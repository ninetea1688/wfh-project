import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  format,
  addWeeks,
  subWeeks,
  isAfter,
  isSameDay,
  parseISO,
  startOfToday,
} from "date-fns";
import { th } from "date-fns/locale";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Building2,
  Briefcase,
  CalendarOff,
  MapPin,
  CheckCircle2,
  ClipboardEdit,
  Trash2,
  Paperclip,
  FileText,
  Image as ImageIcon,
  X,
} from "lucide-react";
import StaffLayout from "@/components/layout/StaffLayout";
import {
  workplanService,
  PlanType,
  DayPlan,
  getAttachmentUrl,
} from "@/services/workplan.service";

const PLAN_CONFIG: Record<
  PlanType,
  {
    label: string;
    icon: React.ElementType;
    bg: string;
    text: string;
    border: string;
  }
> = {
  WFH: {
    label: "Work From Home",
    icon: Home,
    bg: "bg-blue-light",
    text: "text-navy",
    border: "border-blue/30",
  },
  OFFICE: {
    label: "เข้าสำนักงาน",
    icon: Building2,
    bg: "bg-green-50",
    text: "text-green-800",
    border: "border-green-200",
  },
  FIELD: {
    label: "ไปราชการ",
    icon: Briefcase,
    bg: "bg-gold-light",
    text: "text-green-800",
    border: "border-gold/30",
  },
  LEAVE: {
    label: "ลา",
    icon: CalendarOff,
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  ON_SITE: {
    label: "ออกปฏิบัติงานพื้นที่",
    icon: MapPin,
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },
};

const DAY_TH = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];

type EditState = {
  date: string;
  planType: PlanType;
  note: string;
  actualNote: string;
  mode: "plan" | "actual";
} | null;

export default function WeeklyPlanPage() {
  const queryClient = useQueryClient();
  const [refDate, setRefDate] = useState<Date>(new Date());
  const [editState, setEditState] = useState<EditState>(null);
  const [actualFiles, setActualFiles] = useState<File[]>([]);

  const weekKey = format(refDate, "yyyy-MM-dd");

  const { data, isLoading } = useQuery({
    queryKey: ["work-plans", "week", weekKey],
    queryFn: () => workplanService.getWeek(weekKey).then((r) => r.data.data),
  });

  const upsertMutation = useMutation({
    mutationFn: workplanService.upsert,
    onSuccess: () => {
      toast.success("บันทึกแผนปฏิบัติงานสำเร็จ");
      queryClient.invalidateQueries({ queryKey: ["work-plans"] });
      setEditState(null);
    },
    onError: () => toast.error("เกิดข้อผิดพลาด ไม่สามารถบันทึกได้"),
  });

  const deleteMutation = useMutation({
    mutationFn: workplanService.delete,
    onSuccess: () => {
      toast.success("ลบแผนสำเร็จ");
      queryClient.invalidateQueries({ queryKey: ["work-plans"] });
    },
    onError: () => toast.error("เกิดข้อผิดพลาด"),
  });

  const actualMutation = useMutation({
    mutationFn: ({ date, note, files }: { date: string; note: string | null; files?: File[] }) =>
      workplanService.logActual(date, note, files),
    onSuccess: () => {
      toast.success("บันทึกผลปฏิบัติงานสำเร็จ");
      queryClient.invalidateQueries({ queryKey: ["work-plans"] });
      setEditState(null);
      setActualFiles([]);
    },
    onError: () => toast.error("เกิดข้อผิดพลาด"),
  });

  const today = startOfToday();

  const handleOpenEdit = (day: DayPlan, mode: "plan" | "actual" = "plan") => {
    setEditState({
      date: day.date,
      planType: day.plan?.planType ?? "WFH",
      note: day.plan?.note ?? "",
      actualNote: day.plan?.actualNote ?? "",
      mode,
    });
  };

  const handleSave = () => {
    if (!editState) return;
    if (editState.mode === "plan") {
      upsertMutation.mutate({
        planDate: editState.date,
        planType: editState.planType,
        note: editState.note || null,
      });
    } else {
      actualMutation.mutate({
        date: editState.date,
        note: editState.actualNote || null,
        files: actualFiles,
      });
    }
  };

  if (isLoading) {
    return (
      <StaffLayout>
        <div className="animate-pulse p-4 space-y-3">
          <div className="h-10 bg-slate-200 rounded-xl" />
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-20 bg-slate-200 rounded-xl" />
          ))}
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout>
      {/* Week navigation */}
      <div className="bg-navy px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setRefDate((d) => subWeeks(d, 1))}
          className="p-1.5 text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/10"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <p className="text-white text-sm font-medium">สัปดาห์</p>
          {data && (
            <p className="text-white/70 text-[11px]">
              {format(parseISO(data.weekStart), "d MMM", { locale: th })} –{" "}
              {format(parseISO(data.weekEnd), "d MMM yyyy", { locale: th })}
            </p>
          )}
        </div>
        <button
          onClick={() => setRefDate((d) => addWeeks(d, 1))}
          className="p-1.5 text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/10"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="p-4 space-y-2">
        {data?.days.map((day, idx) => {
          const dateObj = parseISO(day.date);
          const isPast = isAfter(today, dateObj);
          const isToday = isSameDay(dateObj, today);
          const config = day.plan ? PLAN_CONFIG[day.plan.planType] : null;
          const ActualIcon = day.actual?.workType === "WFH" ? Home : Briefcase;

          return (
            <div
              key={day.date}
              className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
                isToday ? "border-blue" : "border-slate-100"
              }`}
            >
              {/* Day header */}
              <div
                className={`flex items-center justify-between px-3 py-2 ${
                  isToday ? "bg-blue text-white" : "bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-semibold w-6 text-center ${
                      isToday ? "text-white" : "text-slate-600"
                    }`}
                  >
                    {DAY_TH[idx]}
                  </span>
                  <span
                    className={`text-xs ${isToday ? "text-white/80" : "text-slate-400"}`}
                  >
                    {format(dateObj, "d MMM", { locale: th })}
                    {isToday && " (วันนี้)"}
                  </span>
                </div>

                <div className="flex gap-1">
                  {/* Edit plan button — only for today or future */}
                  {!isPast && (
                    <button
                      onClick={() => handleOpenEdit(day, "plan")}
                      className={`p-1 rounded transition-colors ${
                        isToday
                          ? "text-white/70 hover:text-white hover:bg-white/20"
                          : "text-slate-400 hover:text-navy hover:bg-blue-light"
                      }`}
                      title="วางแผน"
                    >
                      <ClipboardEdit size={13} />
                    </button>
                  )}

                  {/* Log actual — today and past days with a plan */}
                  {(isPast || isToday) && day.plan && (
                    <button
                      onClick={() => handleOpenEdit(day, "actual")}
                      className={`p-1 rounded transition-colors ${
                        isToday
                          ? "text-white/70 hover:text-white hover:bg-white/20"
                          : "text-slate-400 hover:text-success hover:bg-green-50"
                      }`}
                      title="บันทึกผลจริง"
                    >
                      <CheckCircle2 size={13} />
                    </button>
                  )}

                  {/* Past days can still set plan if missing */}
                  {isPast && !day.plan && (
                    <button
                      onClick={() => handleOpenEdit(day, "plan")}
                      className="p-1 rounded text-slate-300 hover:text-navy hover:bg-blue-light transition-colors"
                      title="เพิ่มแผน (ย้อนหลัง)"
                    >
                      <ClipboardEdit size={13} />
                    </button>
                  )}

                  {day.plan && !isPast && (
                    <button
                      onClick={() => deleteMutation.mutate(day.date)}
                      className={`p-1 rounded transition-colors ${
                        isToday
                          ? "text-white/50 hover:text-red-200 hover:bg-white/10"
                          : "text-slate-300 hover:text-danger hover:bg-red-50"
                      }`}
                      title="ลบแผน"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Day body */}
              <div className="px-3 py-2 space-y-1.5">
                {/* Plan */}
                {config ? (
                  <div
                    className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${config.bg} ${config.border}`}
                  >
                    <config.icon size={12} className={config.text} />
                    <span className={`text-[11px] font-medium ${config.text}`}>
                      {config.label}
                    </span>
                    {day.plan?.note && (
                      <span
                        className={`text-[10px] ${config.text} opacity-70 truncate`}
                      >
                        — {day.plan.note}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-300 italic">
                    — ยังไม่มีแผน —
                  </p>
                )}

                {/* Actual check-in */}
                {day.actual && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-2 py-1.5">
                    <ActualIcon size={12} className="text-success" />
                    <span className="text-[11px] text-green-700 font-medium">
                      ผลจริง:{" "}
                      {day.actual.workType === "WFH" ? "WFH" : "ไปราชการ"}
                    </span>
                    {day.actual.checkInTime && (
                      <span className="text-[10px] text-green-600">
                        {format(new Date(day.actual.checkInTime), "HH:mm")}
                      </span>
                    )}
                    {day.actual.status === "PRESENT" && (
                      <CheckCircle2
                        size={11}
                        className="text-success ml-auto"
                      />
                    )}
                  </div>
                )}

                {/* Actual note */}
                {day.plan?.actualNote && (
                  <p className="text-[10px] text-slate-500 bg-slate-50 rounded px-2 py-1">
                    📝 {day.plan.actualNote}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {/* Legend */}
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {(Object.keys(PLAN_CONFIG) as PlanType[]).map((key) => {
            const cfg = PLAN_CONFIG[key];
            return (
              <div
                key={key}
                className={`flex items-center gap-1.5 rounded-lg px-2 py-1 border text-[10px] ${cfg.bg} ${cfg.border} ${cfg.text}`}
              >
                <cfg.icon size={10} />
                {cfg.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Modal */}
      {editState && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="bg-white w-full max-w-[430px] rounded-t-2xl p-5 space-y-4 shadow-2xl">
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">
              {editState.mode === "plan"
                ? `วางแผน — ${format(parseISO(editState.date), "d MMMM yyyy", { locale: th })}`
                : `บันทึกผลจริง — ${format(parseISO(editState.date), "d MMMM yyyy", { locale: th })}`}
            </h3>

            {editState.mode === "plan" ? (
              <>
                {/* Plan type selector */}
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(PLAN_CONFIG) as PlanType[]).map((key) => {
                    const cfg = PLAN_CONFIG[key];
                    const selected = editState.planType === key;
                    return (
                      <button
                        key={key}
                        onClick={() =>
                          setEditState((s) => s && { ...s, planType: key })
                        }
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
                          selected
                            ? `${cfg.bg} ${cfg.border} ${cfg.text} border-solid`
                            : "border-slate-100 text-slate-500 hover:border-slate-200"
                        }`}
                      >
                        <cfg.icon size={14} />
                        <span className="text-xs font-medium">{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Note */}
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">
                    หมายเหตุ (ไม่บังคับ)
                  </label>
                  <textarea
                    rows={2}
                    value={editState.note}
                    onChange={(e) =>
                      setEditState((s) => s && { ...s, note: e.target.value })
                    }
                    placeholder="ระบุสถานที่, งานที่ทำ ฯลฯ"
                    maxLength={500}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue/30 resize-none"
                  />
                </div>
              </>
            ) : (
              /* Actual result note */
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">
                    สรุปผลการปฏิบัติงาน
                  </label>
                  <textarea
                    rows={4}
                    value={editState.actualNote}
                    onChange={(e) =>
                      setEditState(
                        (s) => s && { ...s, actualNote: e.target.value },
                      )
                    }
                    placeholder="ระบุผลงานที่ทำได้จริงในวันนั้น..."
                    maxLength={2000}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue/30 resize-none"
                  />
                </div>

                {/* File picker */}
                <div>
                  <label className="flex items-center justify-center gap-1.5 w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-400 hover:border-blue/40 hover:text-blue cursor-pointer transition-colors">
                    <Paperclip size={13} />
                    แนบรูปภาพ / PDF (สูงสุด 5 ไฟล์)
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
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {actualFiles.map((f, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 bg-white"
                        >
                          {f.type === "application/pdf" ? (
                            <FileText size={12} className="text-red-400 shrink-0" />
                          ) : (
                            <ImageIcon size={12} className="text-blue shrink-0" />
                          )}
                          <span className="max-w-[120px] truncate">{f.name}</span>
                          <button
                            onClick={() =>
                              setActualFiles((prev) =>
                                prev.filter((_, j) => j !== i),
                              )
                            }
                            className="text-slate-300 hover:text-danger ml-0.5"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Existing attachments */}
                {(() => {
                  const day = data?.days.find((d) => d.date === editState.date);
                  const atts = day?.plan?.attachments ?? [];
                  if (atts.length === 0) return null;
                  return (
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-400">ไฟล์ที่แนบไว้แล้ว:</p>
                      {atts.map((att) => (
                        <a
                          key={att.id}
                          href={getAttachmentUrl(att.filePath)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-xs text-blue hover:underline"
                        >
                          {att.mimeType === "application/pdf" ? (
                            <FileText size={12} className="text-red-400 shrink-0" />
                          ) : (
                            <ImageIcon size={12} className="text-blue shrink-0" />
                          )}
                          <span className="truncate">{att.fileName}</span>
                        </a>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setEditState(null)}
                className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={upsertMutation.isPending || actualMutation.isPending}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-navy rounded-xl hover:bg-blue transition-colors disabled:opacity-50"
              >
                {upsertMutation.isPending || actualMutation.isPending
                  ? "กำลังบันทึก..."
                  : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </StaffLayout>
  );
}
