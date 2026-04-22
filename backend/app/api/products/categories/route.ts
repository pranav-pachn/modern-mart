import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { PRODUCTS_COLLECTION } from "@/models/Product";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();

    const categories: string[] = await db
      .collection(PRODUCTS_COLLECTION)
      .distinct("category");

    const sorted = ["All", ...categories.filter(Boolean).sort()];

    return NextResponse.json(sorted, {
      headers: {
        ...corsHeaders,
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json(
      { error: "Could not fetch categories." },
      { status: 500, headers: corsHeaders }
    );
  }
}
