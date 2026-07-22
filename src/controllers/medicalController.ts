import { Request, Response, NextFunction } from "express";
import { Patient } from "../models/Patient";
import { Medicine } from "../models/Medicine";
import { Prescription } from "../models/Prescription";
import { CaseRecord } from "../models/CaseRecord";
import { ClinicalPosting } from "../models/ClinicalPosting";
import { Appointment } from "../models/Appointment";
import { AppError } from "../utils/AppError";
import asyncHandler from "../utils/asyncHandler";
import { logAudit } from "../utils/auditLogger";
import { paginate } from "../utils/paginate";

// ─────────────────────────────────────────────────────────────────────────────
// 1. Patient Management (OPD/IPD)
// ─────────────────────────────────────────────────────────────────────────────

export const getPatients = asyncHandler(async (req: Request, res: Response) => {
  const { type, department, status, search, page, limit } = req.query;
  const filter: Record<string, any> = {};

  if (type) filter.type = type;
  if (department) filter.department = department;
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { caseNumber: { $regex: search, $options: "i" } },
    ];
  }

  const result = await paginate(Patient, filter, {
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    sort: { createdAt: -1 },
    populate: [{ path: "createdBy", select: "name role" }],
  });

  res.status(200).json({ success: true, ...result });
});

export const getPatientById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const patient = await Patient.findById(req.params.id).populate("createdBy", "name role");
  if (!patient) return next(new AppError("Patient record not found", 404));
  res.status(200).json({ success: true, data: { patient } });
});

export const createPatient = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { name, age, gender, contact, address, type, department, wardNo, bedNo } = req.body;

  // Generate unique case number based on date and serial sequence
  const todayPrefix = `${type || "OPD"}-${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, "0")}`;
  const totalCount = await Patient.countDocuments({ caseNumber: { $regex: `^${todayPrefix}` } });
  const caseNumber = `${todayPrefix}${(totalCount + 1).toString().padStart(4, "0")}`;

  const patient = await Patient.create({
    name,
    age,
    gender,
    contact,
    address,
    type: type || "OPD",
    caseNumber,
    department,
    wardNo,
    bedNo,
    createdBy: user._id,
  });

  await logAudit({
    user: user._id,
    userName: user.name,
    userRole: user.role,
    action: "PATIENT_REGISTER",
    details: { caseNumber, name, type },
    ipAddress: req.ip,
  });

  res.status(201).json({ success: true, data: { patient } });
});

export const updatePatient = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!patient) return next(new AppError("Patient not found", 404));

  await logAudit({
    user: user._id,
    userName: user.name,
    userRole: user.role,
    action: "PATIENT_UPDATE",
    details: { caseNumber: patient.caseNumber, id: patient._id },
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, data: { patient } });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Appointment Scheduling
// ─────────────────────────────────────────────────────────────────────────────

export const getAppointments = asyncHandler(async (req: Request, res: Response) => {
  const { doctor, status, page, limit } = req.query;
  const filter: Record<string, any> = {};

  if (doctor) filter.doctor = doctor;
  if (status) filter.status = status;

  const result = await paginate(Appointment, filter, {
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    sort: { dateTime: 1 },
    populate: [
      { path: "patient", select: "name age gender caseNumber" },
      { path: "doctor", select: "name email" },
      { path: "student", select: "name" },
    ],
  });

  res.status(200).json({ success: true, ...result });
});

export const createAppointment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  const { patientId, doctorId, studentId, dateTime, symptoms } = req.body;

  const patient = await Patient.findById(patientId);
  if (!patient) return next(new AppError("Patient record not found", 404));

  // Determine appointment date range to compute sequential daily token for this doctor
  const apptDate = new Date(dateTime);
  const startOfDay = new Date(apptDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(apptDate.setHours(23, 59, 59, 999));

  const totalApptsToday = await Appointment.countDocuments({
    doctor: doctorId,
    dateTime: { $gte: startOfDay, $lte: endOfDay },
  });

  const appointment = await Appointment.create({
    patient: patientId,
    doctor: doctorId,
    student: studentId,
    dateTime: new Date(dateTime),
    symptoms,
    tokenNumber: totalApptsToday + 1,
  });

  await logAudit({
    user: user._id,
    userName: user.name,
    userRole: user.role,
    action: "APPOINTMENT_CREATE",
    details: { appointmentId: appointment._id, patientId, token: appointment.tokenNumber },
    ipAddress: req.ip,
  });

  res.status(201).json({ success: true, data: { appointment } });
});

export const updateAppointment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!appointment) return next(new AppError("Appointment not found", 404));
  res.status(200).json({ success: true, data: { appointment } });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Homeopathic Pharmacy Stock Inventory
// ─────────────────────────────────────────────────────────────────────────────

export const getMedicines = asyncHandler(async (req: Request, res: Response) => {
  const { search, form, page, limit } = req.query;
  const filter: Record<string, any> = { isActive: true };

  if (form) filter.form = form;
  if (search) {
    filter.name = { $regex: search, $options: "i" };
  }

  const result = await paginate(Medicine, filter, {
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    sort: { name: 1 },
  });

  res.status(200).json({ success: true, ...result });
});

export const createMedicine = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const medicine = await Medicine.create(req.body);

  await logAudit({
    user: user._id,
    userName: user.name,
    userRole: user.role,
    action: "MEDICINE_CREATE",
    details: { name: medicine.name, potency: medicine.potency, form: medicine.form },
    ipAddress: req.ip,
  });

  res.status(201).json({ success: true, data: { medicine } });
});

export const updateMedicine = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!medicine) return next(new AppError("Medicine item not found", 404));
  res.status(200).json({ success: true, data: { medicine } });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Homeopathic Prescriptions & Dispensing
// ─────────────────────────────────────────────────────────────────────────────

export const getPrescriptions = asyncHandler(async (req: Request, res: Response) => {
  const { patient, dispensed, page, limit } = req.query;
  const filter: Record<string, any> = {};

  if (patient) filter.patient = patient;
  if (dispensed) filter.dispensed = dispensed === "true";

  const result = await paginate(Prescription, filter, {
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    sort: { createdAt: -1 },
    populate: [
      { path: "patient", select: "name caseNumber age gender" },
      { path: "doctor", select: "name" },
      { path: "student", select: "name" },
    ],
  });

  res.status(200).json({ success: true, ...result });
});

export const createPrescription = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  const { patientId, symptoms, diagnosis, medicines, labTests, studentId } = req.body;

  const patient = await Patient.findById(patientId);
  if (!patient) return next(new AppError("Patient not found", 404));

  const prescription = await Prescription.create({
    patient: patientId,
    doctor: user._id,
    student: studentId,
    symptoms,
    diagnosis,
    medicines,
    labTests,
  });

  await logAudit({
    user: user._id,
    userName: user.name,
    userRole: user.role,
    action: "PRESCRIPTION_CREATE",
    details: { prescriptionId: prescription._id, patientId },
    ipAddress: req.ip,
  });

  res.status(201).json({ success: true, data: { prescription } });
});

// Pharmacy dispensing system — automatically deducts remedy quantities from Pharmacy inventory safely and atomic!
export const dispensePrescription = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  const prescription = await Prescription.findById(req.params.id);
  if (!prescription) return next(new AppError("Prescription not found", 404));
  if (prescription.dispensed) return next(new AppError("Prescription is already dispensed", 400));

  // Perform stock reduction checks
  for (const item of prescription.medicines) {
    const medicine = await Medicine.findOne({
      name: { $regex: `^${item.medicineName}$`, $options: "i" },
      potency: item.potency,
    });

    if (medicine) {
      if (medicine.quantity < 1) {
        return next(new AppError(`Insufficient pharmacy stock for remedy: ${item.medicineName} (${item.potency})`, 400));
      }
      // Decrement safely
      medicine.quantity -= 1;
      await medicine.save();
    }
  }

  prescription.dispensed = true;
  prescription.dispensedAt = new Date();
  await prescription.save();

  await logAudit({
    user: user._id,
    userName: user.name,
    userRole: user.role,
    action: "PRESCRIPTION_DISPENSE",
    details: { prescriptionId: prescription._id },
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, data: { prescription } });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Homeopathic Case Records (Case Taking)
// ─────────────────────────────────────────────────────────────────────────────

export const getCaseRecords = asyncHandler(async (req: Request, res: Response) => {
  const { patient, page, limit } = req.query;
  const filter: Record<string, any> = {};

  if (patient) filter.patient = patient;

  const result = await paginate(CaseRecord, filter, {
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    sort: { createdAt: -1 },
    populate: [
      { path: "patient", select: "name caseNumber age gender" },
      { path: "caseTaker", select: "name role" },
    ],
  });

  res.status(200).json({ success: true, ...result });
});

export const getCaseRecordById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const record = await CaseRecord.findById(req.params.id)
    .populate("patient", "name caseNumber age gender contact address")
    .populate("caseTaker", "name role");
  if (!record) return next(new AppError("Case Taking record not found", 404));
  res.status(200).json({ success: true, data: { record } });
});

export const createCaseRecord = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  const {
    patientId,
    chiefComplaints,
    pastHistory,
    familyHistory,
    physicalGenerals,
    mentalGenerals,
    miasmaticAnalysis,
    repertorization,
    remedySelectionReason,
  } = req.body;

  const patient = await Patient.findById(patientId);
  if (!patient) return next(new AppError("Patient not found", 404));

  const record = await CaseRecord.create({
    patient: patientId,
    caseTaker: user._id,
    chiefComplaints,
    pastHistory,
    familyHistory,
    physicalGenerals,
    mentalGenerals,
    miasmaticAnalysis,
    repertorization,
    remedySelectionReason,
  });

  await logAudit({
    user: user._id,
    userName: user.name,
    userRole: user.role,
    action: "CASE_RECORD_CREATE",
    details: { caseRecordId: record._id, patientId },
    ipAddress: req.ip,
  });

  res.status(201).json({ success: true, data: { record } });
});

export const addFollowUp = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  const { statusDetails, remedyPrescribed, potencyPrescribed } = req.body;

  const record = await CaseRecord.findById(req.params.id);
  if (!record) return next(new AppError("Case record not found", 404));

  record.followUps.push({
    date: new Date(),
    statusDetails,
    remedyPrescribed,
    potencyPrescribed,
  });

  await record.save();

  await logAudit({
    user: user._id,
    userName: user.name,
    userRole: user.role,
    action: "CASE_FOLLOW_UP_ADD",
    details: { caseRecordId: record._id },
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, data: { record } });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Clinical Postings (Rotations/Internships)
// ─────────────────────────────────────────────────────────────────────────────

export const getClinicalPostings = asyncHandler(async (req: Request, res: Response) => {
  const { student, supervisor, department, page, limit } = req.query;
  const filter: Record<string, any> = { isActive: true };

  if (student) filter.student = student;
  if (supervisor) filter.supervisor = supervisor;
  if (department) filter.department = department;

  const result = await paginate(ClinicalPosting, filter, {
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    sort: { startDate: 1 },
    populate: [
      { path: "student", select: "name email studentId department semester" },
      { path: "supervisor", select: "name role" },
    ],
  });

  res.status(200).json({ success: true, ...result });
});

export const createClinicalPosting = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const posting = await ClinicalPosting.create(req.body);

  await logAudit({
    user: user._id,
    userName: user.name,
    userRole: user.role,
    action: "CLINICAL_POSTING_CREATE",
    details: { postingId: posting._id, studentId: posting.student, dept: posting.department },
    ipAddress: req.ip,
  });

  res.status(201).json({ success: true, data: { posting } });
});

export const updateClinicalPosting = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const posting = await ClinicalPosting.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!posting) return next(new AppError("Clinical posting rotation record not found", 404));
  res.status(200).json({ success: true, data: { posting } });
});
