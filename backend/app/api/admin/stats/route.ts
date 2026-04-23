import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ORDERS_COLLECTION, type OrderDocument } from "@/models/Order";

export const runtime = "nodejs";

type AdminStatsResponse = {
  totalOrders: number;
  todayOrders: number;
  pendingOrders: number;
  totalRevenue: number;
};

function getTodayRange() {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  return { startOfToday, startOfTomorrow };
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const ordersCollection = db.collection<OrderDocument>(ORDERS_COLLECTION);

    const { startOfToday, startOfTomorrow } = getTodayRange();

    const [totalOrders, todayOrders, pendingOrders, revenueDocs] = await Promise.all([
      ordersCollection.countDocuments(),
      ordersCollection.countDocuments({
        createdAt: {
          $gte: startOfToday,
          $lt: startOfTomorrow,
        },
      }),
      ordersCollection.countDocuments({ status: "pending" }),
      ordersCollection
        .aggregate<{ totalRevenue: number }>([
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: "$total" },
            },
          },
        ])
        .toArray(),
    ]);

    const totalRevenue = Number(revenueDocs[0]?.totalRevenue ?? 0);

    const response: AdminStatsResponse = {
      totalOrders,
      todayOrders,
      pendingOrders,
      totalRevenue: Number.isFinite(totalRevenue) ? totalRevenue : 0,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch admin stats:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch admin stats.",
      },
      { status: 500 }
    );
  }
}
