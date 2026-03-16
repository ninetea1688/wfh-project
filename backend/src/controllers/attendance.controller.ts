import { Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ok, created, fail } from "../utils/response";
import { AuthRequest } from "../middleware/auth.middleware";
type AttendanceStatus = "PRESENT" | "INCOMPLETE";
import { startOfDay, endOfDay } from "date-fns";

const checkInSchema = z.object({
  workType: z.enum(["WFH", "FIELD"]),
  taskDescription: z.string().min(5, "กรุณาระบุภารกิจอย่างน้อย 5 ตัวอักษร"),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  locationName: z.string().optional().nullable(),
});

/** Returns UTC midnight that represents today's local calendar date,
 *  so MySQL @db.Date stores the correct local date in any timezone. */
function localDateUTC(d: Date = new Date()): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

export const checkIn = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body = checkInSchema.parse(req.body);
    const userId = req.user!.userId;
    const today = localDateUTC();

    const existing = await prisma.attendance.findFirst({
      where: { userId, workDate: today },
    });

    if (existing) {
      fail(res, 409, "คุณได้ลงชื่อเข้างานวันนี้แล้ว");
      return;
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId,
        workDate: today,
        workType: body.workType,
        checkInTime: new Date(),
        taskDescription: body.taskDescription,
        latitude: body.latitude != null ? body.latitude : undefined,
        longitude: body.longitude != null ? body.longitude : undefined,
        locationName: body.locationName,
        status: "INCOMPLETE" as AttendanceStatus,
      },
      include: { images: true },
    });

    created(res, attendance, "ลงชื่อเข้างานสำเร็จ");
  } catch (err) {
    next(err);
  }
};

export const checkOut = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const today = localDateUTC();

    const attendance = await prisma.attendance.findFirst({
      where: { userId, workDate: today },
    });

    if (!attendance) {
      fail(res, 404, "ไม่พบการลงชื่อเข้างานวันนี้");
      return;
    }

    if (attendance.checkOutTime) {
      fail(res, 409, "ได้ลงชื่อออกงานแล้ว");
      return;
    }

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOutTime: new Date(),
        status: "PRESENT" as AttendanceStatus,
      },
      include: { images: true },
    });

    ok(res, updated, "ลงชื่อออกงานสำเร็จ");
  } catch (err) {
    next(err);
  }
};

export const getToday = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const today = localDateUTC();

    const attendance = await prisma.attendance.findFirst({
      where: { userId, workDate: today },
      include: { images: true },
    });

    ok(res, attendance);
  } catch (err) {
    next(err);
  }
};

export const getHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const querySchema = z.object({
      from: z.string().optional(),
      to: z.string().optional(),
      type: z.enum(["WFH", "FIELD", "ALL"]).optional().default("ALL"),
      page: z.string().optional().default("1"),
      limit: z.string().optional().default("10"),
    });

    const { from, to, type, page, limit } = querySchema.parse(req.query);
    const userId = req.user!.userId;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);

    const where: Record<string, unknown> = { userId };
    if (from) where.workDate = { gte: new Date(from) };
    if (to)
      where.workDate = {
        ...((where.workDate as Record<string, unknown>) ?? {}),
        lte: endOfDay(new Date(to)),
      };
    if (type !== "ALL") where.workType = type;

    const [total, records] = await prisma.$transaction([
      prisma.attendance.count({ where }),
      prisma.attendance.findMany({
        where,
        include: { images: true },
        orderBy: { workDate: "desc" },
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

export const getById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      fail(res, 400, "Invalid ID");
      return;
    }

    const where =
      req.user!.role === "ADMIN" ? { id } : { id, userId: req.user!.userId };

    const record = await prisma.attendance.findFirst({
      where,
      include: {
        user: {
          select: { firstName: true, lastName: true, employeeCode: true },
        },
        images: true,
      },
    });

    if (!record) {
      fail(res, 404, "ไม่พบข้อมูล");
      return;
    }
    ok(res, record);
  } catch (err) {
    next(err);
  }
};

export const uploadImages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      fail(res, 400, "Invalid ID");
      return;
    }

    const attendance = await prisma.attendance.findFirst({
      where: { id, userId: req.user!.userId },
      include: { images: true },
    });

    if (!attendance) {
      fail(res, 404, "ไม่พบข้อมูล");
      return;
    }
    if (attendance.images.length >= 3) {
      fail(res, 400, "แนบรูปได้สูงสุด 3 รูป");
      return;
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      fail(res, 400, "No files uploaded");
      return;
    }

    const maxNew = 3 - attendance.images.length;
    const toCreate = files.slice(0, maxNew);

    const images = await prisma.$transaction(
      toCreate.map((file) =>
        prisma.attendanceImage.create({
          data: {
            attendanceId: id,
            filePath: `uploads/${file.filename}`,
            fileName: file.filename,
            fileSize: file.size,
          },
        }),
      ),
    );

    ok(res, images, "อัปโหลดรูปสำเร็จ");
  } catch (err) {
    next(err);
  }
};
