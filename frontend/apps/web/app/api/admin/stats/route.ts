import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getToken } from "next-auth/jwt";

const ORDERS_COLLECTION = "orders";

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
    total: number;
    status: string;
    createdAt: string;
  }[];
};

async function isAdmin(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  return (token as any)?.role === "admin";
}

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

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    const ordersCollection = db.collection(ORDERS_COLLECTION);

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
      ordersCollection.countDocuments({
        createdAt: {
          $gte: startOfToday,
          $lt: startOfTomorrow,
        },
      }),
      ordersCollection.countDocuments({
        createdAt: {
          $gte: startOfYesterday,
          $lt: endOfYesterday,
        },
      }),
      // Trustworthy pending count: status is exactly pending (case-insensitive).
      ordersCollection.countDocuments({
        $expr: {
          $eq: [{ $toLower: { $ifNull: ["$status", ""] } }, "pending"],
        },
      }),
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
      ordersCollection
        .aggregate<{ totalRevenue: number }>([
          {
            $match: {
              createdAt: {
                $gte: startOfToday,
                $lt: startOfTomorrow,
              },
            },
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: "$total" },
            },
          },
        ])
        .toArray(),
      ordersCollection
        .aggregate<{ totalRevenue: number }>([
          {
            $match: {
              createdAt: {
                $gte: startOfYesterday,
                $lt: endOfYesterday,
              },
            },
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: "$total" },
            },
          },
        ])
        .toArray(),
      ordersCollection
        .find(
          {},
          {
            projection: {
              _id: 1,
              userName: 1,
              total: 1,
              status: 1,
              createdAt: 1,
            },
          }
        )
        .sort({ createdAt: -1 })
        .limit(6)
        .toArray(),
    ]);

    const totalRevenue = Number(revenueDocs[0]?.totalRevenue ?? 0);
    const todayRevenue = Number(todayRevenueDocs[0]?.totalRevenue ?? 0);
    const yesterdayRevenue = Number(yesterdayRevenueDocs[0]?.totalRevenue ?? 0);
    const todayOrdersDelta = todayOrders - yesterdayOrders;
    const revenueDeltaPercent =
      yesterdayRevenue > 0
        ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
        : todayRevenue > 0
          ? 100
          : 0;

    const recentOrders = recentOrderDocs.map((order: any) => ({
      id: order._id?.toString?.() ?? "",
      userName: order.userName ?? "Guest",
      total: Number(order.total ?? 0),
      status: String(order.status ?? "pending"),
      createdAt: new Date(order.createdAt ?? new Date()).toISOString(),
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

    return NextResponse.json(
      {
        error: "Failed to fetch admin stats.",
      },
      { status: 500 }
    );
  }
}
