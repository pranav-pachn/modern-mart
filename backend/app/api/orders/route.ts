import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { ORDERS_COLLECTION, type OrderDocument } from "@/models/Order";
import { PRODUCTS_COLLECTION, type ProductDocument } from "@/models/Product";
import { z } from "zod";
import { requireAdminToken, rateLimit } from "@/lib/api-guard";

export const runtime = "nodejs";
const MINIMUM_ORDER_VALUE = 200;


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

const paymentMethodSchema = z.literal("COD");

const deliverySlotSchema = z
  .string()
  .trim()
  .pipe(z.enum(["Morning", "Afternoon", "Evening"]));

const orderSchema = z.object({
  userId: z.string().min(1).optional(),
  userEmail: z.string().email().optional(),
  userName: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().min(1, "Address is required"),
  deliverySlot: deliverySlotSchema,
  subtotal: z.number().nonnegative("Subtotal is required"),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
  total: z.number().nonnegative("Total is required"),
  paymentMethod: paymentMethodSchema,
  notes: z.string().trim().max(500, "Notes must be 500 characters or less.").optional(),
});

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const parsed = orderSchema.safeParse(rawBody);

    if (!parsed.success) {
      return jsonWithCors(
        {
          error: "Validation failed",
          fields: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
        },
        400
      );
    }

    const {
      userId,
      userEmail,
      userName,
      phone,
      address,
      deliverySlot,
      subtotal,
      items,
      total,
      paymentMethod,
      notes,
    } = parsed.data;

    
    if (subtotal < MINIMUM_ORDER_VALUE) {
      return jsonWithCors(
        {
          error: `Minimum order value is Rs. ${MINIMUM_ORDER_VALUE}.`,
        },
        400
      );
    }

    const paymentStatus = "cod_pending";
    const status = "placed";

    const order: Omit<OrderDocument, "_id"> = {
      userName,
      phone,
      address,
      deliverySlot,
      subtotal,
      items,
      total: total as number,
      status,
      paymentMethod,
      paymentStatus,
      createdAt: new Date(),
    };
    if (userId?.trim()) order.userId = userId.trim();
    if (userEmail?.trim()) order.userEmail = userEmail.trim();
    if (notes?.trim()) order.notes = notes.trim();


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
  } catch (error: unknown) {
    console.error("Order creation failed", error);
    if (isMongoValidatorError(error)) {
      console.error(JSON.stringify(error.errInfo, null, 2));
    }

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
  try {
    // Protect all order data — admin only
    const authError = await requireAdminToken(request);
    if (authError) return authError;

    const limited = rateLimit(request, { limit: 30, windowMs: 60_000 });
    if (limited) return limited;

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
    const statusFilter = searchParams.get("status") ?? "";

    const query: Partial<Pick<OrderDocument, "status">> = {};
    if (statusFilter) query.status = statusFilter;

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
  } catch (error: unknown) {
    console.error("GET /api/orders failed:", error);
    return jsonWithCors(
      {
        error: "Failed to fetch orders.",
        details: process.env.NODE_ENV !== "production"
          ? String((error as Error).message)
          : undefined,
      },
      500
    );
  }
}

function isMongoValidatorError(
  error: unknown
): error is { code: number; errInfo?: unknown } {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === 121;
}
