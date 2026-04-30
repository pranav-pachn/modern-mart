import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getMongoClient } from "@/lib/mongodb";

export const runtime = "nodejs";

const registerSchema = {
  parse(raw: unknown) {
    const body = typeof raw === "object" && raw !== null
      ? raw as { name?: unknown; email?: unknown; password?: unknown }
      : {};

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!name) return { error: "Name is required" };
    if (!email || !email.includes("@")) return { error: "Valid email is required" };
    if (password.length < 6) return { error: "Password must be at least 6 characters" };

    return { data: { name, email, password } };
  },
};

export async function POST(req: Request) {
  try {
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = registerSchema.parse(rawBody);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const client = await getMongoClient();
    const users = client.db().collection("users");

    const existingUser = await users.findOne({ email: parsed.data.email });
    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const password = await bcrypt.hash(parsed.data.password, 10);
    await users.insertOne({
      name: parsed.data.name,
      email: parsed.data.email,
      password,
      role: "user",
      addresses: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Registration failed:", error);
    return NextResponse.json({ error: "Unable to register account" }, { status: 500 });
  }
}
