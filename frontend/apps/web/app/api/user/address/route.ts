import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMongoClient } from "@/lib/mongodb";

export const runtime = "nodejs";

type AddressBody = {
  label?: unknown;
  addressLine?: unknown;
  city?: unknown;
  pincode?: unknown;
  isDefault?: unknown;
};

function getSessionEmail(session: unknown) {
  return (session as { user?: { email?: string | null } } | null)?.user?.email ?? "";
}

function parseAddress(raw: unknown) {
  const body = typeof raw === "object" && raw !== null ? raw as AddressBody : {};
  const label = typeof body.label === "string" ? body.label.trim() : "";
  const addressLine = typeof body.addressLine === "string" ? body.addressLine.trim() : "";
  const city = typeof body.city === "string" ? body.city.trim() : "";
  const pincode = typeof body.pincode === "string" ? body.pincode.trim() : "";

  if (!label) return { error: "Label is required" };
  if (!addressLine) return { error: "Address is required" };
  if (!city) return { error: "City is required" };
  if (!/^\d{6}$/.test(pincode)) return { error: "Invalid pincode" };

  return {
    data: {
      id: crypto.randomUUID(),
      label,
      addressLine,
      city,
      pincode,
      isDefault: Boolean(body.isDefault),
    },
  };
}

export async function GET() {
  try {
    const session = await auth();
    const email = getSessionEmail(session);
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const client = await getMongoClient();
    const user = await client.db().collection<any>("users").findOne(
      { email },
      { projection: { addresses: 1 } }
    );

    return NextResponse.json(user?.addresses ?? []);
  } catch (error) {
    console.error("Failed to fetch addresses:", error);
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

    const parsed = parseAddress(rawBody);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const client = await getMongoClient();
    const users = client.db().collection<any>("users");

    if (parsed.data.isDefault) {
      await users.updateOne(
        { email, "addresses.isDefault": true },
        { $set: { "addresses.$.isDefault": false } }
      );
    }

    await users.updateOne(
      { email },
      ({
        $setOnInsert: { email, createdAt: new Date() },
        $set: { updatedAt: new Date() },
        $push: { addresses: parsed.data },
      }) as any,
      { upsert: true }
    );

    return NextResponse.json(parsed.data, { status: 201 });
  } catch (error) {
    console.error("Failed to save address:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    const email = getSessionEmail(session);
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Address ID is required" }, { status: 400 });

    const client = await getMongoClient();
    await client.db().collection<any>("users").updateOne(
      { email },
      ({ $pull: { addresses: { id } } }) as any
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete address:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    const email = getSessionEmail(session);
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Address ID is required" }, { status: 400 });

    const client = await getMongoClient();
    const users = client.db().collection<any>("users");

    await users.updateOne(
      { email, "addresses.isDefault": true },
      { $set: { "addresses.$.isDefault": false } }
    );

    const result = await users.updateOne(
      { email, "addresses.id": id },
      { $set: { "addresses.$.isDefault": true, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to set default address:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
