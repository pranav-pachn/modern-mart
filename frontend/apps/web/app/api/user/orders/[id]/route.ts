import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

export const runtime = "nodejs";

const ORDERS_COLLECTION = "orders";

function serializeOrder(order: any) {
  return {
    id: order._id?.toString?.() ?? "",
    _id: order._id?.toString?.() ?? "",
    userName: String(order.userName ?? "Guest"),
    phone: String(order.phone ?? ""),
    address: String(order.address ?? ""),
    items: Array.isArray(order.items) ? order.items : [],
    total: Number(order.total ?? 0),
    status: String(order.status ?? "pending"),
    paymentMethod: String(order.paymentMethod ?? "COD"),
    paymentStatus: String(order.paymentStatus ?? "pending"),
    createdAt: new Date(order.createdAt ?? new Date()).toISOString(),
  };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customerId = (token as { id?: string }).id ?? token.sub ?? token.email;

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid order ID format." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const order = await db.collection(ORDERS_COLLECTION).findOne({
      _id: new ObjectId(id),
      $or: [
        { userEmail: token.email },
        { userId: customerId },
      ],
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    return NextResponse.json(serializeOrder(order));
  } catch (error) {
    console.error("Failed to fetch customer order details:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}