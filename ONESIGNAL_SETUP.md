# OneSignal Push Notifications Setup Guide

Complete setup guide for OneSignal push notifications in Koala.ai.

## ✅ What's Already Configured

- OneSignal SDK installed (`react-native-onesignal`)
- Frontend initialization and notification listeners
- Backend API endpoint for sending notifications
- Database schema for storing notification history and device tokens
- Environment variable placeholders

---

## 📋 Step-by-Step Setup Instructions

### Step 1: Create OneSignal Account

1. Go to [OneSignal.com](https://onesignal.com)
2. Click **Sign Up** (free tier available)
3. Create your account
4. Verify your email

### Step 2: Create OneSignal App

1. In OneSignal dashboard, click **Create App**
2. Enter app name: `Koala.ai`
3. Select **Native & Cross Platform** → **Capacitor**
4. Click **Create App**

### Step 3: Get Your App ID

1. After app creation, you'll see the **App ID** in dashboard
2. Copy this ID
3. Add to your `.env.local` file:
   ```env
   NEXT_PUBLIC_ONESIGNAL_APP_ID=your_app_id_here
   ```

### Step 4: Configure Android

#### 4a. Get Google Cloud Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Firebase Cloud Messaging API**
4. Go to **Service Accounts** → Create service account
5. Generate a new private key (JSON)
6. Open the JSON file, find `"private_key"` and `"client_email"`

#### 4b. Add to OneSignal

1. In OneSignal dashboard → **Settings** → **Keys & IDs**
2. Under **Android**, scroll to **Google Cloud Messaging**
3. Paste your `private_key` and `client_email`
4. Click **Save**

#### 4c. Add google-services.json

1. Download `google-services.json` from Firebase console
2. Place it at: `client/android/app/google-services.json`
3. Commit to version control

### Step 5: Configure iOS

#### 5a. Create Apple Certificates

1. Go to [Apple Developer Account](https://developer.apple.com)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Under **Keys**, create a new **Key**
4. Select **Apple Push Notifications service (APNs)**
5. Download the `.p8` file
6. Note your **Team ID** and **Key ID**

#### 5b. Add to OneSignal

1. In OneSignal dashboard → **Settings** → **Keys & IDs**
2. Under **iOS**, scroll to **Apple Push Notification Authentication**
3. Upload your `.p8` file
4. Enter your **Team ID** and **Key ID**
5. Click **Save**

### Step 6: Set Environment Variables

Create or update `.env.local`:

```env
# OneSignal Configuration
NEXT_PUBLIC_ONESIGNAL_APP_ID=your_app_id_from_step_3

# Optional: For sending notifications from backend
ONESIGNAL_API_KEY=your_rest_api_key_from_step_7
```

### Step 7: Get OneSignal REST API Key (Optional - for backend notifications)

1. In OneSignal dashboard → **Settings** → **Keys & IDs**
2. Find **REST API Key**
3. Copy it and add to `.env.local`:
   ```env
   ONESIGNAL_API_KEY=your_rest_api_key
   ```

### Step 8: Create Database Tables

Run the SQL migration in your Supabase dashboard:

```sql
-- Create notifications table for storing push notification history
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  data jsonb DEFAULT NULL,
  read_at timestamptz DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for user notifications lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own notifications
CREATE POLICY "Users can read own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Service role can insert notifications
CREATE POLICY "Service role can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Create device_tokens table for storing OneSignal subscription IDs
CREATE TABLE IF NOT EXISTS public.device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  platform text NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz DEFAULT NULL
);

-- Create index for device token lookups
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON public.device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_token ON public.device_tokens(token);

-- Enable RLS
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own device tokens
CREATE POLICY "Users can read own device tokens"
  ON public.device_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can manage their own device tokens
CREATE POLICY "Users can manage own device tokens"
  ON public.device_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own device tokens"
  ON public.device_tokens
  FOR DELETE
  USING (auth.uid() = user_id);
```

Steps to run:
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor**
4. Click **New Query**
5. Paste the SQL above
6. Click **Run**

### Step 9: Register Device Tokens

Create an endpoint to save OneSignal subscription IDs:

```typescript
// Create file: src/app/api/notifications/register-device/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Device } from '@capacitor/device'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(request: NextRequest) {
  try {
    const { token, platform } = await request.json()

    // Get current user from auth
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: user } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (!user.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Store device token
    const { error } = await supabase
      .from('device_tokens')
      .insert([
        {
          user_id: user.user.id,
          token,
          platform,
          active: true,
        },
      ])

    if (error) {
      return NextResponse.json(
        { error: 'Failed to register device token' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Device token registered' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in register device endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Step 10: Update Hook to Register Tokens

The `usePushNotifications` hook already has the logic. It will automatically register tokens when initialized.

### Step 11: Test the Setup

#### Testing on Web (Development)

1. Run the dev server:
   ```bash
   npm run dev
   ```

2. Open [localhost:3000](http://localhost:3000)

3. Browser should ask for notification permission

4. Check browser console for:
   ```
   OneSignal initialized successfully
   OneSignal subscription ID: <subscription-id>
   ```

#### Testing on iOS

1. Build and run:
   ```bash
   npm run cap:build:ios
   npm run cap:run:ios
   ```

2. App will request notification permission
3. Grant permission
4. Check Xcode console logs

#### Testing on Android

1. Build and run:
   ```bash
   npm run cap:build:android
   npm run cap:run:android
   ```

2. App will request notification permission (Android 13+)
3. Grant in app settings
4. Check Android Studio Logcat

### Step 12: Send Test Notifications

#### From OneSignal Dashboard

1. OneSignal Dashboard → **Messaging** → **New Campaign**
2. Select **Push Notification**
3. Enter title and message
4. Under **Recipient**, select your app users
5. Click **Send**

#### From Your Backend

```typescript
// Call this from your server/API
await sendPushNotification(userId, {
  title: '🎓 Study Reminder',
  body: 'Keep your streak alive!',
  data: { action: 'open_streak' },
})
```

---

## 🎯 Example: Sending Notifications

### Send Streak Reminder

```typescript
// src/app/api/reminders/send-streak-reminder/route.ts
import { sendPushNotification } from '@/hooks/usePushNotifications'

export async function POST(request: NextRequest) {
  const { userId } = await request.json()

  await sendPushNotification(userId, {
    title: '🔥 Keep Your Streak Alive!',
    body: 'Complete a study session today',
    data: { action: 'open_streak' },
  })

  return NextResponse.json({ success: true })
}
```

### Send Achievement Celebration

```typescript
await sendPushNotification(userId, {
  title: '🏆 Achievement Unlocked!',
  body: 'You completed 7 days of study!',
  data: { action: 'open_streak' },
})
```

---

## 🔧 Troubleshooting

### Notifications Not Appearing

**Check:**
1. Environment variables are set correctly
2. App ID matches OneSignal dashboard
3. Permissions are granted on device
4. Device token is registered in database:
   ```sql
   SELECT * FROM device_tokens WHERE user_id = 'YOUR_USER_ID';
   ```

### Permission Errors

**Android:**
- Ensure `POST_NOTIFICATIONS` permission in `AndroidManifest.xml`

**iOS:**
- Ensure Push Notification capability is enabled in Xcode

**Web:**
- Requires HTTPS (localhost works in development)

### Device Not Receiving Notifications

1. Check OneSignal dashboard → **Users** → Search your user
2. Verify subscription is active
3. Check notification logs for errors
4. Try sending test notification from OneSignal dashboard

### API Key Not Working

1. Ensure `ONESIGNAL_API_KEY` is in `.env.local` or environment
2. Verify it's the REST API key, not app ID
3. Check OneSignal **Settings** → **Keys & IDs** → **REST API Key**

---

## 📚 Useful Links

- [OneSignal Documentation](https://documentation.onesignal.com)
- [OneSignal React Native SDK](https://github.com/OneSignal/OneSignal-React-Native-SDK)
- [Capacitor Guide](https://capacitorjs.com/docs)
- [Apple Push Notifications](https://developer.apple.com/documentation/usernotifications)
- [Google Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)

---

## 📝 Files Modified/Created

### New Files:
- `src/hooks/usePushNotifications.ts` - OneSignal initialization
- `src/components/PushNotificationProvider.tsx` - Provider component
- `src/app/api/notifications/send/route.ts` - Send notifications
- `src/app/api/notifications/register-device/route.ts` - Register tokens

### Modified Files:
- `src/components/Providers.tsx` - Added PushNotificationProvider
- `android/app/src/main/AndroidManifest.xml` - POST_NOTIFICATIONS permission
- `capacitor.config.ts` - Push notification plugin settings
- `package.json` - OneSignal packages added

---

## ✨ Next Steps

1. ✅ Create OneSignal account (Step 1-3)
2. ✅ Configure Android (Step 4)
3. ✅ Configure iOS (Step 5)
4. ✅ Set environment variables (Step 6-7)
5. ✅ Create database tables (Step 8)
6. ✅ Test on device (Step 11)
7. ✅ Send test notifications (Step 12)
8. 🔄 Set up automated reminders (see examples)
