import { NextRequest, NextResponse } from "next/server";
import { ObjectId, Int32 } from "mongodb";
import { z } from "zod";
import { getMongoClient } from "@/lib/mongodb";
import { PRODUCTS_COLLECTION, type ProductDocument } from "@/models/Product";
import { requireAdminToken, rateLimit } from "@/lib/api-guard";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const updateProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  price: z.coerce.number().nonnegative("Price must be >= 0"),
  category: z.string().min(1, "Category is required").max(100),
  image: z.string().max(2000).optional().default(""),
  stock: z.number().int().nonnegative().optional().default(0),
  description: z.string().max(2000).optional(),
  unit: z.string().max(50).optional(),
});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const limited = rateLimit(req, { limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const { id } = await context.params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400, headers: corsHeaders });
    }

    const client = await getMongoClient();
    const product = await client
      .db()
      .collection<ProductDocument>(PRODUCTS_COLLECTION)
      .findOne({ _id: new ObjectId(id) });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json(product, {
      headers: {
        ...corsHeaders,
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500, headers: corsHeaders });
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authError = await requireAdminToken(req);
  if (authError) return authError;

  const limited = rateLimit(req, { limit: 20, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const { id } = await context.params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400, headers: corsHeaders });
    }

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers: corsHeaders });
    }

    const parsed = updateProductSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400, headers: corsHeaders }
      );
    }

    const { name, price, category, image, stock, description, unit } = parsed.data;

    const { processImageUpload } = await import("@/lib/image-helper");
    const finalImagePath = await processImageUpload(image, id);

    const productToUpdate: Partial<ProductDocument> = {
      name,
      price,
      category,
      image: finalImagePath,
      stock: new Int32(stock),
      updatedAt: new Date(),
    };
    if (description !== undefined) productToUpdate.description = description;
    if (unit !== undefined) productToUpdate.unit = unit;

    const client = await getMongoClient();
    const result = await client
      .db()
      .collection<ProductDocument>(PRODUCTS_COLLECTION)
      .updateOne({ _id: new ObjectId(id) }, { $set: productToUpdate });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json({ success: true, modifiedCount: result.modifiedCount }, { headers: corsHeaders });
  } catch (error) {
    console.error("Failed to update product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authError = await requireAdminToken(req);
  if (authError) return authError;

  const limited = rateLimit(req, { limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const { id } = await context.params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400, headers: corsHeaders });
    }

    const client = await getMongoClient();
    const result = await client
      .db()
      .collection<ProductDocument>(PRODUCTS_COLLECTION)
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500, headers: corsHeaders });
  }
}
