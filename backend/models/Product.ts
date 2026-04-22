import type { ObjectId, Int32 } from "mongodb";

export const PRODUCTS_COLLECTION = "products";

export type ProductDocument = {
  _id?: ObjectId;
  name: string;
  price: number;
  category: string;
  image: string;
  stock: Int32 | number;
  createdAt?: Date;
  updatedAt?: Date;
};

export const productValidator = {
  $jsonSchema: {
    bsonType: "object",
    required: ["name", "price", "category", "image", "stock"],
    additionalProperties: false,
    properties: {
      _id: {
        bsonType: "objectId",
      },
      name: {
        bsonType: "string",
        minLength: 1,
      },
      price: {
        bsonType: ["int", "long", "double", "decimal"],
        minimum: 0,
      },
      category: {
        bsonType: "string",
        minLength: 1,
      },
      image: {
        bsonType: "string",
        minLength: 1,
      },
      stock: {
        bsonType: ["int", "long"],
        minimum: 0,
      },
      createdAt: {
        bsonType: "date",
      },
      updatedAt: {
        bsonType: "date",
      },
    },
  },
} as const;
