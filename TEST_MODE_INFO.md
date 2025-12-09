# Test Mode - Courses Page

## What Changed?

I've added **temporary local storage functionality** so you can test the courses page without Supabase configuration!

## Current Features (Test Mode)

✅ **Add Course**: Click "Add Course" button, fill out the form, submit
- Courses are saved to browser's `localStorage`
- Each course gets: name, code, professor, category, color
- Stats automatically update

✅ **Delete Course**: Hover over any course card
- X button appears in top-right corner
- Click to delete (with confirmation)
- Course removed from localStorage

✅ **Dynamic Stats**: 
- Total Courses: Count of all courses
- Total Lectures: Sum of all lectures
- Study Time: Sum of all hours
- Active Courses: Courses with lectures > 0

✅ **Test Mode Banner**: 
- Yellow banner at top shows you're in test mode
- Will disappear once Supabase is configured

## Important Limitations

⚠️ **Data resets on page refresh** - localStorage is temporary
⚠️ **No authentication** - Anyone can see/edit courses
⚠️ **No sync across devices** - Data only on this browser
⚠️ **No lectures yet** - Course cards show 0 lectures (will add later)

## How to Switch to Production (Supabase)

Follow these steps when ready:

1. **Read SUPABASE_SETUP.md** - Complete setup guide
   
2. **Create Supabase Project**: Go to https://supabase.com
   - Sign up (free, no credit card required!)
   - Create new project
   - Wait 2-3 minutes for setup

3. **Run SQL Scripts**:
   - Go to SQL Editor in Supabase
   - Run the database tables script
   - Run the RLS policies script

4. **Enable Auth Providers**:
   - Email (enabled by default)
   - Google OAuth (optional)
   - GitHub OAuth (optional)

5. **Create Storage Bucket**:
   - Name: `audio-recordings`
   - Add storage policies

6. **Copy Supabase Config**:
   - Project Settings → API
   - Copy URL and anon key to `.env.local`:
     ```bash
     NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```

7. **Restart Dev Server**:
   ```bash
   cd client
   npm run dev
   ```

8. **Yellow banner disappears** - You're now on Supabase! 🎉

## Testing Checklist

- [ ] Click "Add Course" button
- [ ] Fill out form (name, code, professor)
- [ ] Select category from dropdown
- [ ] Pick a color (8 options)
- [ ] Click "Add Course"
- [ ] See course appear in grid
- [ ] Check stats update correctly
- [ ] Hover over course card
- [ ] Click X button to delete
- [ ] Confirm deletion
- [ ] Course disappears

## Console Messages

Watch the browser console for helpful messages:
- `⚠️ Supabase not configured. Using local storage for testing.`
- `✅ Course added to local storage`
- `✅ Course deleted from local storage`

Once Supabase is configured:
- `✅ Course added to Supabase`
- `✅ Course deleted from Supabase`

## Questions?

- **Where is data stored?** Browser's localStorage (key: `koala_courses`)
- **Can I clear it?** Yes, open DevTools → Application → Local Storage → Clear
- **Will this break anything?** No, it's temporary and safe to test
- **When should I set up Supabase?** Whenever you're ready for real data persistence!
- **Does Supabase cost money?** No! Free tier is generous (500MB DB, 1GB storage)

---

**Ready to test?** Go to http://localhost:3004/courses and click "Add Course"! 🚀

**Ready for production?** Read `SUPABASE_SETUP.md` for the complete setup guide!
