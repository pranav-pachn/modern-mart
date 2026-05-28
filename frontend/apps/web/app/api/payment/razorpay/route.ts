export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

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
    const session = await auth();
    // Allow guest checkout too, but if session exists, log it.

    const { amount, currency = "INR" } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400, headers: corsHeaders });
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Razorpay credentials not configured." },
        { status: 500, headers: corsHeaders }
      );
    }

    const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Razorpay expects amount in paise
        currency,
        receipt: `receipt_${Date.now()}`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Razorpay order creation failed:", errorData);
      return NextResponse.json(
        { error: "Failed to create payment order" },
        { status: 500, headers: corsHeaders }
      );
    }

    const order = await response.json();
    return NextResponse.json(order, { headers: corsHeaders });
  } catch (error) {
    console.error("Razorpay API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
