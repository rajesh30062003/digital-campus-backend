import { Request, Response } from "express";
import { Company, Job, Application } from "../models/Placement";
import asyncHandler from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { paginate } from "../utils/paginate";

// ── Companies ─────────────────────────────────────────────────────────────────

export const getAllCompanies = asyncHandler(async (_req: Request, res: Response) => {
  const companies = await Company.find({ isActive: true }).sort({ name: 1 });
  res.json({ success: true, data: { companies } });
});

export const createCompany = asyncHandler(async (req: Request, res: Response) => {
  const company = await Company.create(req.body);
  res.status(201).json({ success: true, data: { company } });
});

export const updateCompany = asyncHandler(async (req: Request, res: Response) => {
  const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!company) throw new AppError("Company not found", 404);
  res.json({ success: true, data: { company } });
});

// ── Jobs ──────────────────────────────────────────────────────────────────────

export const getAllJobs = asyncHandler(async (req: Request, res: Response) => {
  const { status, jobType, page, limit } = req.query;
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (jobType) filter.jobType = jobType;

  const result = await paginate(Job, filter, {
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    sort: { createdAt: -1 },
    populate: [{ path: "company", select: "name logo industry location" }],
  });

  res.json({ success: true, ...result });
});

export const getJobById = asyncHandler(async (req: Request, res: Response) => {
  const job = await Job.findById(req.params.id).populate("company");
  if (!job) throw new AppError("Job not found", 404);

  const applicationCount = await Application.countDocuments({ job: req.params.id });
  res.json({ success: true, data: { job, applicationCount } });
});

export const createJob = asyncHandler(async (req: Request, res: Response) => {
  const job = await Job.create({ ...req.body, postedBy: (req as any).user._id });
  res.status(201).json({ success: true, data: { job } });
});

export const updateJob = asyncHandler(async (req: Request, res: Response) => {
  const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!job) throw new AppError("Job not found", 404);
  res.json({ success: true, data: { job } });
});

// ── Applications ──────────────────────────────────────────────────────────────

export const applyForJob = asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const studentId = (req as any).user._id;

  const job = await Job.findById(jobId);
  if (!job) throw new AppError("Job not found", 404);
  if (job.status !== "open") throw new AppError("This job is no longer accepting applications", 400);
  if (new Date() > job.lastDateToApply) throw new AppError("Application deadline has passed", 400);

  const existing = await Application.findOne({ job: jobId, student: studentId });
  if (existing) throw new AppError("You have already applied for this job", 409);

  const application = await Application.create({
    job: jobId,
    student: studentId,
    resumeUrl: req.body.resumeUrl,
    coverLetter: req.body.coverLetter,
  });

  res.status(201).json({ success: true, data: { application } });
});

export const getMyApplications = asyncHandler(async (req: Request, res: Response) => {
  const applications = await Application.find({ student: (req as any).user._id })
    .populate({ path: "job", populate: { path: "company", select: "name logo" } })
    .sort({ createdAt: -1 });
  res.json({ success: true, data: { applications } });
});

export const getJobApplications = asyncHandler(async (req: Request, res: Response) => {
  const applications = await Application.find({ job: req.params.jobId })
    .populate("student", "name email studentId department avatar")
    .sort({ appliedAt: -1 });
  res.json({ success: true, data: { applications } });
});

export const updateApplicationStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, feedback, interviewDate } = req.body;
  const application = await Application.findByIdAndUpdate(
    req.params.id,
    { status, feedback, interviewDate },
    { new: true }
  ).populate("student", "name email");
  if (!application) throw new AppError("Application not found", 404);
  res.json({ success: true, data: { application } });
});

export const getPlacementStats = asyncHandler(async (_req: Request, res: Response) => {
  const [totalCompanies, openJobs, totalApplications, placed] = await Promise.all([
    Company.countDocuments({ isActive: true }),
    Job.countDocuments({ status: "open" }),
    Application.countDocuments(),
    Application.countDocuments({ status: "selected" }),
  ]);

  const jobsByType = await Job.aggregate([
    { $group: { _id: "$jobType", count: { $sum: 1 } } },
  ]);

  res.json({
    success: true,
    data: { totalCompanies, openJobs, totalApplications, placed, jobsByType },
  });
});
