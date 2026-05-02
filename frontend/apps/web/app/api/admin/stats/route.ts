import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMongoClient } from "@/lib/mongodb";
import { ORDERS_COLLECTION, type OrderDocument } from "@/models/Order";

export const runtime = "nodejs";

type AdminStatsResponse = {
  totalOrders: number;
  todayOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  todayOrdersDelta: number;
  revenueDeltaPercent: number;
  recentOrders: {
    id: string;
    userName: string;
    phone: string;
    total: number;
    status: string;
    createdAt: string;
    items: { name: string; quantity: number }[];
  }[];
};

function getTodayRange() {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  return { startOfToday, startOfTomorrow };
}

function getYesterdayRange(startOfToday: Date) {
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  return { startOfYesterday, endOfYesterday: startOfToday };
}

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {

    const client = await getMongoClient();
    const db = client.db();
    const ordersCollection = db.collection<OrderDocument>(ORDERS_COLLECTION);

    const { startOfToday, startOfTomorrow } = getTodayRange();
    const { startOfYesterday, endOfYesterday } = getYesterdayRange(startOfToday);

    const [
      totalOrders,
      todayOrders,
      yesterdayOrders,
      pendingOrders,
      revenueDocs,
      todayRevenueDocs,
      yesterdayRevenueDocs,
      recentOrderDocs,
    ] = await Promise.all([
      ordersCollection.countDocuments(),
      ordersCollection.countDocuments({ createdAt: { $gte: startOfToday, $lt: startOfTomorrow } }),
      ordersCollection.countDocuments({ createdAt: { $gte: startOfYesterday, $lt: endOfYesterday } }),
      ordersCollection.countDocuments({ $expr: { $eq: [{ $toLower: { $ifNull: ["$status", ""] } }, "pending"] } }),
      ordersCollection.aggregate<{ totalRevenue: number }>([{ $group: { _id: null, totalRevenue: { $sum: "$total" } } }]).toArray(),
      ordersCollection.aggregate<{ totalRevenue: number }>([
        { $match: { createdAt: { $gte: startOfToday, $lt: startOfTomorrow } } },
        { $group: { _id: null, totalRevenue: { $sum: "$total" } } },
      ]).toArray(),
      ordersCollection.aggregate<{ totalRevenue: number }>([
        { $match: { createdAt: { $gte: startOfYesterday, $lt: endOfYesterday } } },
        { $group: { _id: null, totalRevenue: { $sum: "$total" } } },
      ]).toArray(),
      ordersCollection
        .find({}, {
          projection: {
            _id: 1,
            userName: 1,
            phone: 1,
            total: 1,
            status: 1,
            createdAt: 1,
            items: 1,
          },
        })
        .sort({ createdAt: -1 })
        .limit(6)
        .toArray(),
    ]);

    const totalRevenue = Number(revenueDocs[0]?.totalRevenue ?? 0);
    const todayRevenue = Number(todayRevenueDocs[0]?.totalRevenue ?? 0);
    const yesterdayRevenue = Number(yesterdayRevenueDocs[0]?.totalRevenue ?? 0);
    const todayOrdersDelta = todayOrders - yesterdayOrders;
    const revenueDeltaPercent = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : todayRevenue > 0 ? 100 : 0;

    const recentOrders = recentOrderDocs.map((order) => ({
      id: order._id?.toString?.() ?? "",
      userName: order.userName ?? "Guest",
      phone: order.phone ?? "",
      total: Number(order.total ?? 0),
      status: String(order.status ?? "pending"),
      createdAt: new Date(order.createdAt ?? new Date()).toISOString(),
      items: (order.items ?? []).map((item: any) => ({
        name: item.name ?? "",
        quantity: Number(item.quantity ?? 1),
      })),
    }));

    const response: AdminStatsResponse = {
      totalOrders,
      todayOrders,
      pendingOrders,
      totalRevenue: Number.isFinite(totalRevenue) ? totalRevenue : 0,
      todayOrdersDelta,
      revenueDeltaPercent,
      recentOrders,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch admin stats:", error);
    return NextResponse.json({ error: "Failed to fetch admin stats." }, { status: 500 });
  }
}
