import { Request, Response } from "express";
import { Event } from "../models/Event";
import asyncHandler from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { paginate } from "../utils/paginate";

// GET /api/events
export const getEvents = asyncHandler(async (req: Request, res: Response) => {
  const { category, upcoming, page, limit } = req.query;
  const filter: Record<string, unknown> = { isPublished: true };

  if (category) filter.category = category;
  if (upcoming === "true") filter.startDate = { $gte: new Date() };

  const result = await paginate(Event, filter, {
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    sort: { startDate: 1 },
    populate: [{ path: "organizer", select: "name role avatar" }],
  });

  res.json({ success: true, ...result });
});

// GET /api/events/:id
export const getEventById = asyncHandler(
  async (req: Request, res: Response) => {
    const event = await Event.findById(req.params.id)
      .populate("organizer", "name email avatar")
      .populate("registeredParticipants", "name email avatar");

    if (!event) throw new AppError("Event not found", 404);
    res.json({ success: true, data: { event } });
  }
);

// POST /api/events  (faculty/admin)
export const createEvent = asyncHandler(
  async (req: Request, res: Response) => {
    const event = await Event.create({
      ...req.body,
      organizer: (req as any).user._id,
    });
    res.status(201).json({ success: true, data: { event } });
  }
);

// PATCH /api/events/:id
export const updateEvent = asyncHandler(
  async (req: Request, res: Response) => {
    const event = await Event.findById(req.params.id);
    if (!event) throw new AppError("Event not found", 404);

    const reqUser = (req as any).user;
    if (
      reqUser.role !== "admin" &&
      event.organizer.toString() !== reqUser._id.toString()
    ) {
      throw new AppError("Not authorized", 403);
    }

    const updated = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: { event: updated } });
  }
);

// DELETE /api/events/:id
export const deleteEvent = asyncHandler(
  async (req: Request, res: Response) => {
    const event = await Event.findById(req.params.id);
    if (!event) throw new AppError("Event not found", 404);

    const reqUser = (req as any).user;
    if (
      reqUser.role !== "admin" &&
      event.organizer.toString() !== reqUser._id.toString()
    ) {
      throw new AppError("Not authorized", 403);
    }

    await event.deleteOne();
    res.json({ success: true, message: "Event deleted" });
  }
);

// POST /api/events/:id/register
export const registerForEvent = asyncHandler(
  async (req: Request, res: Response) => {
    const event = await Event.findById(req.params.id);
    if (!event) throw new AppError("Event not found", 404);
    if (!event.isPublished) throw new AppError("Event is not open", 400);

    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      throw new AppError("Registration deadline has passed", 400);
    }

    const userId = (req as any).user._id;
    if (event.registeredParticipants.some((p) => p.toString() === userId.toString())) {
      throw new AppError("Already registered", 409);
    }

    if (event.maxParticipants && event.registeredParticipants.length >= event.maxParticipants) {
      throw new AppError("Event is full", 400);
    }

    event.registeredParticipants.push(userId);
    await event.save();

    res.json({ success: true, message: "Registered for event successfully" });
  }
);

// DELETE /api/events/:id/register
export const unregisterFromEvent = asyncHandler(
  async (req: Request, res: Response) => {
    const event = await Event.findById(req.params.id);
    if (!event) throw new AppError("Event not found", 404);

    const userId = (req as any).user._id.toString();
    event.registeredParticipants = event.registeredParticipants.filter(
      (p) => p.toString() !== userId
    );
    await event.save();

    res.json({ success: true, message: "Unregistered from event" });
  }
);
