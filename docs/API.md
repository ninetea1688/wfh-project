# API Reference

Base URL: `http://localhost:4000/api`

All protected routes require: `Authorization: Bearer <JWT_TOKEN>`

## Response Format

```json
// Success
{ "success": true, "data": {}, "message": "..." }

// Error
{ "success": false, "error": "...", "code": 400 }
```

---

## Authentication

### POST /auth/login

Login and receive a JWT token.

**Body:**

```json
{ "username": "admin", "password": "Admin@1234" }
```

**Response 200:**

```json
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "user": {
      "id": 1,
      "employeeCode": "EMP001",
      "firstName": "สมชาย",
      "lastName": "ใจดี",
      "username": "admin",
      "role": "ADMIN",
      "position": "ผู้ดูแลระบบ",
      "department": { "id": 1, "name": "ฝ่ายเทคโนโลยีสารสนเทศ" }
    }
  }
}
```

**Errors:** 400 (validation), 401 (invalid credentials)

---

### POST /auth/logout

Logout (clears server-side session state).

**Auth:** Required

---

### GET /auth/me

Get current authenticated user info.

**Auth:** Required

**Response 200:**

```json
{ "success": true, "data": { "id": 1, "firstName": "สมชาย", ... } }
```

---

### PATCH /auth/change-password

Change password for the authenticated user.

**Auth:** Required

**Body:**

```json
{ "currentPassword": "OldPass@1234", "newPassword": "NewPass@1234" }
```

**Errors:** 400 (validation), 401 (wrong current password)

---

## Attendance

### POST /attendance/checkin

Check in for today.

**Auth:** Required (STAFF or ADMIN)

**Body (multipart/form-data):**

```
workType: "WFH" | "FIELD"
taskDescription: string (optional)
latitude: number (optional)
longitude: number (optional)
images: File[] (max 3, JPEG/PNG, max 5MB each)
```

**Response 201:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "workDate": "2024-01-15",
    "workType": "WFH",
    "checkInTime": "2024-01-15T08:30:00.000Z",
    "taskDescription": "ประชุมออนไลน์",
    "latitude": 13.7563,
    "longitude": 100.5018,
    "status": "INCOMPLETE"
  }
}
```

**Errors:** 400 (validation), 409 (already checked in today)

---

### PATCH /attendance/checkout

Check out for today.

**Auth:** Required

**Body (multipart/form-data):**

```
summary: string (optional)
latitude: number (optional)
longitude: number (optional)
images: File[] (optional)
```

**Response 200:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "checkOutTime": "2024-01-15T17:00:00.000Z",
    "status": "PRESENT"
  }
}
```

**Errors:** 404 (no check-in today), 409 (already checked out)

---

### GET /attendance/today

Get today's attendance record for the current user.

**Auth:** Required

**Response 200:**

```json
{ "success": true, "data": { "id": 1, "checkInTime": "...", ... } }
// null if not checked in
{ "success": true, "data": null }
```

---

### GET /attendance/history

Get attendance history for the current user.

**Auth:** Required

**Query params:**

- `page` (default: 1)
- `limit` (default: 20)
- `workType`: `"WFH"` | `"FIELD"`
- `dateFrom`: `"YYYY-MM-DD"`
- `dateTo`: `"YYYY-MM-DD"`

**Response 200:**

```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 50,
    "page": 1,
    "limit": 20
  }
}
```

---

### GET /attendance/:id

Get a specific attendance record by ID.

**Auth:** Required (own record only; ADMIN can see all)

---

### POST /attendance/:id/images

Upload images for an existing attendance record.

**Auth:** Required

**Body (multipart/form-data):**

```
images: File[] (max 3, JPEG/PNG, max 5MB each)
```

---

## Reports (Admin only)

### GET /reports/dashboard

Get today's attendance overview and weekly chart data.

**Auth:** Required (ADMIN)

**Response 200:**

```json
{
  "success": true,
  "data": {
    "today": {
      "checkedIn": 15, "wfhCount": 10, "fieldCount": 5,
      "notCheckedIn": 3, "total": 18
    },
    "weeklyChart": [
      { "date": "2024-01-09", "WFH": 12, "FIELD": 4 },
      ...
    ],
    "notCheckedInUsers": [
      { "id": 2, "firstName": "สมหญิง", "lastName": "ดีมี", "department": { "name": "ฝ่ายแผน" } }
    ],
    "recentCheckins": [...]
  }
}
```

---

### GET /reports

Get paginated attendance records with filters.

**Auth:** Required (ADMIN)

**Query params:**

- `search`: name/employee code
- `dateFrom`, `dateTo`: date range
- `workType`: `"WFH"` | `"FIELD"`
- `page`, `limit`
- `departmentId`

---

### GET /reports/export/excel

Export report as Excel (.xlsx).

**Auth:** Required (ADMIN)

**Response:** `application/octet-stream` blob

---

### GET /reports/export/pdf

Export report as PDF.

**Auth:** Required (ADMIN)

**Response:** `application/pdf` blob

---

## Users (Admin only)

### GET /users

Get all users.

**Auth:** Required (ADMIN)

**Query params:** `search`, `role`, `departmentId`, `isActive`

---

### POST /users

Create a new user.

**Auth:** Required (ADMIN)

**Body:**

```json
{
  "firstName": "สมชาย",
  "lastName": "ใจดี",
  "employeeCode": "EMP010",
  "username": "staff010",
  "password": "Staff@1234",
  "role": "STAFF",
  "position": "นักวิชาการ",
  "departmentId": 1
}
```

**Errors:** 409 (username or employeeCode already exists)

---

### GET /users/:id

Get a specific user.

**Auth:** Required (ADMIN)

---

### PUT /users/:id

Update a user.

**Auth:** Required (ADMIN)

**Body:** Same as POST (password optional)

---

### DELETE /users/:id

Soft-delete a user (sets `isActive = false`).

**Auth:** Required (ADMIN)

---

### PATCH /users/:id/reset-password

Reset a user's password.

**Auth:** Required (ADMIN)

**Body:**

```json
{ "newPassword": "NewPass@1234" }
```

---

### GET /users/departments

Get all departments.

**Auth:** Required

---

## Error Codes

| Code | Meaning                              |
| ---- | ------------------------------------ |
| 400  | Validation error                     |
| 401  | Unauthorized (missing/invalid token) |
| 403  | Forbidden (insufficient role)        |
| 404  | Resource not found                   |
| 409  | Conflict (duplicate data)            |
| 500  | Internal server error                |
