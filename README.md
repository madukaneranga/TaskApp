# Task Tracker

Full-stack employee work tracking system for photo editing teams. Built with Next.js 14, Supabase, and shadcn/ui.

## Features

- Email + password auth with 6-digit OTP verification
- Admin approval workflow for new users
- Task creation with timer (start / pause / resume / submit)
- Session tracking with work/pause segments
- Threaded notes and remarks on tasks
- Admin dashboard with live activity feed
- Reports with charts and CSV export
- Light/dark theme toggle

## Setup

### 1. Supabase

1. Create a new Supabase project
2. Run the SQL migration in `supabase/migrations/001_initial_schema.sql` via the SQL Editor
3. Configure **Authentication → Providers → Email**:
   - Enable **Confirm email**
   - Use **Email OTP** (6-digit code) — not magic links. In **Authentication → Email Templates**, ensure signup and recovery templates include `{{ .Token }}` for the OTP code.
4. Copy your project URL and keys

### 2. Environment

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials.

### 3. Create first admin

After running migrations, create an admin user via Supabase SQL:

```sql
-- First sign up normally, then promote:
UPDATE public.users SET role = 'admin', status = 'active' WHERE email = 'your@email.com';
```

Or use Supabase Auth dashboard to create a user, then update the `users` table.

### 4. Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Auth OTP flow

OTP is handled entirely by **Supabase Auth**:

- **Signup** → `auth.signUp()` sends a 6-digit OTP → `auth.verifyOtp({ type: 'signup' })`
- **Forgot password** → `auth.resetPasswordForEmail()` → `auth.verifyOtp({ type: 'recovery' })` → `auth.updateUser({ password })`
- **Resend** → `auth.resend({ type: 'signup' })` or `resetPasswordForEmail()` again

Emails are sent by Supabase — no custom SMTP or `otps` table required.

## Project Structure

```
/app/(auth)     → Login, signup, OTP, password reset
/app/(app)      → Dashboard, admin, tasks (protected)
/app/api        → Mutations only
/components     → UI, layout, timer, tasks, notes
/lib            → Supabase clients, auth helpers, types
/supabase       → Database migrations
```
