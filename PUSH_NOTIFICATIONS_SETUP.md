# Push Notifications Setup Guide

This guide covers the complete setup for push notifications in Koala.ai using Capacitor and Firebase Cloud Messaging (FCM).

## ✅ Completed Setup

### 1. **Package Installation**
- ✅ `@capacitor/push-notifications@7` installed

### 2. **Android Configuration**
- ✅ `POST_NOTIFICATIONS` permission added to `AndroidManifest.xml`

### 3. **Frontend Components**
- ✅ `usePushNotifications` hook created (`src/hooks/usePushNotifications.ts`)
- ✅ `PushNotificationProvider` component created (`src/components/PushNotificationProvider.tsx`)
- ✅ Integration with existing Toast system for notifications
- ✅ Notification action handling (open_streak, open_lecture, open_quiz)

### 4. **Backend Setup**
- ✅ `POST /api/notifications/send` endpoint created
- ✅ Notification storage in database

### 5. **Capacitor Configuration**
- ✅ Push notification plugin settings added to `capacitor.config.ts`

### 6. **Database Schema**
- ✅ SQL migration provided (`src/lib/migrations/create_notifications_table.sql`)
  - `notifications` table (notification history)
  - `device_tokens` table (device registration)

---

## 📋 Remaining Setup (Required for Production)

### Step 1: Firebase Cloud Messaging Setup

1. **Create Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project named "Koala.ai"
   - Enable Cloud Messaging

2. **Get Android Credentials:**
   - Download `google-services.json` from Firebase console
   - Place it in: `client/android/app/google-services.json`

3. **Get Server Key:**
   - In Firebase Console → Project Settings → Cloud Messaging
   - Copy the Server API Key
   - Add to environment: `FIREBASE_SERVER_KEY=<your-key>`

4. **Get iOS Certificates:**
   - Request Push Notification Certificate from Apple Developer Account
   - Upload to Firebase console
   - Download and configure in Xcode

### Step 2: Database Migration

Run the migration to create notification tables:

```bash
# Using Supabase dashboard:
# 1. Go to SQL Editor
# 2. Run the SQL from: src/lib/migrations/create_notifications_table.sql

# Or using Supabase CLI:
supabase db push
```

### Step 3: Device Token Registration

Create an API endpoint to register device tokens:

```typescript
// src/app/api/notifications/register-device/route.ts
export async function POST(request: NextRequest) {
  const { token, platform } = await request.json()
  const userId = await getCurrentUserId() // Your auth implementation

  // Store token in device_tokens table
  await supabase
    .from('device_tokens')
    .insert([{ user_id: userId, token, platform, active: true }])

  return NextResponse.json({ success: true })
}
```

Then register tokens in your app:

```typescript
// In usePushNotifications.ts
useEffect(() => {
  const registerDeviceToken = async () => {
    const info = await Device.getInfo()
    const result = await PushNotifications.getDeliveryId()

    await fetch('/api/notifications/register-device', {
      method: 'POST',
      body: JSON.stringify({
        token: result.id,
        platform: info.platform,
      }),
    })
  }

  registerDeviceToken()
}, [])
```

### Step 4: Send Actual Push Notifications

Update the `/api/notifications/send` endpoint to use Firebase Cloud Messaging:

```typescript
// Uncomment the FCM section in src/app/api/notifications/send/route.ts

const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `key=${process.env.FIREBASE_SERVER_KEY}`,
  },
  body: JSON.stringify({
    to: deviceToken, // Get from device_tokens table
    notification: {
      title,
      body: notificationBody,
    },
    data,
  }),
})
```

### Step 5: Implement Notification Triggers

Create cron jobs or scheduled tasks for different notification types:

```typescript
// Example: Daily study reminder
export async function sendDailyReminder() {
  const { data: users } = await supabase
    .from('users')
    .select('id')
    .eq('settings->send_reminders', true)

  for (const user of users) {
    await sendPushNotification(user.id, {
      title: '🎓 Time to Study!',
      body: 'Keep your streak alive with a study session',
      data: { action: 'open_streak' },
    })
  }
}

// Example: Streak milestone
export async function celebrateStreak(userId: string, streak: number) {
  if (streakMilestones.includes(streak)) {
    await sendPushNotification(userId, {
      title: `🔥 ${streak} Day Streak!`,
      body: `Amazing! You've maintained your ${streak}-day streak!`,
      data: { action: 'open_streak' },
    })
  }
}
```

---

## 🧪 Testing

### Local Testing

1. **Test on iOS:**
   ```bash
   npm run cap:run:ios
   ```
   - App will request notification permissions
   - Grant permissions when prompted

2. **Test on Android:**
   ```bash
   npm run cap:run:android
   ```
   - App will request notification permissions (Android 13+)
   - Grant permissions in app settings

3. **Check Console Logs:**
   ```typescript
   // Logs will appear in:
   // - Xcode console (iOS)
   // - Android Studio Logcat (Android)
   // - Browser console (Web)
   ```

### Testing Notifications

Create a test endpoint:

```typescript
// src/app/api/notifications/test/route.ts
export async function POST(request: NextRequest) {
  const { userId } = await request.json()

  await sendPushNotification(userId, {
    title: '🧪 Test Notification',
    body: 'This is a test push notification',
    data: { action: 'open_streak' },
  })

  return NextResponse.json({ success: true })
}
```

---

## 🔄 Architecture Overview

```
User App (iOS/Android/Web)
    ↓
Capacitor PushNotifications Plugin
    ↓
Device Token Registration
    ↓
Device Tokens Table (Supabase)
    ↓
Your Backend API
    ↓
Firebase Cloud Messaging (FCM)
    ↓
Apple Push Notification (APNs) / Google Cloud Messaging (GCM)
    ↓
User Device
```

---

## 📚 Files Created/Modified

### New Files:
- `src/hooks/usePushNotifications.ts` - Push notification hook
- `src/components/PushNotificationProvider.tsx` - Provider component
- `src/app/api/notifications/send/route.ts` - Notification endpoint
- `src/lib/migrations/create_notifications_table.sql` - Database schema

### Modified Files:
- `android/app/src/main/AndroidManifest.xml` - Added POST_NOTIFICATIONS permission
- `capacitor.config.ts` - Added push notification plugin settings
- `src/components/Providers.tsx` - Added PushNotificationProvider

---

## 🚀 Production Deployment

Before deploying to production:

1. ✅ Ensure Firebase credentials are in environment variables
2. ✅ Run database migrations on production
3. ✅ Test on both iOS and Android devices
4. ✅ Configure push notification triggers (reminders, milestones, etc.)
5. ✅ Implement user notification preferences
6. ✅ Set up monitoring and error tracking
7. ✅ Create notification analytics tracking

---

## 🐛 Troubleshooting

### Notifications Not Being Delivered

1. Check device tokens are being registered:
   ```sql
   SELECT * FROM device_tokens WHERE user_id = '<user-id>';
   ```

2. Verify Firebase credentials:
   ```bash
   echo $FIREBASE_SERVER_KEY
   ```

3. Check Android manifest for permissions:
   ```bash
   grep POST_NOTIFICATIONS android/app/src/main/AndroidManifest.xml
   ```

4. Review console logs for errors:
   - Browser console
   - Xcode console
   - Android Studio Logcat

### Permission Issues

- **Android 13+:** POST_NOTIFICATIONS permission required (already added)
- **iOS:** Push Notification capability required in Xcode
- **Web:** Notification API requires HTTPS (not needed for this implementation)

### Firebase Issues

- Ensure `google-services.json` is in correct location
- Verify Server API Key is valid
- Check Firebase project is linked to correct app

---

## 📖 References

- [Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Apple Push Notification (APNs)](https://developer.apple.com/documentation/usernotifications)
- [Android Push Notification](https://firebase.google.com/docs/android/setup)
