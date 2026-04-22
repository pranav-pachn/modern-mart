import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import clientPromise from "@/lib/mongodb";
import { PRODUCTS_COLLECTION, type ProductDocument } from "@/models/Product";
import { rateLimit } from "@/lib/api-guard";

// ── Zod schema for incoming items ─────────────────────────────────────────────
const matchItemSchema = z.object({
  item: z.string().min(1).max(200).trim(),
  qty:  z.string().max(50).optional().default("1"),
});

const matchRequestSchema = z.object({
  items: z.array(matchItemSchema).min(1, "At least one item is required").max(50, "Maximum 50 items per request"),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// ─── Score a product candidate against a tokenized query ─────────────────────
function scoreMatch(
  queryTokens: string[],
  queryText: string,
  p: ProductDocument
): number {
  const pName = (p.name || "").toLowerCase().trim();
  const pCategory = (p.category || "").toLowerCase().trim();
  const pTokens = pName
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  // Exact full-name match — highest priority
  if (pName === queryText) return 200;

  let score = 0;

  for (const q of queryTokens) {
    for (const t of pTokens) {
      if (q === t) {
        score += 10;
      } else if (q === t + "s" || t === q + "s") {
        // Plural/singular
        score += 10;
      } else if (q === t + "es" || t === q + "es") {
        score += 10;
      } else if (t.startsWith(q) && q.length > 2) {
        // Prefix match (e.g. "tom" → "tomato")
        score += 6;
      } else if (q.startsWith(t) && t.length > 2) {
        score += 6;
      } else if (t.includes(q) && q.length > 3) {
        // Substring partial match
        score += 3;
      } else if (q.includes(t) && t.length > 3) {
        score += 3;
      }
    }

    // Bonus: query token appears in category (e.g. "milk" → "dairy")
    if (pCategory.includes(q) && q.length > 2) score += 2;
  }

  return score;
}

export async function POST(req: NextRequest) {
  // Rate-limit AI matching to 20 requests/min per IP
  const limited = rateLimit(req, { limit: 20, windowMs: 60_000 });
  if (limited) return limited;

  try {
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400, headers: corsHeaders }
      );
    }

    const parsed = matchRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400, headers: corsHeaders }
      );
    }

    const { items } = parsed.data;

    const client = await clientPromise;
    const db = client.db();
    const col = db.collection<ProductDocument>(PRODUCTS_COLLECTION);

    const matchedItems = await Promise.all(
      items.map(async (li: any) => {
        const queryText = (li.item || "").toLowerCase().trim();
        const queryTokens = queryText
          .replace(/[^a-z0-9\s]/g, "")
          .split(/\s+/)
          .filter(Boolean);

        if (queryTokens.length === 0) {
          return { item: li.item, qty: li.qty, product: null };
        }

        // ── Step 1: DB-level $regex filter ───────────────────────────────────
        // Build an $or of per-token $regex queries so MongoDB does the heavy
        // lifting and we only score a small candidate set in memory.
        const significantTokens = queryTokens.filter((t) => t.length > 2);
        const regexClauses = significantTokens.map((token) => ({
          name: { $regex: token, $options: "i" },
        }));

        let candidates: ProductDocument[] = [];
        if (regexClauses.length > 0) {
          candidates = await col.find({ $or: regexClauses }).toArray();
        }

        // ── Step 2: Full-collection fallback if no regex hits ────────────────
        // Capped at 500 to prevent unbounded scans on large catalogues.
        if (candidates.length === 0) {
          candidates = await col.find().limit(500).toArray();
        }

        // ── Step 3: In-memory scoring on the (small) candidate pool ─────────
        let bestProduct: ProductDocument | null = null;
        let maxScore = 0;

        for (const p of candidates) {
          const score = scoreMatch(queryTokens, queryText, p);
          if (score > maxScore && score >= 3) {
            maxScore = score;
            bestProduct = p;
          }
        }

        const normalizedProduct = bestProduct
          ? {
              id: String(bestProduct._id),
              name: bestProduct.name,
              category: bestProduct.category ?? "",
              unit: bestProduct.unit ?? "1 item",
              price: bestProduct.price,
              rating: 4.5,
              image: bestProduct.image ?? undefined,
              stock: bestProduct.stock ?? undefined,
            }
          : null;

        return {
          item: li.item,
          qty: li.qty,
          product: normalizedProduct,
        };
      })
    );

    return NextResponse.json(matchedItems, { headers: corsHeaders });
  } catch (err) {
    console.error("AI match error:", err);
    return NextResponse.json(
      { error: "Matching failed" },
      { status: 500, headers: corsHeaders }
    );
  }
}
