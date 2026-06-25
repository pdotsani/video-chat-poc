# Shared Lists

A Next.js app where authenticated users can create list items and share each item privately with one specific other user.

## Stack

- **Next.js 16** (App Router)
- **Supabase** — Google OAuth + Postgres + Row Level Security
- **Tailwind CSS**

## Setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a new project.

### 2. Run the schema

In the Supabase SQL Editor, paste and run the contents of [`supabase/schema.sql`](supabase/schema.sql).

### 3. Enable Google OAuth

In Supabase Dashboard → **Authentication → Providers → Google**:
- Enable it
- Add your Google OAuth Client ID and Secret (create credentials at [console.cloud.google.com](https://console.cloud.google.com))
- Set the authorized redirect URI in Google Console to:
  `https://<your-supabase-project>.supabase.co/auth/v1/callback`

### 4. Configure environment variables

Copy `.env.local` and fill in your values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Both values are found in Supabase Dashboard → **Settings → API**.

### 5. Add localhost to allowed redirect URLs

In Supabase Dashboard → **Authentication → URL Configuration**, add:
```
http://localhost:3000/auth/callback
```

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How it works

- **Home page** — public landing page with Google sign-in button
- **`/dashboard`** — protected; redirects unauthenticated users to home
- **Create item** — write content + pick one recipient from the user dropdown (only users who have previously signed in appear)
- **Item visibility** — enforced by Supabase RLS: each item is readable only by its creator or its designated recipient
