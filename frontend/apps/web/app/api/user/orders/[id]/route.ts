import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { getMongoClient } from "@/lib/mongodb";

export const runtime = "nodejs";

function getSessionEmail(session: unknown) {
  return (session as { user?: { email?: string | null } } | null)?.user?.email ?? "";
}

function normalizeOrder(order: any) {
  const id = order._id?.toString?.() ?? "";
  return {
    ...order,
    _id: id,
    id,
    createdAt: order.createdAt instanceof Date
      ? order.createdAt.toISOString()
      : String(order.createdAt ?? ""),
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const email = getSessionEmail(session);
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid order ID format" }, { status: 400 });
    }

    const client = await getMongoClient();
    const order = await client
      .db()
      .collection("orders")
      .findOne({ _id: new ObjectId(id), userEmail: email });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(normalizeOrder(order));
  } catch (error) {
    console.error("Failed to fetch user order:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
