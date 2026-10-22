# University Lecturer Appointment Booking App (Sistem Bimbingan Akademik)

A production-ready, type-safe fullstack Next.js web application for scheduling academic consultations between university lecturers and students. Engineered with a **Zero-Cost Architecture** optimized for the **Vercel Free Tier** and **Neon Serverless PostgreSQL**.

---

## 🌟 Key Architecture & Highlights

- **Framework:** Next.js 14 App Router (`src/` directory, Server Components & Server Actions).
- **Zero-Cost Cloud Deployment:** Vercel Hobby Tier + Neon Serverless PostgreSQL (Scale-to-zero, free compute & storage).
- **Authentication:** **Auth.js v5 (`next-auth@beta`)** with Google OAuth 2.0 & `@auth/prisma-adapter`.
- **Session Strategy:** Fast `jwt` strategy so roles and student onboarding states are evaluated instantly with zero unnecessary database roundtrips on navigation.
- **Role Assignment & Access Control:**
  - Automatic Lecturer role granting based on the `LECTURER_EMAILS` environment variable (comma-separated, case-insensitive).
  - Student first-time onboarding guard (`/onboarding`) requiring **Nama Lengkap**, **Program Studi**, and **Kelas**.
- **Critical Race-Condition Prevention:**
  - Atomic single-statement conditional booking in Server Actions (`slot.updateMany` with `bookedById: null` and `startTime: { gt: new Date() }`), guaranteeing zero double-bookings under concurrent student clicks.
- **Weekly Schedule Repeat:**
  - Option when creating slots to automatically generate the same slot for the following week (+7 days) on the exact same day and time.
- **Lecturer Schedule Filters:**
  - Instant client-side segmented toggle and KPI cards to filter between **Semua Slot**, **Tersedia (Available)**, and **Sudah Dibooking (Booked)**.
- **Student Privacy:**
  - When students view the schedule grid, slots booked by other students are visually muted as `Sudah Terisi` without ever leaking other students' identities, names, or emails.
- **UI & UX:** Modern academic theme built with Tailwind CSS, `shadcn/ui` design patterns, and `lucide-react` icons.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ (tested on Node 20 & 26)
- PostgreSQL database (e.g., [Neon.tech](https://neon.tech) serverless free tier)
- Google Cloud Console account for OAuth 2.0 credentials

### 2. Environment Variables Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your environment variables:
| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | Neon PostgreSQL pooled connection string | `postgresql://user:pass@ep-sample-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` |
| `AUTH_SECRET` | Secret key used to encrypt Auth.js JWTs | Generate using `openssl rand -base64 33` or `npx auth secret` |
| `AUTH_GOOGLE_ID` | Google OAuth Client ID | `xxx.apps.googleusercontent.com` |
| `AUTH_GOOGLE_SECRET` | Google OAuth Client Secret | `GOCSPX-xxx` |
| `LECTURER_EMAILS` | Comma-separated Google emails for Lecturers | `dosen1@univ.ac.id,dosen2@gmail.com` |
| `NEXTAUTH_URL` | Base canonical application URL | `http://localhost:3000` (or your Vercel URL) |
| `AUTH_TRUST_HOST` | Allows local production & custom hosts | `true` |

### 3. Setting Up Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/) $\rightarrow$ **APIs & Services** $\rightarrow$ **Credentials**.
2. Create an **OAuth 2.0 Client ID** (Web application).
3. Under **OAuth Consent Screen** $\rightarrow$ **Scopes**, select standard non-sensitive scopes (`.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`).
4. Set **Authorized JavaScript origins**:
   - `http://localhost:3000` (Local dev)
   - `https://your-app.vercel.app` (Production)
5. Set **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://your-app.vercel.app/api/auth/callback/google`

### 4. Database Migration & Prisma Generation
Push the Prisma schema to your PostgreSQL database:
```bash
npx prisma db push
```

> [!TIP]
> If using Neon PostgreSQL, connecting to the default database `/neondb` grants full schema privileges out of the box.

### 5. Running the Application
For local development:
```bash
npm run dev
```

For production test build:
```bash
npm run build
npm run start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Security & Concurrency Design

### 1. Atomic Booking Query (Race Condition Guard)
```typescript
const result = await prisma.slot.updateMany({
  where: {
    id: slotId,
    bookedById: null, // Atomic lock condition
    startTime: { gt: new Date() }, // Prevents booking expired slots
  },
  data: {
    bookedById: session.user.id,
    bookedAt: new Date(),
  },
});

if (result.count === 0) {
  return {
    success: false,
    error: "Maaf, slot jadwal ini baru saja dibooking oleh mahasiswa lain atau sudah kedaluwarsa.",
  };
}
```

### 2. Edge-Compatible Middleware
Authentication session checks in `src/middleware.ts` operate strictly on JWT tokens without importing Node-only libraries or direct database connections, making it 100% compliant with Vercel Edge Runtime.

---

## 📦 Vercel Zero-Cost Deployment

1. Push your repository to GitHub or GitLab.
2. Import the project into [Vercel](https://vercel.com).
3. Under **Environment Variables**, add:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `AUTH_GOOGLE_ID`
   - `AUTH_GOOGLE_SECRET`
   - `LECTURER_EMAILS`
   - `NEXTAUTH_URL` (set to your Vercel production URL, e.g. `https://your-app.vercel.app`)
   - `AUTH_TRUST_HOST` (`true`)
4. Click **Deploy**. Vercel will run `postinstall: prisma generate` and build the application automatically.
