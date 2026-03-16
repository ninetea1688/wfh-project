import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Users, UserCheck, UserX, Home, Briefcase } from 'lucide-react'
import AdminLayout from '@/components/layout/AdminLayout'
import { reportsService } from '@/services/admin.service'

interface DashboardData {
  today: {
    checkedIn: number
    wfhCount: number
    fieldCount: number
    notCheckedIn: number
    total: number
  }
  recentCheckins: Array<{
    id: number
    workType: string
    checkInTime: string
    user: { firstName: string; lastName: string; department: { name: string } | null }
  }>
  notCheckedInUsers: Array<{
    id: number
    firstName: string
    lastName: string
    position: string | null
    department: { name: string } | null
  }>
  weeklyChart: Array<{ date: string; WFH: number; FIELD: number }>
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => reportsService.getDashboard().then((r) => r.data.data as DashboardData),
    refetchInterval: 60000, // Refresh every minute
  })

  const today = data?.today

  const statCards = [
    {
      label: 'ลงชื่อวันนี้',
      value: today?.checkedIn ?? 0,
      color: 'text-success',
      badge: `จากทั้งหมด ${today?.total ?? 0} คน`,
      badgeCls: 'bg-green-50 text-green-700',
      icon: UserCheck,
    },
    {
      label: 'ยังไม่ลงชื่อ',
      value: today?.notCheckedIn ?? 0,
      color: 'text-danger',
      badge: `จากทั้งหมด ${today?.total ?? 0} คน`,
      badgeCls: 'bg-red-50 text-red-700',
      icon: UserX,
    },
    {
      label: 'Work From Home',
      value: today?.wfhCount ?? 0,
      color: 'text-blue',
      badge: today?.checkedIn ? `${Math.round((today.wfhCount / today.checkedIn) * 100)}% ของวันนี้` : '0%',
      badgeCls: 'bg-blue-light text-navy',
      icon: Home,
    },
    {
      label: 'ออกราชการ',
      value: today?.fieldCount ?? 0,
      color: 'text-gold',
      badge: today?.checkedIn ? `${Math.round((today.fieldCount / today.checkedIn) * 100)}% ของวันนี้` : '0%',
      badgeCls: 'bg-gold-light text-green-800',
      icon: Briefcase,
    },
  ]

  const maxBarValue = Math.max(...(data?.weeklyChart.map((d) => d.WFH + d.FIELD) ?? [1]))

  return (
    <AdminLayout>
      <div className="space-y-4">
        <h1 className="text-base font-semibold text-slate-800">
          ภาพรวมระบบ — วันที่ {format(new Date(), 'dd MMMM yyyy')}
        </h1>

        {/* Stat Cards */}
        {isLoading ? (
          <div className="grid grid-cols-4 gap-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-slate-200 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {statCards.map((card) => (
              <div key={card.label} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs text-slate-400">{card.label}</p>
                  <card.icon size={16} className="text-slate-300" />
                </div>
                <p className={`text-3xl font-semibold ${card.color}`}>{card.value}</p>
                <span className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full ${card.badgeCls}`}>
                  {card.badge}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Charts row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Bar Chart */}
          <div className="md:col-span-2 bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-600 mb-4">สรุปรายสัปดาห์ (จำนวนการลงชื่อ)</h3>
            {data?.weeklyChart && (
              <div className="flex items-end gap-2 h-20">
                {data.weeklyChart.map((day) => {
                  const total = day.WFH + day.FIELD
                  const height = maxBarValue > 0 ? (total / maxBarValue) * 100 : 0
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex-1 flex items-end">
                        <div
                          className="w-full bg-blue rounded-sm transition-all duration-500"
                          style={{ height: `${height}%`, minHeight: total > 0 ? '4px' : '0' }}
                          title={`${format(new Date(day.date), 'dd/MM')}: WFH=${day.WFH}, ราชการ=${day.FIELD}`}
                        />
                      </div>
                      <span className="text-[8px] text-slate-400">{format(new Date(day.date), 'dd')}</span>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="flex gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue" />
                <span className="text-[10px] text-slate-500">WFH</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-gold" />
                <span className="text-[10px] text-slate-500">ออกราชการ</span>
              </div>
            </div>
          </div>

          {/* Donut summary */}
          <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-600 mb-4">สัดส่วนวันนี้</h3>
            {today && (
              <div className="space-y-2">
                {[
                  { label: 'WFH', value: today.wfhCount, color: 'bg-blue' },
                  { label: 'ราชการ', value: today.fieldCount, color: 'bg-gold' },
                  { label: 'ไม่ลงชื่อ', value: today.notCheckedIn, color: 'bg-danger' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${item.color}`} />
                      <span className="text-xs text-slate-600">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full`}
                          style={{ width: today.total > 0 ? `${(item.value / today.total) * 100}%` : '0%' }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-700 w-6 text-right">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Not checked in table */}
        {data?.notCheckedInUsers && data.notCheckedInUsers.length > 0 && (
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-700">
                รายชื่อยังไม่ลงชื่อวันนี้ ({today?.notCheckedIn} คน)
              </h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-2.5 text-left text-[10px] text-slate-500 font-medium">ชื่อ-สกุล</th>
                  <th className="px-4 py-2.5 text-left text-[10px] text-slate-500 font-medium">ตำแหน่ง</th>
                  <th className="px-4 py-2.5 text-left text-[10px] text-slate-500 font-medium">หน่วยงาน</th>
                </tr>
              </thead>
              <tbody>
                {data.notCheckedInUsers.map((u) => (
                  <tr key={u.id} className="border-t border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-xs font-medium text-slate-700">
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">{u.position ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">{u.department?.name ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
