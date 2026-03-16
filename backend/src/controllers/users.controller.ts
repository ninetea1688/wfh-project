import { Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ok, created, fail } from "../utils/response";
import { AuthRequest } from "../middleware/auth.middleware";
import { hashPassword } from "../utils/password";
type Role = "ADMIN" | "STAFF";

const createUserSchema = z.object({
  employeeCode: z.string().min(1).max(20),
  username: z.string().min(3).max(50),
  password: z.string().min(8),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  departmentId: z.number().int().positive().optional().nullable(),
  position: z.string().max(100).optional().nullable(),
  role: z.enum(["ADMIN", "STAFF"]).default("STAFF"),
  phone: z.string().max(20).optional().nullable(),
});

const updateUserSchema = createUserSchema.omit({ password: true }).partial();

export const getUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const querySchema = z.object({
      dept: z.string().optional(),
      role: z.enum(["ADMIN", "STAFF"]).optional(),
      search: z.string().optional(),
      page: z.string().optional().default("1"),
      limit: z.string().optional().default("20"),
    });
    const { dept, role, search, page, limit } = querySchema.parse(req.query);

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);

    const where: Record<string, unknown> = {};
    if (dept) where.departmentId = parseInt(dept);
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { employeeCode: { contains: search } },
        { username: { contains: search } },
      ];
    }

    const [total, users] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          employeeCode: true,
          username: true,
          firstName: true,
          lastName: true,
          position: true,
          role: true,
          phone: true,
          isActive: true,
          createdAt: true,
          department: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
    ]);

    ok(res, {
      users,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    next(err);
  }
};

export const getUserById = async (
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

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        employeeCode: true,
        username: true,
        firstName: true,
        lastName: true,
        position: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        department: { select: { id: true, name: true } },
      },
    });

    if (!user) {
      fail(res, 404, "ไม่พบผู้ใช้งาน");
      return;
    }
    ok(res, user);
  } catch (err) {
    next(err);
  }
};

export const createUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body = createUserSchema.parse(req.body);
    const passwordHash = await hashPassword(body.password);

    const user = await prisma.user.create({
      data: {
        employeeCode: body.employeeCode,
        username: body.username,
        passwordHash,
        firstName: body.firstName,
        lastName: body.lastName,
        departmentId: body.departmentId ?? undefined,
        position: body.position,
        role: body.role as Role,
        phone: body.phone,
      },
      select: {
        id: true,
        employeeCode: true,
        username: true,
        firstName: true,
        lastName: true,
        position: true,
        role: true,
        isActive: true,
        createdAt: true,
        department: { select: { id: true, name: true } },
      },
    });

    created(res, user, "สร้างผู้ใช้งานสำเร็จ");
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (
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

    const body = updateUserSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(body.firstName && { firstName: body.firstName }),
        ...(body.lastName && { lastName: body.lastName }),
        ...(body.position !== undefined && { position: body.position }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.role && { role: body.role as Role }),
        ...(body.departmentId !== undefined && {
          departmentId: body.departmentId ?? undefined,
        }),
      },
      select: {
        id: true,
        employeeCode: true,
        username: true,
        firstName: true,
        lastName: true,
        position: true,
        role: true,
        isActive: true,
        updatedAt: true,
        department: { select: { id: true, name: true } },
      },
    });

    ok(res, user, "อัปเดตข้อมูลสำเร็จ");
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (
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
    if (id === req.user!.userId) {
      fail(res, 400, "ไม่สามารถลบบัญชีตัวเองได้");
      return;
    }

    await prisma.user.update({ where: { id }, data: { isActive: false } });
    ok(res, null, "ปิดใช้งานผู้ใช้สำเร็จ");
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (
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

    const { newPassword } = z
      .object({
        newPassword: z.string().min(8),
      })
      .parse(req.body);

    const hash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id }, data: { passwordHash: hash } });
    ok(res, null, "รีเซ็ตรหัสผ่านสำเร็จ");
  } catch (err) {
    next(err);
  }
};

export const getDepartments = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const depts = await prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: { _count: { select: { users: true } } },
    });
    ok(res, depts);
  } catch (err) {
    next(err);
  }
};

const deptSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().max(20).optional().nullable(),
});

export const createDepartment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body = deptSchema.parse(req.body);
    const existing = await prisma.department.findFirst({
      where: { name: body.name, isActive: true },
    });
    if (existing) {
      fail(res, 409, "ชื่อแผนกนี้มีอยู่แล้ว");
      return;
    }
    const dept = await prisma.department.create({
      data: { name: body.name, code: body.code ?? null },
    });
    created(res, dept, "เพิ่มแผนกสำเร็จ");
  } catch (err) {
    next(err);
  }
};

export const updateDepartment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const body = deptSchema.parse(req.body);
    const dept = await prisma.department.findFirst({
      where: { id, isActive: true },
    });
    if (!dept) {
      fail(res, 404, "ไม่พบแผนก");
      return;
    }
    const dup = await prisma.department.findFirst({
      where: { name: body.name, isActive: true, NOT: { id } },
    });
    if (dup) {
      fail(res, 409, "ชื่อแผนกนี้มีอยู่แล้ว");
      return;
    }
    const updated = await prisma.department.update({
      where: { id },
      data: { name: body.name, code: body.code ?? null },
    });
    ok(res, updated, "แก้ไขแผนกสำเร็จ");
  } catch (err) {
    next(err);
  }
};

export const deleteDepartment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const dept = await prisma.department.findFirst({
      where: { id, isActive: true },
    });
    if (!dept) {
      fail(res, 404, "ไม่พบแผนก");
      return;
    }
    const userCount = await prisma.user.count({
      where: { departmentId: id, isActive: true },
    });
    if (userCount > 0) {
      fail(res, 409, `ไม่สามารถลบได้ มีผู้ใช้งาน ${userCount} คนอยู่ในแผนกนี้`);
      return;
    }
    await prisma.department.update({
      where: { id },
      data: { isActive: false },
    });
    ok(res, null, "ลบแผนกสำเร็จ");
  } catch (err) {
    next(err);
  }
};
