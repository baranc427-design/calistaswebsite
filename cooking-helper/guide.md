# 🍳 Cooking Helper App - The Simple Guide

This guide will walk you through building a full-stack cooking/file-sharing app using **just one single file**. 

We are using **Vanilla HTML, CSS, and JavaScript**. This means no terminal commands, no `npm`, no React, and no complex folders. You can just double-click the file to open it in your browser. We will use **Supabase** for the backend (database, login, and file storage) and **GitHub Pages** to host it for free.

---

## Phase 1: Set Up Your Backend (Supabase)

Before we write any code, we need to create the database and storage space where your app will save data.

1. Go to [supabase.com](https://supabase.com) and log in.
2. Open your project (or create a new one named `cooking-helper`).
3. **Get your API Keys:**
   - Click the **Gear Icon (Project Settings)** on the left, then click **API**.
   - Keep this page open. You will need the **Project URL** and the **Anon/Public Key** in a minute.
4. **Create the File Storage:**
   - Click **Storage** on the left menu.
   - Click **New Bucket**. Name it exactly `files` (all lowercase).
   - Toggle the **Public** switch to **ON** (so people can view the files).
   - Click Save.
5. **Create the Database Table & Security:**
   - Click **SQL Editor** on the left menu.
   - Click **New Query**.
   - Copy and paste this exact code, then click **Run**:

```sql
-- 1. Create a table to keep track of uploaded files
create table shared_files (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  file_name text not null,
  file_path text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Turn on Row Level Security (This is the "Lock")
alter table shared_files enable row level security;

-- 3. Create policies so users can ONLY see and delete their OWN files
create policy "Users can view own files" on shared_files for select using (auth.uid() = user_id);
create policy "Users can insert own files" on shared_files for insert with check (auth.uid() = user_id);
create policy "Users can delete own files" on shared_files for delete using (auth.uid() = user_id);