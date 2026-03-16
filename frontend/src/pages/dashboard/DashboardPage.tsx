import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { toast } from 'sonner'
import { Clock, CheckCircle2, AlertCircle, ChevronRight, Bell } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { attendanceService, AttendanceRecord } from '@/services/attendance.service'
import { formatThaiDate, formatTime, formatDuration } from '@/lib/utils'
import StaffLayout from '@/components/layout/StaffLayout'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: today, isLoading } = useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: () => attendanceService.getToday().then((r) => r.data.data),
  })

  const { data: historyData } = useQuery({
    queryKey: ['attendance', 'history', { limit: 5 }],
    queryFn: () => attendanceService.getHistory({ limit: 5 }).then((r) => r.data.data),
  })

  const checkOutMutation = useMutation({
    mutationFn: attendanceService.checkOut,
    onSuccess: () => {
      toast.success('ลงชื่อออกงานสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'เกิดข้อผิดพลาด'
      toast.error(msg)
    },
  })

  const todayStr = formatThaiDate(new Date())
  const hasCheckedIn = !!today
  const hasCheckedOut = !!today?.checkOutTime

  // Checkout reminder — show toast + banner after 15:30 if checked in but not out
  const reminderShown = useRef(false)
  const [showReminder, setShowReminder] = useState(false)
  useEffect(() => {
    if (!hasCheckedIn || hasCheckedOut) { setShowReminder(false); return }
    const check = () => {
      const now = new Date()
      const h = now.getHours(), m = now.getMinutes()
      if (h > 15 || (h === 15 && m >= 30)) {
        setShowReminder(true)
        if (!reminderShown.current) {
          reminderShown.current = true
          toast.warning('อย่าลืมลงชื่อออกงาน (Check-out) ด้วยนะครับ', {
            duration: 8000,
            icon: '🔔',
          })
        }
      }
    }
    check()
    const interval = setInterval(check, 5 * 60 * 1000) // recheck every 5 min
    return () => clearInterval(interval)
  }, [hasCheckedIn, hasCheckedOut])

  if (isLoading) {
    return (
      <StaffLayout>
        <div className="animate-pulse p-4 space-y-3">
          <div className="h-14 bg-slate-200 rounded-xl" />
          <div className="h-32 bg-slate-200 rounded-xl" />
          <div className="h-24 bg-slate-200 rounded-xl" />
        </div>
      </StaffLayout>
    )
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
          <span className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium ${
            hasCheckedOut ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${hasCheckedOut ? 'bg-blue-500' : 'bg-green-500'}`} />
            {hasCheckedOut ? 'สิ้นสุดงานแล้ว' : 'Check-in แล้ว'}
          </span>
        )}
      </div>

      {/* Checkout reminder banner */}
      {showReminder && (
        <div className="mx-4 mt-3 bg-gold-light border border-gold/30 rounded-xl px-4 py-3 flex items-center gap-3">
          <Bell className="text-gold shrink-0" size={16} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-green-800">อย่าลืม Check-out!</p>
            <p className="text-[10px] text-green-700">คุณยังไม่ได้ลงชื่อออกงานวันนี้</p>
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
                  <p className="text-lg font-semibold text-success">{formatTime(today!.checkInTime)}</p>
                  <p className="text-[9px] text-slate-400 mt-1">เวลาเข้างาน</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-lg font-semibold text-slate-400">
                    {today?.checkOutTime ? formatTime(today.checkOutTime) : '—'}
                  </p>
                  <p className="text-[9px] text-slate-400 mt-1">เวลาออกงาน</p>
                </div>
              </div>
              <div className="bg-blue-light rounded-lg px-3 py-2 text-xs text-navy mb-2">
                <span className="font-medium">ประเภท:</span>{' '}
                {today?.workType === 'WFH' ? '🏠 Work From Home (บ้าน)' : '🚗 ออกปฏิบัติราชการ'}
              </div>
              {today?.taskDescription && (
                <p className="text-xs text-slate-500 leading-relaxed">{today.taskDescription}</p>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <AlertCircle className="mx-auto text-amber-400 mb-2" size={32} />
              <p className="text-sm font-medium text-slate-600">ยังไม่ได้ลงชื่อวันนี้</p>
              <p className="text-xs text-slate-400 mt-1">กดปุ่มด้านล่างเพื่อลงชื่อเข้างาน</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          {!hasCheckedIn ? (
            <button
              onClick={() => navigate('/checkin')}
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
                onClick={() => navigate('/history')}
                className="py-3 bg-white border-2 border-navy text-navy rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-blue-light transition-colors"
              >
                📋 ประวัติ
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/history')}
              className="col-span-2 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
            >
              📋 ดูประวัติการทำงาน
            </button>
          )}
        </div>

        {/* Recent history */}
        {historyData && historyData.records.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-600 mb-2">ประวัติล่าสุด</p>
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
                      {formatTime(rec.checkInTime)} {rec.checkOutTime ? `— ${formatTime(rec.checkOutTime)}` : ''}
                    </p>
                  </div>
                  <span className={`text-[9px] font-medium px-2 py-1 rounded-full ${
                    rec.workType === 'WFH'
                      ? 'bg-blue-light text-navy'
                      : 'bg-gold-light text-green-800'
                  }`}>
                    {rec.workType === 'WFH' ? '🏠 WFH' : '🚗 ราชการ'}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/history')}
              className="w-full mt-2 py-2 text-xs text-blue flex items-center justify-center gap-1 hover:underline"
            >
              ดูทั้งหมด <ChevronRight size={12} />
            </button>
          </div>
        )}
      </div>
    </StaffLayout>
  )
}
