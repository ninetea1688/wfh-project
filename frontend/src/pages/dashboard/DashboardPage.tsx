import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { format, parseISO, isAfter, startOfToday } from "date-fns";
import { th } from "date-fns/locale";
import { toast } from "sonner";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Bell,
  CalendarDays,
  Home,
  Briefcase,
  CalendarOff,
  Building2,
  FileCheck,
  Paperclip,
  FileText,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { PlanType, DayPlan, getAttachmentUrl } from "@/services/workplan.service";
import { useAuthStore } from "@/stores/auth.store";
import {
  attendanceService,
  AttendanceRecord,
} from "@/services/attendance.service";
import { workplanService } from "@/services/workplan.service";

const PLAN_DASH: Record<
  PlanType,
  { label: string; bg: string; text: string; icon: React.ElementType }
> = {
  WFH: { label: "WFH", bg: "bg-blue-light", text: "text-navy", icon: Home },
  OFFICE: {
    label: "สำนักงาน",
    bg: "bg-green-50",
    text: "text-green-800",
    icon: Building2,
  },
  FIELD: {
    label: "ไปราชการ",
    bg: "bg-gold-light",
    text: "text-amber-800",
    icon: Briefcase,
  },
  LEAVE: {
    label: "ลา",
    bg: "bg-red-50",
    text: "text-red-700",
    icon: CalendarOff,
  },
};
import { formatThaiDate, formatTime, formatDuration } from "@/lib/utils";
import StaffLayout from "@/components/layout/StaffLayout";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [actualEditDate, setActualEditDate] = useState<string | null>(null);
  const [actualNoteText, setActualNoteText] = useState("");
  const [actualFiles, setActualFiles] = useState<File[]>([]);

  const { data: today, isLoading } = useQuery({
    queryKey: ["attendance", "today"],
    queryFn: () => attendanceService.getToday().then((r) => r.data.data),
  });

  const { data: historyData } = useQuery({
    queryKey: ["attendance", "history", { limit: 5 }],
    queryFn: () =>
      attendanceService.getHistory({ limit: 5 }).then((r) => r.data.data),
  });

  const todayDate = startOfToday();
  const weekKey = format(todayDate, "yyyy-MM-dd");

  const { data: weekData } = useQuery({
    queryKey: ["work-plans", "week", weekKey],
    queryFn: () => workplanService.getWeek(weekKey).then((r) => r.data.data),
  });

  const actualMutation = useMutation({
    mutationFn: ({ date, note, files }: { date: string; note: string | null; files?: File[] }) =>
      workplanService.logActual(date, note, files),
    onSuccess: () => {
      toast.success("บันทึกผลปฏิบัติงานสำเร็จ");
      queryClient.invalidateQueries({ queryKey: ["work-plans"] });
      setActualEditDate(null);
      setActualNoteText("");
      setActualFiles([]);
    },
    onError: () => toast.error("เกิดข้อผิดพลาด ไม่สามารถบันทึกได้"),
  });

  // Days in this week that are past + have a plan + missing actualNote
  const pendingActualDays: DayPlan[] = (weekData?.days ?? []).filter(
    (d) =>
      d.plan && !d.plan.actualNote && !isAfter(parseISO(d.date), todayDate),
  );

  const now = new Date();
  const { data: leaveSummary } = useQuery({
    queryKey: [
      "work-plans",
      "leave-summary",
      now.getFullYear(),
      now.getMonth() + 1,
    ],
    queryFn: () =>
      workplanService
        .getLeaveSummary(now.getFullYear(), now.getMonth() + 1)
        .then((r) => r.data.data),
  });

  const checkOutMutation = useMutation({
    mutationFn: attendanceService.checkOut,
    onSuccess: () => {
      toast.success("ลงชื่อออกงานสำเร็จ");
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "เกิดข้อผิดพลาด";
      toast.error(msg);
    },
  });

  const todayStr = formatThaiDate(new Date());
  const hasCheckedIn = !!today;
  const hasCheckedOut = !!today?.checkOutTime;

  // Checkout reminder — show toast + banner after 15:30 if checked in but not out
  const reminderShown = useRef(false);
  const [showReminder, setShowReminder] = useState(false);
  useEffect(() => {
    if (!hasCheckedIn || hasCheckedOut) {
      setShowReminder(false);
      return;
    }
    const check = () => {
      const now = new Date();
      const h = now.getHours(),
        m = now.getMinutes();
      if (h > 15 || (h === 15 && m >= 30)) {
        setShowReminder(true);
        if (!reminderShown.current) {
          reminderShown.current = true;
          toast.warning("อย่าลืมลงชื่อออกงาน (Check-out) ด้วยนะครับ", {
            duration: 8000,
            icon: "🔔",
          });
        }
      }
    };
    check();
    const interval = setInterval(check, 5 * 60 * 1000); // recheck every 5 min
    return () => clearInterval(interval);
  }, [hasCheckedIn, hasCheckedOut]);

  if (isLoading) {
    return (
      <StaffLayout>
        <div className="animate-pulse p-4 space-y-3">
          <div className="h-14 bg-slate-200 rounded-xl" />
          <div className="h-32 bg-slate-200 rounded-xl" />
          <div className="h-24 bg-slate-200 rounded-xl" />
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout>
      {/* Date Banner */}
      <div className="bg-blue px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-white/70 text-xs">วันที่ปัจจุบัน</p>
          <p className="text-white text-sm font-medium">{todayStr}</p>
        </div>
        {hasCheckedIn && (
          <span
            className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium ${
              hasCheckedOut
                ? "bg-blue-100 text-blue-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${hasCheckedOut ? "bg-blue-500" : "bg-green-500"}`}
            />
            {hasCheckedOut ? "สิ้นสุดงานแล้ว" : "Check-in แล้ว"}
          </span>
        )}
      </div>

      {/* Checkout reminder banner */}
      {showReminder && (
        <div className="mx-4 mt-3 bg-gold-light border border-gold/30 rounded-xl px-4 py-3 flex items-center gap-3">
          <Bell className="text-gold shrink-0" size={16} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-green-800">
              อย่าลืม Check-out!
            </p>
            <p className="text-[10px] text-green-700">
              คุณยังไม่ได้ลงชื่อออกงานวันนี้
            </p>
          </div>
          <button
            onClick={() => checkOutMutation.mutate()}
            disabled={checkOutMutation.isPending}
            className="shrink-0 px-3 py-1 text-[10px] font-medium bg-gold text-white rounded-lg hover:bg-gold/90 disabled:opacity-50"
          >
            Check-out เลย
          </button>
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Today status card */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-400 mb-3">สถานะวันนี้</p>
          {hasCheckedIn ? (
            <>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-lg font-semibold text-success">
                    {formatTime(today!.checkInTime)}
                  </p>
                  <p className="text-[9px] text-slate-400 mt-1">เวลาเข้างาน</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-lg font-semibold text-slate-400">
                    {today?.checkOutTime ? formatTime(today.checkOutTime) : "—"}
                  </p>
                  <p className="text-[9px] text-slate-400 mt-1">เวลาออกงาน</p>
                </div>
              </div>
              <div className="bg-blue-light rounded-lg px-3 py-2 text-xs text-navy mb-2">
                <span className="font-medium">ประเภท:</span>{" "}
                {today?.workType === "WFH"
                  ? "🏠 Work From Home (บ้าน)"
                  : today?.workType === "OFFICE"
                    ? "🏢 เข้าสำนักงาน"
                    : "🚗 ไปราชการ"}
              </div>
              {today?.taskDescription && (
                <p className="text-xs text-slate-500 leading-relaxed">
                  {today.taskDescription}
                </p>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <AlertCircle className="mx-auto text-amber-400 mb-2" size={32} />
              <p className="text-sm font-medium text-slate-600">
                ยังไม่ได้ลงชื่อวันนี้
              </p>
              <p className="text-xs text-slate-400 mt-1">
                กดปุ่มด้านล่างเพื่อลงชื่อเข้างาน
              </p>
            </div>
          )}
        </div>

        {/* Leave & work plan summary card */}
        {leaveSummary && (
          <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-slate-400">
                แผนงานเดือนนี้ ({format(now, "MMMM yyyy", { locale: th })})
              </p>
              <button
                onClick={() => navigate("/plan")}
                className="flex items-center gap-1 text-[10px] text-blue hover:underline"
              >
                <CalendarDays size={10} />
                วางแผน
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                {
                  label: "WFH",
                  value: leaveSummary.wfhDays,
                  icon: Home,
                  cls: "text-navy bg-blue-light",
                },
                {
                  label: "สำนักงาน",
                  value: leaveSummary.officeDays,
                  icon: Building2,
                  cls: "text-green-700 bg-green-50",
                },
                {
                  label: "ไปราชการ",
                  value: leaveSummary.fieldDays,
                  icon: Briefcase,
                  cls: "text-amber-700 bg-gold-light",
                },
                {
                  label: "ลา",
                  value: leaveSummary.leaveDays,
                  icon: CalendarOff,
                  cls: "text-red-600 bg-red-50",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`${item.cls} rounded-xl p-2 text-center`}
                >
                  <item.icon size={14} className="mx-auto mb-1" />
                  <p className="text-lg font-bold">{item.value}</p>
                  <p className="text-[9px] opacity-80">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending actual results card */}
        {pendingActualDays.length > 0 && (
          <div className="bg-white rounded-xl border border-amber-100 p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500 mb-3 flex items-center gap-1.5">
              <FileCheck size={13} className="text-amber-500" />
              ผลการปฏิบัติงานที่รอบันทึก
              <span className="ml-auto bg-amber-100 text-amber-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                {pendingActualDays.length} วัน
              </span>
            </p>
            <div className="space-y-2">
              {pendingActualDays.map((day) => {
                const cfg = PLAN_DASH[day.plan!.planType];
                const isEditing = actualEditDate === day.date;
                return (
                  <div
                    key={day.date}
                    className="border border-slate-100 rounded-xl overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <cfg.icon size={13} className={cfg.text} />
                        <div>
                          <p className="text-xs font-medium text-slate-700">
                            {format(parseISO(day.date), "EEEE d MMM", {
                              locale: th,
                            })}
                          </p>
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}
                          >
                            {cfg.label}
                            {day.plan?.note ? ` — ${day.plan.note}` : ""}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (isEditing) {
                            setActualEditDate(null);
                            setActualNoteText("");
                            setActualFiles([]);
                          } else {
                            setActualEditDate(day.date);
                            setActualNoteText(day.plan?.actualNote ?? "");
                          }
                        }}
                        className="shrink-0 text-[11px] font-medium px-3 py-1.5 rounded-lg bg-blue-light text-navy hover:bg-blue/10 transition-colors"
                      >
                        {isEditing ? "ยกเลิก" : "บันทึกผล"}
                      </button>
                    </div>

                    {isEditing && (
                      <div className="px-3 pb-3 space-y-2 border-t border-slate-50 bg-slate-50/60 pt-2.5">
                        <textarea
                          value={actualNoteText}
                          onChange={(e) => setActualNoteText(e.target.value)}
                          placeholder="สรุปผลการปฏิบัติงานที่ทำจริง เช่น จัดทำรายงาน, ประชุม..."
                          rows={3}
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue/30 resize-none"
                        />

                        {/* File picker */}
                        <div>
                          <label className="flex items-center justify-center gap-1.5 w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-[11px] text-slate-400 hover:border-blue/40 hover:text-blue cursor-pointer transition-colors bg-white">
                            <Paperclip size={12} />
                            แนบรูปภาพ / เอกสาร PDF (สูงสุด 5 ไฟล์)
                            <input
                              type="file"
                              accept="image/jpeg,image/png,application/pdf"
                              multiple
                              className="hidden"
                              onChange={(e) => {
                                const picked = Array.from(e.target.files ?? []);
                                setActualFiles((prev) =>
                                  [...prev, ...picked].slice(0, 5),
                                );
                                e.target.value = "";
                              }}
                            />
                          </label>
                          {actualFiles.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {actualFiles.map((f, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-1 bg-white border border-slate-200 rounded-md px-2 py-1 text-[10px] text-slate-600"
                                >
                                  {f.type === "application/pdf" ? (
                                    <FileText size={10} className="text-red-400 shrink-0" />
                                  ) : (
                                    <ImageIcon size={10} className="text-blue shrink-0" />
                                  )}
                                  <span className="max-w-[100px] truncate">{f.name}</span>
                                  <button
                                    onClick={() =>
                                      setActualFiles((prev) =>
                                        prev.filter((_, j) => j !== i),
                                      )
                                    }
                                    className="ml-0.5 text-slate-300 hover:text-danger"
                                  >
                                    <X size={10} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Existing attachments */}
                        {(day.plan?.attachments?.length ?? 0) > 0 && (
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-400">ไฟล์ที่แนบไว้แล้ว:</p>
                            {day.plan!.attachments!.map((att) => (
                              <a
                                key={att.id}
                                href={getAttachmentUrl(att.filePath)}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 text-[11px] text-blue hover:underline"
                              >
                                {att.mimeType === "application/pdf" ? (
                                  <FileText size={11} className="text-red-400 shrink-0" />
                                ) : (
                                  <ImageIcon size={11} className="text-blue shrink-0" />
                                )}
                                <span className="truncate">{att.fileName}</span>
                              </a>
                            ))}
                          </div>
                        )}

                        <button
                          onClick={() =>
                            actualMutation.mutate({
                              date: day.date,
                              note: actualNoteText || null,
                              files: actualFiles,
                            })
                          }
                          disabled={actualMutation.isPending}
                          className="w-full py-2 bg-success text-white rounded-lg text-xs font-medium hover:bg-success/90 disabled:opacity-60 flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 size={13} />
                          {actualMutation.isPending
                            ? "กำลังบันทึก..."
                            : "บันทึกผลการปฏิบัติงาน"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          {!hasCheckedIn ? (
            <button
              onClick={() => navigate("/checkin")}
              className="col-span-2 py-3 bg-success text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-success/90 transition-colors"
            >
              <CheckCircle2 size={18} />
              ลงชื่อเข้างาน (Check-in)
            </button>
          ) : !hasCheckedOut ? (
            <>
              <button
                onClick={() => checkOutMutation.mutate()}
                disabled={checkOutMutation.isPending}
                className="py-3 bg-navy text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-navy-light transition-colors disabled:opacity-70"
              >
                <Clock size={16} />
                Check-out
              </button>
              <button
                onClick={() => navigate("/history")}
                className="py-3 bg-white border-2 border-navy text-navy rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-blue-light transition-colors"
              >
                📋 ประวัติ
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate("/history")}
              className="col-span-2 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
            >
              📋 ดูประวัติการทำงาน
            </button>
          )}
        </div>

        {/* Recent history */}
        {historyData && historyData.records.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-600 mb-2">
              ประวัติล่าสุด
            </p>
            <div className="space-y-2">
              {historyData.records.map((rec: AttendanceRecord) => (
                <div
                  key={rec.id}
                  className="bg-white rounded-lg border border-slate-100 px-3 py-2.5 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-medium text-slate-700">
                      {formatThaiDate(rec.workDate)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {formatTime(rec.checkInTime)}{" "}
                      {rec.checkOutTime
                        ? `— ${formatTime(rec.checkOutTime)}`
                        : ""}
                    </p>
                  </div>
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
                        ? "🏢 สำนักงาน"
                        : "🚗 ไปราชการ"}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate("/history")}
              className="w-full mt-2 py-2 text-xs text-blue flex items-center justify-center gap-1 hover:underline"
            >
              ดูทั้งหมด <ChevronRight size={12} />
            </button>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
