import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.routes";
import attendanceRoutes from "./routes/attendance.routes";
import usersRoutes from "./routes/users.routes";
import reportsRoutes from "./routes/reports.routes";
import { errorHandler } from "./middleware/error.middleware";

const app = express();
const PORT = process.env.PORT ?? 4000;

// Security
app.use(helmet());
app.use(
  cors({
    origin:
      process.env.CORS_ORIGIN?.split(",") ?? [
        "http://localhost:5173",
        "http://localhost:8080",
      ],
    credentials: true,
  }),
);

// Rate limiting on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests, please try again later.",
    code: 429,
  },
});

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files (uploads) — allow cross-origin for image display in browser
app.use(
  "/uploads",
  (_req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.resolve(process.env.UPLOAD_DIR ?? "./uploads")),
);

// Health check
app.get("/health", (_req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() }),
);

// Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/reports", reportsRoutes);

// 404
app.use((_req, res) =>
  res.status(404).json({ success: false, error: "Route not found", code: 404 }),
);

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 WFH Backend running at http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;
