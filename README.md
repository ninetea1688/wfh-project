# 📋 WFH Online Attendance System

> ระบบลงชื่อปฏิบัติงานออนไลน์ สำหรับหน่วยงานราชการ,โรงเรียน สถานศึกษา,บริษัท และ อื่น ๆ แล้วแต่จะนำไปปรับใช้  
> รองรับการปฏิบัติงานที่บ้าน (Work From Home) และการออกปฏิบัติราชการนอกสถานที่  
> พร้อม Admin Dashboard สำหรับผู้ดูแลระบบ

---

## ✨ ความสามารถของระบบ

### 👤 สำหรับพนักงาน (Staff)

| ฟีเจอร์                      | รายละเอียด                                                         |
| ---------------------------- | ------------------------------------------------------------------ |
| **ลงชื่อเข้างาน (Check-in)** | บันทึกเวลาเข้างาน พร้อมเลือกประเภท WFH หรือออกราชการ               |
| **ลงชื่อออกงาน (Check-out)** | บันทึกเวลาออกงาน พร้อมสรุปชั่วโมงทำงาน                             |
| **อัปโหลดรูปภาพ**            | แนบรูปภาพหลักฐานการปฏิบัติงาน (รองรับ JPG, PNG ขนาดสูงสุด 5MB)     |
| **บันทึก GPS**               | บันทึกพิกัดตำแหน่งพร้อม Check-in/Check-out โดยอัตโนมัติ            |
| **บันทึกภารกิจ**             | อธิบายงานที่ปฏิบัติในวันนั้นๆ                                      |
| **ประวัติการลงชื่อ**         | ดูประวัติย้อนหลัง พร้อมดูรูปภาพที่แนบไว้                           |
| **แจ้งเตือน Check-out**      | ระบบแจ้งเตือนอัตโนมัติเมื่อถึงเวลา 15:30 น. หากยังไม่ได้ Check-out |
| **โปรไฟล์**                  | ดูข้อมูลส่วนตัว และเปลี่ยนรหัสผ่าน                                 |

### 🛠️ สำหรับผู้ดูแลระบบ (Admin)

| ฟีเจอร์               | รายละเอียด                                                        |
| --------------------- | ----------------------------------------------------------------- |
| **Admin Dashboard**   | ภาพรวมการลงชื่อวันนี้ แผนภูมิรายสัปดาห์ รายชื่อผู้ที่ยังไม่ลงชื่อ |
| **รายงาน**            | ค้นหาและกรองข้อมูลตาม ชื่อ / วันที่ / ประเภท / หน่วยงาน           |
| **Export Excel**      | ดาวน์โหลดรายงานเป็นไฟล์ `.xlsx`                                   |
| **Export PDF**        | พิมพ์รายงานเป็น PDF จากเบราว์เซอร์ รองรับภาษาไทย                  |
| **จัดการผู้ใช้**      | เพิ่ม / แก้ไข / ลบ / รีเซ็ตรหัสผ่านผู้ใช้งาน                      |
| **ดูประวัติรายบุคคล** | คลิกชื่อพนักงานเพื่อดูประวัติการลงชื่อ 30 รายการล่าสุด            |
| **จัดการแผนก**        | เพิ่ม / แก้ไข / ลบหน่วยงาน / แผนก                                 |

---

## 🏗️ Tech Stack

### Frontend

| เทคโนโลยี                                                                 | เวอร์ชัน | บทบาท                        |
| ------------------------------------------------------------------------- | -------- | ---------------------------- |
| [React](https://react.dev/)                                               | 18       | UI Framework                 |
| [Vite](https://vitejs.dev/)                                               | 5        | Build Tool                   |
| [TypeScript](https://www.typescriptlang.org/)                             | 5        | Type Safety                  |
| [Tailwind CSS](https://tailwindcss.com/)                                  | 3        | Styling                      |
| [shadcn/ui](https://ui.shadcn.com/)                                       | —        | UI Components                |
| [TanStack Query](https://tanstack.com/query/v5)                           | v5       | Server State (Cache + Fetch) |
| [Zustand](https://zustand-demo.pmnd.rs/)                                  | 4        | Client State (Auth)          |
| [React Router DOM](https://reactrouter.com/)                              | v6       | Routing                      |
| [react-hook-form](https://react-hook-form.com/) + [Zod](https://zod.dev/) | —        | Form + Validation            |
| [Axios](https://axios-http.com/)                                          | —        | HTTP Client                  |
| [date-fns](https://date-fns.org/)                                         | 3        | จัดการวันที่                 |
| [Sonner](https://sonner.emilkowal.ski/)                                   | —        | Toast Notifications          |
| [Lucide React](https://lucide.dev/)                                       | —        | Icons                        |

### Backend

| เทคโนโลยี                                                                      | เวอร์ชัน | บทบาท                      |
| ------------------------------------------------------------------------------ | -------- | -------------------------- |
| [Node.js](https://nodejs.org/)                                                 | 20 LTS   | Runtime                    |
| [Express.js](https://expressjs.com/)                                           | 4        | Web Framework              |
| [TypeScript](https://www.typescriptlang.org/)                                  | 5        | Type Safety                |
| [Prisma ORM](https://www.prisma.io/)                                           | v5       | Database ORM               |
| [MySQL](https://www.mysql.com/)                                                | 8.0      | Database                   |
| [JWT](https://jwt.io/)                                                         | —        | Authentication (Token 8h)  |
| [bcrypt](https://github.com/dcodeIO/bcrypt.js)                                 | —        | เข้ารหัสรหัสผ่าน (salt 12) |
| [Multer](https://github.com/expressjs/multer)                                  | —        | อัปโหลดไฟล์                |
| [Zod](https://zod.dev/)                                                        | —        | Input Validation           |
| [Helmet](https://helmetjs.github.io/)                                          | —        | Security Headers           |
| [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) | —        | Rate Limiting              |
| [xlsx](https://github.com/SheetJS/sheetjs)                                     | —        | Export Excel               |

### Infrastructure

| เทคโนโลยี                                                                              | บทบาท                   |
| -------------------------------------------------------------------------------------- | ----------------------- |
| [Docker](https://www.docker.com/) + [Docker Compose](https://docs.docker.com/compose/) | Container orchestration |

---

## 📁 โครงสร้างโปรเจกต์

```
wfh-attendance/
├── backend/                    # Express.js API Server
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema (models)
│   │   ├── migrations/         # Migration history
│   │   └── seed.ts             # ข้อมูลเริ่มต้น (Admin + Staff ตัวอย่าง)
│   └── src/
│       ├── controllers/        # Business logic ของแต่ละ resource
│       ├── middleware/         # Auth, Error handler
│       ├── routes/             # API route declarations
│       ├── services/           # Reusable service layer
│       └── index.ts            # Entry point
│
├── frontend/                   # React + Vite App
│   └── src/
│       ├── components/
│       │   └── layout/         # StaffLayout, AdminLayout (shell หน้าจอ)
│       ├── pages/
│       │   ├── login/          # หน้าเข้าสู่ระบบ
│       │   ├── dashboard/      # หน้าหลักพนักงาน
│       │   ├── checkin/        # ลงชื่อปฏิบัติงาน
│       │   ├── history/        # ประวัติการลงชื่อ
│       │   ├── profile/        # โปรไฟล์
│       │   └── admin/          # Admin Dashboard, Reports, Users, Departments
│       ├── services/           # API calls ผ่าน axios
│       ├── stores/             # Zustand state (auth)
│       └── lib/                # Utilities, helpers
│
├── docker-compose.yml          # Production: MySQL + Backend + Frontend
├── docker-compose.dev.yml      # Development: MySQL เท่านั้น
├── .env.example                # ตัวอย่าง Environment Variables
└── README.md
```

---

## 🚀 วิธีติดตั้งและใช้งาน

มี 2 วิธี — เลือกตามความถนัด:

| วิธี                                                        | เหมาะกับ               | ความยาก      |
| ----------------------------------------------------------- | ---------------------- | ------------ |
| [🐳 Docker (แนะนำ)](#-วิธีที่-1-docker-แนะนำ)               | Production / ทดสอบระบบ | ⭐ ง่ายมาก   |
| [💻 Manual (Dev Mode)](#-วิธีที่-2-manual-สำหรับ-developer) | พัฒนาและแก้ไขโค้ด      | ⭐⭐ ปานกลาง |

---

## 🐳 วิธีที่ 1: Docker (แนะนำ)

### สิ่งที่ต้องมีก่อน

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (ดาวน์โหลดและติดตั้งฟรี)
  - **Windows:** ต้องเปิดใช้งาน WSL 2 ด้วย (Docker Desktop จะแนะนำอัตโนมัติ)
  - **macOS / Linux:** ติดตั้งได้เลย ไม่ต้องตั้งค่าเพิ่ม
- Git

### ขั้นตอนที่ 1 — Clone โปรเจกต์

```bash
git clone <repository-url>
cd wfh-attendance
```

### ขั้นตอนที่ 2 — สร้างไฟล์ `.env`

```bash
# Windows (Command Prompt หรือ PowerShell)
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

### ขั้นตอนที่ 3 — แก้ไขไฟล์ `.env`

เปิดไฟล์ `.env` ด้วย text editor แล้วแก้ค่าต่อไปนี้:

```env
# ⚠️ สำคัญมาก: เปลี่ยน JWT_SECRET เป็น random string ยาวๆ ก่อนใช้งานจริง
JWT_SECRET=เปลี่ยนค่านี้เป็น-random-string-ยาวอย่างน้อย-64-ตัวอักษร

# URL ที่ผู้ใช้งานจะเข้าถึงระบบ
# ถ้ารันบนเครื่องตัวเอง: ใช้ localhost
# ถ้ารันบน server จริง: เปลี่ยน localhost เป็น IP หรือ domain
CORS_ORIGIN=http://localhost:8080
VITE_API_URL=http://localhost:4000
```

> 💡 **วิธีสร้าง JWT_SECRET ที่ปลอดภัย:**
>
> ```bash
> # macOS / Linux
> openssl rand -hex 32
>
> # Windows PowerShell
> -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
> ```

### ขั้นตอนที่ 4 — Build และเริ่มระบบ

```bash
docker-compose up -d --build
```

> ⏳ ครั้งแรกอาจใช้เวลา **3–10 นาที** เพราะต้อง download Docker images และ build
> ครั้งถัดไปจะเร็วขึ้นมาก

### ขั้นตอนที่ 5 — ตั้งค่าฐานข้อมูล (ทำแค่ครั้งแรก)

รอให้ทุก container พร้อมก่อน (ประมาณ 1 นาที) แล้วรันคำสั่งนี้:

```bash
# สร้าง tables ในฐานข้อมูล
docker exec wfh_backend npx prisma migrate deploy

# เพิ่มข้อมูลเริ่มต้น (Admin + Staff ตัวอย่าง)
docker exec wfh_backend npx prisma db seed
```

### ขั้นตอนที่ 6 — เข้าใช้งาน 🎉

| บริการ                     | URL                       |
| -------------------------- | ------------------------- |
| 🌐 **Frontend (หน้าเว็บ)** | http://localhost:8080     |
| ⚙️ **Backend API**         | http://localhost:4000/api |

---

### คำสั่ง Docker ที่ใช้บ่อย

```bash
# ดู log แบบ real-time (กด Ctrl+C เพื่อหยุด)
docker-compose logs -f

# ดู log เฉพาะ service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql

# ดูสถานะทุก container
docker-compose ps

# Restart เฉพาะ service
docker-compose restart backend

# หยุดระบบ (ข้อมูลในฐานข้อมูลยังอยู่)
docker-compose down

# หยุดระบบและลบข้อมูลทั้งหมด (เริ่มต้นใหม่สมบูรณ์)
docker-compose down -v
```

---

## 💻 วิธีที่ 2: Manual (สำหรับ Developer)

วิธีนี้เหมาะสำหรับการพัฒนา เพราะ code จะ hot-reload ทันทีเมื่อแก้ไขไฟล์

### สิ่งที่ต้องมีก่อน

- [Node.js](https://nodejs.org/) **v20 LTS** หรือสูงกว่า ([ดาวน์โหลด](https://nodejs.org/en/download))
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (สำหรับรัน MySQL เท่านั้น)
- Git

### ตรวจสอบ Node.js ว่าพร้อมหรือยัง

```bash
node --version
# ต้องได้ v20.x.x หรือสูงกว่า

npm --version
# ต้องได้ 9.x.x หรือสูงกว่า
```

---

### ขั้นตอนที่ 1 — Clone และเตรียม Environment

```bash
git clone <repository-url>
cd wfh-attendance

# สร้างไฟล์ .env
copy .env.example .env    # Windows
cp .env.example .env      # macOS / Linux
```

แก้ไข `.env` สำหรับ development:

```env
DATABASE_URL=mysql://wfh_user:wfh_pass123@localhost:3306/wfh_attendance
JWT_SECRET=dev-secret-key-change-in-production-min-64-chars-xxxxxxxxxxxxxx
JWT_EXPIRES_IN=8h
PORT=4000
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### ขั้นตอนที่ 2 — เริ่ม MySQL ด้วย Docker

```bash
docker-compose -f docker-compose.dev.yml up -d
```

> รอประมาณ **30 วินาที** ให้ MySQL พร้อมรับ connection

### ขั้นตอนที่ 3 — ติดตั้ง Backend

```bash
cd backend
npm install
```

### ขั้นตอนที่ 4 — ตั้งค่าฐานข้อมูล

```bash
# สร้าง database tables จาก schema
npx prisma migrate dev --name init

# เพิ่มข้อมูลเริ่มต้น
npx prisma db seed
```

### ขั้นตอนที่ 5 — เริ่ม Backend

```bash
npm run dev
```

เมื่อเห็นข้อความนี้แสดงว่าพร้อมใช้งาน:

```
🚀 Server running on port 4000
✅ Database connected
```

### ขั้นตอนที่ 6 — ติดตั้ง Frontend (เปิด Terminal ใหม่)

```bash
cd frontend
npm install
```

สร้างไฟล์ `frontend/.env`:

```env
VITE_API_URL=http://localhost:4000
```

### ขั้นตอนที่ 7 — เริ่ม Frontend

```bash
npm run dev
```

เบราว์เซอร์จะเปิดอัตโนมัติที่ http://localhost:5173

---

## 🔑 บัญชีผู้ใช้เริ่มต้น (Seed Data)

หลังจากรัน `prisma db seed` จะมีบัญชีสำเร็จรูปสำหรับทดสอบ:

| Role      | Username   | Password     | สิทธิ์            |
| --------- | ---------- | ------------ | ----------------- |
| **Admin** | `admin`    | `Admin@1234` | จัดการระบบทั้งหมด |
| **Staff** | `staff001` | `Staff@1234` | พนักงานทั่วไป     |
| **Staff** | `staff002` | `Staff@1234` | พนักงานทั่วไป     |

> ⚠️ **ความปลอดภัย:** เปลี่ยนรหัสผ่านทันทีก่อนนำไปใช้งานจริง

---

## 🔐 สิทธิ์การใช้งาน

### STAFF — พนักงาน

- ✅ ลงชื่อเข้า / ออกงาน
- ✅ ดูสถานะวันนี้ของตนเอง
- ✅ ดูประวัติการลงชื่อของตนเอง
- ✅ อัปโหลดรูปภาพหลักฐาน
- ✅ แก้ไขโปรไฟล์และเปลี่ยนรหัสผ่าน
- ❌ ไม่สามารถดูข้อมูลของพนักงานคนอื่น

### ADMIN — ผู้ดูแลระบบ

- ✅ ทุกอย่างของ STAFF
- ✅ Admin Dashboard — ภาพรวมองค์กรรายวัน
- ✅ รายงานและ Export ข้อมูล (Excel / PDF)
- ✅ จัดการผู้ใช้งานทั้งหมด (CRUD + Reset Password)
- ✅ ดูประวัติการลงชื่อของพนักงานทุกคน
- ✅ จัดการหน่วยงาน / แผนก

---

## 🗄️ โครงสร้างฐานข้อมูล

```
departments                users
──────────────────         ──────────────────────────
id (PK)                    id (PK)
name                       employee_code  ← UNIQUE
code (UNIQUE)              username       ← UNIQUE
parent_id (FK → self)      password_hash
is_active                  first_name / last_name
                           department_id  (FK → departments)
                           position
                           role           (ADMIN | STAFF)
                           is_active
                           created_at / updated_at

attendances                              attendance_images
─────────────────────────────────────    ─────────────────────
id (PK)                                  id (PK)
user_id (FK → users)                     attendance_id (FK → attendances)
work_date (DATE)   ┐                     file_path
work_type          │ UNIQUE constraint   file_name
check_in_time      ┘ (user_id+work_date) file_size
check_out_time                           uploaded_at
task_description
latitude / longitude
location_name
status  (INCOMPLETE | PRESENT)
created_at / updated_at
```

> **Constraint สำคัญ:** พนักงาน 1 คน ลงชื่อได้ **1 ครั้งต่อวัน** เท่านั้น

---

## 🌐 API Endpoints

Base URL: `http://localhost:4000/api`

Header ที่ต้องส่งทุก request (ยกเว้น login):

```
Authorization: Bearer <JWT_TOKEN>
```

### Authentication

| Method | Endpoint                | สิทธิ์ | คำอธิบาย                         |
| ------ | ----------------------- | ------ | -------------------------------- |
| POST   | `/auth/login`           | Public | เข้าสู่ระบบ รับ JWT token กลับมา |
| POST   | `/auth/logout`          | Auth   | ออกจากระบบ                       |
| GET    | `/auth/me`              | Auth   | ดูข้อมูลผู้ใช้ที่ login อยู่     |
| PUT    | `/auth/change-password` | Auth   | เปลี่ยนรหัสผ่านตนเอง             |

### Attendance

| Method | Endpoint               | สิทธิ์ | คำอธิบาย                 |
| ------ | ---------------------- | ------ | ------------------------ |
| GET    | `/attendance/today`    | Auth   | สถานะการลงชื่อวันนี้     |
| POST   | `/attendance/checkin`  | Auth   | ลงชื่อเข้างาน            |
| POST   | `/attendance/checkout` | Auth   | ลงชื่อออกงาน             |
| GET    | `/attendance/history`  | Auth   | ประวัติการลงชื่อของตนเอง |

### Reports (Admin เท่านั้น)

| Method | Endpoint                | Query Params                                            | คำอธิบาย          |
| ------ | ----------------------- | ------------------------------------------------------- | ----------------- |
| GET    | `/reports/dashboard`    | —                                                       | ข้อมูลสรุปภาพรวม  |
| GET    | `/reports`              | `search`, `from`, `to`, `type`, `dept`, `page`, `limit` | รายงาน + กรอง     |
| GET    | `/reports/export/excel` | เหมือน reports                                          | Export ไฟล์ Excel |
| GET    | `/reports/export/pdf`   | เหมือน reports                                          | Export PDF        |

### Users (Admin เท่านั้น)

| Method | Endpoint                    | คำอธิบาย               |
| ------ | --------------------------- | ---------------------- |
| GET    | `/users`                    | ดูรายชื่อผู้ใช้ทั้งหมด |
| POST   | `/users`                    | สร้างผู้ใช้ใหม่        |
| GET    | `/users/:id`                | ดูข้อมูลผู้ใช้รายคน    |
| PUT    | `/users/:id`                | แก้ไขข้อมูลผู้ใช้      |
| DELETE | `/users/:id`                | ลบผู้ใช้ (soft delete) |
| POST   | `/users/:id/reset-password` | รีเซ็ตรหัสผ่าน         |

### Departments (Admin เท่านั้น)

| Method | Endpoint           | คำอธิบาย                 |
| ------ | ------------------ | ------------------------ |
| GET    | `/departments`     | ดูรายชื่อแผนก / หน่วยงาน |
| POST   | `/departments`     | สร้างแผนกใหม่            |
| PUT    | `/departments/:id` | แก้ไขแผนก                |
| DELETE | `/departments/:id` | ลบแผนก                   |

### Format ของ Response

```json
// สำเร็จ
{ "success": true, "data": { ... }, "message": "..." }

// ล้มเหลว
{ "success": false, "error": "...", "code": 400 }
```

---

## ⚙️ Environment Variables อธิบายทุกตัว

### Backend (`.env` ที่ root)

| ตัวแปร           | ตัวอย่าง                         | คำอธิบาย                           |
| ---------------- | -------------------------------- | ---------------------------------- |
| `DATABASE_URL`   | `mysql://user:pass@host:3306/db` | Connection string สำหรับ MySQL     |
| `JWT_SECRET`     | `random-string-64-chars+`        | ⚠️ ต้องเปลี่ยน! ใช้ sign JWT token |
| `JWT_EXPIRES_IN` | `8h`                             | อายุ Token (8 ชั่วโมง)             |
| `PORT`           | `4000`                           | Port ที่ Backend รัน               |
| `UPLOAD_DIR`     | `./uploads`                      | โฟลเดอร์เก็บรูปภาพที่อัปโหลด       |
| `MAX_FILE_SIZE`  | `5242880`                        | ขนาดไฟล์สูงสุด (5MB)               |
| `CORS_ORIGIN`    | `http://localhost:5173`          | URL ของ Frontend (ห้ามใส่ `*`)     |
| `NODE_ENV`       | `development`                    | `development` หรือ `production`    |

### Frontend (`frontend/.env`)

| ตัวแปร         | ตัวอย่าง                | คำอธิบาย            |
| -------------- | ----------------------- | ------------------- |
| `VITE_API_URL` | `http://localhost:4000` | URL ของ Backend API |

---

## 🔒 ความปลอดภัย

ระบบออกแบบตาม OWASP Top 10:

| มาตรการ              | รายละเอียด                                                  |
| -------------------- | ----------------------------------------------------------- |
| **รหัสผ่าน**         | เข้ารหัสด้วย bcrypt (salt rounds = 12) ไม่เก็บ plaintext    |
| **Authentication**   | JWT Token อายุ 8 ชั่วโมง — หมดแล้วต้อง login ใหม่           |
| **SQL Injection**    | ป้องกันด้วย Prisma ORM (Parameterized Queries ทุกที่)       |
| **File Upload**      | ตรวจสอบ MIME type จาก buffer + จำกัด 5MB + rename ด้วย UUID |
| **Rate Limiting**    | Auth endpoints: 10 requests / 15 นาที ต่อ IP                |
| **Security Headers** | Helmet.js (XSS Protection, Clickjacking, HSTS)              |
| **CORS**             | Whitelist เฉพาะ Origin ที่กำหนดใน env — ห้ามใช้ `*`         |
| **Input Validation** | Zod schema ทั้ง Frontend และ Backend ทุก endpoint           |
| **Row-level Access** | Staff เข้าถึงได้เฉพาะข้อมูลของตนเองเท่านั้น                 |

---

## 🛠️ แก้ปัญหาที่พบบ่อย

### ❌ `docker-compose up` ล้มเหลว — Port 3306 ถูกใช้งานอยู่

MySQL ในเครื่อง (ที่ไม่ใช่ Docker) กำลังรันอยู่:

```bash
# Windows — หยุด MySQL service
net stop MySQL80

# หรือเปลี่ยน port ใน docker-compose.yml บรรทัด ports:
ports:
  - "3307:3306"   # ใช้ port 3307 แทน
# แล้วเปลี่ยน DATABASE_URL ใน .env ด้วย
DATABASE_URL=mysql://wfh_user:wfh_pass123@localhost:3307/wfh_attendance
```

### ❌ Backend ขึ้น `Can't connect to MySQL` หรือ `ECONNREFUSED`

MySQL ยังไม่พร้อม รอสักครู่แล้วลองใหม่:

```bash
# ดูสถานะ MySQL
docker-compose logs mysql

# ถ้า MySQL พร้อมแล้ว restart backend
docker-compose restart backend
```

### ❌ `prisma migrate dev` ล้มเหลว — ไม่สามารถเชื่อมต่อ database

```bash
# ตรวจสอบว่า MySQL กำลังรัน
docker-compose ps

# ตรวจสอบ DATABASE_URL ใน .env
# user, password, host, port และ database name ต้องตรงกัน
```

### ❌ Frontend เชื่อม Backend ไม่ได้ — CORS Error ใน browser console

```bash
# ตรวจสอบว่า CORS_ORIGIN ใน .env (backend) ตรงกับ URL ของ frontend
# Dev: CORS_ORIGIN=http://localhost:5173
# Docker: CORS_ORIGIN=http://localhost:8080
```

### ❌ รูปภาพที่แนบไม่แสดงในหน้า History

```bash
# ตรวจสอบว่าโฟลเดอร์ uploads มีสิทธิ์ write
ls -la uploads/      # macOS/Linux

# สร้างโฟลเดอร์ถ้าไม่มี
mkdir uploads
```

### ❌ Port 8080 ถูกใช้งานอยู่ (Docker Production)

```yaml
# แก้ใน docker-compose.yml
frontend:
  ports:
    - "3000:80" # เปลี่ยนจาก 8080 เป็น port อื่น
```

---

## 📦 Build สำหรับ Production

### Backend

```bash
cd backend
npm run build   # Compile TypeScript → dist/
npm start       # รัน production build
```

### Frontend

```bash
cd frontend
npm run build   # Build → dist/ (static files)
npm run preview # Preview ก่อน deploy
```

---

## 📝 License

MIT License — ใช้งานได้ฟรีทั้งส่วนตัวและองค์กร
