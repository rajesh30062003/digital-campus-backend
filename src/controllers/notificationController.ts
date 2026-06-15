import { Request, Response } from "express";
import { Notification } from "../models/Notification";
import asyncHandler from "../utils/asyncHandler";

// GET /api/notifications  (current user)
export const getMyNotifications = asyncHandler(async (req: Request, res: Response) => {
  const notifications = await Notification.find({ recipient: (req as any).user._id })
    .sort({ createdAt: -1 })
    .limit(50);

  const unreadCount = await Notification.countDocuments({
    recipient: (req as any).user._id,
    isRead: false,
  });

  res.json({ success: true, data: { notifications, unreadCount } });
});

// PATCH /api/notifications/:id/read
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
  res.json({ success: true });
});

// PATCH /api/notifications/read-all
export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  await Notification.updateMany({ recipient: (req as any).user._id, isRead: false }, { isRead: true });
  res.json({ success: true });
});

// Utility: Create notification (called internally)
export const createNotification = async (
  recipientId: string,
  data: { title: string; message: string; type: string; link?: string }
) => {
  await Notification.create({ recipient: recipientId, ...data });
};
