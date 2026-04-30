import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getMongoClient } from "@/lib/mongodb";
import { ORDERS_COLLECTION } from "@/models/Order";
import { requireAdminToken } from "@/lib/api-guard";

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

export async function POST(req: NextRequest) {
  try {
    const authError = await requireAdminToken(req);
    if (authError) return authError;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers: corsHeaders });
    }

    const payload = typeof body === "object" && body !== null
      ? body as { id?: unknown; status?: unknown }
      : {};
    const id = typeof payload.id === "string" ? payload.id.trim() : "";
    const rawStatus = typeof payload.status === "string" ? payload.status.trim() : "";
    const status = rawStatus.toLowerCase();

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid order id" }, { status: 400, headers: corsHeaders });
    }

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400, headers: corsHeaders });
    }

    const allowedStatuses = new Set([
      "pending",
      "placed",
      "accepted",
      "confirmed",
      "packed",
      "out for delivery",
      "delivered",
      "cancelled",
    ]);

    if (!allowedStatuses.has(status)) {
      return NextResponse.json({ error: "Invalid order status" }, { status: 400, headers: corsHeaders });
    }

    const client = await getMongoClient();
    const result = await client.db()
      .collection(ORDERS_COLLECTION)
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { status } },
        { bypassDocumentValidation: true }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json({ success: true }, { status: 200, headers: corsHeaders });
  } catch (e) {
    console.error("Failed to update order status:", e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500, headers: corsHeaders });
  }
}
