# Authentication Setup Guide for Koala.ai

## Quick Start - Email/Password Authentication

Your authentication is **already set up** and ready to use! Just create an account:

### Step 1: Visit Signup Page
Open your browser and go to:
```
http://localhost:3000/auth/signup
```

### Step 2: Create Your Account
Fill out the form:
- **Full Name:** Your name (e.g., "Andrew")
- **Email:** Your email (or `test@example.com` for testing)
- **Password:** Minimum 8 characters (e.g., `TestPass123!`)
- **Confirm Password:** Same password
- **University:** Optional
- ✅ Check "I agree to the Terms and Conditions"

### Step 3: Click "Create Account"
You'll be automatically logged in and redirected to the dashboard!

### Step 4: Test Adding Courses
- Go to http://localhost:3000/courses
- Click "+ Add Course"
- Fill out the form and click "Add Course"
- Your course will be saved to Supabase! 🎉

---

## How It Works

### What Happens When You Sign Up:

1. **Supabase creates your auth account** in the `auth.users` table
2. **A trigger automatically creates your profile** in the `public.users` table
3. **You get a session token** that keeps you logged in
4. **Row Level Security (RLS)** ensures you only see your own data

### Authentication Pages Available:

- **Signup:** `/auth/signup` - Create new account
- **Login:** `/auth/login` - Log in to existing account  
- **Forgot Password:** `/auth/forgot-password` - Reset password
- **Dashboard:** `/dashboard` - Main app (requires login)
- **Courses:** `/courses` - Manage your courses (requires login)

### Sign Out:

Currently, you'll need to add a logout button. For now, you can sign out by:
1. Opening browser dev tools (F12)
2. In the Console, run:
   ```javascript
   localStorage.clear()
   location.reload()
   ```

---

## Optional: Enable OAuth Providers

### Google OAuth Setup

If you want "Sign in with Google" functionality:

#### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Go to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Configure consent screen if prompted
6. Application type: **Web application**
7. Add authorized redirect URI:
   ```
   https://tcdhznrhnatlbseexiuqw.supabase.co/auth/v1/callback
   ```
8. Copy your **Client ID** and **Client Secret**

#### 2. Configure in Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **Koala-AI**
3. Go to **Authentication → Providers**
4. Find **Google** and toggle it **ON**
5. Paste your **Client ID** and **Client Secret**
6. Click **Save**

#### 3. Test Google Login

1. Go to http://localhost:3000/auth/signup
2. Click "Continue with Google"
3. Authorize your app
4. You'll be logged in! 🎉

### GitHub OAuth Setup

Similar process:

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - **Application name:** Koala.ai
   - **Homepage URL:** http://localhost:3000
   - **Authorization callback URL:** 
     ```
     https://tcdhznrhnatlbseexiuqw.supabase.co/auth/v1/callback
     ```
4. Copy **Client ID** and **Client Secret**
5. In Supabase → Authentication → Providers → GitHub
6. Toggle ON and paste credentials
7. Click **Save**

---

## Email Confirmation (Optional)

By default, Supabase requires email confirmation. To disable for development:

1. Go to Supabase Dashboard
2. **Authentication → Settings**
3. Scroll to **Email Auth**
4. **Uncheck "Enable email confirmations"**
5. Click **Save**

This allows you to sign up without verifying your email (useful for testing).

---

## Testing Authentication

### Test Flow:

1. ✅ **Sign Up** at `/auth/signup`
2. ✅ **Check Dashboard** - You should see your name
3. ✅ **Add a Course** at `/courses` - Should work now!
4. ✅ **Verify in Supabase:**
   - Go to **Authentication → Users** - See your account
   - Go to **Table Editor → users** - See your profile
   - Go to **Table Editor → courses** - See your course data

### Troubleshooting:

**"Please sign up or log in to add courses!" alert:**
- You're not logged in yet
- Go to `/auth/signup` and create an account

**"Failed to create account" error:**
- Check browser console (F12) for details
- Check Supabase Dashboard → Logs for errors
- Ensure `.env.local` has correct credentials

**"Redirects to callback but doesn't log in" (OAuth):**
- Make sure OAuth providers are configured in Supabase
- Check redirect URLs match exactly
- Try clearing cookies and trying again

---

## Security Notes

### What's Protected:

✅ **Row Level Security (RLS)** is enabled on all tables
✅ **Users can only see their own data** (courses, lectures, notes)
✅ **Passwords are hashed** by Supabase (bcrypt)
✅ **JWT tokens** used for authentication
✅ **Anon key is public** (security comes from RLS policies)

### What to Keep Secret:

❌ **Service Role Key** - Never expose in client code (we're not using it)
❌ **OAuth Client Secrets** - Only in Supabase dashboard
✅ **Anon Key** - Safe to expose (already in `.env.local`)

---

## Next Steps

Once authenticated, you can:

1. ✅ **Add/Edit/Delete Courses**
2. 🔜 **Record Lectures** (next feature to build)
3. 🔜 **Upload Audio Files** (need to create storage bucket)
4. 🔜 **Transcribe with Whisper API**
5. 🔜 **Generate AI Notes with GPT-4**

Your authentication is production-ready! 🚀
