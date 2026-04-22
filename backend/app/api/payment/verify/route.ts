import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { ORDERS_COLLECTION } from "@/models/Order";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await request.json();

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing payment verification fields." },
        { status: 400, headers: corsHeaders }
      );
    }

    const secret = process.env.RAZORPAY_KEY_SECRET!;

    // Razorpay signs order_id + "|" + payment_id with SHA-256 HMAC
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(razorpay_signature, "hex")
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Payment verification failed. Signature mismatch." },
        { status: 400, headers: corsHeaders }
      );
    }

    const client = await clientPromise;
    await client.db()
      .collection(ORDERS_COLLECTION)
      .updateOne(
        { _id: new ObjectId(orderId) },
        { $set: { paymentStatus: "success", paymentId: razorpay_payment_id } }
      );

    return NextResponse.json({ verified: true }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Internal verification error." },
      { status: 500, headers: corsHeaders }
    );
  }
}
