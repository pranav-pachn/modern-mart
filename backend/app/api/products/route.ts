import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { PRODUCTS_COLLECTION, type ProductDocument } from "@/models/Product";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET() {
  try {
    const client = await clientPromise;
    const products = await client
      .db()
      .collection<ProductDocument>(PRODUCTS_COLLECTION)
      .find()
      .toArray();

    return NextResponse.json(products, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Product fetch failed", error);

    return NextResponse.json(
      {
        error: "Unable to fetch products.",
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}

export async function POST(req: Request) {
  const body = await req.json();

  const client = await clientPromise;
  const db = client.db();

  const result = await db.collection("products").insertOne(body);

  return NextResponse.json(result);
}
