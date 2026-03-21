import { Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ok, fail } from "../utils/response";
import { AuthRequest } from "../middleware/auth.middleware";
import { startOfDay, endOfDay, subDays, format } from "date-fns";
import * as XLSX from "xlsx";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export const getDashboard = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const now = new Date();
    // Use UTC midnight of local calendar date so MySQL @db.Date comparisons are correct
    const today = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
    );
    const todayEnd = new Date(
      Date.UTC(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999,
      ),
    );
    const dayOfWeek = now.getDay();
    const daysFromMon = (dayOfWeek + 6) % 7;
    const monDate = new Date(now);
    monDate.setDate(monDate.getDate() - daysFromMon);
    const weekStart = new Date(
      Date.UTC(monDate.getFullYear(), monDate.getMonth(), monDate.getDate()),
    );

    const [totalActive, todayRecords, weekRecords] = await prisma.$transaction([
      prisma.user.count({ where: { isActive: true, role: "STAFF" } }),
      prisma.attendance.findMany({
        where: { workDate: { gte: today, lte: todayEnd } },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              position: true,
              department: { select: { name: true } },
            },
          },
        },
      }),
      prisma.attendance.groupBy({
        by: ["workDate", "workType"],
        where: { workDate: { gte: weekStart } },
        orderBy: [],
        _count: { id: true },
      }),
    ]);

    const checkedIn = todayRecords.length;
    const wfhCount = todayRecords.filter((r) => r.workType === "WFH").length;
    const officeCount = todayRecords.filter(
      (r) => r.workType === "OFFICE",
    ).length;
    const fieldCount = todayRecords.filter(
      (r) => r.workType === "FIELD",
    ).length;
    const onSiteCount = todayRecords.filter(
      (r) => r.workType === "ON_SITE",
    ).length;
    const notCheckedIn = totalActive - checkedIn;

    // Build weekly chart data
    const weeklyData: Record<
      string,
      { WFH: number; OFFICE: number; FIELD: number; ON_SITE: number }
    > = {};
    for (let i = 0; i < 7; i++) {
      const d = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
      weeklyData[d] = { WFH: 0, OFFICE: 0, FIELD: 0, ON_SITE: 0 };
    }
    weekRecords.forEach((r) => {
      const d = format(r.workDate, "yyyy-MM-dd");
      const wt = r.workType as "WFH" | "OFFICE" | "FIELD" | "ON_SITE";
      if (weeklyData[d] && (wt === "WFH" || wt === "OFFICE" || wt === "FIELD" || wt === "ON_SITE"))
        weeklyData[d][wt] += (r._count as { id: number }).id ?? 0;
    });

    // Who hasn't checked in today
    const checkedInUserIds = todayRecords.map((r) => r.userId);
    const notCheckedInUsers = await prisma.user.findMany({
      where: { isActive: true, role: "STAFF", id: { notIn: checkedInUserIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        position: true,
        department: { select: { name: true } },
      },
      take: 10,
    });

    ok(res, {
      today: {
        checkedIn,
        wfhCount,
        officeCount,
        fieldCount,
        onSiteCount,
        notCheckedIn,
        total: totalActive,
      },
      recentCheckins: todayRecords.slice(0, 10),
      notCheckedInUsers,
      weeklyChart: Object.entries(weeklyData).map(([date, counts]) => ({
        date,
        ...counts,
      })),
    });
  } catch (err) {
    next(err);
  }
};

export const getReports = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const querySchema = z.object({
      from: z.string().optional(),
      to: z.string().optional(),
      type: z.enum(["WFH", "FIELD", "ALL"]).optional().default("ALL"),
      dept: z.string().optional(),
      userId: z.string().optional(),
      search: z.string().optional(),
      page: z.string().optional().default("1"),
      limit: z.string().optional().default("10"),
    });

    const { from, to, type, dept, userId, search, page, limit } =
      querySchema.parse(req.query);
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);

    const where: Record<string, unknown> = {};
    if (from || to) {
      where.workDate = {
        ...(from ? { gte: startOfDay(new Date(from)) } : {}),
        ...(to ? { lte: endOfDay(new Date(to)) } : {}),
      };
    }
    if (type !== "ALL") where.workType = type;
    if (userId) where.userId = parseInt(userId);
    if (dept) where.user = { departmentId: parseInt(dept) };
    if (search) {
      where.user = {
        ...((where.user as Record<string, unknown>) ?? {}),
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { employeeCode: { contains: search } },
        ],
      };
    }

    const [total, records] = await prisma.$transaction([
      prisma.attendance.count({ where }),
      prisma.attendance.findMany({
        where,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              employeeCode: true,
              position: true,
              department: { select: { name: true } },
            },
          },
          images: { select: { id: true, filePath: true, fileName: true } },
        },
        orderBy: [{ workDate: "desc" }, { checkInTime: "desc" }],
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
    ]);

    ok(res, {
      records,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    next(err);
  }
};

export const exportExcel = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const querySchema = z.object({
      from: z.string().optional(),
      to: z.string().optional(),
      type: z.enum(["WFH", "FIELD", "ALL"]).optional().default("ALL"),
      dept: z.string().optional(),
    });

    const { from, to, type, dept } = querySchema.parse(req.query);

    const where: Record<string, unknown> = {};
    if (from || to) {
      where.workDate = {
        ...(from ? { gte: startOfDay(new Date(from)) } : {}),
        ...(to ? { lte: endOfDay(new Date(to)) } : {}),
      };
    }
    if (type !== "ALL") where.workType = type;
    if (dept) where.user = { departmentId: parseInt(dept) };

    const records = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            employeeCode: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: [{ workDate: "desc" }],
    });

    const rows = records.map((r, i) => ({
      "#": i + 1,
      รหัสพนักงาน: r.user.employeeCode,
      ชื่อ: `${r.user.firstName} ${r.user.lastName}`,
      หน่วยงาน: r.user.department?.name ?? "",
      วันที่: format(r.workDate, "dd/MM/yyyy"),
      ประเภท: r.workType === "WFH" ? "Work From Home" : "ออกราชการ",
      เวลาเข้า: r.checkInTime ? format(r.checkInTime, "HH:mm") : "",
      เวลาออก: r.checkOutTime ? format(r.checkOutTime, "HH:mm") : "-",
      สถานะ: r.status === "PRESENT" ? "สมบูรณ์" : "ยังไม่ออก",
      ภารกิจ: r.taskDescription ?? "",
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = [
      { wch: 4 },
      { wch: 12 },
      { wch: 20 },
      { wch: 25 },
      { wch: 12 },
      { wch: 16 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 40 },
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, "รายงาน WFH");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    const filename = `wfh-report-${format(new Date(), "yyyyMMdd")}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

export const exportPdf = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const querySchema = z.object({
      from: z.string().optional(),
      to: z.string().optional(),
      type: z.enum(["WFH", "FIELD", "ALL"]).optional().default("ALL"),
      dept: z.string().optional(),
    });

    const { from, to, type, dept } = querySchema.parse(req.query);

    const where: Record<string, unknown> = {};
    if (from || to) {
      where.workDate = {
        ...(from ? { gte: startOfDay(new Date(from)) } : {}),
        ...(to ? { lte: endOfDay(new Date(to)) } : {}),
      };
    }
    if (type !== "ALL") where.workType = type;
    if (dept) where.user = { departmentId: parseInt(dept) };

    const records = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: { firstName: true, lastName: true, employeeCode: true },
        },
      },
      orderBy: [{ workDate: "desc" }],
      take: 200, // PDF limit
    });

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    page.drawText("WFH Attendance Report", {
      x: 50,
      y: 800,
      size: 16,
      font,
      color: rgb(0.1, 0.25, 0.55),
    });
    page.drawText(`Generated: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, {
      x: 50,
      y: 780,
      size: 10,
      font,
    });
    page.drawText(`Total Records: ${records.length}`, {
      x: 50,
      y: 765,
      size: 10,
      font,
    });

    let y = 740;
    const headers = ["#", "Code", "Name", "Date", "Type", "In", "Out"];
    const colX = [50, 70, 110, 210, 280, 340, 390];

    headers.forEach((h, i) => {
      page.drawText(h, {
        x: colX[i],
        y,
        size: 9,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
    });

    y -= 15;
    records.slice(0, 50).forEach((r, idx) => {
      if (y < 60) return;
      const row = [
        String(idx + 1),
        r.user.employeeCode,
        `${r.user.firstName} ${r.user.lastName}`.substring(0, 20),
        format(r.workDate, "dd/MM/yy"),
        r.workType,
        r.checkInTime ? format(r.checkInTime, "HH:mm") : "",
        r.checkOutTime ? format(r.checkOutTime, "HH:mm") : "-",
      ];
      row.forEach((cell, i) => {
        page.drawText(cell, { x: colX[i], y, size: 8, font });
      });
      y -= 12;
    });

    const pdfBytes = await pdfDoc.save();
    const filename = `wfh-report-${format(new Date(), "yyyyMMdd")}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    next(err);
  }
};
