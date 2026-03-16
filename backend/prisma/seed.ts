import { PrismaClient, Role, WorkType, AttendanceStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Departments
  const deptIT = await prisma.department.upsert({
    where: { code: 'IT' },
    update: {},
    create: { name: 'กลุ่มงานเทคโนโลยีสารสนเทศ', code: 'IT' },
  })
  const deptPlan = await prisma.department.upsert({
    where: { code: 'PLAN' },
    update: {},
    create: { name: 'ฝ่ายแผนงาน', code: 'PLAN' },
  })
  const deptAdmin = await prisma.department.upsert({
    where: { code: 'ADMIN' },
    update: {},
    create: { name: 'สำนักอำนวยการ', code: 'ADMIN' },
  })

  console.log('✅ Departments created')

  // Admin user
  const adminHash = await bcrypt.hash('Admin@1234', 12)
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      employeeCode: 'EMP000',
      username: 'admin',
      passwordHash: adminHash,
      firstName: 'ผู้ดูแล',
      lastName: 'ระบบ',
      role: Role.ADMIN,
      position: 'ผู้ดูแลระบบ',
      departmentId: deptAdmin.id,
    },
  })

  // Staff users
  const staffHash = await bcrypt.hash('Staff@1234', 12)

  const staff001 = await prisma.user.upsert({
    where: { username: 'staff001' },
    update: {},
    create: {
      employeeCode: 'EMP001',
      username: 'staff001',
      passwordHash: staffHash,
      firstName: 'สมศักดิ์',
      lastName: 'ใจดี',
      role: Role.STAFF,
      position: 'นักวิเคราะห์',
      phone: '081-234-5678',
      departmentId: deptIT.id,
    },
  })

  const staff002 = await prisma.user.upsert({
    where: { username: 'staff002' },
    update: {},
    create: {
      employeeCode: 'EMP002',
      username: 'staff002',
      passwordHash: staffHash,
      firstName: 'กัญญา',
      lastName: 'มีสุข',
      role: Role.STAFF,
      position: 'เจ้าพนักงาน',
      phone: '082-345-6789',
      departmentId: deptPlan.id,
    },
  })

  console.log('✅ Users created')

  // Sample attendance records (last 7 days)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 1; i <= 5; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dayOfWeek = date.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) continue // skip weekend

    const checkIn = new Date(date)
    checkIn.setHours(8, Math.floor(Math.random() * 30), 0, 0)
    const checkOut = new Date(date)
    checkOut.setHours(17, Math.floor(Math.random() * 30), 0, 0)

    const workType = i % 3 === 0 ? WorkType.FIELD : WorkType.WFH

    await prisma.attendance.upsert({
      where: { userId_workDate: { userId: staff001.id, workDate: date } },
      update: {},
      create: {
        userId: staff001.id,
        workDate: date,
        workType,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        taskDescription: workType === WorkType.WFH
          ? 'ประชุมออนไลน์ทีม / จัดทำรายงานประจำสัปดาห์'
          : 'ออกตรวจเยี่ยมหน่วยงาน / ประชุมคณะทำงาน',
        latitude: workType === WorkType.FIELD ? new Prisma.Decimal(14.8798) : null,
        longitude: workType === WorkType.FIELD ? new Prisma.Decimal(102.0161) : null,
        locationName: workType === WorkType.FIELD ? 'ศาลากลางจังหวัด' : null,
        status: AttendanceStatus.PRESENT,
      },
    })

    await prisma.attendance.upsert({
      where: { userId_workDate: { userId: staff002.id, workDate: date } },
      update: {},
      create: {
        userId: staff002.id,
        workDate: date,
        workType: WorkType.WFH,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        taskDescription: 'สรุปผลการดำเนินงาน / จัดทำแผนงาน',
        status: AttendanceStatus.PRESENT,
      },
    })
  }

  console.log('✅ Sample attendance records created')
  console.log('\n📋 Test Accounts:')
  console.log('  ADMIN | username: admin    | password: Admin@1234')
  console.log('  STAFF | username: staff001 | password: Staff@1234')
  console.log('  STAFF | username: staff002 | password: Staff@1234')
  console.log('\n✨ Seed completed!')
}

// Fix: import Prisma for Decimal type
import { Prisma } from '@prisma/client'

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
