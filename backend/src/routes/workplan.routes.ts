import { Router } from "express";
import {
  getWeekPlan,
  upsertPlan,
  deletePlan,
  logActual,
  getLeaveSummary,
  getTomorrowSummary,
  getAdminMonthPlans,
  getAdminMonthResults,
} from "../controllers/workplan.controller";
import { authenticate, requireAdmin } from "../middleware/auth.middleware";
import { uploadWorkPlanFiles } from "../middleware/upload.middleware";

const router = Router();

router.use(authenticate);

router.get("/week", getWeekPlan);
router.get("/leave-summary", getLeaveSummary);
router.get("/tomorrow-summary", requireAdmin, getTomorrowSummary);
router.get("/admin/month-plans", requireAdmin, getAdminMonthPlans);
router.get("/admin/month-results", requireAdmin, getAdminMonthResults);
router.post("/upsert", upsertPlan);
router.put("/:date/actual", uploadWorkPlanFiles.array("files", 5), logActual);
router.delete("/:date", deletePlan);

export default router;
