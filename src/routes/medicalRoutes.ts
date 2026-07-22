import { Router } from "express";
import { protect, restrictTo } from "../middleware/auth";
import {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  getAppointments,
  createAppointment,
  updateAppointment,
  getMedicines,
  createMedicine,
  updateMedicine,
  getPrescriptions,
  createPrescription,
  dispensePrescription,
  getCaseRecords,
  getCaseRecordById,
  createCaseRecord,
  addFollowUp,
  getClinicalPostings,
  createClinicalPosting,
  updateClinicalPosting,
} from "../controllers/medicalController";

const router = Router();

// Protect all medical/hospital routes with JWT
router.use(protect);

// Patients
router.route("/patients")
  .get(getPatients)
  .post(createPatient);

router.route("/patients/:id")
  .get(getPatientById)
  .patch(updatePatient);

// Appointments
router.route("/appointments")
  .get(getAppointments)
  .post(createAppointment);

router.patch("/appointments/:id", updateAppointment);

// Pharmacy Remedies Stock
router.route("/medicines")
  .get(getMedicines)
  .post(restrictTo("faculty", "admin"), createMedicine);

router.patch("/medicines/:id", restrictTo("faculty", "admin"), updateMedicine);

// Prescriptions
router.route("/prescriptions")
  .get(getPrescriptions)
  .post(restrictTo("faculty", "admin"), createPrescription);

router.patch("/prescriptions/:id/dispense", restrictTo("faculty", "admin"), dispensePrescription);

// Case Taking Records
router.route("/case-records")
  .get(getCaseRecords)
  .post(createCaseRecord);

router.route("/case-records/:id")
  .get(getCaseRecordById);

router.post("/case-records/:id/follow-ups", addFollowUp);

// Student Clinical Rotations / Postings
router.route("/postings")
  .get(getClinicalPostings)
  .post(restrictTo("faculty", "admin"), createClinicalPosting);

router.patch("/postings/:id", restrictTo("faculty", "admin"), updateClinicalPosting);

export default router;
