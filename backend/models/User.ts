import type { ObjectId } from "mongodb";

export const USERS_COLLECTION = "users";

export type UserAddress = {
  id: string;
  label: string;
  addressLine: string;
  city: string;
  pincode: string;
  isDefault?: boolean;
};

export type UserDocument = {
  _id?: ObjectId;
  name?: string;
  email: string;
  emailVerified?: Date | null;
  image?: string;
  password?: string;
  role?: string;
  addresses?: UserAddress[];
  createdAt?: Date;
  updatedAt?: Date;
};

export const userValidator = {
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
      addresses: {
        bsonType: "array",
        items: {
          bsonType: "object",
          required: ["id", "label", "addressLine", "city", "pincode"],
          properties: {
            id: { bsonType: "string" },
            label: { bsonType: "string" },
            addressLine: { bsonType: "string" },
            city: { bsonType: "string" },
            pincode: { bsonType: "string" },
            isDefault: { bsonType: "boolean" },
          },
        },
      },
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" },
    },
  },
} as const;
