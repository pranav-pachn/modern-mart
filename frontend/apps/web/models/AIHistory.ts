import type { ObjectId } from "mongodb";

export const AI_HISTORY_COLLECTION = "aiHistory";

export interface AIHistoryDocument {
  _id?: ObjectId;
  userId: string;
  prompt: string;
  results: any[];
  suggestedResults: any[];
  createdAt: Date;
}
