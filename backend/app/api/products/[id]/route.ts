import { NextResponse } from "next/server";
import { ObjectId, Int32 } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { PRODUCTS_COLLECTION, type ProductDocument } from "@/models/Product";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: Request, context: { params: any }) {
  try {
    const { id } = context.params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400, headers: corsHeaders });
    }

    const client = await clientPromise;
    const db = client.db();

    const product = await db.collection<ProductDocument>(PRODUCTS_COLLECTION).findOne({
      _id: new ObjectId(id),
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json(product, { headers: corsHeaders });
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500, headers: corsHeaders });
  }
}


export async function PUT(req: Request, context: { params: any }) {
  try {
    const { id } = context.params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400, headers: corsHeaders });
    }

    const body = await req.json();
    const client = await clientPromise;
    const db = client.db();

    const { processImageUpload } = await import("@/lib/image-helper");
    const finalImagePath = await processImageUpload(String(body.image), id);

    const productToUpdate = {
      name: String(body.name),
      price: Number(body.price),
      category: String(body.category),
      image: finalImagePath,
      stock: new Int32(Number(body.stock || 0)),
      updatedAt: new Date(),
    };

    const result = await db.collection<ProductDocument>(PRODUCTS_COLLECTION).updateOne(
      { _id: new ObjectId(id) },
      { $set: productToUpdate }
    );

    return NextResponse.json(result, { headers: corsHeaders });
  } catch (error) {
    console.error("Failed to update product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(req: Request, context: { params: any }) {
  try {
    const { id } = context.params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400, headers: corsHeaders });
    }

    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection<ProductDocument>(PRODUCTS_COLLECTION).deleteOne({
      _id: new ObjectId(id),
    });

    return NextResponse.json(result, { headers: corsHeaders });
  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500, headers: corsHeaders });
  }
}
