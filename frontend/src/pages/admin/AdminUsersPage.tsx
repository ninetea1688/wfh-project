import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, KeyRound, Search, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import AdminLayout from "@/components/layout/AdminLayout";
import { usersService, reportsService } from "@/services/admin.service";

interface Department {
  id: number;
  name: string;
}
interface HistoryRecord {
  id: number;
  workDate: string;
  workType: "WFH" | "OFFICE" | "FIELD" | "ON_SITE";
  checkInTime: string | null;
  checkOutTime: string | null;
  status: string;
}
interface User {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  username: string;
  role: "ADMIN" | "STAFF";
  position: string | null;
  isActive: boolean;
  department: Department | null;
}

const userSchema = z.object({
  firstName: z.string().min(1, "จำเป็น"),
  lastName: z.string().min(1, "จำเป็น"),
  employeeCode: z.string().min(1, "จำเป็น"),
  username: z.string().min(3, "อย่างน้อย 3 ตัว"),
  password: z.string().optional(),
  position: z.string().optional(),
  role: z.enum(["ADMIN", "STAFF"]),
  departmentId: z.preprocess(
    (v) => (!v || v === "" ? undefined : Number(v)),
    z.number().int().positive().optional().nullable(),
  ),
  isActive: z.boolean().optional(),
});
type UserForm = z.infer<typeof userSchema>;

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [historyTarget, setHistoryTarget] = useState<User | null>(null);

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["admin", "users", search],
    queryFn: () =>
      usersService
        .getUsers({ search })
        .then((r) => (r.data.data as { users: User[] }).users),
  });

  const { data: departments } = useQuery<Department[]>({
    queryKey: ["admin", "departments"],
    queryFn: () =>
      usersService.getDepartments().then((r) => r.data.data as Department[]),
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["admin", "user-history", historyTarget?.id],
    queryFn: () =>
      reportsService
        .getReports({ userId: String(historyTarget!.id), limit: "30" })
        .then(
          (r) => r.data.data as { records: HistoryRecord[]; total: number },
        ),
    enabled: !!historyTarget,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserForm>({ resolver: zodResolver(userSchema) });

  function openCreate() {
    setEditId(null);
    reset({ role: "STAFF", isActive: true });
    setShowForm(true);
  }

  function openEdit(u: User) {
    setEditId(u.id);
    reset({
      firstName: u.firstName,
      lastName: u.lastName,
      employeeCode: u.employeeCode,
      username: u.username,
      role: u.role,
      position: u.position ?? "",
      departmentId: u.department?.id,
      isActive: u.isActive,
    });
    setShowForm(true);
  }

  const saveMutation = useMutation({
    mutationFn: (data: UserForm) => {
      const payload: Record<string, unknown> = { ...data };
      if (!payload.departmentId) delete payload.departmentId;
      if (editId && !payload.password) delete payload.password;
      return editId
        ? usersService.updateUser(editId, payload)
        : usersService.createUser(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success(editId ? "แก้ไขผู้ใช้สำเร็จ" : "เพิ่มผู้ใช้สำเร็จ");
      setShowForm(false);
    },
    onError: () => toast.error("เกิดข้อผิดพลาด"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersService.deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("ลบผู้ใช้สำเร็จ");
      setDeleteTarget(null);
    },
    onError: () => toast.error("เกิดข้อผิดพลาด"),
  });

  const resetPwMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      usersService.resetPassword(id, password),
    onSuccess: () => {
      toast.success("รีเซ็ตรหัสผ่านสำเร็จ");
      setResetTarget(null);
      setNewPassword("");
    },
    onError: () => toast.error("เกิดข้อผิดพลาด"),
  });

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold text-slate-800">
            จัดการผู้ใช้งาน
          </h1>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-navy text-white rounded-lg hover:bg-blue transition-colors"
          >
            <Plus size={13} />
            เพิ่มผู้ใช้
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full max-w-xs">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20"
            placeholder="ค้นหาชื่อ / รหัสพนักงาน..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Form panel */}
        {showForm && (
          <div className="bg-white border border-navy/20 rounded-xl p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-700 mb-4">
              {editId ? "แก้ไขผู้ใช้" : "เพิ่มผู้ใช้ใหม่"}
            </h3>
            <form
              onSubmit={handleSubmit((d) => {
                if (!editId && (!d.password || d.password.length < 8)) {
                  toast.error("กรุณากรอกรหัสผ่านอย่างน้อย 8 ตัวอักษร");
                  return;
                }
                saveMutation.mutate(d);
              })}
              className="grid grid-cols-2 md:grid-cols-3 gap-3"
            >
              {[
                { name: "firstName" as const, label: "ชื่อ" },
                { name: "lastName" as const, label: "นามสกุล" },
                { name: "employeeCode" as const, label: "รหัสพนักงาน" },
                { name: "username" as const, label: "Username" },
                { name: "position" as const, label: "ตำแหน่ง" },
              ].map((f) => (
                <div key={f.name}>
                  <label className="text-[10px] text-slate-500 block mb-1">
                    {f.label}
                  </label>
                  <input
                    {...register(f.name)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20"
                  />
                  {errors[f.name] && (
                    <p className="text-[10px] text-danger mt-0.5">
                      {errors[f.name]?.message}
                    </p>
                  )}
                </div>
              ))}

              {!editId && (
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">
                    รหัสผ่าน
                  </label>
                  <input
                    {...register("password")}
                    type="password"
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20"
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] text-slate-500 block mb-1">
                  หน่วยงาน
                </label>
                <select
                  {...register("departmentId")}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20"
                >
                  <option value="">— ไม่ระบุ —</option>
                  {departments?.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-1">
                  สิทธิ์
                </label>
                <select
                  {...register("role")}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20"
                >
                  <option value="STAFF">STAFF</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div className="col-span-2 md:col-span-3 flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-4 py-1.5 text-xs bg-navy text-white rounded-lg hover:bg-blue disabled:opacity-50 transition-colors"
                >
                  {saveMutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {[
                    "รหัส",
                    "ชื่อ-สกุล",
                    "Username",
                    "หน่วยงาน",
                    "ตำแหน่ง",
                    "Role",
                    "สถานะ",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2.5 text-left text-[10px] text-slate-500 font-medium whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400">
                      กำลังโหลด...
                    </td>
                  </tr>
                )}
                {!isLoading && users?.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400">
                      ไม่พบข้อมูล
                    </td>
                  </tr>
                )}
                {users?.map((u) => (
                  <tr
                    key={u.id}
                    className="border-t border-slate-50 hover:bg-slate-50"
                  >
                    <td className="px-3 py-2.5 text-slate-500">
                      {u.employeeCode}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-slate-700 whitespace-nowrap">
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="px-3 py-2.5 text-slate-500">{u.username}</td>
                    <td className="px-3 py-2.5 text-slate-500">
                      {u.department?.name ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 text-slate-500">
                      {u.position ?? "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          u.role === "ADMIN"
                            ? "bg-navy/10 text-navy"
                            : "bg-blue-light text-blue"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          u.isActive
                            ? "bg-green-50 text-success"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {u.isActive ? "ใช้งาน" : "ปิดใช้"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1 text-slate-400 hover:text-navy hover:bg-blue-light rounded transition-colors"
                          title="แก้ไข"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => {
                            setResetTarget(u);
                            setNewPassword("");
                          }}
                          className="p-1 text-slate-400 hover:text-gold hover:bg-gold/10 rounded transition-colors"
                          title="รีเซ็ตรหัสผ่าน"
                        >
                          <KeyRound size={12} />
                        </button>
                        <button
                          onClick={() => setHistoryTarget(u)}
                          className="p-1 text-slate-400 hover:text-blue hover:bg-blue-light rounded transition-colors"
                          title="ดูประวัติ"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="p-1 text-slate-400 hover:text-danger hover:bg-red-50 rounded transition-colors"
                          title="ลบผู้ใช้"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* History Modal */}
      {historyTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  ประวัติการลงชื่อ
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {historyTarget.firstName} {historyTarget.lastName} (
                  {historyTarget.employeeCode})
                </p>
              </div>
              <button
                onClick={() => setHistoryTarget(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <div className="overflow-auto flex-1">
              {historyLoading ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  กำลังโหลด...
                </div>
              ) : !historyData?.records?.length ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  ไม่พบข้อมูล
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-100">
                    <tr>
                      {[
                        "#",
                        "วันที่",
                        "ประเภท",
                        "เข้างาน",
                        "ออกงาน",
                        "สถานะ",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2.5 text-left text-[10px] text-slate-500 font-medium whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historyData.records.map((r, i) => (
                      <tr
                        key={r.id}
                        className="border-t border-slate-50 hover:bg-slate-50"
                      >
                        <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                        <td className="px-3 py-2 text-slate-700 whitespace-nowrap">
                          {format(new Date(r.workDate), "dd/MM/yyyy")}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              r.workType === "WFH"
                                ? "bg-blue-light text-navy"
                                : r.workType === "OFFICE"
                                  ? "bg-green-50 text-green-700"
                                  : "bg-gold-light text-green-800"
                            }`}
                          >
                            {r.workType === "WFH"
                              ? "🏠 WFH"
                              : r.workType === "OFFICE"
                                ? "🏢 สำนักงาน"
                                : "🚗 ไปราชการ"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {r.checkInTime
                            ? format(new Date(r.checkInTime), "HH:mm")
                            : "—"}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {r.checkOutTime
                            ? format(new Date(r.checkOutTime), "HH:mm")
                            : "—"}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              r.status === "PRESENT"
                                ? "bg-green-50 text-success"
                                : "bg-gold-light text-green-700"
                            }`}
                          >
                            {r.status === "PRESENT" ? "สมบูรณ์" : "ไม่สมบูรณ์"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
              <p className="text-[10px] text-slate-400">
                ทั้งหมด {historyData?.total ?? 0} รายการ (แสดง 30 รายการล่าสุด)
              </p>
              <button
                onClick={() => setHistoryTarget(null)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-sm font-semibold text-slate-800 mb-2">
              ยืนยันการลบ
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              คุณต้องการลบ{" "}
              <span className="font-medium text-slate-700">
                {deleteTarget.firstName} {deleteTarget.lastName}
              </span>{" "}
              ออกจากระบบ? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="px-3 py-1.5 text-xs bg-danger text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {deleteMutation.isPending ? "กำลังลบ..." : "ลบผู้ใช้"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-sm font-semibold text-slate-800 mb-2">
              รีเซ็ตรหัสผ่าน
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              กำหนดรหัสผ่านใหม่สำหรับ{" "}
              <span className="font-medium text-slate-700">
                {resetTarget.firstName} {resetTarget.lastName}
              </span>
            </p>
            <input
              type="password"
              placeholder="รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20 mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setResetTarget(null)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                disabled={newPassword.length < 8 || resetPwMutation.isPending}
                onClick={() =>
                  resetPwMutation.mutate({
                    id: resetTarget.id,
                    password: newPassword,
                  })
                }
                className="px-3 py-1.5 text-xs bg-navy text-white rounded-lg hover:bg-blue disabled:opacity-50 transition-colors"
              >
                {resetPwMutation.isPending ? "กำลังรีเซ็ต..." : "รีเซ็ต"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
