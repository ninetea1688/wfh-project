import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth.store'

const schema = z.object({
  username: z.string().min(1, 'กรุณากรอกชื่อผู้ใช้งาน'),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [showPass, setShowPass] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authService.login(data)
      const { token, user } = res.data.data as { token: string; user: ReturnType<typeof useAuthStore.getState>['user'] }
      login(token, user!)
      toast.success(`ยินดีต้อนรับ ${user?.firstName}`)
      if (user?.role === 'ADMIN') navigate('/admin/dashboard')
      else navigate('/dashboard')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'เกิดข้อผิดพลาด กรุณาลองใหม่'
      toast.error(msg)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #1B3F8B 0%, #234A9E 55%, #2E5EAA 100%)' }}>
      {/* Hero */}
      <div className="px-6 pt-14 pb-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center mx-auto mb-4 text-3xl">
          🏛️
        </div>
        <h1 className="text-white text-xl font-semibold mb-1">ระบบลงชื่อปฏิบัติงาน</h1>
        <p className="text-white/60 text-sm">Work From Home Online System</p>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-t-3xl flex-1 px-6 pt-7 pb-8">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              ชื่อผู้ใช้งาน (Username)
            </label>
            <input
              {...register('username')}
              autoComplete="username"
              placeholder="กรอกชื่อผู้ใช้งาน"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
            />
            {errors.username && (
              <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>
            )}
          </div>

          <div className="mb-5">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="กรอกรหัสผ่าน"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-navy text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-70 hover:bg-navy-light transition-colors"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            เข้าสู่ระบบ
          </button>

          <p className="text-center text-xs text-blue mt-4">
            ลืมรหัสผ่าน? ติดต่อผู้ดูแลระบบ
          </p>
        </form>

        <div className="mt-8 pt-5 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">สำนักงาน / หน่วยงาน</p>
          <p className="text-[10px] text-slate-300 mt-1">v1.0.0 · สงวนสิทธิ์</p>
        </div>
      </div>
    </div>
  )
}
