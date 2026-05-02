import { NextResponse, NextRequest } from "next/server";
import { getMongoClient } from "@/lib/mongodb";
import { requireAdminToken } from "@/lib/api-guard";
import { PRODUCTS_COLLECTION, type ProductDocument } from "@/models/Product";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "12", 10)));
    const skip = (page - 1) * limit;

    const q = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const sort = searchParams.get("sort") || "";

    const query: any = {};
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
      ];
    }
    if (category && category !== "All") {
      query.category = category;
    }

    const sortOptions: any = {};
    if (sort === "price_asc") sortOptions.price = 1;
    else if (sort === "price_desc") sortOptions.price = -1;
    else if (sort === "rating") sortOptions.rating = -1;
    else sortOptions.createdAt = -1;

    const client = await getMongoClient();
    const col = client.db().collection<ProductDocument>(PRODUCTS_COLLECTION);

    const [products, total] = await Promise.all([
      col.find(query).sort(sortOptions).skip(skip).limit(limit).toArray(),
      col.countDocuments(query),
    ]);

    const headers = {
      ...corsHeaders,
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    };

    return NextResponse.json(
      { products, total, page, limit, totalPages: Math.ceil(total / limit) },
      { headers }
    );
  } catch (error) {
    console.error("Product fetch failed", error);
    return NextResponse.json(
      { error: "Unable to fetch products." },
      { status: 500, headers: corsHeaders }
    );
  }
}

import { ObjectId, Int32 } from "mongodb";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.number().nonnegative("Price must be a positive number"),
  category: z.string().min(1, "Category is required"),
  image: z.string().max(5_000_000).or(z.literal("")), // Allow large base64 images (~5MB)
  stock: z.number().int().nonnegative().optional().default(0),
  description: z.string().optional(),
  unit: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const authError = await requireAdminToken(req);
  if (authError) return authError;

  try {
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers: corsHeaders });
    }

    const parsed = productSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400, headers: corsHeaders }
      );
    }

    const client = await getMongoClient();
    const db = client.db();

    const now = new Date();
    const newId = new ObjectId();

    const { processImageUpload } = await import("@/lib/image-helper");
    const finalImagePath = await processImageUpload(parsed.data.image, newId.toHexString());

    const productToInsert: ProductDocument = {
      _id: newId,
      name: parsed.data.name,
      price: parsed.data.price,
      category: parsed.data.category,
      image: finalImagePath,
      stock: new Int32(parsed.data.stock),
      createdAt: now,
      updatedAt: now,
    };

    if (typeof parsed.data.description === "string") {
      productToInsert.description = parsed.data.description;
    }

    if (typeof parsed.data.unit === "string") {
      productToInsert.unit = parsed.data.unit;
    }

    const result = await db.collection<ProductDocument>(PRODUCTS_COLLECTION).insertOne(productToInsert);

    return NextResponse.json(result, { headers: corsHeaders });
  } catch (error) {
    console.error("Failed to add product:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
