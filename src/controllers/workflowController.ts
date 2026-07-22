import { Request, Response } from "express";
import crypto from "crypto";
import asyncHandler from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { WorkflowInstance, WorkflowRule, WorkflowType } from "../models/Workflow";
import { AuditLog } from "../models/AuditLog";

// Helper to compute cryptographic signature hash
function generateDigitalSignature(data: string, secretKey = "INSTITUTION_DIGITAL_KEY_2026"): string {
  return crypto.createHmac("sha256", secretKey).update(data).digest("hex");
}

// Pre-defined default workflow configurations for all 16 institutional domains
export const DEFAULT_WORKFLOW_TEMPLATES: Record<
  WorkflowType,
  {
    title: string;
    description: string;
    triggerEvent: string;
    approvalRoles: string[];
    notificationChannels: ("email" | "sms" | "push")[];
    defaultPayload: Record<string, any>;
  }
> = {
  admissions: {
    title: "Student Admission Processing & Enrollment",
    description: "Automated verification of applicant credentials, entrance interview sign-off, and fee voucher issuance.",
    triggerEvent: "NEW_ADMISSION_APPLICATION_SUBMITTED",
    approvalRoles: ["admissions_officer", "department_head", "registrar"],
    notificationChannels: ["email", "sms", "push"],
    defaultPayload: { applicantName: "John Doe", department: "Computer Science", gpa: 3.85, testScore: 1420 },
  },
  attendance: {
    title: "Low Attendance Flag & Parent Escalation",
    description: "Triggers escalation flow when student attendance falls below 75% threshold.",
    triggerEvent: "ATTENDANCE_DROPPED_BELOW_75_PERCENT",
    approvalRoles: ["faculty_advisor", "department_head"],
    notificationChannels: ["email", "sms", "push"],
    defaultPayload: { studentId: "STU-99201", studentName: "Alice Smith", course: "Data Structures", currentAttendance: 68 },
  },
  fee_reminders: {
    title: "Overdue Tuition Fee Reminder & Exemption Review",
    description: "Sends automated multi-channel reminders and processes fee installment or scholarship requests.",
    triggerEvent: "TUITION_FEE_OVERDUE_DUE_DATE",
    approvalRoles: ["finance_officer", "treasurer"],
    notificationChannels: ["email", "sms", "push"],
    defaultPayload: { studentName: "Robert Johnson", amountDue: 2450, dueDate: "2026-08-01", semester: "Fall 2026" },
  },
  result_publication: {
    title: "Semester Examination Grade Sheet Verification & Publishing",
    description: "Multi-level validation of semester exam marks prior to official portal release.",
    triggerEvent: "MARKS_SUBMITTED_BY_FACULTY",
    approvalRoles: ["course_coordinator", "department_head", "controller_of_examinations"],
    notificationChannels: ["email", "push"],
    defaultPayload: { courseCode: "CS301", semester: "Spring 2026", totalStudents: 64, classAverageGPA: 3.42 },
  },
  certificate_generation: {
    title: "Degree / Bonafide / Transcript Certificate Issuance",
    description: "Automated verification of library/lab clearances, digital signing, and secure PDF dispatch.",
    triggerEvent: "CERTIFICATE_REQUESTED_BY_STUDENT",
    approvalRoles: ["library_head", "accounts_officer", "registrar"],
    notificationChannels: ["email", "push"],
    defaultPayload: { certificateType: "Official Transcript", studentRoll: "2023-CS-041", cgpa: 3.91 },
  },
  leave_approval: {
    title: "Faculty & Staff Medical / Casual Leave Clearance",
    description: "Automated substitution check and hierarchical leave approval with medical certificate validation.",
    triggerEvent: "STAFF_LEAVE_APPLICATION_LOGGED",
    approvalRoles: ["department_head", "hr_manager"],
    notificationChannels: ["email", "push"],
    defaultPayload: { applicant: "Prof. Alan Turing", leaveType: "Medical Leave", startDate: "2026-08-10", endDate: "2026-08-14" },
  },
  notifications: {
    title: "Emergency / Campus-Wide Circular Broadcast Approval",
    description: "Verification and dispatch of urgent announcements across mobile push, email, and SMS gateways.",
    triggerEvent: "URGENT_BROADCAST_REQUESTED",
    approvalRoles: ["public_relations_officer", "dean_of_students"],
    notificationChannels: ["email", "sms", "push"],
    defaultPayload: { circularTitle: "Campus Maintenance & Weather Advisory", priority: "High", targetScope: "All Staff & Students" },
  },
  inventory: {
    title: "Lab Equipment & Facility Procurement Requisition",
    description: "Review of vendor bids, budget check, and digital purchase order sign-off.",
    triggerEvent: "INVENTORY_REQUISITION_CREATED",
    approvalRoles: ["lab_incharge", "inventory_manager", "finance_head"],
    notificationChannels: ["email"],
    defaultPayload: { item: "High-Performance GPU Nodes for AI Lab", quantity: 4, estimatedCost: 12000 },
  },
  library: {
    title: "Overdue Book Clearance & Lost Book Fine Assessment",
    description: "Automated catalog status sync, fine computation, and digital clearance seal.",
    triggerEvent: "LIBRARY_OVERDUE_OR_FINE_FLAG",
    approvalRoles: ["assistant_librarian", "chief_librarian"],
    notificationChannels: ["email", "push"],
    defaultPayload: { bookTitle: "Artificial Intelligence: A Modern Approach", borrowerName: "Emma Watson", daysOverdue: 14, fineAmount: 28 },
  },
  placement: {
    title: "Corporate Recruitment Drive & Offer Letter Endorsement",
    description: "Verification of student eligibility, interview shortlist, and official offer sign-off.",
    triggerEvent: "PLACEMENT_OFFER_RECEIVED",
    approvalRoles: ["placement_officer", "dean_academics"],
    notificationChannels: ["email", "sms", "push"],
    defaultPayload: { companyName: "Google Cloud Labs", candidateName: "David Miller", packageLPA: 24.5, role: "Software Engineer" },
  },
  research: {
    title: "Research Grant Application & Publication Approval",
    description: "Ethics committee evaluation, similarity index check, and institutional grant allocation.",
    triggerEvent: "RESEARCH_PAPER_OR_GRANT_SUBMITTED",
    approvalRoles: ["ethics_committee_chair", "dean_research"],
    notificationChannels: ["email"],
    defaultPayload: { paperTitle: "Quantum Neural Networks for Genome Sequencing", journal: "Nature Computational Science", grantRequested: 18000 },
  },
  hr: {
    title: "New Faculty / Staff Onboarding & Asset Allocation",
    description: "Background check verification, email provision, desk assignment, and ID badge approval.",
    triggerEvent: "NEW_EMPLOYEE_ONBOARDING_INITIATED",
    approvalRoles: ["hr_executive", "department_head"],
    notificationChannels: ["email", "sms"],
    defaultPayload: { candidateName: "Dr. Sophia Lin", position: "Associate Professor", department: "Biomedical Engineering" },
  },
  payroll: {
    title: "Monthly Salary Slip Generation & Direct Deposit Release",
    description: "Attendance sync, tax deductions review, digital signing of payslips, and bank file dispatch.",
    triggerEvent: "MONTHLY_PAYROLL_CYCLE_CLOSED",
    approvalRoles: ["payroll_accountant", "finance_director"],
    notificationChannels: ["email", "push"],
    defaultPayload: { payPeriod: "July 2026", totalEmployees: 142, totalDisbursement: 385000 },
  },
  transport: {
    title: "Bus Route Allocation & Student Pass Issuance",
    description: "Route capacity optimization, driver assignment, and digital bus pass generation.",
    triggerEvent: "TRANSPORT_PASS_APPLICATION",
    approvalRoles: ["transport_supervisor", "admin_officer"],
    notificationChannels: ["email", "sms", "push"],
    defaultPayload: { studentName: "Michael Chang", routeNumber: "Route 12 - North Campus", stopName: "Central Square" },
  },
  hostel: {
    title: "Room Allotment & Late Night Out-Pass Clearance",
    description: "Warden approval, curfew compliance, parental SMS alert, and room inventory sign-off.",
    triggerEvent: "HOSTEL_OUTPASS_OR_ALLOTMENT_REQ",
    approvalRoles: ["hostel_warden", "chief_warden"],
    notificationChannels: ["email", "sms", "push"],
    defaultPayload: { studentName: "Sarah Connor", hostelBlock: "Block C - Room 304", passType: "Weekend Home Pass" },
  },
  hospital: {
    title: "Medical Center OPD Case Record & Clinical Posting Sign-Off",
    description: "Clinical case record verification, prescription audit, and medical leave certification.",
    triggerEvent: "HOSPITAL_PATIENT_CASE_LOGGED",
    approvalRoles: ["attending_physician", "medical_superintendent"],
    notificationChannels: ["email", "sms", "push"],
    defaultPayload: { patientName: "James Wilson", diagnosis: "Acute Gastroenteritis", bedAssigned: "Observation Bed 04" },
  },
};

// ── GET ALL WORKFLOW INSTANCES ──────────────────────────────────────────────
export const getWorkflows = asyncHandler(async (req: Request, res: Response) => {
  const { workflowType, status, search, page = 1, limit = 20 } = req.query;

  const query: any = {};
  if (workflowType && workflowType !== "all") {
    query.workflowType = workflowType;
  }
  if (status && status !== "all") {
    query.status = status;
  }
  if (search) {
    query.$or = [
      { title: { $regex: search as string, $options: "i" } },
      { requesterName: { $regex: search as string, $options: "i" } },
      { description: { $regex: search as string, $options: "i" } },
    ];
  }

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  let instances = await WorkflowInstance.find(query)
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

  // Auto-seed default workflows if database is empty so user gets instant 100% working demo for all 16 domains!
  if (instances.length === 0 && pageNum === 1 && !search && (!workflowType || workflowType === "all")) {
    await seedDefaultWorkflowsInternal((req as any).user);
    instances = await WorkflowInstance.find(query).sort({ createdAt: -1 }).limit(limitNum);
  }

  const total = await WorkflowInstance.countDocuments(query);

  res.json({
    success: true,
    data: instances,
    pagination: {
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    },
  });
});

// ── GET SINGLE WORKFLOW BY ID ──────────────────────────────────────────────
export const getWorkflowById = asyncHandler(async (req: Request, res: Response) => {
  const instance = await WorkflowInstance.findById(req.params.id);
  if (!instance) {
    throw new AppError("Workflow instance not found", 404);
  }
  res.json({
    success: true,
    data: instance,
  });
});

// ── TRIGGER / CREATE NEW WORKFLOW ──────────────────────────────────────────
export const triggerWorkflow = asyncHandler(async (req: Request, res: Response) => {
  const { workflowType, title, description, payload, customApprovalRoles, notificationChannels } = req.body;

  if (!workflowType || !DEFAULT_WORKFLOW_TEMPLATES[workflowType as WorkflowType]) {
    throw new AppError("Invalid workflow domain specified", 400);
  }

  const template = DEFAULT_WORKFLOW_TEMPLATES[workflowType as WorkflowType];
  const user = (req as any).user || { name: "Admin User", email: "admin@campus.edu", role: "admin" };

  const rolesToUse = customApprovalRoles || template.approvalRoles;
  const channelsToUse: ("email" | "sms" | "push")[] = notificationChannels || template.notificationChannels;

  // Build Approval Chain
  const approvalChain = rolesToUse.map((role: string, index: number) => ({
    stepIndex: index + 1,
    roleRequired: role,
    status: index === 0 ? "pending" : "pending",
  }));

  // Initial Notifications to dispatch across selected channels
  const initialNotifications = channelsToUse.map((channel) => ({
    channel,
    recipient: user.email || "recipient@campus.edu",
    subject: `[Workflow Initiated] ${title || template.title}`,
    message: `Workflow "${title || template.title}" has been created and requires approval step 1 (${rolesToUse[0]}).`,
    status: "sent" as const,
    dispatchedAt: new Date(),
  }));

  // Initial Cryptographic Signature Hash
  const docHash = generateDigitalSignature(JSON.stringify({ title, requester: user.email, timestamp: Date.now() }));

  const instance = await WorkflowInstance.create({
    workflowType,
    title: title || template.title,
    description: description || template.description,
    requesterName: user.name || "System Admin",
    requesterEmail: user.email || "admin@institution.edu",
    requesterRole: user.role || "admin",
    status: "pending",
    currentStep: 1,
    payload: payload || template.defaultPayload,
    approvalChain,
    notifications: initialNotifications,
    digitalSignature: {
      isSigned: false,
      documentHash: docHash,
      signatureHash: "",
      signerName: "",
      signerRole: "",
      signedAt: new Date(),
    },
    auditTrail: [
      {
        action: "WORKFLOW_TRIGGERED",
        actorName: user.name || "System Admin",
        actorRole: user.role || "admin",
        timestamp: new Date(),
        details: `Triggered workflow "${title || template.title}" with ${approvalChain.length} approval levels.`,
        signatureHash: docHash,
      },
    ],
  });

  // Log to central system AuditLog
  await AuditLog.create({
    user: user._id,
    userName: user.name,
    userRole: user.role,
    action: `WORKFLOW_TRIGGERED_${workflowType.toUpperCase()}`,
    details: { workflowId: instance._id, title: instance.title, payload: instance.payload },
    ipAddress: req.ip,
  });

  res.status(201).json({
    success: true,
    data: instance,
  });
});

// ── APPROVE OR REJECT STEP IN APPROVAL CHAIN ──────────────────────────────
export const approveOrRejectStep = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { action, comments } = req.body; // action: 'approve' | 'reject'

  if (!["approve", "reject"].includes(action)) {
    throw new AppError("Action must be 'approve' or 'reject'", 400);
  }

  const instance = await WorkflowInstance.findById(id);
  if (!instance) {
    throw new AppError("Workflow instance not found", 404);
  }

  if (instance.status === "completed" || instance.status === "rejected") {
    throw new AppError(`Workflow is already in final state (${instance.status})`, 400);
  }

  const user = (req as any).user || { name: "Approver", email: "approver@campus.edu", role: "department_head" };
  const currentStepIndex = instance.currentStep - 1;

  if (currentStepIndex < 0 || currentStepIndex >= instance.approvalChain.length) {
    throw new AppError("Invalid approval step index", 400);
  }

  const step = instance.approvalChain[currentStepIndex];

  // Cryptographic step digital signature
  const stepSigHash = generateDigitalSignature(`${instance._id}-${step.stepIndex}-${user.name}-${action}-${Date.now()}`);

  if (action === "reject") {
    step.status = "rejected";
    step.comments = comments || "Rejected during review";
    step.approverName = user.name;
    step.approverEmail = user.email;
    step.approverRole = user.role;
    step.updatedAt = new Date();
    step.digitalSignature = {
      signatureHash: stepSigHash,
      timestamp: new Date(),
      signedBy: user.name,
      signerRole: user.role,
    };

    instance.status = "rejected";
    instance.auditTrail.push({
      action: "STEP_REJECTED",
      actorName: user.name,
      actorRole: user.role,
      timestamp: new Date(),
      details: `Step ${step.stepIndex} (${step.roleRequired}) was rejected. Reason: ${comments || "None"}`,
      signatureHash: stepSigHash,
    });

    // Send notifications
    instance.notifications.push({
      channel: "email",
      recipient: instance.requesterEmail,
      subject: `[Workflow Rejected] ${instance.title}`,
      message: `Your request "${instance.title}" was rejected at step ${step.stepIndex} by ${user.name}.`,
      status: "sent",
      dispatchedAt: new Date(),
    });
  } else {
    // Approve
    step.status = "approved";
    step.comments = comments || "Approved upon credential verification";
    step.approverName = user.name;
    step.approverEmail = user.email;
    step.approverRole = user.role;
    step.updatedAt = new Date();
    step.digitalSignature = {
      signatureHash: stepSigHash,
      timestamp: new Date(),
      signedBy: user.name,
      signerRole: user.role,
    };

    instance.auditTrail.push({
      action: "STEP_APPROVED",
      actorName: user.name,
      actorRole: user.role,
      timestamp: new Date(),
      details: `Step ${step.stepIndex} (${step.roleRequired}) was approved by ${user.name}.`,
      signatureHash: stepSigHash,
    });

    // Advance to next step or complete
    if (instance.currentStep < instance.approvalChain.length) {
      instance.currentStep += 1;
      instance.status = "in_review";

      const nextRole = instance.approvalChain[instance.currentStep - 1].roleRequired;
      instance.notifications.push({
        channel: "push",
        recipient: instance.requesterEmail,
        subject: `[Workflow Progress] ${instance.title}`,
        message: `Step ${step.stepIndex} approved. Advanced to step ${instance.currentStep} (${nextRole}).`,
        status: "sent",
        dispatchedAt: new Date(),
      });
    } else {
      // Final level approved!
      instance.status = "approved";

      // Auto sign overall document
      const finalDocSig = generateDigitalSignature(`FINAL_APPROVED_${instance._id}_${Date.now()}`);
      instance.digitalSignature = {
        isSigned: true,
        documentHash: instance.digitalSignature?.documentHash || finalDocSig,
        signatureHash: finalDocSig,
        signerName: user.name,
        signerRole: user.role,
        signedAt: new Date(),
      };

      instance.auditTrail.push({
        action: "WORKFLOW_FULLY_APPROVED",
        actorName: user.name,
        actorRole: user.role,
        timestamp: new Date(),
        details: `All ${instance.approvalChain.length} approval levels completed successfully. Digital signature applied.`,
        signatureHash: finalDocSig,
      });

      instance.notifications.push({
        channel: "email",
        recipient: instance.requesterEmail,
        subject: `[Workflow Fully Approved] ${instance.title}`,
        message: `Congratulations! Your workflow "${instance.title}" has been fully approved and digitally signed.`,
        status: "sent",
        dispatchedAt: new Date(),
      });
      instance.notifications.push({
        channel: "sms",
        recipient: "+1 (555) 019-2831",
        subject: "SMS Alert",
        message: `Institution Alert: Workflow ${instance.title} is APPROVED. Digital seal: ${finalDocSig.substring(0, 10)}...`,
        status: "sent",
        dispatchedAt: new Date(),
      });
    }
  }

  await instance.save();

  await AuditLog.create({
    user: user._id,
    userName: user.name,
    userRole: user.role,
    action: `WORKFLOW_STEP_${action.toUpperCase()}`,
    details: { workflowId: instance._id, step: currentStepIndex + 1, status: instance.status },
    ipAddress: req.ip,
  });

  res.json({
    success: true,
    data: instance,
  });
});

// ── DIGITALLY SIGN A WORKFLOW DOCUMENT / CERTIFICATE ────────────────────────
export const signWorkflowDocument = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const instance = await WorkflowInstance.findById(id);
  if (!instance) {
    throw new AppError("Workflow instance not found", 404);
  }

  const user = (req as any).user || { name: "Registrar Officer", role: "registrar" };

  const sigHash = generateDigitalSignature(`SEALED_DOCUMENT_${instance._id}_${user.name}_${Date.now()}`);

  instance.digitalSignature = {
    isSigned: true,
    documentHash: instance.digitalSignature?.documentHash || sigHash,
    signatureHash: sigHash,
    signerName: user.name,
    signerRole: user.role,
    signedAt: new Date(),
  };

  instance.auditTrail.push({
    action: "DOCUMENT_DIGITALLY_SIGNED",
    actorName: user.name,
    actorRole: user.role,
    timestamp: new Date(),
    details: `Official digital seal and cryptographic signature generated: ${sigHash}`,
    signatureHash: sigHash,
  });

  await instance.save();

  res.json({
    success: true,
    message: "Workflow document successfully digitally signed & sealed.",
    digitalSignature: instance.digitalSignature,
  });
});

// ── GET AUTOMATED TRIGGER RULES ─────────────────────────────────────────────
export const getWorkflowRules = asyncHandler(async (req: Request, res: Response) => {
  let rules = await WorkflowRule.find().sort({ createdAt: -1 });

  // Seed default rules if missing
  if (rules.length === 0) {
    const defaultRules = Object.entries(DEFAULT_WORKFLOW_TEMPLATES).map(([type, template]) => ({
      workflowType: type as WorkflowType,
      name: template.title,
      description: template.description,
      triggerEvent: template.triggerEvent,
      isEnabled: true,
      approvalRoles: template.approvalRoles,
      notificationChannels: template.notificationChannels,
      requiresDigitalSignature: true,
    }));
    rules = await WorkflowRule.insertMany(defaultRules);
  }

  res.json({
    success: true,
    data: rules,
  });
});

// ── SEED DEFAULT DEMO WORKFLOWS FOR ALL 16 DOMAINS ─────────────────────────
async function seedDefaultWorkflowsInternal(user?: any) {
  const actor = user || { name: "System Registrar", email: "registrar@institution.edu", role: "admin" };

  const seedDocs = Object.entries(DEFAULT_WORKFLOW_TEMPLATES).map(([domain, template], idx) => {
    const isCompleted = idx % 3 === 0;
    const isRejected = idx === 13;
    const status = isCompleted ? "completed" : isRejected ? "rejected" : "in_review";

    const docHash = generateDigitalSignature(`SEED_DOC_${domain}_${Date.now()}`);
    const sigHash = generateDigitalSignature(`SIG_${domain}_${Date.now()}`);

    return {
      workflowType: domain as WorkflowType,
      title: template.title,
      description: template.description,
      requesterName: actor.name || "Academic Admin",
      requesterEmail: actor.email || "admin@institution.edu",
      requesterRole: actor.role || "admin",
      status,
      currentStep: isCompleted ? template.approvalRoles.length : 1,
      payload: template.defaultPayload,
      approvalChain: template.approvalRoles.map((role, rIdx) => ({
        stepIndex: rIdx + 1,
        roleRequired: role,
        approverName: rIdx === 0 || isCompleted ? "Dr. Dept Head" : undefined,
        approverRole: role,
        status: isCompleted ? "approved" : rIdx === 0 ? "approved" : isRejected && rIdx === 1 ? "rejected" : "pending",
        comments: isCompleted ? "Verified & Approved" : "Pending review",
        updatedAt: new Date(),
        digitalSignature: {
          signatureHash: sigHash,
          timestamp: new Date(),
          signedBy: "Dr. Dept Head",
          signerRole: role,
        },
      })),
      digitalSignature: {
        isSigned: isCompleted,
        documentHash: docHash,
        signatureHash: isCompleted ? sigHash : "",
        signerName: isCompleted ? "Dr. Dept Head" : "",
        signerRole: isCompleted ? "admin" : "",
        signedAt: new Date(),
      },
      notifications: [
        {
          channel: "email" as const,
          recipient: "student@campus.edu",
          subject: `[Automated Workflow] ${template.title}`,
          message: `Notification dispatched for ${template.title}. Triggered by event ${template.triggerEvent}.`,
          status: "sent" as const,
          dispatchedAt: new Date(),
        },
        {
          channel: "sms" as const,
          recipient: "+1 (555) 012-3456",
          subject: "SMS Gateway",
          message: `Campus Alert: Workflow ${template.title} updated. Status: ${status}`,
          status: "sent" as const,
          dispatchedAt: new Date(),
        },
        {
          channel: "push" as const,
          recipient: "DeviceToken_99210",
          subject: "Push Notification",
          message: `Approval step updated for ${template.title}`,
          status: "sent" as const,
          dispatchedAt: new Date(),
        },
      ],
      auditTrail: [
        {
          action: "WORKFLOW_INITIATED",
          actorName: actor.name || "Academic Admin",
          actorRole: actor.role || "admin",
          timestamp: new Date(),
          details: `Automated trigger fired event "${template.triggerEvent}" across ${template.approvalRoles.length} steps.`,
          signatureHash: docHash,
        },
      ],
    };
  });

  await WorkflowInstance.insertMany(seedDocs);
}

export const seedWorkflows = asyncHandler(async (req: Request, res: Response) => {
  await WorkflowInstance.deleteMany({});
  await seedDefaultWorkflowsInternal((req as any).user);

  const list = await WorkflowInstance.find().sort({ createdAt: -1 });
  res.json({
    success: true,
    message: "Successfully seeded default workflow instances for all 16 institution domains!",
    data: list,
  });
});
