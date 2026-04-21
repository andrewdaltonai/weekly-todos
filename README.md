# Weekly Todos

Cross-device weekly todo app. Supabase for auth + storage, deployable to Vercel in minutes.

---

## Setup (10 mins total)

### 1. Supabase — create your database

1. Go to [supabase.com](https://supabase.com) → create a free account
2. Click **New Project** → name it `weekly-todos` → pick a region → set a DB password
3. Once loaded, go to **SQL Editor** and run:

```sql
create table todos (
  id text primary key,
  user_id text not null,
  data jsonb not null,
  updated_at timestamptz default now()
);
```

4. Go to **Settings → API** and copy:
   - **Project URL** (e.g. `https://abcxyz.supabase.co`)
   - **anon public** key (long `eyJ...` string)

### 2. Add your keys

Open `src/supabase.js` and replace the placeholder values:

```js
const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co'
const SUPABASE_ANON_KEY = 'eyJ...'
```

### 3. Deploy to Vercel

1. Push this folder to a GitHub repo (or drag-drop to Vercel)
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo
3. Vercel auto-detects Vite — just click **Deploy**
4. Your app is live at `your-project.vercel.app`

### 4. Fix magic link redirect (important)

After deploying, go back to Supabase:
- **Authentication → URL Configuration**
- Set **Site URL** to your Vercel URL (e.g. `https://weekly-todos.vercel.app`)
- Add it to **Redirect URLs** too

---

## How it works

- **Sign in**: enter your email → get a magic link → click it → you're in, on any device
- **Tasks sync** instantly via Supabase across all browsers/devices
- **New week** = fresh slate automatically (previous week data kept for carry-forward)
- **Carry forward**: tap ↩ carry to pull incomplete tasks from last week
- **Priority**: tap the square badge on any task to cycle high / medium / low / none

## Local development

```bash
npm install
npm run dev
```
