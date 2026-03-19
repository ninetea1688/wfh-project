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
} from "date-fns";
import { th } from "date-fns/locale";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
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
};

const DOT_COLORS: Record<PlanType, string> = {
  WFH: "bg-blue-500",
  OFFICE: "bg-green-500",
  FIELD: "bg-amber-500",
  LEAVE: "bg-red-500",
};

export default function AdminPlanCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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

  // Count by planType for a date
  const countByType = (entries: AdminDayPlanEntry[]) => {
    const counts: Partial<Record<PlanType, number>> = {};
    for (const e of entries) {
      counts[e.planType] = (counts[e.planType] ?? 0) + 1;
    }
    return counts;
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-navy">แผนการปฏิบัติงาน</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              สรุปแผนงานของบุคลากรทั้งหมด รายเดือน
            </p>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-3 flex-wrap justify-end">
            {(
              Object.entries(PLAN_CONFIG) as [
                PlanType,
                typeof PLAN_CONFIG.WFH,
              ][]
            ).map(([type, cfg]) => (
              <span
                key={type}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
              >
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            ))}
          </div>
        </div>

        {/* Month navigation */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-lg hover:bg-blue-light transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-navy" />
          </button>
          <h2 className="text-lg font-semibold text-navy w-52 text-center">
            {format(currentMonth, "MMMM yyyy", { locale: th })}
          </h2>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-lg hover:bg-blue-light transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-navy" />
          </button>
        </div>

        <div className="flex gap-6">
          {/* Calendar grid */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-gray-100">
              {["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."].map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide"
                >
                  {day}
                </div>
              ))}
            </div>

            {isLoading ? (
              <div className="h-96 flex items-center justify-center text-gray-400">
                กำลังโหลด...
              </div>
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
                      onClick={() =>
                        setSelectedDate(isSelected ? null : dateStr)
                      }
                      className={[
                        "min-h-[88px] p-1.5 border-b border-r border-gray-50 text-left transition-colors",
                        inMonth ? "bg-white" : "bg-gray-50/60",
                        isSelected ? "ring-2 ring-inset ring-navy" : "",
                        entries.length > 0 && inMonth
                          ? "hover:bg-blue-light/30 cursor-pointer"
                          : "cursor-default",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full mb-1",
                          today
                            ? "bg-navy text-white"
                            : inMonth
                              ? "text-gray-700"
                              : "text-gray-300",
                        ].join(" ")}
                      >
                        {format(day, "d")}
                      </span>

                      {/* Plan badges */}
                      <div className="space-y-0.5">
                        {(Object.entries(counts) as [PlanType, number][]).map(
                          ([type, count]) => (
                            <div
                              key={type}
                              className={`flex items-center gap-1 px-1 py-0.5 rounded text-[10px] font-medium ${PLAN_CONFIG[type].bg} ${PLAN_CONFIG[type].text}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${DOT_COLORS[type]}`}
                              />
                              <span>
                                {PLAN_CONFIG[type].label} {count}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selectedDate && (
            <div className="w-80 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden self-start">
              <div className="flex items-center justify-between px-4 py-3 bg-navy text-white">
                <div>
                  <p className="text-xs opacity-75">แผนงานวันที่</p>
                  <p className="font-semibold">
                    {format(parseISO(selectedDate), "d MMMM yyyy", {
                      locale: th,
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-1 rounded hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {selectedEntries.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-400 text-sm">
                  ไม่มีแผนงานในวันนี้
                </div>
              ) : (
                <>
                  {/* Summary row */}
                  <div className="px-4 py-2 border-b border-gray-100 flex gap-2 flex-wrap">
                    {(
                      Object.entries(countByType(selectedEntries)) as [
                        PlanType,
                        number,
                      ][]
                    ).map(([type, count]) => (
                      <span
                        key={type}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_CONFIG[type].bg} ${PLAN_CONFIG[type].text}`}
                      >
                        {PLAN_CONFIG[type].label}: {count}
                      </span>
                    ))}
                  </div>

                  {/* Staff list */}
                  <div className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto">
                    {selectedEntries.map((entry) => {
                      const cfg = PLAN_CONFIG[entry.planType];
                      return (
                        <div
                          key={entry.userId}
                          className="px-4 py-2.5 flex items-center gap-3"
                        >
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {entry.firstName} {entry.lastName}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {entry.department?.name ?? "—"}
                            </p>
                            {entry.note && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                {entry.note}
                              </p>
                            )}
                          </div>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.bg} ${cfg.text}`}
                          >
                            {cfg.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
