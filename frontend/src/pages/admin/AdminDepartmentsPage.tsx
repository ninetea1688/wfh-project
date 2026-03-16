import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";
import { usersService } from "@/services/admin.service";

interface Department {
  id: number;
  name: string;
  code: string | null;
  _count: { users: number };
}

export default function AdminDepartmentsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Department | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const { data: departments = [], isLoading } = useQuery<Department[]>({
    queryKey: ["admin", "departments"],
    queryFn: () =>
      usersService.getDepartments().then((r) => r.data.data as Department[]),
  });

  function openCreate() {
    setEditTarget(null);
    setName("");
    setCode("");
    setShowForm(true);
  }

  function openEdit(d: Department) {
    setEditTarget(d);
    setName(d.name);
    setCode(d.code ?? "");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditTarget(null);
    setName("");
    setCode("");
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { name: name.trim(), code: code.trim() || undefined };
      return editTarget
        ? usersService.updateDepartment(editTarget.id, payload)
        : usersService.createDepartment(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "departments"] });
      toast.success(editTarget ? "แก้ไขแผนกสำเร็จ" : "เพิ่มแผนกสำเร็จ");
      closeForm();
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err?.response?.data?.error ?? "เกิดข้อผิดพลาด");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersService.deleteDepartment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "departments"] });
      toast.success("ลบแผนกสำเร็จ");
      setDeleteTarget(null);
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err?.response?.data?.error ?? "เกิดข้อผิดพลาด");
      setDeleteTarget(null);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("กรุณาระบุชื่อแผนก");
      return;
    }
    saveMutation.mutate();
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold text-slate-800">จัดการแผนก</h1>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-navy text-white rounded-lg hover:bg-blue transition-colors"
          >
            <Plus size={13} />
            เพิ่มแผนก
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white border border-navy/20 rounded-xl p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-700 mb-4">
              {editTarget ? "แก้ไขแผนก" : "เพิ่มแผนกใหม่"}
            </h3>
            <form
              onSubmit={handleSubmit}
              className="flex flex-wrap gap-3 items-end"
            >
              <div className="flex-1 min-w-48">
                <label className="text-[10px] text-slate-500 block mb-1">
                  ชื่อแผนก <span className="text-danger">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น ฝ่ายสารสนเทศ"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20"
                />
              </div>
              <div className="w-36">
                <label className="text-[10px] text-slate-500 block mb-1">
                  รหัสแผนก
                </label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="เช่น IT"
                  maxLength={20}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeForm}
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
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["#", "ชื่อแผนก", "รหัส", "ผู้ใช้งาน", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left text-[10px] text-slate-500 font-medium"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    กำลังโหลด...
                  </td>
                </tr>
              )}
              {!isLoading && departments.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    <Building2 size={32} className="mx-auto mb-2 opacity-30" />
                    <p>ยังไม่มีแผนก</p>
                  </td>
                </tr>
              )}
              {departments.map((dept, idx) => (
                <tr
                  key={dept.id}
                  className="border-t border-slate-50 hover:bg-slate-50"
                >
                  <td className="px-4 py-2.5 text-slate-400">{idx + 1}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-700">
                    {dept.name}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">
                    {dept.code ? (
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono">
                        {dept.code}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        dept._count.users > 0
                          ? "bg-blue-light text-navy"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {dept._count.users} คน
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => openEdit(dept)}
                        className="p-1.5 text-slate-400 hover:text-navy hover:bg-slate-100 rounded transition-colors"
                        title="แก้ไข"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(dept)}
                        disabled={dept._count.users > 0}
                        className="p-1.5 text-slate-400 hover:text-danger hover:bg-red-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title={
                          dept._count.users > 0 ? "มีผู้ใช้งานในแผนกนี้" : "ลบ"
                        }
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirm dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-5 w-full max-w-sm">
            <h3 className="text-sm font-semibold text-slate-800 mb-2">
              ยืนยันการลบ
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              ต้องการลบแผนก{" "}
              <span className="font-medium text-slate-700">
                "{deleteTarget.name}"
              </span>{" "}
              ใช่หรือไม่?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-1.5 text-xs bg-danger text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {deleteMutation.isPending ? "กำลังลบ..." : "ลบ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
