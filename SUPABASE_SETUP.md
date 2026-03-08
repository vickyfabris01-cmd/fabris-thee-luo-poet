# Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Wait for it to initialize
5. Copy the project URL and anon key from **Settings → API**

## 2. Add Environment Variables (secure)

Copy the example `.env.example` to a local `.env` (or `.env.local`) file and populate it with your Supabase credentials. Do NOT commit `.env` — it is already added to `.gitignore`.

```
cp .env.example .env
# then edit .env and paste your values
```

## 3. Create Database Tables

Go to **SQL Editor** in Supabase and run these queries:

### poems table

```sql
CREATE TABLE poems (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  date TEXT NOT NULL,
  image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### videos table

```sql
CREATE TABLE videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  youtubeId TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### comments table

```sql
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  body TEXT NOT NULL,
  poemId TEXT,
  approved BOOLEAN DEFAULT FALSE,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### invites table

```sql
CREATE TABLE invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### media table

```sql
CREATE TABLE media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT,
  content JSONB,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### profile table

```sql
CREATE TABLE profile (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 4. Enable Realtime (Optional)

Go to **Realtime** in Supabase and enable it for all tables to get live updates.

## 5. Set Row Level Security (RLS)

For now, disable RLS in **Authentication → Policies** to allow public access. (Enable in production!)

## 6. Install Dependencies

```bash
npm install
```

## 7. Test Connection

The app will test the Supabase connection on startup. Check the browser console for status.

## Data Migration

Your existing localStorage data can be manually copied to Supabase by:

1. Exporting from browser DevTools → Application → LocalStorage
2. Using the Dashboard UI to re-add items (they'll be saved to Supabase)
3. Or creating a migration script

---

**Need help?** Check the [Supabase docs](https://supabase.com/docs) for more details.
