import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { auth } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";

export const runtime = "nodejs";

const PRODUCTS_COLLECTION = "products";
const REVIEWS_COLLECTION = "reviews";

type ReviewDocument = {
  _id?: ObjectId;
  productId: ObjectId;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Date;
};

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1, "Comment is required").max(1000, "Comment is too long"),
});

function invalidProductId() {
  return NextResponse.json({ error: "Invalid product ID format." }, { status: 400 });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return invalidProductId();

    const client = await clientPromise;
    const db = client.db();
    const productId = new ObjectId(id);

    const reviews = await db
      .collection<ReviewDocument>(REVIEWS_COLLECTION)
      .find({ productId })
      .sort({ createdAt: -1 })
      .toArray();

    const totalReviews = reviews.length;
    const avgRating =
      totalReviews > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0;

    return NextResponse.json({ reviews, avgRating, totalReviews });
  } catch (error) {
    console.error("Failed to fetch product reviews:", error);
    return NextResponse.json({ error: "Unable to fetch reviews." }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userEmail = session?.user?.email;

    if (!userEmail) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to leave a review." },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) return invalidProductId();

    const parsed = reviewSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const productId = new ObjectId(id);

    const productExists = await db.collection(PRODUCTS_COLLECTION).findOne({ _id: productId });
    if (!productExists) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const existingReview = await db.collection<ReviewDocument>(REVIEWS_COLLECTION).findOne({
      productId,
      userId: userEmail,
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this product." },
        { status: 409 }
      );
    }

    const review: ReviewDocument = {
      productId,
      userId: userEmail,
      userName: session.user?.name || userEmail.split("@")[0] || "Anonymous User",
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      createdAt: new Date(),
    };

    const result = await db.collection<ReviewDocument>(REVIEWS_COLLECTION).insertOne(review);

    return NextResponse.json(
      {
        message: "Review added successfully",
        review: { ...review, _id: result.insertedId },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to add product review:", error);
    return NextResponse.json({ error: "Unable to add review." }, { status: 500 });
  }
}
