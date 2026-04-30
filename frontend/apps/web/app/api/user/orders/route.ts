import { NextResponse } from "next/server";
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

export async function GET() {
  try {
    const session = await auth();
    const email = getSessionEmail(session);
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const client = await getMongoClient();
    const orders = await client
      .db()
      .collection("orders")
      .find({ userEmail: email })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return NextResponse.json(orders.map(normalizeOrder));
  } catch (error) {
    console.error("Failed to fetch user orders:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
