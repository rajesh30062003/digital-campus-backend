import { Request, Response } from "express";
import { Announcement } from "../models/Announcement";
import asyncHandler from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { paginate } from "../utils/paginate";

// GET /api/announcements
export const getAnnouncements = asyncHandler(
  async (req: Request, res: Response) => {
    const { category, department, page, limit } = req.query;
    const user = (req as any).user;

    const filter: Record<string, unknown> = {
      $and: [
        { $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] },
      ],
    };

    if (user.role === "student") {
      filter.$or = [
        { targetAudience: "all" },
        { targetAudience: "student" },
      ];
    }

    if (category) filter.category = category;
    if (department) filter.department = department;

    const result = await paginate(Announcement, filter, {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      sort: { isPinned: -1, createdAt: -1 },
      populate: [{ path: "author", select: "name role avatar" }],
    });

    res.json({ success: true, ...result });
  }
);

// GET /api/announcements/:id
export const getAnnouncementById = asyncHandler(
  async (req: Request, res: Response) => {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate("author", "name role avatar");

    if (!announcement) throw new AppError("Announcement not found", 404);
    res.json({ success: true, data: { announcement } });
  }
);

// POST /api/announcements  (faculty/admin)
export const createAnnouncement = asyncHandler(
  async (req: Request, res: Response) => {
    const announcement = await Announcement.create({
      ...req.body,
      author: (req as any).user._id,
    });

    res.status(201).json({ success: true, data: { announcement } });
  }
);

// PATCH /api/announcements/:id
export const updateAnnouncement = asyncHandler(
  async (req: Request, res: Response) => {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) throw new AppError("Announcement not found", 404);

    const reqUser = (req as any).user;
    if (
      reqUser.role !== "admin" &&
      announcement.author.toString() !== reqUser._id.toString()
    ) {
      throw new AppError("Not authorized", 403);
    }

    const updated = await Announcement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("author", "name role avatar");

    res.json({ success: true, data: { announcement: updated } });
  }
);

// DELETE /api/announcements/:id
export const deleteAnnouncement = asyncHandler(
  async (req: Request, res: Response) => {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) throw new AppError("Announcement not found", 404);

    const reqUser = (req as any).user;
    if (
      reqUser.role !== "admin" &&
      announcement.author.toString() !== reqUser._id.toString()
    ) {
      throw new AppError("Not authorized", 403);
    }

    await announcement.deleteOne();
    res.json({ success: true, message: "Announcement deleted" });
  }
);
