import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getMongoClient } from "@/lib/mongodb";
import { REVIEWS_COLLECTION, type ReviewDocument } from "@/models/Review";
import { PRODUCTS_COLLECTION } from "@/models/Product";
import { getToken } from "next-auth/jwt";
import { z } from "zod";

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

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1, "Comment is required").max(1000, "Comment is too long"),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    if (!ObjectId.isValid(productId)) {
      return NextResponse.json({ error: "Invalid product ID format." }, { status: 400, headers: corsHeaders });
    }

    const client = await getMongoClient();
    const db = client.db();

    const reviews = await db
      .collection<ReviewDocument>(REVIEWS_COLLECTION)
      .find({ productId: new ObjectId(productId) })
      .sort({ createdAt: -1 })
      .toArray();

    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;

    return NextResponse.json({ reviews, avgRating, totalReviews }, { headers: corsHeaders });
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    return NextResponse.json({ error: "Unable to fetch reviews." }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("POST review request received for:", request.url);
  try {
    const { id: productId } = await params;
    if (!ObjectId.isValid(productId)) {
      return NextResponse.json({ error: "Invalid product ID format." }, { status: 400, headers: corsHeaders });
    }

    const isSecure = request.url.startsWith("https://");
    const cookieName = isSecure ? "__Secure-authjs.session-token" : "authjs.session-token";
    const v4CookieName = isSecure ? "__Secure-next-auth.session-token" : "next-auth.session-token";

    let token = await getToken({ req: request, secret: process.env.AUTH_SECRET, cookieName });
    if (!token) {
      token = await getToken({ req: request, secret: process.env.AUTH_SECRET, cookieName: v4CookieName });
    }

    if (!token || !token.email) {
      return NextResponse.json({ error: "Unauthorized. Please log in to leave a review." }, { status: 401, headers: corsHeaders });
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers: corsHeaders });
    }

    const parsed = reviewSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400, headers: corsHeaders });
    }

    const client = await getMongoClient();
    const db = client.db();

    const productExists = await db.collection(PRODUCTS_COLLECTION).findOne({ _id: new ObjectId(productId) });
    if (!productExists) {
      console.warn("Product not found in DB for review submission:", productId);
      return NextResponse.json({ error: `Product with ID ${productId} not found.` }, { status: 404, headers: corsHeaders });
    }

    const existingReview = await db.collection<ReviewDocument>(REVIEWS_COLLECTION).findOne({
      productId: new ObjectId(productId),
      userId: token.email,
    });

    if (existingReview) {
      return NextResponse.json({ error: "You have already reviewed this product." }, { status: 400, headers: corsHeaders });
    }

    const newReview: ReviewDocument = {
      productId: new ObjectId(productId),
      userId: token.email,
      userName: token.name || "Anonymous User",
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      createdAt: new Date(),
    };

    await db.collection<ReviewDocument>(REVIEWS_COLLECTION).insertOne(newReview);

    return NextResponse.json({ message: "Review added successfully", review: newReview }, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error("Failed to add review:", error);
    return NextResponse.json({ error: "Unable to add review." }, { status: 500, headers: corsHeaders });
  }
}
