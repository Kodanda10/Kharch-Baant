# 📱 Android App Setup Guide

This guide will help you build and run the Kharch Baant Android app using Capacitor.

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v18 or higher)
   ```bash
   node --version
   ```

2. **Java Development Kit (JDK)** (v21 LTS recommended)
   ```bash
   java -version
   ```
   - **Recommended:** Eclipse Temurin (OpenJDK) 21 LTS
     - Download from: https://adoptium.net/temurin/releases/?version=21
     - Select: Windows x64 → JDK → .msi installer
     - Default install path: `C:\Program Files\Eclipse Adoptium\jdk-21.x.x-hotspot`
   - **Alternative:** Oracle JDK 21
     - Download from: https://www.oracle.com/java/technologies/downloads/#java21
     - Default install path: `C:\Program Files\Java\jdk-21`
   
   **Important:** After installation, note the JDK installation path for Gradle configuration.

3. **Android Studio** (latest version recommended)
   - Download from: https://developer.android.com/studio
   - Includes Android SDK, Gradle, and Android Emulator

4. **Android SDK** (via Android Studio)
   - Open Android Studio → SDK Manager
   - Install Android SDK Platform 33 or higher
   - Install Android SDK Build-Tools

5. **Environment Variables**
   - Set `ANDROID_HOME` to your Android SDK path
   - Add `$ANDROID_HOME/platform-tools` to your PATH
   
   **Windows:**
   ```powershell
   $env:ANDROID_HOME = "C:\Users\YourUsername\AppData\Local\Android\Sdk"
   $env:PATH += ";$env:ANDROID_HOME\platform-tools"
   ```

   **macOS/Linux:**
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

## Project Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Build Web App

First, build the web app for production:

```bash
npm run build
```

This creates the `dist` folder that Capacitor will use.

### 3. Sync with Android

Sync the web assets to the Android project:

```bash
npm run android:sync
```

This command:
- Builds the web app (`npm run build`)
- Copies files to `android/app/src/main/assets/public`
- Updates Capacitor configuration

## Development Workflow

### Option 1: Using Android Studio (Recommended)

1. **Open Android Studio:**
   ```bash
   npm run android:open
   ```
   Or manually open `android` folder in Android Studio.

2. **Run the App:**
   - Connect an Android device via USB (with USB debugging enabled)
   - Or start an Android emulator
   - Click the "Run" button (▶️) in Android Studio

### Option 2: Using Command Line

1. **Build and Run:**
   ```bash
   npm run android:run
   ```

2. **Build APK only:**
   ```bash
   npm run android:build
   ```
   APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

## Building for Production

### Debug Build (APK)

```bash
npm run android:build
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release Build (AAB - for Play Store)

1. **Create a Keystore** (first time only):
   ```bash
   keytool -genkey -v -keystore kharch-baant-release.keystore -alias kharch-baant -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Update `capacitor.config.ts`:**
   ```typescript
   android: {
     buildOptions: {
       keystorePath: 'path/to/kharch-baant-release.keystore',
       keystorePassword: 'your-keystore-password',
       keystoreAlias: 'kharch-baant',
       keystoreAliasPassword: 'your-alias-password',
       releaseType: 'AAB'
     }
   }
   ```

3. **Build Release:**
   ```bash
   npm run android:build:release
   ```

   Output: `android/app/build/outputs/bundle/release/app-release.aab`

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run android:sync` | Build web app and sync to Android |
| `npm run android:open` | Open Android project in Android Studio |
| `npm run android:run` | Build, sync, and run on connected device |
| `npm run android:build` | Build debug APK |
| `npm run android:build:release` | Build release AAB for Play Store |

## Troubleshooting

### Issue: "Command not found: gradlew"

**Solution:** Make sure you're in the `android` directory or use the full path:
```bash
cd android && ./gradlew assembleDebug
```

**Windows:**
```bash
cd android && gradlew.bat assembleDebug
```

### Issue: "SDK location not found"

**Solution:** Create `android/local.properties`:
```properties
sdk.dir=C:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk
```

### Issue: "Unsupported class file major version 69" or Java version mismatch

**Problem:** Gradle doesn't support Java 25. You need Java 21 (LTS).

**Solution:** 
1. Install Java 21 (see Prerequisites section above)

2. Configure Gradle to use Java 21 by adding to `android/gradle.properties`:
   ```properties
   # Point Gradle to Java 21 installation
   org.gradle.java.home=E:\\Program Files\\Java\\jdk-21
   ```
   **Important:** Use double backslashes (`\\`) in Windows paths. Update the path to match your Java 21 installation location.

3. Update npm scripts in `package.json` to set JAVA_HOME for Capacitor commands:
   The `android:run`, `android:build`, and `android:build:release` scripts have been configured to automatically set JAVA_HOME to Java 21 before running.

4. Stop any running Gradle daemons (if needed):
   ```bash
   cd android
   gradlew.bat --stop
   ```

5. Verify Java 21 is being used:
   ```bash
   cd android
   gradlew.bat -version
   ```
   Should show Java version 21.x.x

### Issue: "Build failed: OutOfMemoryError"

**Solution:** Increase Gradle memory in `android/gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx2048m -XX:MaxPermSize=512m
```

### Issue: "Plugin not found" or Capacitor errors

**Solution:** Reinstall Capacitor dependencies:
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap sync android
```

### Issue: App shows blank screen

**Solution:**
1. Check that `npm run build` completed successfully
2. Run `npm run android:sync` again
3. Check browser console in Android Studio's Logcat for errors
4. Verify environment variables are set correctly

### Issue: Network requests fail

**Solution:** 
- Check `capacitor.config.ts` server settings
- For development, ensure `hostname: 'localhost'` is set
- For production, set the `url` to your production server

## Testing on Physical Device

1. **Enable Developer Options:**
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back to Settings → Developer Options
   - Enable "USB Debugging"

2. **Connect Device:**
   ```bash
   adb devices
   ```
   Should show your device.

3. **Run App:**
   ```bash
   npm run android:run
   ```

## Testing on Emulator

1. **Create Emulator in Android Studio:**
   - Tools → Device Manager → Create Device
   - Select a device (e.g., Pixel 5)
   - Download a system image (API 33+)
   - Finish setup

2. **Start Emulator:**
   ```bash
   emulator -avd YourEmulatorName
   ```

3. **Run App:**
   ```bash
   npm run android:run
   ```

## App Configuration

### App ID & Name

Edit `capacitor.config.ts`:
```typescript
appId: 'com.kharchbaant.app',
appName: 'Kharch Baant',
```

### Version & Build Number

Edit `android/app/build.gradle`:
```gradle
versionCode 1        // Increment for each release
versionName "1.0"    // User-facing version
```

### App Icon

Replace icons in:
- `android/app/src/main/res/mipmap-*/ic_launcher.png`
- `android/app/src/main/res/mipmap-*/ic_launcher_foreground.png`

Use Android Asset Studio: https://romannurik.github.io/AndroidAssetStudio/

### Splash Screen

Edit `android/app/src/main/res/drawable/splash.png` or update in `capacitor.config.ts`:
```typescript
plugins: {
  SplashScreen: {
    backgroundColor: '#1e293b',
    // ... other settings
  }
}
```

## Publishing to Google Play Store

1. **Prepare Release Build:**
   - Follow "Building for Production" steps above
   - Test thoroughly on multiple devices

2. **Create Play Store Listing:**
   - Go to Google Play Console
   - Create new app
   - Fill in store listing details
   - Upload screenshots and graphics

3. **Upload AAB:**
   - Go to Production → Create Release
   - Upload `app-release.aab`
   - Fill in release notes
   - Submit for review

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/guide)
- [Google Play Console](https://play.google.com/console)

## Notes

- The Android app uses the same codebase as the web app
- Changes to React code require rebuilding (`npm run build`) and syncing (`npm run android:sync`)
- Native Android code is in `android/app/src/main/java/com/kharchbaant/app/`
- Web assets are copied to `android/app/src/main/assets/public/` during sync


