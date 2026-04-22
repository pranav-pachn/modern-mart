import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { PRODUCTS_COLLECTION, type ProductDocument } from "@/models/Product";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
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
    const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "12", 10)));
    const skip  = (page - 1) * limit;

    const q = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const sort = searchParams.get("sort") || "";

    const query: any = {};
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } }
      ];
    }
    if (category && category !== "All") {
      query.category = category;
    }

    const sortOptions: any = {};
    if (sort === "price_asc") sortOptions.price = 1;
    else if (sort === "price_desc") sortOptions.price = -1;
    else if (sort === "rating") sortOptions.rating = -1;
    else sortOptions.createdAt = -1; // Default sort

    const client = await clientPromise;
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
  image: z.string().or(z.literal("")),
  stock: z.number().int().nonnegative().optional().default(0),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = productSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const client = await clientPromise;
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

    const result = await db.collection<ProductDocument>(PRODUCTS_COLLECTION).insertOne(productToInsert);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to add product:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
