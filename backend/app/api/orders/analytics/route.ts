import { NextRequest, NextResponse } from "next/server";
import { getMongoClient } from "@/lib/mongodb";
import { ORDERS_COLLECTION, type OrderDocument } from "@/models/Order";
import { requireAdminToken } from "@/lib/api-guard";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdminToken(request);
    if (authError) return authError;

    const client = await getMongoClient();
    const db = client.db();
    const col = db.collection<OrderDocument>(ORDERS_COLLECTION);

    // Date range — last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      statusBreakdown,
      revenueByDay,
      ordersByDay,
      topProducts,
      recentActivity,
    ] = await Promise.all([
    // A) Status breakdown — all orders
    col.aggregate([
      { $group: { _id: { $toLower: "$status" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).toArray(),

    // B) Revenue per day (last 30 days)
    col.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: "$_id", revenue: 1, orders: 1 } },
    ]).toArray(),

    // C) Orders per day (last 14 days, separate for bar chart)
    col.aggregate([
      { $match: { createdAt: { $gte: (() => { const d = new Date(); d.setDate(d.getDate() - 14); return d; })() } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: "$_id", count: 1 } },
    ]).toArray(),

    // D) Top Selling Items (group by productId, count orders)
    col.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          name: { $first: "$items.name" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          units: { $sum: "$items.quantity" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { orderCount: -1 } },
      { $limit: 5 },
      { $project: { _id: 0, productId: "$_id", name: 1, revenue: 1, units: 1, orderCount: 1 } },
    ]).toArray(),

    // E) Recent Activity Feed
    col.find({}).sort({ createdAt: -1 }).limit(8).project({ 
      _id: 1, 
      userName: 1, 
      phone: 1,
      address: 1,
      items: 1,
      status: 1, 
      total: 1, 
      createdAt: 1,
      updatedAt: 1
    }).toArray(),
    ]);

    return NextResponse.json(
      { statusBreakdown, revenueByDay, ordersByDay, topProducts, recentActivity },
      {
        headers: {
          ...corsHeaders,
          "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch order analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch order analytics." },
      { status: 500, headers: corsHeaders }
    );
  }
}
