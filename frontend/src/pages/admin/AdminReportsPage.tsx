import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Search, Download, FileText, Filter } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";
import { reportsService, usersService } from "@/services/admin.service";

interface Department {
  id: number;
  name: string;
}

interface ReportItem {
  id: number;
  workDate: string;
  workType: "WFH" | "OFFICE" | "FIELD" | "ON_SITE";
  checkInTime: string | null;
  checkOutTime: string | null;
  taskDescription: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  user: {
    firstName: string;
    lastName: string;
    employeeCode: string;
    department: { name: string } | null;
  };
}

export default function AdminReportsPage() {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState(
    format(new Date(Date.now() - 30 * 86400000), "yyyy-MM-dd"),
  );
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [workType, setWorkType] = useState("");
  const [dept, setDept] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: departments } = useQuery<Department[]>({
    queryKey: ["admin", "departments"],
    queryFn: () =>
      usersService.getDepartments().then((r) => r.data.data as Department[]),
  });

  const params = {
    search: search || undefined,
    from: dateFrom,
    to: dateTo,
    type: workType || "ALL",
    dept: dept || undefined,
    page,
    limit,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "reports", params],
    queryFn: () =>
      reportsService
        .getReports(params)
        .then((r) => r.data.data as { records: ReportItem[]; total: number }),
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  function durationStr(ci: string | null, co: string | null) {
    if (!ci || !co) return "—";
    const diff = new Date(co).getTime() - new Date(ci).getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m`;
  }

  async function downloadBlob(
    fn: () => Promise<{ data: Blob }>,
    filename: string,
  ) {
    try {
      const res = await fn();
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("เกิดข้อผิดพลาดในการ Export ไฟล์");
    }
  }

  function exportPdf() {
    if (!data?.records?.length) {
      toast.error("ไม่มีข้อมูลสำหรับ Export");
      return;
    }
    const rows = data.records
      .map(
        (item, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${item.user.employeeCode}</td>
          <td>${item.user.firstName} ${item.user.lastName}</td>
          <td>${item.user.department?.name ?? "—"}</td>
          <td>${format(new Date(item.workDate), "dd/MM/yyyy")}</td>
          <td>${item.workType === "WFH" ? "Work From Home" : item.workType === "OFFICE" ? "เข้าสำนักงาน" : "ไปราชการ"}</td>
          <td>${item.checkInTime ? format(new Date(item.checkInTime), "HH:mm") : "—"}</td>
          <td>${item.checkOutTime ? format(new Date(item.checkOutTime), "HH:mm") : "—"}</td>
          <td>${item.status === "PRESENT" ? "สมบูรณ์" : "รอออกงาน"}</td>
        </tr>`,
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>รายงานการลงชื่อปฏิบัติงาน</title>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600&display=swap" rel="stylesheet">
  <style>
    * { font-family: Sarabun, sans-serif; margin: 0; padding: 0; box-sizing: border-box; }
    body { padding: 24px; color: #1e293b; }
    h1 { font-size: 16px; font-weight: 600; text-align: center; margin-bottom: 6px; }
    .meta { text-align: center; font-size: 11px; color: #64748b; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #1B3F8B; color: white; padding: 6px 8px; text-align: left; white-space: nowrap; }
    td { border: 1px solid #e2e8f0; padding: 5px 8px; }
    tr:nth-child(even) td { background: #f8fafc; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>รายงานการลงชื่อปฏิบัติงาน</h1>
  <p class="meta">ช่วงวันที่: ${dateFrom} ถึง ${dateTo} &nbsp;|&nbsp; ทั้งหมด ${data.total} รายการ (แสดง ${data.records.length} รายการ)</p>
  <table>
    <thead>
      <tr>
        <th>#</th><th>รหัสพนักงาน</th><th>ชื่อ-สกุล</th><th>หน่วยงาน</th>
        <th>วันที่</th><th>ประเภท</th><th>เข้างาน</th><th>ออกงาน</th><th>สถานะ</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) {
      toast.error("กรุณาอนุญาต Popup ในเบราว์เซอร์");
      return;
    }
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <h1 className="text-base font-semibold text-slate-800">
          รายงานการลงชื่อปฏิบัติงาน
        </h1>

        {/* Filters */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={14} className="text-slate-400" />
            <span className="text-xs font-medium text-slate-600">ตัวกรอง</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="col-span-2 md:col-span-1">
              <label className="text-[10px] text-slate-500 mb-1 block">
                ค้นหาชื่อ / รหัส
              </label>
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20"
                  placeholder="ค้นหา..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 mb-1 block">
                วันที่เริ่มต้น
              </label>
              <input
                type="date"
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 mb-1 block">
                วันที่สิ้นสุด
              </label>
              <input
                type="date"
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 mb-1 block">
                ประเภท
              </label>
              <select
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20"
                value={workType}
                onChange={(e) => {
                  setWorkType(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">ทั้งหมด</option>
                <option value="WFH">WFH</option>
                <option value="OFFICE">เข้าสำนักงาน</option>
                <option value="FIELD">ไปราชการ</option>
                <option value="ON_SITE">ออกปฏิบัติงานพื้นที่</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 mb-1 block">
                หน่วยงาน
              </label>
              <select
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20"
                value={dept}
                onChange={(e) => {
                  setDept(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">ทั้งหมด</option>
                {departments?.map((d) => (
                  <option key={d.id} value={String(d.id)}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <p className="text-xs text-slate-500">
            ทั้งหมด{" "}
            <span className="font-semibold text-slate-700">
              {data?.total ?? 0}
            </span>{" "}
            รายการ
          </p>
          <div className="flex gap-2">
            <button
              onClick={() =>
                downloadBlob(
                  () =>
                    reportsService.exportExcel(params) as Promise<{
                      data: Blob;
                    }>,
                  `report-${dateFrom}-${dateTo}.xlsx`,
                )
              }
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-success/10 text-success rounded-lg hover:bg-success/20 transition-colors"
            >
              <Download size={13} />
              Excel
            </button>
            <button
              onClick={exportPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-danger/10 text-danger rounded-lg hover:bg-danger/20 transition-colors"
            >
              <FileText size={13} />
              PDF
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {[
                    "#",
                    "ชื่อ-สกุล",
                    "หน่วยงาน",
                    "วันที่",
                    "เข้างาน",
                    "ออกงาน",
                    "ชั่วโมง",
                    "ประเภท",
                    "GPS",
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
                {isLoading && (
                  <tr>
                    <td
                      colSpan={10}
                      className="text-center py-8 text-slate-400"
                    >
                      กำลังโหลด...
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  (!data?.records || data.records.length === 0) && (
                    <tr>
                      <td
                        colSpan={10}
                        className="text-center py-8 text-slate-400"
                      >
                        ไม่พบข้อมูล
                      </td>
                    </tr>
                  )}
                {data?.records?.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="border-t border-slate-50 hover:bg-slate-50"
                  >
                    <td className="px-3 py-2.5 text-slate-400">
                      {(page - 1) * limit + idx + 1}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-slate-700 whitespace-nowrap">
                      {item.user.firstName} {item.user.lastName}
                    </td>
                    <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">
                      {item.user.department?.name ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                      {format(new Date(item.workDate), "dd/MM/yyyy")}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">
                      {item.checkInTime
                        ? format(new Date(item.checkInTime), "HH:mm")
                        : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">
                      {item.checkOutTime
                        ? format(new Date(item.checkOutTime), "HH:mm")
                        : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">
                      {durationStr(item.checkInTime, item.checkOutTime)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          item.workType === "WFH"
                            ? "bg-blue-light text-navy"
                            : item.workType === "OFFICE"
                              ? "bg-green-50 text-green-700"
                              : "bg-gold/20 text-green-800"
                        }`}
                      >
                        {item.workType === "WFH"
                          ? "WFH"
                          : item.workType === "OFFICE"
                            ? "เข้าสำนักงาน"
                            : "ไปราชการ"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      {item.latitude ? (
                        <span className="text-success">✓</span>
                      ) : (
                        <span className="text-slate-300">✗</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          item.status === "PRESENT"
                            ? "bg-green-50 text-success"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {item.status === "PRESENT" ? "สมบูรณ์" : "ไม่สมบูรณ์"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                ก่อนหน้า
              </button>
              <span className="text-xs text-slate-500">
                หน้า {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                ถัดไป
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
