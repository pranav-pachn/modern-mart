import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import clientPromise from "@/lib/mongodb";

const USERS_COLLECTION = "users";

export type UserAddress = {
  id: string;
  label: string;
  addressLine: string;
  city: string;
  pincode: string;
  isDefault?: boolean;
};

// GET /api/user/address — fetch all saved addresses for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    const user = await db.collection(USERS_COLLECTION).findOne({ email: token.email });

    return NextResponse.json(user?.addresses || []);
  } catch (error) {
    console.error("Failed to fetch addresses:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/user/address — save a new address
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { label, addressLine, city, pincode, isDefault } = body;

    if (!label || !addressLine || !city || !pincode) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const newAddress: UserAddress = {
      id: Math.random().toString(36).substring(2, 9),
      label: String(label).trim(),
      addressLine: String(addressLine).trim(),
      city: String(city).trim(),
      pincode: String(pincode).trim(),
      isDefault: Boolean(isDefault),
    };

    // If this is the default, clear existing defaults first
    if (newAddress.isDefault) {
      await db.collection(USERS_COLLECTION).updateOne(
        { email: token.email, "addresses.isDefault": true },
        { $set: { "addresses.$[elem].isDefault": false } },
        { arrayFilters: [{ "elem.isDefault": true }] }
      );
    }

    await db.collection(USERS_COLLECTION).updateOne(
      { email: token.email },
      { $push: { addresses: newAddress as any } }
    );

    return NextResponse.json(newAddress);
  } catch (error) {
    console.error("Failed to save address:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/user/address?id=xxx — remove an address by id
export async function DELETE(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Address ID is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    await db.collection(USERS_COLLECTION).updateOne(
      { email: token.email },
      { $pull: { addresses: { id } as any } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete address:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH /api/user/address?id=xxx — set an address as default
export async function PATCH(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Address ID is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Unset all defaults first
    await db.collection(USERS_COLLECTION).updateOne(
      { email: token.email, "addresses.isDefault": true },
      { $set: { "addresses.$[elem].isDefault": false } },
      { arrayFilters: [{ "elem.isDefault": true }] }
    );

    // Set the chosen address as default
    await db.collection(USERS_COLLECTION).updateOne(
      { email: token.email, "addresses.id": id },
      { $set: { "addresses.$.isDefault": true } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to set default address:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
