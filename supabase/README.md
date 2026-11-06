# Supabase Setup Guide for Teen Bible Challenge CBT Platform

This project includes complete Supabase PostgreSQL cloud database integration, with automatic fallback to local JSON storage if Supabase credentials are not provided.

---

## 1. Quick Setup (3 Minutes)

### Step 1: Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New Project**, select your organization, and name your project (e.g. `teen-bible-cbt`).
3. Set a strong database password and choose your nearest region.

### Step 2: Run the Database Schema & Seed Script
1. In your Supabase Dashboard sidebar, navigate to the **SQL Editor** (icon with terminal `>_`).
2. Click **New query**.
3. Copy the entire contents of [`supabase/schema.sql`](./schema.sql) and paste it into the editor.
4. Click **Run** (or press `Cmd/Ctrl + Enter`).
5. You will see:
   - `Success. No rows returned.`
   - Three tables created: `exams`, `submissions`, `announcements`.
   - Row Level Security (RLS) policies and performance indexes enabled.
   - All 5 Teen Bible Challenges pre-populated into the `exams` table!

### Step 3: Copy Project API Credentials
1. In the Supabase Dashboard sidebar, click the **Settings** (gear icon) -> **API** (or **Data API**).
2. Copy the following values:
   - **Project URL**: e.g. `https://xyzcompany.supabase.co`
   - **Project API Keys**:
     - `anon` `public` key: `eyJhbGciOi...`
     - `service_role` `secret` key: `eyJhbGciOi...`

### Step 4: Configure Your `.env` File
Open `/home/gamp/exam/.env` and paste your keys:

```env
OPENROUTER_API_KEY=your-openrouter-api-key-here
OPENROUTER_MODEL=google/gemma-4-31b-it:free

# Supabase Cloud Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...your-service-role-key
```

### Step 5: Restart the Server
Restart the development or production server:
```bash
npm run build
npm run start
```
The platform will immediately detect the Supabase credentials and start querying and saving to your live Supabase cloud database!

---

## 2. Database Schema Overview

| Table Name | Description | Key Columns |
|------------|-------------|-------------|
| **`exams`** | Teen Bible Challenges | `id`, `title`, `description`, `category`, `difficulty`, `duration_minutes`, `passing_score`, `total_marks`, `questions` (JSONB), `proctoring_settings` (JSONB) |
| **`submissions`** | Student test sessions | `id`, `exam_id`, `candidate_name`, `candidate_email`, `score`, `percentage`, `passed`, `question_results` (JSONB), `proctor_logs` (JSONB), `ai_analytics` (JSONB) |
| **`announcements`** | Live broadcast messages | `id`, `title`, `message`, `target_exam_id`, `created_at` |

---

## 3. Resilience & Zero-Downtime Fallback

The backend data service in [`src/lib/db.ts`](../src/lib/db.ts) is architected with a hybrid resilience pattern:
- **When Supabase is configured**: All reads and writes target Supabase PostgreSQL. A local backup is also preserved in `data/` for maximum fault tolerance.
- **When Supabase credentials are missing**: The platform automatically and gracefully falls back to local storage (`data/exams.json` and `data/submissions.json`), ensuring zero downtime or startup failures.
