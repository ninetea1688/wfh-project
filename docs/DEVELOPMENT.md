# Development Guide

## Prerequisites

- Node.js 20 LTS
- Docker Desktop
- VS Code (recommended extensions: see `.vscode/extensions.json`)

---

## Local Setup

### 1. Clone and configure environment

```bash
git clone <repo-url>
cd wfh-attendance
cp .env.example .env
```

Edit `.env`:

```
DATABASE_URL=mysql://wfh_user:wfh_pass123@localhost:3306/wfh_attendance
JWT_SECRET=your-super-secret-key-change-me
JWT_EXPIRES_IN=8h
PORT=4000
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
CORS_ORIGIN=http://localhost:5173
```

### 2. Start MySQL via Docker

```bash
docker-compose up -d mysql
```

Wait ~10 seconds for MySQL to initialize, then verify:

```bash
docker-compose ps
```

### 3. Backend setup

```bash
cd backend
npm install

# Run migrations
npx prisma migrate dev --name init

# Seed initial data (admin + 2 staff + departments)
npx prisma db seed

# Start dev server (port 4000)
npm run dev
```

### 4. Frontend setup

```bash
cd frontend
npm install

# Start dev server (port 5173)
npm run dev
```

---

## Prisma Workflow

```bash
# Create a new migration
npx prisma migrate dev --name <migration-name>

# Apply migrations to production DB
npx prisma migrate deploy

# Open Prisma Studio (DB GUI)
npx prisma studio

# Regenerate Prisma Client after schema changes
npx prisma generate
```

---

## Project Scripts

**Backend** (`backend/package.json`):

```json
{
  "dev": "tsx watch src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "seed": "tsx prisma/seed.ts"
}
```

**Frontend** (`frontend/package.json`):

```json
{
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview"
}
```

---

## Docker (Full Stack)

Start everything:

```bash
docker-compose up -d
```

Rebuild after code changes:

```bash
docker-compose up -d --build backend
docker-compose up -d --build frontend
```

View logs:

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

---

## GitHub Copilot Instructions

This project uses structured Copilot customization files:

| File                                            | Purpose                                        |
| ----------------------------------------------- | ---------------------------------------------- |
| `.github/copilot-instructions.md`               | Main context — always loaded                   |
| `.github/instructions/backend.instructions.md`  | Backend patterns (applyTo: `backend/**`)       |
| `.github/instructions/frontend.instructions.md` | Frontend patterns (applyTo: `frontend/**`)     |
| `.github/instructions/security.instructions.md` | Security rules (applyTo: `**`)                 |
| `.github/instructions/database.instructions.md` | Prisma patterns (applyTo: `backend/prisma/**`) |
| `.github/prompts/new-api-endpoint.prompt.md`    | Template: create API endpoint                  |
| `.github/prompts/new-react-page.prompt.md`      | Template: create React page                    |
| `.github/prompts/db-migration.prompt.md`        | Template: Prisma migration                     |
| `.github/prompts/write-tests.prompt.md`         | Template: write tests                          |
| `.github/prompts/debug-fix.prompt.md`           | Template: debug issues                         |

---

## Code Conventions

- Files: `camelCase.ts` (utils), `PascalCase.tsx` (components)
- API routes: `kebab-case` (`/api/auth/login`)
- DB columns: `snake_case` → Prisma `@map()`
- CSS: Tailwind utility classes only

---

## Test Accounts

| Role  | Username   | Password     |
| ----- | ---------- | ------------ |
| ADMIN | `admin`    | `Admin@1234` |
| STAFF | `staff001` | `Staff@1234` |
| STAFF | `staff002` | `Staff@1234` |
