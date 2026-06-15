import { Request, Response } from "express";
import { Discussion } from "../models/Discussion";
import asyncHandler from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { paginate } from "../utils/paginate";

// GET /api/courses/:courseId/discussions
export const getCourseDiscussions = asyncHandler(
  async (req: Request, res: Response) => {
    const { page, limit, tag } = req.query;
    const filter: Record<string, unknown> = { course: req.params.courseId };
    if (tag) filter.tags = tag;

    const result = await paginate(Discussion, filter, {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      sort: { isPinned: -1, createdAt: -1 },
      populate: [{ path: "author", select: "name role avatar" }],
    });

    res.json({ success: true, ...result });
  }
);

// GET /api/discussions/:id
export const getDiscussionById = asyncHandler(
  async (req: Request, res: Response) => {
    const discussion = await Discussion.findById(req.params.id)
      .populate("author", "name role avatar department")
      .populate("replies.author", "name role avatar");

    if (!discussion) throw new AppError("Discussion not found", 404);
    res.json({ success: true, data: { discussion } });
  }
);

// POST /api/courses/:courseId/discussions
export const createDiscussion = asyncHandler(
  async (req: Request, res: Response) => {
    const discussion = await Discussion.create({
      ...req.body,
      course: req.params.courseId,
      author: (req as any).user._id,
    });

    res.status(201).json({ success: true, data: { discussion } });
  }
);

// POST /api/discussions/:id/replies
export const addReply = asyncHandler(async (req: Request, res: Response) => {
  const discussion = await Discussion.findById(req.params.id);
  if (!discussion) throw new AppError("Discussion not found", 404);

  discussion.replies.push({
    author: (req as any).user._id,
    content: req.body.content,
    createdAt: new Date(),
    likes: [],
  });

  await discussion.save();
  await discussion.populate("replies.author", "name role avatar");

  const newReply = discussion.replies[discussion.replies.length - 1];
  res.status(201).json({ success: true, data: { reply: newReply } });
});

// PATCH /api/discussions/:id/like
export const toggleLike = asyncHandler(async (req: Request, res: Response) => {
  const discussion = await Discussion.findById(req.params.id);
  if (!discussion) throw new AppError("Discussion not found", 404);

  const userId = (req as any).user._id.toString();
  const liked = discussion.likes.some((l) => l.toString() === userId);

  if (liked) {
    discussion.likes = discussion.likes.filter((l) => l.toString() !== userId);
  } else {
    discussion.likes.push((req as any).user._id);
  }

  await discussion.save();
  res.json({ success: true, data: { likes: discussion.likes.length, liked: !liked } });
});

// DELETE /api/discussions/:id
export const deleteDiscussion = asyncHandler(
  async (req: Request, res: Response) => {
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) throw new AppError("Discussion not found", 404);

    const reqUser = (req as any).user;
    if (
      reqUser.role !== "admin" &&
      discussion.author.toString() !== reqUser._id.toString()
    ) {
      throw new AppError("Not authorized", 403);
    }

    await discussion.deleteOne();
    res.json({ success: true, message: "Discussion deleted" });
  }
);
