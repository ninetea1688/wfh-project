import { Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ok, fail } from "../utils/response";
import { AuthRequest } from "../middleware/auth.middleware";
import { startOfWeek, endOfWeek, addDays, format, parseISO } from "date-fns";

type PlanType = "WFH" | "OFFICE" | "FIELD" | "LEAVE";

function localDateUTC(d: Date = new Date()): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

const upsertSchema = z.object({
  planDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "planDate must be YYYY-MM-DD"),
  planType: z.enum(["WFH", "OFFICE", "FIELD", "LEAVE"]),
  note: z.string().max(500).optional().nullable(),
});

const actualNoteSchema = z.object({
  actualNote: z.string().max(2000).optional().nullable(),
});

/** GET /api/work-plans/week?date=YYYY-MM-DD
 *  Returns Mon–Sun plans for the week containing `date` (default=today).
 *  Also returns actual attendance records for the same week if already passed.
 */
export const getWeekPlan = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    // Determine the Monday of the requested week
    const refDate = req.query.date
      ? parseISO(req.query.date as string)
      : new Date();

    const monday = startOfWeek(refDate, { weekStartsOn: 1 });
    const sunday = endOfWeek(refDate, { weekStartsOn: 1 });
    const mondayUTC = localDateUTC(monday);
    const sundayUTC = localDateUTC(sunday);

    const [plans, attendances] = await Promise.all([
      prisma.workPlan.findMany({
        where: { userId, planDate: { gte: mondayUTC, lte: sundayUTC } },
        include: { attachments: true },
        orderBy: { planDate: "asc" },
      }),
      prisma.attendance.findMany({
        where: { userId, workDate: { gte: mondayUTC, lte: sundayUTC } },
        select: {
          workDate: true,
          workType: true,
          checkInTime: true,
          checkOutTime: true,
          status: true,
          taskDescription: true,
        },
        orderBy: { workDate: "asc" },
      }),
    ]);

    // Build a day-by-day summary Mon–Sun
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(monday, i);
      const dateStr = format(date, "yyyy-MM-dd");
      const plan = plans.find(
        (p) => format(p.planDate, "yyyy-MM-dd") === dateStr,
      );
      const actual = attendances.find(
        (a) => format(a.workDate, "yyyy-MM-dd") === dateStr,
      );
      return { date: dateStr, plan: plan ?? null, actual: actual ?? null };
    });

    ok(res, {
      weekStart: format(monday, "yyyy-MM-dd"),
      weekEnd: format(sunday, "yyyy-MM-dd"),
      days,
    });
  } catch (err) {
    next(err);
  }
};

/** POST /api/work-plans/upsert
 *  Create or update a plan for one date. Deletes the record if planType is null.
 */
export const upsertPlan = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const body = upsertSchema.parse(req.body);

    const planDateObj = parseISO(body.planDate);
    const planDate = localDateUTC(planDateObj);

    const plan = await prisma.workPlan.upsert({
      where: { userId_planDate: { userId, planDate } },
      create: {
        userId,
        planDate,
        planType: body.planType as PlanType,
        note: body.note ?? null,
      },
      update: {
        planType: body.planType as PlanType,
        note: body.note ?? null,
      },
    });

    ok(res, plan, "บันทึกแผนปฏิบัติงานสำเร็จ");
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/work-plans/:date  (date = YYYY-MM-DD)
 *  Remove a plan for the given date.
 */
export const deletePlan = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const dateParam = req.params.date;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      fail(res, 400, "date must be YYYY-MM-DD");
      return;
    }

    const planDate = localDateUTC(parseISO(dateParam));

    const existing = await prisma.workPlan.findFirst({
      where: { userId, planDate },
    });
    if (!existing) {
      fail(res, 404, "ไม่พบแผนในวันที่ระบุ");
      return;
    }

    await prisma.workPlan.delete({ where: { id: existing.id } });
    ok(res, null, "ลบแผนสำเร็จ");
  } catch (err) {
    next(err);
  }
};

/** PUT /api/work-plans/:date/actual
 *  Log the actual result note for a past plan date.
 */
export const logActual = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const dateParam = req.params.date;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      fail(res, 400, "date must be YYYY-MM-DD");
      return;
    }

    const body = actualNoteSchema.parse(req.body);
    const planDate = localDateUTC(parseISO(dateParam));

    // Verify the date is in the past (the week has passed)
    const today = localDateUTC();
    if (planDate >= today) {
      fail(res, 400, "สามารถบันทึกผลได้เฉพาะวันที่ผ่านมาแล้ว");
      return;
    }

    const existing = await prisma.workPlan.findFirst({
      where: { userId, planDate },
    });
    if (!existing) {
      fail(res, 404, "ไม่พบแผนในวันที่ระบุ");
      return;
    }

    // Collect uploaded files (from multer)
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];

    const [updated] = await prisma.$transaction([
      prisma.workPlan.update({
        where: { id: existing.id },
        data: { actualNote: body.actualNote ?? null },
        include: { attachments: true },
      }),
      ...files.map((file) =>
        prisma.workPlanAttachment.create({
          data: {
            workPlanId: existing.id,
            filePath: `uploads/${file.filename}`,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
          },
        }),
      ),
    ]);

    ok(res, updated, "บันทึกผลปฏิบัติงานสำเร็จ");
  } catch (err) {
    next(err);
  }
};

/** GET /api/work-plans/leave-summary?year=YYYY&month=MM
 *  Returns leave days count for current user (or all staff if admin).
 */
export const getLeaveSummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const now = new Date();
    const year = parseInt((req.query.year as string) ?? now.getFullYear(), 10);
    const month = parseInt(
      (req.query.month as string) ?? now.getMonth() + 1,
      10,
    );

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      fail(res, 400, "year และ month ไม่ถูกต้อง");
      return;
    }

    const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
    const endOfMonth = new Date(Date.UTC(year, month, 0)); // last day of month

    const [leaveDays, wfhDays, officeDays, fieldDays, totalPlanned] =
      await Promise.all([
        prisma.workPlan.count({
          where: {
            userId,
            planType: "LEAVE",
            planDate: { gte: startOfMonth, lte: endOfMonth },
          },
        }),
        prisma.workPlan.count({
          where: {
            userId,
            planType: "WFH",
            planDate: { gte: startOfMonth, lte: endOfMonth },
          },
        }),
        prisma.workPlan.count({
          where: {
            userId,
            planType: "OFFICE",
            planDate: { gte: startOfMonth, lte: endOfMonth },
          },
        }),
        prisma.workPlan.count({
          where: {
            userId,
            planType: "FIELD",
            planDate: { gte: startOfMonth, lte: endOfMonth },
          },
        }),
        prisma.workPlan.count({
          where: { userId, planDate: { gte: startOfMonth, lte: endOfMonth } },
        }),
      ]);

    ok(res, {
      year,
      month,
      leaveDays,
      wfhDays,
      officeDays,
      fieldDays,
      totalPlanned,
    });
  } catch (err) {
    next(err);
  }
};

/** GET /api/work-plans/tomorrow-summary   (Admin only)
 *  Returns tomorrow's planned WFH, OFFICE, FIELD, LEAVE, and unknown counts.
 */
export const getTomorrowSummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const today = localDateUTC();
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const [plans, totalStaff] = await Promise.all([
      prisma.workPlan.findMany({
        where: { planDate: tomorrow },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              position: true,
              department: { select: { name: true } },
            },
          },
        },
      }),
      prisma.user.count({ where: { isActive: true, role: "STAFF" } }),
    ]);

    const wfh = plans.filter((p) => p.planType === "WFH");
    const office = plans.filter((p) => p.planType === "OFFICE");
    const field = plans.filter((p) => p.planType === "FIELD");
    const leave = plans.filter((p) => p.planType === "LEAVE");
    const notPlanned = totalStaff - plans.length;

    ok(res, {
      date: format(tomorrow, "yyyy-MM-dd"),
      totalStaff,
      wfhCount: wfh.length,
      officeCount: office.length,
      fieldCount: field.length,
      leaveCount: leave.length,
      notPlannedCount: notPlanned,
      wfhUsers: wfh.map((p) => p.user),
      officeUsers: office.map((p) => p.user),
      fieldUsers: field.map((p) => p.user),
      leaveUsers: leave.map((p) => p.user),
    });
  } catch (err) {
    next(err);
  }
};

/** GET /api/work-plans/admin/month-plans?year=YYYY&month=MM  (Admin only)
 *  Returns all staff work plans for a given month, grouped by date.
 */
export const getAdminMonthPlans = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const now = new Date();
    const year = parseInt((req.query.year as string) ?? now.getFullYear(), 10);
    const month = parseInt(
      (req.query.month as string) ?? now.getMonth() + 1,
      10,
    );

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      fail(res, 400, "year และ month ไม่ถูกต้อง");
      return;
    }

    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0));

    const plans = await prisma.workPlan.findMany({
      where: { planDate: { gte: startDate, lte: endDate } },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: [{ planDate: "asc" }, { user: { firstName: "asc" } }],
    });

    // Group by date string
    const byDate: Record<
      string,
      Array<{
        userId: number;
        firstName: string;
        lastName: string;
        position: string | null;
        department: { name: string } | null;
        planType: PlanType;
        note: string | null;
        actualNote: string | null;
      }>
    > = {};

    for (const p of plans) {
      const dateStr = format(p.planDate, "yyyy-MM-dd");
      if (!byDate[dateStr]) byDate[dateStr] = [];
      byDate[dateStr].push({
        userId: p.user.id,
        firstName: p.user.firstName,
        lastName: p.user.lastName,
        position: p.user.position,
        department: p.user.department,
        planType: p.planType as PlanType,
        note: p.note,
        actualNote: p.actualNote,
      });
    }

    ok(res, { year, month, byDate });
  } catch (err) {
    next(err);
  }
};

/** GET /api/work-plans/admin/month-results?year=YYYY&month=MM  (Admin only)
 *  Returns all staff actual attendance records for a given month, grouped by date.
 */
export const getAdminMonthResults = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const now = new Date();
    const year = parseInt((req.query.year as string) ?? now.getFullYear(), 10);
    const month = parseInt(
      (req.query.month as string) ?? now.getMonth() + 1,
      10,
    );

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      fail(res, 400, "year และ month ไม่ถูกต้อง");
      return;
    }

    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0));

    const attendances = await prisma.attendance.findMany({
      where: { workDate: { gte: startDate, lte: endDate } },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: [{ workDate: "asc" }, { user: { firstName: "asc" } }],
    });

    // Group by date string
    const byDate: Record<
      string,
      Array<{
        userId: number;
        firstName: string;
        lastName: string;
        position: string | null;
        department: { name: string } | null;
        workType: string;
        status: string;
        checkInTime: string | null;
        checkOutTime: string | null;
        taskDescription: string | null;
      }>
    > = {};

    for (const a of attendances) {
      const dateStr = format(a.workDate, "yyyy-MM-dd");
      if (!byDate[dateStr]) byDate[dateStr] = [];
      byDate[dateStr].push({
        userId: a.user.id,
        firstName: a.user.firstName,
        lastName: a.user.lastName,
        position: a.user.position,
        department: a.user.department,
        workType: a.workType,
        status: a.status,
        checkInTime: a.checkInTime ? a.checkInTime.toISOString() : null,
        checkOutTime: a.checkOutTime ? a.checkOutTime.toISOString() : null,
        taskDescription: a.taskDescription,
      });
    }

    ok(res, { year, month, byDate });
  } catch (err) {
    next(err);
  }
};
