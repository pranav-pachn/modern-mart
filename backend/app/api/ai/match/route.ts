import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getMongoClient } from "@/lib/mongodb";
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

// ─── Text Normalization ────────────────────────────────────────────────────────
const normalize = (text: string) => text.toLowerCase().replace(/s$/, "");

// ─── Score a product candidate against a tokenized query ─────────────────────
function scoreMatch(
  queryTokens: string[],
  queryText: string,
  p: ProductDocument
): number {
  const pName = normalize(p.name || "").trim();
  const pCategory = normalize(p.category || "").trim();
  const pTokens = pName
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map(normalize);

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

    const client = await getMongoClient();
    const db = client.db();
    const col = db.collection<ProductDocument>(PRODUCTS_COLLECTION);

    const matchedItems = await Promise.all(
      items.map(async (li: any) => {
        const queryText = normalize(li.item || "").trim();
        const queryTokens = queryText
          .replace(/[^a-z0-9\s]/g, "")
          .split(/\s+/)
          .filter(Boolean)
          .map(normalize);

        if (queryTokens.length === 0) {
          return { item: li.item, qty: li.qty, product: null };
        }

        // ── Step 1: DB-level $regex filter ───────────────────────────────────
        const rawItem = li.item || "";
        let keyword = rawItem.toLowerCase().split(" ")[0];
        
        // Handle basic plurals
        if (keyword.endsWith("oes")) {
          keyword = keyword.slice(0, -2); // tomatoes -> tomato
        } else if (keyword.endsWith("ies")) {
          keyword = keyword.slice(0, -3) + "y"; // berries -> berry
        } else if (keyword.endsWith("s") && !keyword.endsWith("ss")) {
          keyword = keyword.slice(0, -1); // onions -> onion, apples -> apple
        }

        let candidates: ProductDocument[] = [];
        if (keyword) {
          candidates = await col.find({ name: { $regex: keyword, $options: "i" } }).toArray();
        }

        // ── Step 2: Full-collection fallback if no regex hits ────────────────
        if (candidates.length === 0) {
          candidates = await col.find().limit(500).toArray();
        }

        // ── Step 3: In-memory scoring on the candidate pool ─────────
        let bestProduct: ProductDocument | null = null;
        let fallbackProduct: ProductDocument | null = null;
        let maxScore = 0;
        let maxFallbackScore = 0;

        for (const p of candidates) {
          const score = scoreMatch(queryTokens, queryText, p);
          if (score > maxScore && score >= 3) {
            maxScore = score;
            bestProduct = p;
          }
          if (score > maxFallbackScore) {
            maxFallbackScore = score;
            fallbackProduct = p;
          }
        }

        let isSuggested = false;
        if (!bestProduct && fallbackProduct && maxFallbackScore > 0) {
          bestProduct = fallbackProduct;
          isSuggested = true;
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
          suggested: isSuggested,
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
