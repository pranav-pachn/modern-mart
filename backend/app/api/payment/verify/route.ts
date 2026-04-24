import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { ORDERS_COLLECTION } from "@/models/Order";
import { z } from "zod";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const verifyPayloadSchema = z.object({
  orderId: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().regex(/^[a-fA-F0-9]+$/, "Invalid signature format"),
});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const parsed = verifyPayloadSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Missing or invalid payment verification fields." },
        { status: 400, headers: corsHeaders }
      );
    }

    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error("[payment/verify] RAZORPAY_KEY_SECRET is not configured.");
      return NextResponse.json(
        { error: "Payment service is not configured." },
        { status: 503, headers: corsHeaders }
      );
    }

    // Razorpay signs order_id + "|" + payment_id with SHA-256 HMAC
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const actualBuffer = Buffer.from(razorpay_signature, "hex");

    // timingSafeEqual throws if buffer lengths differ.
    const isValid =
      expectedBuffer.length === actualBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, actualBuffer);

    if (!isValid) {
      return NextResponse.json(
        { error: "Payment verification failed. Signature mismatch." },
        { status: 400, headers: corsHeaders }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    const result = await db
      .collection(ORDERS_COLLECTION)
      .updateOne(
        { _id: new ObjectId(orderId), paymentMethod: "ONLINE" },
        {
          $set: {
            paymentStatus: "success",
            paymentId: razorpay_payment_id,
            status: "placed",
          },
        }
      );

    if (!result.matchedCount) {
      return NextResponse.json(
        { error: "Order not found for ONLINE payment verification." },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { verified: true, paymentId: razorpay_payment_id },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Internal verification error." },
      { status: 500, headers: corsHeaders }
    );
  }
}
