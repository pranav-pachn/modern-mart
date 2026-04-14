import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

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

    const matchedItems = await Promise.all(
      items.map(async (li: any) => {
        // Partial + case-insensitive match
        const product = await db.collection("products").findOne({
          name: { $regex: li.item, $options: "i" },
        });

        // Normalize: map _id to id so the cart store can use it
        const normalizedProduct = product
          ? {
              id: String(product._id),
              name: product.name,
              category: product.category ?? "",
              unit: product.unit ?? "1 item",
              price: product.price,
              rating: product.rating ?? 4.5,
              image: product.image ?? undefined,
              stock: product.stock ?? undefined,
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
