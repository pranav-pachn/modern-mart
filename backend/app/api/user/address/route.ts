import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import clientPromise from "@/lib/mongodb";
import { USERS_COLLECTION, UserAddress } from "@/models/User";
import { z } from "zod";

const addressSchema = z.object({
  label: z.string().min(1, "Label is required (e.g. Home, Work)"),
  addressLine: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  pincode: z.string().min(6, "Invalid Pincode").max(6, "Invalid Pincode"),
});

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    if (!token) {
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

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = addressSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const newAddress: UserAddress = {
      id: Math.random().toString(36).substring(7),
      ...parsed.data,
      isDefault: body.isDefault || false,
    };

    // If isDefault is true, unset other default addresses
    if (newAddress.isDefault) {
      await db.collection(USERS_COLLECTION).updateOne(
        { email: token.email, "addresses.isDefault": true },
        { $set: { "addresses.$.isDefault": false } }
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

export async function DELETE(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    if (!token) {
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
