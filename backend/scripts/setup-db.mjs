import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(backendRoot, "..");

loadEnv(path.join(repoRoot, ".env"));
loadEnv(path.join(repoRoot, "frontend", "apps", "web", ".env.local"));

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Missing MONGODB_URI. Add it to the repository root .env file.");
}

const userValidator = {
  $jsonSchema: {
    bsonType: "object",
    required: ["email"],
    additionalProperties: false,
    properties: {
      _id: { bsonType: "objectId" },
      name: { bsonType: "string" },
      email: { bsonType: "string", minLength: 1 },
      emailVerified: { bsonType: ["date", "null"] },
      image: { bsonType: "string" },
      password: { bsonType: "string" },
      role: { bsonType: "string" },
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" },
    },
  },
};

const productValidator = {
  $jsonSchema: {
    bsonType: "object",
    required: ["name", "price", "category", "image", "stock"],
    additionalProperties: false,
    properties: {
      _id: { bsonType: "objectId" },
      name: { bsonType: "string", minLength: 1 },
      price: { bsonType: ["int", "long", "double", "decimal"], minimum: 0 },
      category: { bsonType: "string", minLength: 1 },
      image: { bsonType: "string", minLength: 1 },
      stock: { bsonType: ["int", "long"], minimum: 0 },
    },
  },
};

const orderValidator = {
  $jsonSchema: {
    bsonType: "object",
    required: [
      "userName",
      "phone",
      "address",
      "deliverySlot",
      "subtotal",
      "items",
      "total",
      "status",
      "paymentMethod",
      "createdAt",
    ],
    additionalProperties: false,
    properties: {
      _id: { bsonType: "objectId" },
      userName: { bsonType: "string", minLength: 1 },
      phone: { bsonType: "string", minLength: 1 },
      address: { bsonType: "string", minLength: 1 },
      deliverySlot: { enum: ["Morning", "Afternoon", "Evening"] },
      subtotal: { bsonType: ["int", "long", "double", "decimal"], minimum: 0 },
      items: {
        bsonType: "array",
        minItems: 1,
        items: {
          bsonType: "object",
          required: ["productId", "name", "price", "quantity"],
          additionalProperties: false,
          properties: {
            productId: { bsonType: "string", minLength: 1 },
            name: { bsonType: "string", minLength: 1 },
            price: {
              bsonType: ["int", "long", "double", "decimal"],
              minimum: 0,
            },
            quantity: { bsonType: ["int", "long"], minimum: 1 },
          },
        },
      },
      total: { bsonType: ["int", "long", "double", "decimal"], minimum: 0 },
      status: {
        enum: ["pending", "placed", "accepted", "confirmed", "packed", "out for delivery", "delivered", "cancelled"],
      },
      paymentMethod: { bsonType: "string", minLength: 1 },
      paymentId: { bsonType: "string" },
      paymentStatus: { bsonType: "string" },
      notes: { bsonType: "string", maxLength: 500 },
      createdAt: { bsonType: "date" },
    },
  },
};

const seedProducts = [
  product("Fresh Tomatoes", 45, "Fruits & Vegetables", "tomatoes.jpg", 50),
  product("Banana", 62, "Fruits & Vegetables", "banana.jpg", 40),
  product("Amul Taaza Milk", 58, "Dairy & Eggs", "amul-taaza-milk.jpg", 35),
  product("Farm Eggs", 54, "Dairy & Eggs", "farm-eggs.jpg", 30),
  product("Potato Chips", 25, "Snacks", "potato-chips.jpg", 80),
  product("Salted Peanuts", 40, "Snacks", "salted-peanuts.jpg", 65),
  product("Orange Juice", 110, "Beverages", "orange-juice.jpg", 24),
  product("Mineral Water", 20, "Beverages", "mineral-water.jpg", 120),
  product("Whole Wheat Bread", 38, "Bakery", "whole-wheat-bread.jpg", 28),
  product("Burger Buns", 45, "Bakery", "burger-buns.jpg", 22),
  product("Dishwash Liquid", 89, "Household", "dishwash-liquid.jpg", 34),
  product("Laundry Detergent", 199, "Household", "laundry-detergent.jpg", 18),
];

const client = new MongoClient(uri);

try {
  await client.connect();
  const db = client.db();

  await ensureCollection(db, "products", productValidator);
  await ensureCollection(db, "orders", orderValidator);
  await ensureCollection(db, "users", userValidator);

  await enforceValidator(db, "products", productValidator);
  await enforceValidator(db, "orders", orderValidator);
  await enforceValidator(db, "users", userValidator);

  await normalizeProducts(db);
  await normalizeOrders(db);
  await seedProductsIfEmpty(db);
  await seedAdminIfEmpty(db);

  await db.collection("products").createIndex({ name: 1 }, { unique: true });
  await db.collection("products").createIndex({ category: 1 });
  await db.collection("orders").createIndex({ createdAt: -1 });
  await db.collection("orders").createIndex({ status: 1 });
  await db.collection("users").createIndex({ email: 1 }, { unique: true });

  const productCount = await db.collection("products").countDocuments();
  const orderCount = await db.collection("orders").countDocuments();
  const userCount = await db.collection("users").countDocuments();

  console.log(`Database ready: ${db.databaseName}`);
  console.log(`products: ${productCount} document(s)`);
  console.log(`orders: ${orderCount} document(s)`);
  console.log(`users: ${userCount} document(s)`);
} finally {
  await client.close();
}

function loadEnv(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const env = readFileSync(filePath, "utf8");

  for (const line of env.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value.replace(/^["']|["']$/g, "");
    }
  }
}

function product(name, price, category, imageName, stock) {
  return {
    name,
    price,
    category,
    image: `/products/${imageName}`,
    stock,
  };
}

async function ensureCollection(db, name, validator) {
  const collections = await db
    .listCollections({ name }, { nameOnly: true })
    .toArray();

  if (collections.length > 0) {
    return;
  }

  await db.createCollection(name, {
    validator,
    validationLevel: "strict",
    validationAction: "error",
  });
}

async function enforceValidator(db, name, validator) {
  await db.command({
    collMod: name,
    validator,
    validationLevel: "strict",
    validationAction: "error",
  });
}

async function normalizeProducts(db) {
  const products = db.collection("products");

  await products.updateMany({}, [
    {
      $replaceRoot: {
        newRoot: {
          _id: "$_id",
          name: { $ifNull: ["$name", "Unknown Product"] },
          price: { $ifNull: ["$price", 0] },
          category: { $ifNull: ["$category", "Uncategorized"] },
          image: { $ifNull: ["$image", "/products/placeholder.jpg"] },
          stock: { $ifNull: ["$stock", 0] },
        },
      },
    },
  ]);
}

async function normalizeOrders(db) {
  const orders = db.collection("orders");

  await orders.updateMany(
    {},
    [
      {
        $replaceRoot: {
          newRoot: {
          _id: "$_id",
          userName: { $ifNull: ["$userName", "Guest Customer"] },
          phone: { $ifNull: ["$phone", "Not provided"] },
          address: { $ifNull: ["$address", "Not provided"] },
          deliverySlot: {
            $cond: {
              if: { $in: ["$deliverySlot", ["Morning", "Afternoon", "Evening"]] },
              then: "$deliverySlot",
              else: "Morning",
            },
          },
          items: {
            $cond: {
              if: { $gt: [{ $size: { $ifNull: ["$items", []] } }, 0] },
              then: {
                $map: {
                  input: "$items",
                  as: "item",
                  in: {
                    productId: { $ifNull: ["$$item.productId", "unknown-product"] },
                    name: { $ifNull: ["$$item.name", "Unknown Product"] },
                    price: { $ifNull: ["$$item.price", 0] },
                    quantity: { $ifNull: ["$$item.quantity", 1] },
                  },
                },
              },
              else: [
                {
                  productId: "unknown-product",
                  name: "Unknown Product",
                  price: 0,
                  quantity: 1,
                },
              ],
            },
          },
          subtotal: {
            $ifNull: [
              "$subtotal",
              {
                $sum: {
                  $map: {
                    input: { $ifNull: ["$items", []] },
                    as: "item",
                    in: {
                      $multiply: [
                        { $ifNull: ["$$item.price", 0] },
                        { $ifNull: ["$$item.quantity", 1] },
                      ],
                    },
                  },
                },
              },
            ],
          },
          total: { $ifNull: ["$total", 0] },
          status: {
            $cond: {
              if: {
                $in: [
                  "$status",
                  ["pending", "placed", "accepted", "confirmed", "packed", "out for delivery", "delivered", "cancelled"],
                ],
              },
              then: "$status",
              else: "pending",
            },
          },
          paymentMethod: { $ifNull: ["$paymentMethod", "COD"] },
          paymentId: { $ifNull: ["$paymentId", "$$REMOVE"] },
          paymentStatus: { $ifNull: ["$paymentStatus", "$$REMOVE"] },
          notes: { $ifNull: ["$notes", "$$REMOVE"] },
          createdAt: { $ifNull: ["$createdAt", "$$NOW"] },
          },
        },
      },
    ],
    { bypassDocumentValidation: true }
  );
}

async function seedProductsIfEmpty(db) {
  const products = db.collection("products");
  const existingCount = await products.countDocuments();

  if (existingCount > 0) {
    return;
  }

  await products.insertMany(seedProducts);
}

async function seedAdminIfEmpty(db) {
  const users = db.collection("users");
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) return;

  const existingAdmin = await users.findOne({ email: adminEmail });
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await users.insertOne({
      name: "Administrator",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("Seeded default admin user.");
  }
}

