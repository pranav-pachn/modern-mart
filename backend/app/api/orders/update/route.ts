import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { ORDERS_COLLECTION } from "@/models/Order";

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

export async function POST(req: Request) {
  try {
    const { id, status } = await req.json();
    const client = await clientPromise;
    await client.db()
      .collection(ORDERS_COLLECTION)
      .updateOne({ _id: new ObjectId(id) }, { $set: { status } });

    return NextResponse.json({ success: true }, { status: 200, headers: corsHeaders });
  } catch (e) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500, headers: corsHeaders });
  }
}
