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
    deliverySlot: String(order.deliverySlot ?? ""),
    subtotal: Number(order.subtotal ?? 0),
    items: Array.isArray(order.items) ? order.items : [],
    total: Number(order.total ?? 0),
    status: String(order.status ?? "pending"),
    paymentMethod: String(order.paymentMethod ?? "COD"),
    paymentStatus: String(order.paymentStatus ?? "pending"),
    notes: typeof order.notes === "string" ? order.notes : undefined,
    createdAt: new Date(order.createdAt ?? new Date()).toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customerId = (token as { id?: string }).id ?? token.sub ?? token.email;

    const client = await clientPromise;
    const db = client.db();
    const orders = db.collection(ORDERS_COLLECTION);

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("id");

    if (orderId) {
      if (!ObjectId.isValid(orderId)) {
        return NextResponse.json({ error: "Invalid order ID format." }, { status: 400 });
      }

      const order = await orders.findOne({
        _id: new ObjectId(orderId),
        $or: [
          { userEmail: token.email },
          { userId: customerId },
        ],
      });

      if (!order) {
        return NextResponse.json({ error: "Order not found." }, { status: 404 });
      }

      return NextResponse.json(serializeOrder(order));
    }

    const docs = await orders
      .find({
        $or: [
          { userEmail: token.email },
          { userId: customerId },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json(docs.map(serializeOrder));
  } catch (error: any) {
    console.error("Failed to fetch customer orders:", error);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      details: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined 
    }, { status: 500 });
  }
}