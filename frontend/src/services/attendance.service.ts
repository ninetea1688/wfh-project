import api from '@/lib/api'

export interface CheckInPayload {
  workType: 'WFH' | 'FIELD'
  taskDescription: string
  latitude?: number | null
  longitude?: number | null
  locationName?: string | null
}

export interface AttendanceRecord {
  id: number
  userId: number
  workDate: string
  workType: 'WFH' | 'FIELD'
  checkInTime: string
  checkOutTime: string | null
  taskDescription: string | null
  latitude: number | null
  longitude: number | null
  locationName: string | null
  status: 'PRESENT' | 'INCOMPLETE'
  images: { id: number; filePath: string; fileName: string }[]
  user?: { firstName: string; lastName: string; employeeCode: string }
}

export const attendanceService = {
  checkIn: (payload: CheckInPayload) =>
    api.post<{ success: boolean; data: AttendanceRecord }>('/attendance/checkin', payload),

  checkOut: () =>
    api.patch<{ success: boolean; data: AttendanceRecord }>('/attendance/checkout'),

  getToday: () =>
    api.get<{ success: boolean; data: AttendanceRecord | null }>('/attendance/today'),

  getHistory: (params?: { from?: string; to?: string; type?: string; page?: number; limit?: number }) =>
    api.get<{ success: boolean; data: { records: AttendanceRecord[]; total: number; totalPages: number } }>(
      '/attendance/history',
      { params }
    ),

  getById: (id: number) =>
    api.get<{ success: boolean; data: AttendanceRecord }>(`/attendance/${id}`),

  uploadImages: (id: number, files: File[]) => {
    const form = new FormData()
    files.forEach((f) => form.append('images', f))
    return api.post(`/attendance/${id}/images`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
