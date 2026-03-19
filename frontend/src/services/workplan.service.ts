import api from "@/lib/api";

export type PlanType = "WFH" | "OFFICE" | "FIELD" | "LEAVE";

export interface WorkPlanAttachment {
  id: number;
  workPlanId: number;
  filePath: string;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  uploadedAt: string;
}

export function getAttachmentUrl(filePath: string): string {
  const base =
    (import.meta.env.VITE_API_URL as string) ?? "http://localhost:4000";
  return `${base}/${filePath}`;
}

export interface WorkPlan {
  id: number;
  userId: number;
  planDate: string;
  planType: PlanType;
  note: string | null;
  actualNote: string | null;
  attachments: WorkPlanAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface DayPlan {
  date: string;
  plan: WorkPlan | null;
  actual: {
    workDate: string;
    workType: string;
    checkInTime: string | null;
    checkOutTime: string | null;
    status: string;
    taskDescription: string | null;
  } | null;
}

export interface WeekPlanResponse {
  weekStart: string;
  weekEnd: string;
  days: DayPlan[];
}

export interface LeaveSummary {
  year: number;
  month: number;
  leaveDays: number;
  wfhDays: number;
  officeDays: number;
  fieldDays: number;
  totalPlanned: number;
}

export interface TomorrowSummary {
  date: string;
  totalStaff: number;
  wfhCount: number;
  officeCount: number;
  fieldCount: number;
  leaveCount: number;
  notPlannedCount: number;
  wfhUsers: Array<{
    id: number;
    firstName: string;
    lastName: string;
    position: string | null;
    department: { name: string } | null;
  }>;
  officeUsers: Array<{
    id: number;
    firstName: string;
    lastName: string;
    position: string | null;
    department: { name: string } | null;
  }>;
  fieldUsers: Array<{
    id: number;
    firstName: string;
    lastName: string;
    position: string | null;
    department: { name: string } | null;
  }>;
  leaveUsers: Array<{
    id: number;
    firstName: string;
    lastName: string;
    position: string | null;
    department: { name: string } | null;
  }>;
}

export interface AdminDayPlanEntry {
  userId: number;
  firstName: string;
  lastName: string;
  position: string | null;
  department: { name: string } | null;
  planType: PlanType;
  note: string | null;
  actualNote: string | null;
}

export interface AdminMonthPlansResponse {
  year: number;
  month: number;
  byDate: Record<string, AdminDayPlanEntry[]>;
}

export interface AdminDayResultEntry {
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
}

export interface AdminMonthResultsResponse {
  year: number;
  month: number;
  byDate: Record<string, AdminDayResultEntry[]>;
}

export const workplanService = {
  getWeek: (date?: string) =>
    api.get<{ success: boolean; data: WeekPlanResponse }>("/work-plans/week", {
      params: date ? { date } : undefined,
    }),

  upsert: (payload: {
    planDate: string;
    planType: PlanType;
    note?: string | null;
  }) =>
    api.post<{ success: boolean; data: WorkPlan }>(
      "/work-plans/upsert",
      payload,
    ),

  delete: (date: string) =>
    api.delete<{ success: boolean; data: null }>(`/work-plans/${date}`),

  logActual: (date: string, actualNote: string | null, files?: File[]) => {
    const fd = new FormData();
    if (actualNote !== null && actualNote !== undefined) {
      fd.append("actualNote", actualNote);
    }
    (files ?? []).forEach((f) => fd.append("files", f));
    return api.put<{ success: boolean; data: WorkPlan }>(
      `/work-plans/${date}/actual`,
      fd,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
  },

  getLeaveSummary: (year?: number, month?: number) =>
    api.get<{ success: boolean; data: LeaveSummary }>(
      "/work-plans/leave-summary",
      {
        params: { year, month },
      },
    ),

  getTomorrowSummary: () =>
    api.get<{ success: boolean; data: TomorrowSummary }>(
      "/work-plans/tomorrow-summary",
    ),

  getAdminMonthPlans: (year: number, month: number) =>
    api.get<{ success: boolean; data: AdminMonthPlansResponse }>(
      "/work-plans/admin/month-plans",
      { params: { year, month } },
    ),

  getAdminMonthResults: (year: number, month: number) =>
    api.get<{ success: boolean; data: AdminMonthResultsResponse }>(
      "/work-plans/admin/month-results",
      { params: { year, month } },
    ),
};
