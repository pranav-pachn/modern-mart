import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getMongoClient } from "@/lib/mongodb";
import { ORDERS_COLLECTION, type OrderDocument } from "@/models/Order";
import { rateLimit } from "@/lib/api-guard";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting first
  const limited = rateLimit(request, { limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  try {
    // AUTH CHECK: Verify user is logged in
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const { id: orderId } = await params;
    if (!ObjectId.isValid(orderId)) {
      return NextResponse.json({ error: "Invalid order ID format." }, { status: 400, headers: corsHeaders });
    }

    const client = await getMongoClient();
    const db = client.db();

    const order = await db.collection<OrderDocument>(ORDERS_COLLECTION).findOne({ _id: new ObjectId(orderId) });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404, headers: corsHeaders });
    }

    // AUTHORIZATION: Only allow if user owns the order OR user is admin
    const isAdmin = (session.user as any)?.role === "admin";
    const isOwner = order.userEmail === session.user.email;
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: corsHeaders });
    }

    return NextResponse.json(order, { headers: corsHeaders });
  } catch (error) {
    console.error("Failed to fetch order details", error);
    return NextResponse.json({ error: "Unable to fetch order details." }, { status: 500, headers: corsHeaders });
  }
}
