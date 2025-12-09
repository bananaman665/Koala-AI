# Koala.ai Mobile Setup Guide

This guide will help you set up and run the Koala.ai mobile apps on iOS and Android using Capacitor.

## Prerequisites

### Required Software

1. **Node.js** (v18+) and **npm**
2. **Capacitor CLI** (already installed in project dependencies)

### Platform-Specific Requirements

#### For iOS Development:
- **macOS** (required)
- **Xcode** (latest version from App Store)
- **CocoaPods**: Install with `sudo gem install cocoapods`
- **iOS Simulator** (comes with Xcode)

#### For Android Development:
- **Android Studio** ([Download](https://developer.android.com/studio))
- **Java Development Kit (JDK)** 11 or newer
- **Android SDK** (installed via Android Studio)
- **Android Emulator** or physical device

## Project Structure

```
client/
├── capacitor.config.ts    # Capacitor configuration
├── android/               # Native Android project
├── ios/                   # Native iOS project
├── src/                   # Next.js application source
└── public/                # Static assets
```

## Setup Steps

### 1. Install Dependencies

From the project root:

```bash
cd client
npm install
```

### 2. Start the Next.js Development Server

The Capacitor config points to `http://localhost:3000`, so you need the dev server running:

```bash
npm run dev
```

Keep this terminal window open. The dev server must be running for the mobile apps to work in development mode.

### 3. Sync Capacitor

After making changes to web code or plugins, sync to native projects:

```bash
npm run cap:sync
```

This command:
- Copies web assets to native projects
- Updates native dependencies
- Syncs plugin configurations

## Running on iOS

### Method 1: Using Xcode (Recommended)

1. Open the iOS project:
   ```bash
   npm run cap:open:ios
   ```

2. In Xcode:
   - Select a simulator or connected device from the dropdown
   - Click the **Play** button (▶️) or press `Cmd + R`
   - Wait for the app to build and launch

### Method 2: Using Capacitor CLI

```bash
npm run cap:run:ios
```

This will:
- Build the app
- Launch the default simulator
- Install and run the app

### iOS Troubleshooting

**Issue: "No development team selected"**
- In Xcode, go to **Signing & Capabilities**
- Select your development team
- If no team available, add your Apple ID in Xcode Preferences → Accounts

**Issue: "CocoaPods not installed"**
```bash
sudo gem install cocoapods
cd ios/App
pod install
```

## Running on Android

### Method 1: Using Android Studio (Recommended)

1. Open the Android project:
   ```bash
   npm run cap:open:android
   ```

2. In Android Studio:
   - Wait for Gradle sync to complete
   - Select an emulator or connected device from the dropdown
   - Click the **Run** button (▶️) or press `Shift + F10`
   - Wait for the app to build and launch

### Method 2: Using Capacitor CLI

```bash
npm run cap:run:android
```

This will:
- Build the app
- Launch the default emulator (or use connected device)
- Install and run the app

### Android Troubleshooting

**Issue: "SDK not found"**
- Open Android Studio
- Go to Settings → Appearance & Behavior → System Settings → Android SDK
- Install the latest SDK version
- Set `ANDROID_HOME` environment variable:
  ```bash
  export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
  export ANDROID_HOME=$HOME/Android/Sdk          # Linux
  ```

**Issue: "Gradle build failed"**
- In Android Studio: File → Invalidate Caches → Invalidate and Restart
- Or manually: `cd android && ./gradlew clean`

## Testing on Physical Devices

### iOS Device

1. Connect your iPhone/iPad via USB
2. Trust the computer on your device
3. In Xcode:
   - Select your device from the dropdown
   - Signing → Select your team
   - Click Run

**Note:** You may need to enable Developer Mode on iOS 16+ devices (Settings → Privacy & Security → Developer Mode).

### Android Device

1. Enable Developer Options on your Android device:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   
2. Enable USB Debugging:
   - Settings → Developer Options → USB Debugging

3. Connect via USB and run the app from Android Studio

## Changing the Server URL

For testing on real devices, you need to use your computer's local IP address instead of `localhost`.

### Find Your IP Address

**macOS/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```bash
ipconfig
```

Look for your local IP (usually starts with `192.168.` or `10.`).

### Update capacitor.config.ts

```typescript
const config: CapacitorConfig = {
  // ...
  server: {
    url: 'http://192.168.1.100:3000',  // Replace with your IP
    cleartext: true,
  },
};
```

After updating, run:
```bash
npm run cap:sync
```

## Available Capacitor Scripts

Added to `client/package.json`:

- `npm run cap:sync` - Sync web code to native projects
- `npm run cap:open:ios` - Open iOS project in Xcode
- `npm run cap:open:android` - Open Android project in Android Studio
- `npm run cap:run:ios` - Build and run on iOS
- `npm run cap:run:android` - Build and run on Android

## Features Enabled

### Plugins Configured

1. **@capacitor/splash-screen** - Splash screen on app launch
2. **@capacitor/status-bar** - Native status bar control
3. **@capacitor/camera** - Camera and photo library access
4. **@capacitor/filesystem** - File system operations
5. **@capacitor/haptics** - Haptic feedback
6. **@capacitor/app** - App state and lifecycle events

### Permissions Granted

**Android:**
- Internet access
- Camera
- Storage (read/write)
- Vibration
- Media images (Android 13+)

**iOS:**
- Camera usage
- Photo library access
- Photo library add usage
- Microphone usage (for lecture recording)

## Building for Production

### iOS Production Build

1. Open Xcode: `npm run cap:open:ios`
2. Change the build configuration to **Release**
3. Select **Any iOS Device** as the destination
4. Product → Archive
5. Follow the App Store submission workflow

### Android Production Build

1. Generate a signing key (first time only):
   ```bash
   keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Configure signing in `android/app/build.gradle`

3. Build the release APK/AAB:
   ```bash
   cd android
   ./gradlew assembleRelease   # For APK
   ./gradlew bundleRelease     # For AAB (Play Store)
   ```

4. Find the output:
   - APK: `android/app/build/outputs/apk/release/app-release.apk`
   - AAB: `android/app/build/outputs/bundle/release/app-release.aab`

## Common Issues

### "Cannot connect to dev server"

- Ensure `npm run dev` is running on port 3000
- For physical devices, update `server.url` in `capacitor.config.ts` with your local IP
- Check firewall settings aren't blocking connections

### "Plugins not working"

- Run `npm run cap:sync` after installing new plugins
- Clean and rebuild the native projects
- Check that permissions are properly configured

### "White screen on launch"

- Check the browser console in the native IDE
- Verify the Next.js dev server is running
- Check the `server.url` in `capacitor.config.ts`

## Next Steps

1. **Start the dev server:** `npm run dev`
2. **Sync Capacitor:** `npm run cap:sync`
3. **Open your platform:** `npm run cap:open:ios` or `npm run cap:open:android`
4. **Run the app** from the native IDE

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor with Next.js](https://capacitorjs.com/docs/guides/nextjs)
- [iOS Development](https://developer.apple.com/ios/)
- [Android Development](https://developer.android.com/)

---

**Need help?** Check the main [SETUP.md](./SETUP.md) for general project setup or create an issue in the repository.
