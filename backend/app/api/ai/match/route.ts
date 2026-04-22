import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { PRODUCTS_COLLECTION, type ProductDocument } from "@/models/Product";

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

export async function POST(req: Request) {
  try {
    const { items } = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json([], { headers: corsHeaders });
    }

    const client = await clientPromise;
    const db = client.db();

    // Fetch all products for in-memory fuzzy matching
    const products = await db.collection<ProductDocument>(PRODUCTS_COLLECTION).find().toArray();

    const matchedItems = items.map((li: any) => {
      const queryText = (li.item || "").toLowerCase().trim();
      const queryTokens = queryText.replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
      
      let bestProduct = null;
      let maxScore = 0;

      for (const p of products) {
        const pName = (p.name || "").toLowerCase().trim();
        const pTokens = pName.replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
        
        let score = 0;
        
        // Exact full name match gets massive boost
        if (pName === queryText) {
          score += 100;
        }

        for (const q of queryTokens) {
          for (const t of pTokens) {
            if (q === t) score += 10;
            else if (q === t + "s" || t === q + "s") score += 10;
            else if (q === t + "es" || t === q + "es") score += 10;
            else if (t.includes(q) && q.length > 3) score += 3;
            else if (q.includes(t) && t.length > 3) score += 3;
          }
        }
        
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
            unit: "1 item",
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
    });

    return NextResponse.json(matchedItems, { headers: corsHeaders });
  } catch (err) {
    console.error("AI match error:", err);
    return NextResponse.json(
      { error: "Matching failed" },
      { status: 500, headers: corsHeaders }
    );
  }
}
