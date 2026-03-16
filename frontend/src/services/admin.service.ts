import api from "@/lib/api";

export const reportsService = {
  getDashboard: () =>
    api.get<{ success: boolean; data: unknown }>("/reports/dashboard"),

  getReports: (params?: Record<string, unknown>) =>
    api.get<{ success: boolean; data: unknown }>("/reports", { params }),

  exportExcel: (params?: Record<string, unknown>) =>
    api.get("/reports/export/excel", {
      params,
      responseType: "blob",
    }),

  exportPdf: (params?: Record<string, unknown>) =>
    api.get("/reports/export/pdf", {
      params,
      responseType: "blob",
    }),
};

export const usersService = {
  getUsers: (params?: Record<string, unknown>) =>
    api.get<{ success: boolean; data: unknown }>("/users", { params }),

  getUserById: (id: number) =>
    api.get<{ success: boolean; data: unknown }>(`/users/${id}`),

  createUser: (data: unknown) =>
    api.post<{ success: boolean; data: unknown }>("/users", data),

  updateUser: (id: number, data: unknown) =>
    api.put<{ success: boolean; data: unknown }>(`/users/${id}`, data),

  deleteUser: (id: number) => api.delete(`/users/${id}`),

  resetPassword: (id: number, newPassword: string) =>
    api.patch(`/users/${id}/reset-password`, { newPassword }),

  getDepartments: () =>
    api.get<{
      success: boolean;
      data: {
        id: number;
        name: string;
        code: string;
        _count: { users: number };
      }[];
    }>("/users/departments"),

  createDepartment: (data: { name: string; code?: string }) =>
    api.post<{ success: boolean; data: unknown }>("/users/departments", data),

  updateDepartment: (id: number, data: { name: string; code?: string }) =>
    api.put<{ success: boolean; data: unknown }>(
      `/users/departments/${id}`,
      data,
    ),

  deleteDepartment: (id: number) => api.delete(`/users/departments/${id}`),
};
