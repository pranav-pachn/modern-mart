import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Razorpay from "razorpay";
import { rateLimit } from "@/lib/api-guard";

export const runtime = "nodejs";

function isOnlinePaymentEnabled() {
  return (
    process.env.ENABLE_ONLINE_PAYMENTS === "true" &&
    Boolean(process.env.RAZORPAY_KEY_ID) &&
    Boolean(process.env.RAZORPAY_KEY_SECRET)
  );
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// ── Zod schema ────────────────────────────────────────────────────────────────
const paymentSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  // Amount is in INR (rupees). Cap at ₹1,00,000 to prevent abuse.
  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be positive")
    .max(100_000, "Amount exceeds maximum allowed value"),
});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  // Rate-limit payment creation to 10/min per IP
  const limited = rateLimit(request, { limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  try {
    if (!isOnlinePaymentEnabled()) {
      return NextResponse.json(
        { error: "Online payments are disabled." },
        { status: 403, headers: corsHeaders }
      );
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400, headers: corsHeaders }
      );
    }

    const parsed = paymentSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400, headers: corsHeaders }
      );
    }

    const { amount, orderId } = parsed.data;

    const keyId     = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error("[payment] Razorpay keys are not configured.");
      return NextResponse.json(
        { error: "Payment service is not configured." },
        { status: 503, headers: corsHeaders }
      );
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: "INR",
      receipt: orderId.slice(-40),
      notes: { orderId },
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
