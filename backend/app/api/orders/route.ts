import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { ORDERS_COLLECTION, type OrderDocument, type OrderItem } from "@/models/Order";
import { PRODUCTS_COLLECTION, type ProductDocument } from "@/models/Product";
import { z } from "zod";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
    } = parsed.data;

    const paymentStatus = "pending";

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

export async function GET(request: NextRequest) {
  const client = await clientPromise;
  const db = client.db();
  const col = db.collection<OrderDocument>(ORDERS_COLLECTION);

  const { searchParams } = new URL(request.url);

  // ── Fast stats-only mode for admin dashboard ──────────────────────────────
  if (searchParams.get("stats") === "1") {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [totalOrders, todayOrders, pendingOrders, revenueResult] = await Promise.all([
      col.countDocuments(),
      col.countDocuments({ createdAt: { $gte: startOfDay } }),
      col.countDocuments({ status: { $in: ["pending", "placed"] } }),
      col.aggregate([
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]).toArray(),
    ]);

    return NextResponse.json({
      totalOrders,
      todayOrders,
      pendingOrders,
      revenue: revenueResult[0]?.total ?? 0,
    }, {
      headers: {
        ...corsHeaders,
        "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
      },
    });
  }

  // ── Paginated order list ──────────────────────────────────────────────────
  const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const skip  = (page - 1) * limit;
  const status = searchParams.get("status") ?? "";

  const query: any = {};
  if (status) query.status = status;

  const [orders, total] = await Promise.all([
    col.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
    col.countDocuments(query),
  ]);

  return NextResponse.json(
    { orders, total, page, limit, totalPages: Math.ceil(total / limit) },
    {
      headers: {
        ...corsHeaders,
        "Cache-Control": "private, max-age=15, stale-while-revalidate=30",
      },
    }
  );
}

