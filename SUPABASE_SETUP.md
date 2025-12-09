# Supabase Setup Guide for Koala.ai

This guide will help you set up Supabase for Koala.ai, replacing Firebase completely. Supabase provides authentication, PostgreSQL database, and storage - all on a generous free tier with **no billing required**.

## Why Supabase?

✅ **Free Forever Tier**: 500MB database, 1GB file storage, 50,000 monthly active users
✅ **No Billing Required**: Unlike Firebase, Supabase works without a credit card
✅ **PostgreSQL**: Industry-standard relational database
✅ **Row Level Security**: Built-in data protection
✅ **Real-time subscriptions**: Live data updates (optional)
✅ **Open Source**: Full control and transparency

---

## Part 1: Create Supabase Project

### Step 1: Sign Up for Supabase

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub, Google, or email
4. Verify your email if needed

### Step 2: Create a New Project

1. Click "New Project"
2. Fill in:
   - **Name**: `koala-ai` (or your preference)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free (default)
3. Click "Create new project"
4. Wait 2-3 minutes for setup

---

## Part 2: Database Setup

### Step 1: Create Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Paste the following SQL and click "Run":

\`\`\`sql
-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  display_name TEXT,
  university TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  storage_used BIGINT DEFAULT 0,
  monthly_minutes_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Courses table
CREATE TABLE courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  professor TEXT NOT NULL,
  category TEXT DEFAULT 'computer-science',
  color TEXT DEFAULT 'blue',
  lectures INTEGER DEFAULT 0,
  total_hours NUMERIC DEFAULT 0,
  last_updated TEXT DEFAULT 'Just now',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lectures table
CREATE TABLE lectures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  duration INTEGER NOT NULL, -- in seconds
  audio_url TEXT,
  transcription_status TEXT DEFAULT 'pending' CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transcripts table
CREATE TABLE transcripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notes table
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_courses_user_id ON courses(user_id);
CREATE INDEX idx_lectures_user_id ON lectures(user_id);
CREATE INDEX idx_lectures_course_id ON lectures(course_id);
CREATE INDEX idx_transcripts_lecture_id ON transcripts(lecture_id);
CREATE INDEX idx_notes_lecture_id ON notes(lecture_id);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lectures_updated_at BEFORE UPDATE ON lectures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'display_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
\`\`\`

### Step 2: Set Up Row Level Security (RLS)

Supabase uses RLS to protect your data. Run this SQL:

\`\`\`sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Courses table policies
CREATE POLICY "Users can view own courses"
  ON courses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own courses"
  ON courses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own courses"
  ON courses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own courses"
  ON courses FOR DELETE
  USING (auth.uid() = user_id);

-- Lectures table policies
CREATE POLICY "Users can view own lectures"
  ON lectures FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lectures"
  ON lectures FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lectures"
  ON lectures FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own lectures"
  ON lectures FOR DELETE
  USING (auth.uid() = user_id);

-- Transcripts table policies
CREATE POLICY "Users can view own transcripts"
  ON transcripts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transcripts"
  ON transcripts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Notes table policies
CREATE POLICY "Users can view own notes"
  ON notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
  ON notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON notes FOR DELETE
  USING (auth.uid() = user_id);
\`\`\`

---

## Part 3: Authentication Setup

### Step 1: Enable Email Auth

1. Go to **Authentication** → **Providers**
2. **Email** should be enabled by default
3. Configure:
   - ✅ Enable email provider
   - ✅ Confirm email (recommended)
   - Set "Site URL" to: `http://localhost:3004` (for development)
   - Set "Redirect URLs" to: `http://localhost:3004/auth/callback`

### Step 2: Enable Google OAuth (Optional)

1. Go to **Authentication** → **Providers** → **Google**
2. Click "Enable"
3. Follow the instructions to create Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Set authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
4. Copy Client ID and Client Secret to Supabase
5. Click "Save"

### Step 3: Enable GitHub OAuth (Optional)

1. Go to **Authentication** → **Providers** → **GitHub**
2. Click "Enable"
3. Follow the instructions to create GitHub OAuth app:
   - Go to GitHub Settings → Developer settings → OAuth Apps
   - Click "New OAuth App"
   - Set callback URL: `https://<your-project-ref>.supabase.co/auth/v1/callback`
4. Copy Client ID and Client Secret to Supabase
5. Click "Save"

---

## Part 4: Storage Setup

### Step 1: Create Storage Bucket

1. Go to **Storage** in Supabase dashboard
2. Click "New bucket"
3. Fill in:
   - **Name**: `audio-recordings`
   - **Public**: OFF (keep private)
   - **File size limit**: 100MB
   - **Allowed MIME types**: `audio/wav, audio/mpeg, audio/webm`
4. Click "Create bucket"

### Step 2: Set Storage Policies

1. Click on `audio-recordings` bucket
2. Go to **Policies** tab
3. Click "New policy" and add these three policies:

**Policy 1: Allow users to upload their own audio**
```sql
-- Name: Users can upload own audio
-- Allowed operation: INSERT
CREATE POLICY "Users can upload own audio"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'audio-recordings' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy 2: Allow users to view their own audio**
```sql
-- Name: Users can view own audio
-- Allowed operation: SELECT
CREATE POLICY "Users can view own audio"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'audio-recordings' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy 3: Allow users to delete their own audio**
```sql
-- Name: Users can delete own audio
-- Allowed operation: DELETE
CREATE POLICY "Users can delete own audio"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'audio-recordings' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## Part 5: Get Your API Keys

### Step 1: Find Your Credentials

1. Go to **Settings** → **API**
2. You'll see:
   - **Project URL**: `https://xxxx.supabase.co`
   - **anon/public key**: Long string starting with `eyJ...`

### Step 2: Update .env.local

1. Open `/Users/andrew/Koala.ai/client/.env.local`
2. Replace the placeholder values:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Restart Your Dev Server

```bash
cd /Users/andrew/Koala.ai/client
npm run dev
```

---

## Part 6: Test Everything

### Test 1: Sign Up

1. Go to `http://localhost:3004/auth/signup`
2. Create a new account
3. Check Supabase **Authentication** → **Users** to see your new user
4. Check **Table Editor** → **users** to see your profile

### Test 2: Add a Course

1. Go to `http://localhost:3004/courses`
2. Click "Add Course"
3. Fill out the form and submit
4. Check **Table Editor** → **courses** to see your course

### Test 3: Upload Audio (Later)

1. Record a lecture (feature to be implemented)
2. Check **Storage** → **audio-recordings** to see your file

---

## Troubleshooting

### Issue: "Failed to fetch courses"
- **Solution**: Make sure you ran all the RLS policies SQL
- Check browser console for specific error
- Verify your Supabase URL and key in .env.local

### Issue: "Insert violates row-level security policy"
- **Solution**: Re-run the RLS policies SQL
- Make sure user is authenticated (check `user` in console)

### Issue: "relation does not exist"
- **Solution**: Re-run the database tables SQL
- Check **Table Editor** to verify tables exist

### Issue: Auth redirect not working
- **Solution**: Update redirect URLs in Authentication settings
- For local dev: `http://localhost:3004/auth/callback`
- For production: `https://yourdomain.com/auth/callback`

---

## What's Next?

Now that Supabase is set up, you can:

1. ✅ **Authentication works**: Sign up, login, OAuth
2. ✅ **Courses work**: Add, view, delete courses
3. 🔄 **Coming next**:
   - Audio recording and upload
   - Whisper API transcription
   - AI note generation
   - Library and analytics pages

---

## Cost Breakdown

Supabase Free Tier includes:
- 500MB database storage
- 1GB file storage
- 2GB bandwidth/month
- 50,000 monthly active users
- Unlimited API requests

**This is perfect for Koala.ai and costs $0!** 🎉

When you need more:
- **Pro Plan**: $25/month (8GB database, 100GB storage)
- **Team Plan**: $599/month (unlimited everything)

But you won't need this for a long time!

---

## Database Schema Overview

```
┌─────────────────┐
│     auth.users  │ (Supabase managed)
│  - id           │
│  - email        │
└────────┬────────┘
         │
         ├── users (profile extension)
         │   - full_name
         │   - university
         │   - plan
         │
         ├── courses
         │   - name, code, professor
         │   - lectures count
         │   - total_hours
         │   │
         │   └── lectures
         │       - title, duration
         │       - audio_url
         │       - transcription_status
         │       │
         │       ├── transcripts
         │       │   - content (Whisper output)
         │       │
         │       └── notes
         │           - content (AI generated)
         │
         └── storage: audio-recordings/
             {user_id}/{lecture_id}.wav
```

---

## Security Features

Supabase provides enterprise-grade security:

✅ **Row Level Security**: Users can only access their own data
✅ **Storage Policies**: Audio files are private and user-scoped
✅ **JWT Authentication**: Secure, industry-standard tokens
✅ **HTTPS Only**: All connections encrypted
✅ **SQL Injection Protection**: Built-in with prepared statements
✅ **Rate Limiting**: Prevents abuse (configurable)

---

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage](https://supabase.com/docs/guides/storage)
- [Next.js Integration](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)

---

**You're all set!** 🚀 Supabase is now handling authentication, database, and storage for Koala.ai - all for free!
