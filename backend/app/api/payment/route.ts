import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { amount } = await request.json();

    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Valid amount is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
    });

    return NextResponse.json(order, { headers: corsHeaders });
  } catch (error) {
    console.error("Payment order creation failed", error);
    return NextResponse.json(
      { error: "Unable to create payment order" },
      { status: 500, headers: corsHeaders }
    );
  }
}