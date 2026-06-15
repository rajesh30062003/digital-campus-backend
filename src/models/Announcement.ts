import mongoose, { Document, Schema } from "mongoose";

export type AnnouncementCategory =
  | "academic"
  | "event"
  | "exam"
  | "holiday"
  | "general"
  | "urgent";

export interface IAnnouncement extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  category: AnnouncementCategory;
  author: mongoose.Types.ObjectId;
  targetAudience: ("student" | "faculty" | "all")[];
  department?: string;
  attachments?: string[];
  isPinned: boolean;
  expiresAt?: Date;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true },
    category: {
      type: String,
      enum: ["academic", "event", "exam", "holiday", "general", "urgent"],
      default: "general",
    },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetAudience: {
      type: [String],
      enum: ["student", "faculty", "all"],
      default: ["all"],
    },
    department: { type: String },
    attachments: [{ type: String }],
    isPinned: { type: Boolean, default: false },
    expiresAt: { type: Date },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

announcementSchema.index({ category: 1, createdAt: -1 });
announcementSchema.index({ isPinned: -1, createdAt: -1 });

export const Announcement = mongoose.model<IAnnouncement>(
  "Announcement",
  announcementSchema
);
