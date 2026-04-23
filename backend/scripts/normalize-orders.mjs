import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";

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
            price: { bsonType: ["int", "long", "double", "decimal"], minimum: 0 },
            quantity: { bsonType: ["int", "long"], minimum: 1 },
          },
        },
      },
      total: { bsonType: ["int", "long", "double", "decimal"], minimum: 0 },
      status: {
        enum: [
          "pending",
          "placed",
          "accepted",
          "confirmed",
          "packed",
          "out for delivery",
          "delivered",
          "cancelled",
        ],
      },
      paymentMethod: { bsonType: "string", minLength: 1 },
      paymentId: { bsonType: "string" },
      paymentStatus: { bsonType: "string" },
      notes: { bsonType: "string", maxLength: 500 },
      createdAt: { bsonType: "date" },
    },
  },
};

const client = new MongoClient(uri);

try {
  await client.connect();
  const db = client.db();
  const orders = db.collection("orders");

  const result = await orders.updateMany(
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
                    quantity: { $max: [{ $ifNull: ["$$item.quantity", 1] }, 1] },
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
                        { $max: [{ $ifNull: ["$$item.quantity", 1] }, 1] },
                      ],
                    },
                  },
                },
              },
            ],
          },
          total: { $ifNull: ["$total", 0] },
          status: {
            $let: {
              vars: { normalized: { $toLower: { $ifNull: ["$status", "pending"] } } },
              in: {
                $cond: {
                  if: {
                    $in: [
                      "$$normalized",
                      [
                        "pending",
                        "placed",
                        "accepted",
                        "confirmed",
                        "packed",
                        "out for delivery",
                        "delivered",
                        "cancelled",
                      ],
                    ],
                  },
                  then: "$$normalized",
                  else: "pending",
                },
              },
            },
          },
          paymentMethod: { $ifNull: ["$paymentMethod", "COD"] },
          paymentId: { $ifNull: ["$paymentId", "$$REMOVE"] },
          paymentStatus: { $ifNull: ["$paymentStatus", "$$REMOVE"] },
          notes: {
            $let: {
              vars: { rawNotes: { $ifNull: ["$notes", ""] } },
              in: {
                $cond: {
                  if: { $gt: [{ $strLenCP: "$$rawNotes" }, 0] },
                  then: { $substrCP: ["$$rawNotes", 0, 500] },
                  else: "$$REMOVE",
                },
              },
            },
          },
          createdAt: { $ifNull: ["$createdAt", "$$NOW"] },
          },
        },
      },
    ],
    { bypassDocumentValidation: true }
  );

  await db.command({
    collMod: "orders",
    validator: orderValidator,
    validationLevel: "strict",
    validationAction: "error",
  });

  console.log(`Normalized ${result.modifiedCount} order document(s).`);
  console.log("Orders validator is now aligned with the current app schema.");
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