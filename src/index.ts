import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";

import connectDB from "./config/database";
import { errorHandler, notFound } from "./middleware/errorHandler";

// Routes
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import courseRoutes from "./routes/courseRoutes";
import announcementRoutes from "./routes/announcementRoutes";
import eventRoutes from "./routes/eventRoutes";
import departmentRoutes from "./routes/departmentRoutes";
import timetableRoutes from "./routes/timetableRoutes";
import marksRoutes from "./routes/marksRoutes";
import libraryRoutes from "./routes/libraryRoutes";
import placementRoutes from "./routes/placementRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import adminRoutes from "./routes/adminRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import medicalRoutes from "./routes/medicalRoutes";
import institutionRoutes from "./routes/institutionRoutes";
import compression from "compression";
import saasRoutes from "./routes/saasRoutes";
import aiRoutes from "./routes/aiRoutes";
import workflowRoutes from "./routes/workflowRoutes";
import securityRoutes from "./routes/securityRoutes";
import { resolveTenant } from "./middleware/tenant";
import { sanitizeInputs } from "./middleware/securitySanitizer";

const app = express();
const PORT = process.env.PORT || 5000;

// ── Compression & Performance Middleware ────────────────────────────────────
app.use(compression({ level: 6, threshold: 512 }));

// ── Cache Control Header Strategy ──────────────────────────────────────────
app.use((req, res, next) => {
  if (req.method === "GET") {
    if (req.path.startsWith("/uploads") || req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$/)) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    } else {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    }
  }
  next();
});

// ── Security ────────────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        connectSrc: ["'self'", "http:", "https:", "ws:", "wss:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.CORS_ORIGIN,
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Tenant-ID"],
}));

// ── Rate Limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: "Too many requests, please try again later" },
});
app.use("/api", limiter);

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { success: false, message: "Too many auth attempts, try again in an hour" },
});
app.use("/api/auth", authLimiter);

// ── Body Parsing & Input Sanitization ──────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeInputs);

// ── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));
}

// ── Health Check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Digital Campus API is running",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Apply Tenant Resolution to all API endpoints
app.use("/api", resolveTenant);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/timetables", timetableRoutes);
app.use("/api/marks", marksRoutes);
app.use("/api/library", libraryRoutes);
app.use("/api/placement", placementRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/medical", medicalRoutes);
app.use("/api/institution", institutionRoutes);
app.use("/api/saas", saasRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/workflows", workflowRoutes);
app.use("/api/security", securityRoutes);

// ── Error Handling ───────────────────────────────────────────────────────────
if (process.env.INTEGRATED_SERVER !== "true") {
  app.use(notFound);
  app.use(errorHandler);
}

// ── Start Server ─────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    console.log(`🔗 Connecting to MongoDB: ${process.env.MONGODB_URI}`);
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Digital Campus API running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

console.log(`🔍 [backend/src/index.ts] process.env.INTEGRATED_SERVER is "${process.env.INTEGRATED_SERVER}"`);
if (process.env.INTEGRATED_SERVER !== "true") {
  startServer();
}

export default app;
