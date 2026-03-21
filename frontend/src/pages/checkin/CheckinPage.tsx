import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { MapPin, Camera, Loader2, CheckCircle, X } from "lucide-react";
import StaffLayout from "@/components/layout/StaffLayout";
import { attendanceService } from "@/services/attendance.service";
import { useGeolocation } from "@/hooks/useGeolocation";
import { formatThaiDate, formatTime } from "@/lib/utils";

const schema = z.object({
  workType: z.enum(["WFH", "OFFICE", "FIELD", "ON_SITE"]),
  taskDescription: z.string().min(5, "กรุณาระบุภารกิจอย่างน้อย 5 ตัวอักษร"),
});
type FormData = z.infer<typeof schema>;

const MAX_FILES = 3;
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export default function CheckinPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const gps = useGeolocation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const { data: todayData } = useQuery({
    queryKey: ["attendance", "today"],
    queryFn: () => attendanceService.getToday().then((r) => r.data.data),
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { workType: "WFH", taskDescription: "" },
  });

  const workType = watch("workType");

  const checkInMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await attendanceService.checkIn({
        ...data,
        latitude: gps.latitude,
        longitude: gps.longitude,
        locationName: gps.latitude
          ? `${gps.latitude.toFixed(4)}° N, ${gps.longitude?.toFixed(4)}° E`
          : undefined,
      });
      // Upload images if any
      if (selectedFiles.length > 0 && res.data.data) {
        await attendanceService.uploadImages(res.data.data.id, selectedFiles);
      }
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("ลงชื่อเข้างานสำเร็จ! 🎉");
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      navigate("/dashboard");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "เกิดข้อผิดพลาด";
      toast.error(msg);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const valid = files.filter((f) => {
      if (!["image/jpeg", "image/png"].includes(f.type)) {
        toast.error(`${f.name}: รองรับเฉพาะ JPEG และ PNG`);
        return false;
      }
      if (f.size > MAX_SIZE) {
        toast.error(`${f.name}: ไฟล์ใหญ่เกิน 5MB`);
        return false;
      }
      return true;
    });
    const newFiles = [...selectedFiles, ...valid].slice(0, MAX_FILES);
    setSelectedFiles(newFiles);
    setPreviewUrls(newFiles.map((f) => URL.createObjectURL(f)));
  };

  const removeFile = (idx: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== idx);
    setSelectedFiles(newFiles);
    setPreviewUrls(newFiles.map((f) => URL.createObjectURL(f)));
  };

  if (todayData) {
    return (
      <StaffLayout>
        <div className="p-6 text-center">
          <CheckCircle className="mx-auto text-success mb-3" size={48} />
          <h2 className="text-lg font-semibold text-slate-700 mb-2">
            ลงชื่อแล้ววันนี้
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            เข้างาน {formatTime(todayData.checkInTime)} ·{" "}
            {todayData.workType === "WFH"
              ? "🏠 WFH"
              : todayData.workType === "OFFICE"
                ? "🏢 เข้าสำนักงาน"
                : "🚗 ไปราชการ"}
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-2 bg-navy text-white rounded-lg text-sm"
          >
            กลับหน้าหลัก
          </button>
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout>
      <div className="bg-navy px-4 py-3 pb-5">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle size={16} color="white" />
          <span className="text-white text-sm font-medium">
            ลงชื่อปฏิบัติงาน
          </span>
        </div>
        <p className="text-white/60 text-xs">
          {formatThaiDate(new Date())} · {formatTime(new Date())}
        </p>
      </div>

      <form
        onSubmit={handleSubmit((d) => checkInMutation.mutate(d))}
        className="pb-6"
      >
        {/* Time card */}
        <div className="mx-4 -mt-3 bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-xs text-slate-400">เวลาปัจจุบัน</p>
              <p className="text-2xl font-semibold text-slate-800">
                {formatTime(new Date())}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">สถานะ</p>
              <p className="text-xs text-success mt-1">
                <span className="w-2 h-2 bg-success rounded-full inline-block mr-1" />
                พร้อมลงชื่อ
              </p>
            </div>
          </div>
        </div>

        {/* Work type */}
        <p className="text-xs font-medium text-slate-700 mx-4 mb-2">
          ประเภทการปฏิบัติงาน
        </p>
        <div className="grid grid-cols-2 gap-3 mx-4 mb-4">
          {(["WFH", "OFFICE", "ON_SITE", "FIELD"] as const).map((type) => {
            const cfg = {
              WFH:     { icon: "🏠", label: "Work From Home" },
              OFFICE:  { icon: "🏢", label: "เข้าสำนักงาน" },
              ON_SITE: { icon: "📍", label: "ออกปฏิบัติงานพื้นที่" },
              FIELD:   { icon: "🚗", label: "ไปราชการ" },
            }[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => setValue("workType", type)}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  workType === type
                    ? "border-blue bg-blue-light"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="text-xl mb-1">{cfg.icon}</div>
                <div
                  className={`text-xs font-medium ${workType === type ? "text-navy" : "text-slate-500"}`}
                >
                  {cfg.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* GPS Status */}
        <div className="mx-4 mb-4 bg-white rounded-xl border border-slate-100 p-3 flex items-center gap-2">
          <MapPin
            size={14}
            className={gps.latitude ? "text-success" : "text-slate-400"}
          />
          {gps.loading ? (
            <span className="text-xs text-slate-400">กำลังค้นหาพิกัด...</span>
          ) : gps.latitude ? (
            <span className="text-xs text-slate-600 flex-1">
              {gps.latitude.toFixed(4)}° N, {gps.longitude?.toFixed(4)}° E
            </span>
          ) : (
            <span className="text-xs text-slate-400 flex-1">
              {gps.error ?? "ไม่พบพิกัด GPS"}
            </span>
          )}
          {gps.latitude && (
            <span className="text-xs text-success font-medium">ตรวจพบ GPS</span>
          )}
        </div>

        {/* Task description */}
        <p className="text-xs font-medium text-slate-700 mx-4 mb-2">
          รายละเอียดภารกิจ <span className="text-danger">*</span>
        </p>
        <div className="mx-4 mb-1 bg-white rounded-xl border border-slate-200">
          <textarea
            {...register("taskDescription")}
            placeholder="ระบุงานที่จะปฏิบัติวันนี้..."
            rows={4}
            className="w-full px-3 py-2.5 text-sm text-slate-700 bg-transparent border-none rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue"
          />
        </div>
        {errors.taskDescription && (
          <p className="text-xs text-danger mx-4 mb-3">
            {errors.taskDescription.message}
          </p>
        )}

        {/* Image upload */}
        <div className="mx-4 mb-4">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          {selectedFiles.length < MAX_FILES && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-white hover:border-blue transition-colors"
            >
              <Camera size={22} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs text-slate-400">
                แนบรูปภาพหลักฐาน (ไม่เกิน {MAX_FILES} รูป)
              </p>
              <p className="text-[10px] text-slate-300 mt-1">
                JPEG / PNG · ไม่เกิน 5MB
              </p>
            </button>
          )}

          {previewUrls.length > 0 && (
            <div className="flex gap-2 mt-2">
              {previewUrls.map((url, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={url}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover border border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-danger text-white rounded-full flex items-center justify-center"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="mx-4">
          <button
            type="submit"
            disabled={isSubmitting || checkInMutation.isPending}
            className="w-full py-3.5 bg-success text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isSubmitting || checkInMutation.isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <CheckCircle size={18} />
            )}
            ลงชื่อเข้างาน (Check-in)
          </button>
        </div>
      </form>
    </StaffLayout>
  );
}
