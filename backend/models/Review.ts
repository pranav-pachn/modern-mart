import type { ObjectId } from "mongodb";

export const REVIEWS_COLLECTION = "reviews";

export type ReviewDocument = {
  _id?: ObjectId;
  productId: ObjectId;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Date;
};

export const reviewValidator = {
  $jsonSchema: {
    bsonType: "object",
    required: ["productId", "userId", "userName", "rating", "comment", "createdAt"],
    additionalProperties: false,
    properties: {
      _id: { bsonType: "objectId" },
      productId: { bsonType: "objectId" },
      userId: { bsonType: "string" },
      userName: { bsonType: "string" },
      rating: { bsonType: ["int", "long", "double"], minimum: 1, maximum: 5 },
      comment: { bsonType: "string", minLength: 1 },
      createdAt: { bsonType: "date" },
    },
  },
} as const;
