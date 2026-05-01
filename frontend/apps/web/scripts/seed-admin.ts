/**
 * Admin Seeding Script
 * Creates an admin user if one doesn't exist
 * Run: npx tsx scripts/seed-admin.ts
 */

import { getMongoClient } from "@/lib/mongodb";
import bcrypt from "bcryptjs";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const ADMIN_NAME = process.env.ADMIN_NAME || "Admin";

async function seedAdmin() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    const client = await getMongoClient();
    const users = client.db().collection("users");

    // Check if admin already exists
    const existingAdmin = await users.findOne({ email: ADMIN_EMAIL });

    if (existingAdmin) {
      console.log(`✅ Admin user already exists: ${ADMIN_EMAIL}`);

      // Ensure role is admin
      if (existingAdmin.role !== "admin") {
        await users.updateOne(
          { email: ADMIN_EMAIL },
          { $set: { role: "admin" } }
        );
        console.log("🔧 Updated role to 'admin'");
      }
      return;
    }

    // Create admin user
    console.log("🌱 Creating admin user...");
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    await users.insertOne({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: "admin",
      addresses: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log("✅ Admin user created successfully!");
    console.log(`📧 Email: ${ADMIN_EMAIL}`);
    console.log(`🔑 Password: ${ADMIN_PASSWORD}`);
    console.log("⚠️  Please change the default password after first login!");

  } catch (error) {
    console.error("❌ Failed to seed admin:", error);
    process.exit(1);
  }
}

// Run the seed function
seedAdmin();
