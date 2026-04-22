import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import clientPromise from "@/lib/mongodb";
import { AI_HISTORY_COLLECTION, AIHistoryDocument } from "@/models/AIHistory";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    
    // Sort by newest first
    const history = await db
      .collection<AIHistoryDocument>(AI_HISTORY_COLLECTION)
      .find({ userId: token.email })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json(history);
  } catch (error) {
    console.error("Failed to fetch AI history:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const client = await clientPromise;
    const db = client.db();

    // Support single item or array of items (for sync)
    const itemsToInsert = Array.isArray(body) ? body : [body];
    
    if (itemsToInsert.length === 0) {
      return NextResponse.json({ success: true });
    }

    const docsToInsert: AIHistoryDocument[] = itemsToInsert.map((item: any) => ({
      userId: token.email as string,
      prompt: String(item.prompt),
      results: Array.isArray(item.results) ? item.results : [],
      suggestedResults: Array.isArray(item.suggestedResults) ? item.suggestedResults : [],
      createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
    }));

    await db.collection<AIHistoryDocument>(AI_HISTORY_COLLECTION).insertMany(docsToInsert);

    return NextResponse.json({ success: true, insertedCount: docsToInsert.length });
  } catch (error) {
    console.error("Failed to save AI history:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
