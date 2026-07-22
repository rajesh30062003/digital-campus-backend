import mongoose, { Document, Schema } from "mongoose";

export interface IReply {
  _id?: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  likes: mongoose.Types.ObjectId[];
}

export interface IDiscussion extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  course: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  replies: IReply[];
  likes: mongoose.Types.ObjectId[];
  isPinned: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const replySchema = new Schema<IReply>(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const discussionSchema = new Schema<IDiscussion>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    replies: [replySchema],
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isPinned: { type: Boolean, default: false },
    tags: [String],
  },
  { timestamps: true }
);

discussionSchema.index({ course: 1, createdAt: -1 });

export const Discussion = mongoose.model<IDiscussion>(
  "Discussion",
  discussionSchema
);
