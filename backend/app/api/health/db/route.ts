import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET() {
  try {
    const client = await clientPromise;

    await client.db().admin().ping();

    return NextResponse.json({
      connected: true,
      database: client.db().databaseName,
    });
  } catch (error) {
    console.error("MongoDB connection check failed", error);

    return NextResponse.json(
      {
        connected: false,
        error: "Unable to connect to MongoDB",
      },
      { status: 500 },
    );
  }
}
