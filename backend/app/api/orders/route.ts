import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ORDERS_COLLECTION, type OrderDocument, type OrderItem } from "@/models/Order";

export const runtime = "nodejs";

type OrderRequestBody = {
  userName?: unknown;
  phone?: unknown;
  address?: unknown;
  items?: unknown;
  total?: unknown;
  paymentMethod?: unknown;
  paymentId?: unknown;
};

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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as OrderRequestBody;
    const userName = readRequiredString(body.userName);
    const phone = readRequiredString(body.phone);
    const address = readRequiredString(body.address);
    const items = readOrderItems(body.items);
    const total = readNonNegativeNumber(body.total);

    const paymentMethod = (readRequiredString(body.paymentMethod) || "COD").toUpperCase();
    const validationErrors: string[] = [];

    if (!userName) {
      validationErrors.push("userName");
    }

    if (!phone) {
      validationErrors.push("phone");
    }

    if (!address) {
      validationErrors.push("address");
    }

    if (items.length === 0) {
      validationErrors.push("items");
    }

    if (total === null) {
      validationErrors.push("total");
    }

    if (validationErrors.length > 0) {
      return jsonWithCors(
        {
          error: "Name, phone, address, total, and at least one order item are required.",
          fields: validationErrors,
        },
        400,
      );
    }

    if (!["COD", "ONLINE"].includes(paymentMethod)) {
      return jsonWithCors(
        {
          error: "Invalid payment method.",
        },
        400,
      );
    }

    const order: OrderDocument = {
      userName,
      phone,
      address,
      items,
      total: total as number,
      status: "pending",
      paymentMethod,
      paymentId: body.paymentId as string | undefined,
      createdAt: new Date(),
    };

    const client = await clientPromise;
    const result = await client.db().collection<OrderDocument>(ORDERS_COLLECTION).insertOne(order);

    return jsonWithCors(
      {
        orderId: result.insertedId.toString(),
      },
      201,
    );
  } catch (error) {
    console.error("Order creation failed", error);

    return jsonWithCors(
      {
        error: "Unable to place order.",
      },
      500,
    );
  }
}

function readOrderItems(value: unknown): OrderItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const orderItem = item as Record<string, unknown>;
      const productId = readRequiredString(orderItem.productId);
      const name = readRequiredString(orderItem.name);
      const price = readNonNegativeNumber(orderItem.price);
      const quantity = readPositiveInteger(orderItem.quantity);

      if (!productId || !name || price === null || quantity === null) {
        return null;
      }

      return {
        productId,
        name,
        price,
        quantity,
      };
    })
    .filter((item): item is OrderItem => item !== null);
}

function readRequiredString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readNonNegativeNumber(value: unknown) {
  const parsed = readFiniteNumber(value);

  if (parsed === null || parsed < 0) {
    return null;
  }

  return parsed;
}

function readPositiveInteger(value: unknown) {
  const parsed = readFiniteNumber(value);

  if (parsed === null || !Number.isInteger(parsed) || parsed < 1) {
    return null;
  }

  return parsed;
}

function readFiniteNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
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
