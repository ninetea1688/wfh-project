import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import StaffLayout from "@/components/layout/StaffLayout";
import {
  attendanceService,
  AttendanceRecord,
} from "@/services/attendance.service";
import { formatThaiDate, formatTime, formatDuration } from "@/lib/utils";

const FILTERS = [
  { label: "ทั้งหมด", value: "ALL" },
  { label: "WFH", value: "WFH" },
  { label: "เข้าสำนักงาน", value: "OFFICE" },
  { label: "ออกพื้นที่", value: "ON_SITE" },
  { label: "ไปราชการ", value: "FIELD" },
];

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export default function HistoryPage() {
  const [filter, setFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["attendance", "history", { filter, page }],
    queryFn: () =>
      attendanceService
        .getHistory({
          type: filter as "WFH" | "OFFICE" | "FIELD" | "ON_SITE" | "ALL",
          page,
          limit: 10,
        })
        .then((r) => r.data.data),
  });

  const records = data?.records ?? [];
  const totalPages = data?.totalPages ?? 1;

  const statusLabel = (rec: AttendanceRecord) => {
    if (!rec.checkOutTime)
      return { label: "ปฏิบัติงานอยู่", cls: "bg-green-100 text-green-800" };
    return { label: "สมบูรณ์", cls: "bg-blue-100 text-blue-800" };
  };

  return (
    <StaffLayout>
      {/* Header */}
      <div className="bg-navy px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-white text-base font-medium">ประวัติการลงชื่อ</h1>
          <span className="text-white/60 text-xs">
            {format(new Date(), "MMMM yyyy", { locale: undefined })}
          </span>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 px-4 py-2.5 overflow-x-auto scrollbar-hide border-b border-slate-100">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setFilter(f.value);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition-colors ${
              filter === f.value
                ? "bg-navy text-white border-navy"
                : "bg-white text-slate-500 border-slate-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Summary strip */}
      {data && (
        <div className="mx-4 my-3 bg-blue-light rounded-xl px-4 py-3 flex gap-4">
          <div className="text-center">
            <p className="text-xl font-semibold text-navy">{data.total}</p>
            <p className="text-[10px] text-blue">รายการ</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-semibold text-navy">
              {records.filter((r) => r.workType === "WFH").length}
            </p>
            <p className="text-[10px] text-blue">WFH</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-semibold text-navy">
              {records.filter((r) => r.workType === "OFFICE").length}
            </p>
            <p className="text-[10px] text-blue">เข้าสำนักงาน</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-semibold text-navy">
              {records.filter((r) => r.workType === "FIELD").length}
            </p>
            <p className="text-[10px] text-blue">ไปราชการ</p>
          </div>
        </div>
      )}

      {/* Records list */}
      <div className="px-4 pb-4 space-y-2">
        {isLoading && (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-slate-200 rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && records.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p className="text-3xl mb-3">📋</p>
            <p className="text-sm">ไม่พบข้อมูลการลงชื่อ</p>
          </div>
        )}

        {records.map((rec) => {
          const status = statusLabel(rec);
          return (
            <div
              key={rec.id}
              className="bg-white rounded-xl border border-slate-100 p-3.5"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    {formatThaiDate(rec.workDate)}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                    <span>▶ {formatTime(rec.checkInTime)}</span>
                    <span className="text-slate-200">|</span>
                    <span>
                      ■ {rec.checkOutTime ? formatTime(rec.checkOutTime) : "—"}
                    </span>
                    {rec.checkOutTime && (
                      <span className="text-slate-400">
                        {formatDuration(rec.checkInTime, rec.checkOutTime)}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`text-[9px] font-medium px-2 py-1 rounded-full ${status.cls}`}
                >
                  {status.label}
                </span>
              </div>

              {rec.taskDescription && (
                <p className="text-xs text-slate-500 leading-relaxed mb-2 line-clamp-2">
                  {rec.taskDescription}
                </p>
              )}

              <div className="flex items-center justify-between">
                <span
                  className={`text-[9px] font-medium px-2 py-1 rounded-full ${
                    rec.workType === "WFH"
                      ? "bg-blue-light text-navy"
                      : rec.workType === "OFFICE"
                        ? "bg-green-50 text-green-700"
                        : "bg-gold-light text-green-800"
                  }`}
                >
                  {rec.workType === "WFH"
                    ? "🏠 WFH"
                    : rec.workType === "OFFICE"
                      ? "🏢 เข้าสำนักงาน"
                      : "🚗 ไปราชการ"}
                </span>

                {rec.images.length > 0 && (
                  <div className="flex gap-1">
                    {rec.images.slice(0, 3).map((img) => {
                      const imgUrl = `${API_BASE}/${img.filePath.replace(/^\.?\//, "")}`;
                      return (
                        <a
                          key={img.id}
                          href={imgUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden"
                        >
                          <img
                            src={imgUrl}
                            alt="หลักฐาน"
                            className="w-full h-full object-cover"
                          />
                        </a>
                      );
                    })}
                  </div>
                )}

                {rec.latitude && (
                  <span className="text-[9px] text-slate-400">
                    📍 GPS บันทึกแล้ว
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40"
            >
              ‹ ก่อนหน้า
            </button>
            <span className="px-3 py-1.5 text-xs">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40"
            >
              ถัดไป ›
            </button>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
