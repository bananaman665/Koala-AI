# Quick Fix: "Failed to Fetch" Error

## The Problem
Supabase requires email confirmation by default. When you sign up, it sends a confirmation email, but the user isn't fully activated until they click the link.

## Solution 1: Disable Email Confirmation (Fastest - For Development)

### Steps:

1. **Go to your Supabase Dashboard:**
   https://supabase.com/dashboard/project/tcdhznrhnatlbseexiuqw

2. **Navigate to:** Authentication → Settings (in the left sidebar)

3. **Scroll down to "Email Auth" section**

4. **Find "Enable email confirmations"**

5. **Uncheck the box** ✅ → ⬜

6. **Click "Save"** at the bottom

7. **Try signing up again** - Should work immediately!

---

## Solution 2: Use Email Confirmation (Production-Ready)

If you want to keep email confirmation enabled:

### Steps:

1. **Sign up with a real email address** you can access

2. **Check your inbox** for an email from Supabase

3. **Click the confirmation link** in the email

4. **You'll be redirected and logged in**

---

## Solution 3: Use a Test Email Service

For development, you can use a temporary email service:

1. Go to https://temp-mail.org/ or https://10minutemail.com/
2. Copy the temporary email address
3. Use it to sign up
4. Check the temp-mail inbox for the confirmation email
5. Click the link

---

## Debugging: Check Supabase Logs

If the error persists:

1. Go to Supabase Dashboard
2. Click **Logs** → **Auth Logs**
3. Look for recent errors
4. Common issues:
   - Network/CORS errors
   - Invalid credentials
   - Rate limiting
   - Missing email templates

---

## Alternative: Update Signup to Handle Email Confirmation

You can update the signup to automatically confirm emails in development mode.

But the **easiest fix** is to disable email confirmations in Supabase settings (Solution 1 above).
