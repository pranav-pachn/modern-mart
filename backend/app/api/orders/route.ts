import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import crypto from "crypto";
import clientPromise from "@/lib/mongodb";
import { ORDERS_COLLECTION, type OrderDocument, type OrderItem } from "@/models/Order";
import { PRODUCTS_COLLECTION, type ProductDocument } from "@/models/Product";
import { z } from "zod";

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

const orderItemSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  quantity: z.number().int().positive(),
});

const orderSchema = z.object({
  userName: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().min(1, "Address is required"),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
  total: z.number().nonnegative("Total is required"),
  paymentMethod: z.enum(["COD", "ONLINE"]).default("COD"),
  paymentId: z.string().optional(),
  razorpay_order_id: z.string().optional(),
  razorpay_payment_id: z.string().optional(),
  razorpay_signature: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const parsed = orderSchema.safeParse(rawBody);

    if (!parsed.success) {
      return jsonWithCors(
        {
          error: "Validation failed",
          fields: parsed.error.issues.map((e: any) => `${e.path.join(".")}: ${e.message}`),
        },
        400
      );
    }

    const {
      userName,
      phone,
      address,
      items,
      total,
      paymentMethod,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = parsed.data;

    let paymentStatus = "pending";
    let finalPaymentId = parsed.data.paymentId;

    if (paymentMethod === "ONLINE") {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return jsonWithCors({ error: "Missing Razorpay payment verification details." }, 400);
      }

      const secret = process.env.RAZORPAY_KEY_SECRET;
      if (!secret) {
        return jsonWithCors({ error: "Server missing Razorpay secret" }, 500);
      }

      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "hex"),
        Buffer.from(razorpay_signature, "hex")
      );

      if (!isValid) {
        return jsonWithCors({ error: "Payment verification failed. Signature mismatch." }, 400);
      }

      finalPaymentId = razorpay_payment_id;
      paymentStatus = "success";
    }

    const order: OrderDocument = {
      userName,
      phone,
      address,
      items,
      total: total as number,
      status: "pending",
      paymentMethod,
      paymentStatus,
      createdAt: new Date(),
    };

    if (finalPaymentId) {
      order.paymentId = finalPaymentId;
    }

    const client = await clientPromise;
    const db = client.db();

    // Validate stock
    const productIds = items.map(i => {
      try { return new ObjectId(i.productId); } catch { return null; }
    }).filter(id => id !== null) as ObjectId[];

    const productsInDb = await db.collection<ProductDocument>(PRODUCTS_COLLECTION).find({ _id: { $in: productIds } }).toArray();

    for (const item of items) {
      const dbProduct = productsInDb.find(p => p._id?.toString() === item.productId);
      if (!dbProduct) {
        return jsonWithCors({ error: `Product ${item.name} not found.` }, 400);
      }
      const availableStock = dbProduct.stock != null ? Number(dbProduct.stock) : Infinity;
      if (availableStock < item.quantity) {
        return jsonWithCors({ error: `Insufficient stock for ${item.name}. Available: ${availableStock}` }, 400);
      }
    }

    const result = await db.collection<OrderDocument>(ORDERS_COLLECTION).insertOne(order);

    return jsonWithCors(
      {
        orderId: result.insertedId.toString(),
      },
      201
    );
  } catch (error) {
    console.error("Order creation failed", error);

    return jsonWithCors(
      {
        error: "Unable to place order.",
      },
      500
    );
  }
}

function jsonWithCors(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: corsHeaders,
  });
}

export async function GET() {
  const client = await clientPromise;
  const db = client.db();

  const orders = await db.collection("orders").find().toArray();

  return NextResponse.json(orders);
}
