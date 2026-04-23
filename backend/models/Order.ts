import type { ObjectId } from "mongodb";

export const ORDERS_COLLECTION = "orders";

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export type OrderDocument = {
  _id?: ObjectId;
  userName: string;
  phone: string;
  address: string;
  deliverySlot: string;
  subtotal: number;
  items: OrderItem[];
  total: number;
  status: string;
  paymentMethod: string;
  paymentId?: string;
  paymentStatus?: string;
  notes?: string;
  createdAt: Date;
};

export const orderValidator = {
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
      _id: {
        bsonType: "objectId",
      },
      userName: {
        bsonType: "string",
        minLength: 1,
      },
      phone: {
        bsonType: "string",
        minLength: 1,
      },
      address: {
        bsonType: "string",
        minLength: 1,
      },
      deliverySlot: {
        enum: ["Morning", "Afternoon", "Evening"],
      },
      subtotal: {
        bsonType: ["int", "long", "double", "decimal"],
        minimum: 0,
      },
      items: {
        bsonType: "array",
        minItems: 1,
        items: {
          bsonType: "object",
          required: ["productId", "name", "price", "quantity"],
          additionalProperties: false,
          properties: {
            productId: {
              bsonType: "string",
              minLength: 1,
            },
            name: {
              bsonType: "string",
              minLength: 1,
            },
            price: {
              bsonType: ["int", "long", "double", "decimal"],
              minimum: 0,
            },
            quantity: {
              bsonType: ["int", "long"],
              minimum: 1,
            },
          },
        },
      },
      total: {
        bsonType: ["int", "long", "double", "decimal"],
        minimum: 0,
      },
      status: {
        enum: ["pending", "placed", "accepted", "confirmed", "packed", "out for delivery", "delivered", "cancelled"],
      },
      paymentMethod: {
        bsonType: "string",
        minLength: 1,
      },
      paymentId: {
        bsonType: "string",
      },
      paymentStatus: {
        bsonType: "string",
      },
      notes: {
        bsonType: "string",
        maxLength: 500,
      },
      createdAt: {
        bsonType: "date",
      },
    },
  },
} as const;
