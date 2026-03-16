import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff, User } from 'lucide-react'
import StaffLayout from '@/components/layout/StaffLayout'
import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/services/auth.service'

const pwSchema = z
  .object({
    currentPassword: z.string().min(1, 'จำเป็น'),
    newPassword: z.string().min(8, 'อย่างน้อย 8 ตัวอักษร'),
    confirmPassword: z.string().min(1, 'จำเป็น'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'รหัสผ่านไม่ตรงกัน',
  })
type PwForm = z.infer<typeof pwSchema>

export default function ProfilePage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PwForm>({ resolver: zodResolver(pwSchema) })

  const changePwMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authService.changePassword(data.currentPassword, data.newPassword),
    onSuccess: () => {
      toast.success('เปลี่ยนรหัสผ่านสำเร็จ')
      reset()
      qc.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err.response?.data?.error ?? 'เกิดข้อผิดพลาด')
    },
  })

  function onSubmit(data: PwForm) {
    changePwMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    })
  }

  const isAdmin = user?.role === 'ADMIN'

  return (
    <StaffLayout>
      <div className="space-y-4 pb-6">
        {/* Profile card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="h-16 bg-gradient-to-r from-navy to-blue" />
          <div className="px-4 pb-4">
            <div className="-mt-8 flex items-end gap-3 mb-3">
              <div className="w-16 h-16 rounded-full bg-blue-light border-4 border-white flex items-center justify-center shadow-sm">
                <User size={28} className="text-navy" />
              </div>
              <div className="pb-1">
                <h2 className="font-semibold text-slate-800 leading-tight">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-xs text-slate-500">@{user?.username}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'รหัสพนักงาน', value: user?.employeeCode ?? '—' },
                { label: 'ตำแหน่ง', value: user?.position ?? '—' },
                { label: 'หน่วยงาน', value: user?.department?.name ?? '—' },
                { label: 'สิทธิ์การใช้งาน', value: user?.role ?? '—' },
              ].map((field) => (
                <div key={field.label} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] text-slate-400 mb-0.5">{field.label}</p>
                  <p className="text-xs font-medium text-slate-700">{field.value}</p>
                </div>
              ))}
            </div>

            {isAdmin && (
              <div className="mt-3">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-navy/10 text-navy rounded-full text-[10px] font-medium">
                  สิทธิ์ผู้ดูแลระบบ
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Change password */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">เปลี่ยนรหัสผ่าน</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            {(
              [
                { name: 'currentPassword' as const, label: 'รหัสผ่านปัจจุบัน', show: showCurrent, toggle: () => setShowCurrent(!showCurrent) },
                { name: 'newPassword' as const, label: 'รหัสผ่านใหม่', show: showNew, toggle: () => setShowNew(!showNew) },
                { name: 'confirmPassword' as const, label: 'ยืนยันรหัสผ่านใหม่', show: showConfirm, toggle: () => setShowConfirm(!showConfirm) },
              ]
            ).map((f) => (
              <div key={f.name}>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">{f.label}</label>
                <div className="relative">
                  <input
                    {...register(f.name)}
                    type={f.show ? 'text' : 'password'}
                    className="w-full px-3 py-2.5 pr-10 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy/20"
                  />
                  <button
                    type="button"
                    onClick={f.toggle}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {f.show ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors[f.name] && (
                  <p className="text-[11px] text-danger mt-1">{errors[f.name]?.message}</p>
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={changePwMutation.isPending}
              className="w-full py-2.5 text-sm font-medium bg-navy text-white rounded-xl hover:bg-blue disabled:opacity-50 transition-colors mt-2"
            >
              {changePwMutation.isPending ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}
            </button>
          </form>
        </div>
      </div>
    </StaffLayout>
  )
}
