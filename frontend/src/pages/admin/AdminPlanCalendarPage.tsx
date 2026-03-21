import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
  parseISO,
  eachDayOfInterval,
} from "date-fns";
import * as XLSX from "xlsx";
import { th } from "date-fns/locale";
import { ChevronLeft, ChevronRight, X, Download, CalendarDays, Table2 } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  workplanService,
  AdminDayPlanEntry,
  PlanType,
} from "@/services/workplan.service";

const PLAN_CONFIG: Record<
  PlanType,
  { label: string; bg: string; text: string; dot: string }
> = {
  WFH: {
    label: "WFH",
    bg: "bg-blue-100",
    text: "text-blue-800",
    dot: "bg-blue-500",
  },
  OFFICE: {
    label: "สำนักงาน",
    bg: "bg-green-100",
    text: "text-green-800",
    dot: "bg-green-500",
  },
  FIELD: {
    label: "ไปราชการ",
    bg: "bg-amber-100",
    text: "text-amber-800",
    dot: "bg-amber-500",
  },
  LEAVE: {
    label: "ลา",
    bg: "bg-red-100",
    text: "text-red-800",
    dot: "bg-red-500",
  },
  ON_SITE: {
    label: "ออกพื้นที่",
    bg: "bg-purple-100",
    text: "text-purple-800",
    dot: "bg-purple-500",
  },
};

type ViewMode = "calendar" | "table";

function exportDayToExcel(dateStr: string, entries: AdminDayPlanEntry[]) {
  const rows = entries.map((e, i) => ({
    ลำดับ: i + 1,
    ชื่อ: `${e.firstName} ${e.lastName}`,
    ตำแหน่ง: e.position ?? "—",
    หน่วยงาน: e.department?.name ?? "—",
    ประเภทแผน: PLAN_CONFIG[e.planType]?.label ?? e.planType,
    หมายเหตุ: e.note ?? "",
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "แผนงาน");
  XLSX.writeFile(wb, `แผนงาน_${dateStr}.xlsx`);
}

function exportMonthToExcel(
  currentMonth: Date,
  byDate: Record<string, AdminDayPlanEntry[]>,
) {
  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });
  const rows: Record<string, unknown>[] = [];
  for (const day of days) {
    const dateStr = format(day, "yyyy-MM-dd");
    for (const e of byDate[dateStr] ?? []) {
      rows.push({
        วันที่: format(day, "dd/MM/yyyy", { locale: th }),
        ชื่อ: `${e.firstName} ${e.lastName}`,
        ตำแหน่ง: e.position ?? "—",
        หน่วยงาน: e.department?.name ?? "—",
        ประเภทแผน: PLAN_CONFIG[e.planType]?.label ?? e.planType,
        หมายเหตุ: e.note ?? "",
      });
    }
  }
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "แผนงานรายเดือน");
  XLSX.writeFile(wb, `แผนงาน_${format(currentMonth, "yyyy-MM")}.xlsx`);
}

export default function AdminPlanCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("calendar");

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1;

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "month-plans", year, month],
    queryFn: () =>
      workplanService.getAdminMonthPlans(year, month).then((r) => r.data.data),
  });

  // Build calendar grid days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays: Date[] = [];
  let d = gridStart;
  while (d <= gridEnd) {
    calendarDays.push(d);
    d = addDays(d, 1);
  }

  const selectedEntries: AdminDayPlanEntry[] =
    selectedDate && data?.byDate[selectedDate] ? data.byDate[selectedDate] : [];

  const countByType = (entries: AdminDayPlanEntry[]) => {
    const counts: Partial<Record<PlanType, number>> = {};
    for (const e of entries) counts[e.planType] = (counts[e.planType] ?? 0) + 1;
    return counts;
  };

  const tableDays = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }).filter(
    (day) => (data?.byDate[format(day, "yyyy-MM-dd")] ?? []).length > 0,
  );

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-navy">แผนการปฏิบัติงาน</h1>
            <p className="text-sm text-gray-500 mt-0.5">สรุปแผนงานของบุคลากรทั้งหมด รายเดือน</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            {(Object.entries(PLAN_CONFIG) as [PlanType, typeof PLAN_CONFIG.WFH][]).map(([type, cfg]) => (
              <span key={type} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            ))}
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Month navigation */}
          <div className="flex items-center gap-3">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-lg hover:bg-blue-light transition-colors">
              <ChevronLeft className="w-5 h-5 text-navy" />
            </button>
            <h2 className="text-base font-semibold text-navy w-44 text-center">
              {format(currentMonth, "MMMM yyyy", { locale: th })}
            </h2>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-lg hover:bg-blue-light transition-colors">
              <ChevronRight className="w-5 h-5 text-navy" />
            </button>
          </div>

          {/* Tab switcher + export */}
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setView("calendar")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${view === "calendar" ? "bg-white text-navy shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                <CalendarDays size={13} /> ปฏิทิน
              </button>
              <button
                onClick={() => setView("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${view === "table" ? "bg-white text-navy shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                <Table2 size={13} /> ตาราง
              </button>
            </div>
            {view === "table" && data && (
              <button
                onClick={() => exportMonthToExcel(currentMonth, data.byDate)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download size={13} /> Excel ทั้งเดือน
              </button>
            )}
          </div>
        </div>

        {/* ── CALENDAR VIEW ── */}
        {view === "calendar" && (
          <div className="flex gap-6">
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="grid grid-cols-7 border-b border-gray-100">
                {["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."].map((day) => (
                  <div key={day} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">{day}</div>
                ))}
              </div>
              {isLoading ? (
                <div className="h-96 flex items-center justify-center text-gray-400">กำลังโหลด...</div>
              ) : (
                <div className="grid grid-cols-7">
                  {calendarDays.map((day, idx) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const inMonth = isSameMonth(day, currentMonth);
                    const entries = data?.byDate[dateStr] ?? [];
                    const counts = countByType(entries);
                    const isSelected = selectedDate === dateStr;
                    const today = isToday(day);
                    return (
                      <button
                        key={idx}
                        onClick={() => entries.length > 0 && inMonth ? setSelectedDate(isSelected ? null : dateStr) : undefined}
                        className={[
                          "min-h-[88px] p-1.5 border-b border-r border-gray-50 text-left transition-colors",
                          inMonth ? "bg-white" : "bg-gray-50/60",
                          isSelected ? "ring-2 ring-inset ring-navy" : "",
                          entries.length > 0 && inMonth ? "hover:bg-blue-light/30 cursor-pointer" : "cursor-default",
                        ].join(" ")}
                      >
                        <span className={["inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full mb-1", today ? "bg-navy text-white" : inMonth ? "text-gray-700" : "text-gray-300"].join(" ")}>
                          {format(day, "d")}
                        </span>
                        <div className="space-y-0.5">
                          {(Object.entries(counts) as [PlanType, number][]).map(([type, count]) => (
                            <div key={type} className={`flex items-center gap-1 px-1 py-0.5 rounded text-[10px] font-medium ${PLAN_CONFIG[type].bg} ${PLAN_CONFIG[type].text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PLAN_CONFIG[type].dot}`} />
                              {PLAN_CONFIG[type].label} {count}
                            </div>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedDate && (
              <div className="w-80 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden self-start">
                <div className="flex items-center justify-between px-4 py-3 bg-navy text-white">
                  <div>
                    <p className="text-xs opacity-75">แผนงานวันที่</p>
                    <p className="font-semibold">{format(parseISO(selectedDate), "d MMMM yyyy", { locale: th })}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => exportDayToExcel(selectedDate, selectedEntries)} className="p-1.5 rounded hover:bg-white/20 transition-colors" title="ส่งออก Excel">
                      <Download className="w-4 h-4" />
                    </button>
                    <button onClick={() => setSelectedDate(null)} className="p-1.5 rounded hover:bg-white/20 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {selectedEntries.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-400 text-sm">ไม่มีแผนงานในวันนี้</div>
                ) : (
                  <>
                    <div className="px-4 py-2 border-b border-gray-100 flex gap-2 flex-wrap">
                      {(Object.entries(countByType(selectedEntries)) as [PlanType, number][]).map(([type, count]) => (
                        <span key={type} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_CONFIG[type].bg} ${PLAN_CONFIG[type].text}`}>
                          {PLAN_CONFIG[type].label}: {count}
                        </span>
                      ))}
                    </div>
                    <div className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto">
                      {selectedEntries.map((entry) => {
                        const cfg = PLAN_CONFIG[entry.planType];
                        return (
                          <div key={entry.userId} className="px-4 py-2.5 flex items-center gap-3">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{entry.firstName} {entry.lastName}</p>
                              <p className="text-xs text-gray-400 truncate">{entry.department?.name ?? "—"}</p>
                              {entry.note && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{entry.note}</p>}
                            </div>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TABLE VIEW ── */}
        {view === "table" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-gray-400">กำลังโหลด...</div>
            ) : tableDays.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm">ไม่มีข้อมูลในเดือนนี้</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {["วันที่", "ชื่อ-สกุล", "ตำแหน่ง", "หน่วยงาน", "ประเภทแผน", "หมายเหตุ", ""].map((h) => (
                        <th key={h} className="px-3 py-2.5 text-left text-[10px] text-slate-500 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableDays.map((day) => {
                      const dateStr = format(day, "yyyy-MM-dd");
                      const entries = data?.byDate[dateStr] ?? [];
                      return entries.map((entry, i) => {
                        const cfg = PLAN_CONFIG[entry.planType];
                        return (
                          <tr key={`${dateStr}-${entry.userId}`} className="border-t border-slate-50 hover:bg-slate-50">
                            {i === 0 ? (
                              <td rowSpan={entries.length} className="px-3 py-2.5 font-medium text-slate-700 whitespace-nowrap align-top border-r border-slate-100">
                                <div>{format(day, "dd/MM/yyyy")}</div>
                                <div className="text-[10px] text-slate-400 font-normal">{format(day, "EEEE", { locale: th })}</div>
                              </td>
                            ) : null}
                            <td className="px-3 py-2.5 text-slate-700">{entry.firstName} {entry.lastName}</td>
                            <td className="px-3 py-2.5 text-slate-500">{entry.position ?? "—"}</td>
                            <td className="px-3 py-2.5 text-slate-500">{entry.department?.name ?? "—"}</td>
                            <td className="px-3 py-2.5">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                            </td>
                            <td className="px-3 py-2.5 text-slate-500 max-w-[180px] truncate">{entry.note ?? "—"}</td>
                            {i === 0 ? (
                              <td rowSpan={entries.length} className="px-3 py-2.5 align-top border-l border-slate-100">
                                <button
                                  onClick={() => exportDayToExcel(dateStr, entries)}
                                  className="flex items-center gap-1 px-2 py-1 text-[10px] bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors whitespace-nowrap"
                                >
                                  <Download size={11} /> Excel
                                </button>
                              </td>
                            ) : null}
                          </tr>
                        );
                      });
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
