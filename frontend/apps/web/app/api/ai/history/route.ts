import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMongoClient } from "@/lib/mongodb";

export const runtime = "nodejs";

function getSessionEmail(session: unknown) {
  return (session as { user?: { email?: string | null } } | null)?.user?.email ?? "";
}

function normalizeHistory(item: any) {
  const id = item._id?.toString?.() ?? item.id ?? "";
  return {
    id,
    prompt: String(item.prompt ?? ""),
    results: Array.isArray(item.results) ? item.results : [],
    suggestedResults: Array.isArray(item.suggestedResults) ? item.suggestedResults : [],
    createdAt: item.createdAt instanceof Date
      ? item.createdAt.toISOString()
      : String(item.createdAt ?? new Date().toISOString()),
  };
}

export async function GET() {
  try {
    const session = await auth();
    const email = getSessionEmail(session);
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const client = await getMongoClient();
    const history = await client
      .db()
      .collection("aiHistory")
      .find({ userId: email })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json(history.map(normalizeHistory));
  } catch (error) {
    console.error("Failed to fetch AI history:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const email = getSessionEmail(session);
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const items = Array.isArray(rawBody) ? rawBody : [rawBody];
    const docs = items
      .filter((item) => typeof item === "object" && item !== null)
      .map((item: any) => ({
        userId: email,
        prompt: String(item.prompt ?? ""),
        results: Array.isArray(item.results) ? item.results : [],
        suggestedResults: Array.isArray(item.suggestedResults) ? item.suggestedResults : [],
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
      }))
      .filter((item) => item.prompt);

    if (docs.length === 0) {
      return NextResponse.json({ success: true, insertedCount: 0 });
    }

    const client = await getMongoClient();
    const result = await client.db().collection("aiHistory").insertMany(docs);

    return NextResponse.json({ success: true, insertedCount: result.insertedCount });
  } catch (error) {
    console.error("Failed to save AI history:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
