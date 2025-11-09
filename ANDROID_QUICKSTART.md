# 🚀 Android Quick Start

Get your Android app running in 5 minutes!

## Quick Setup

### 1. Prerequisites Check
```bash
# Check Node.js
node --version  # Should be 18+

# Check Java
java -version  # Should be 17+

# Check Android SDK (if Android Studio installed)
echo $ANDROID_HOME  # Should show path to SDK
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Build & Sync
```bash
npm run android:sync
```

### 4. Open in Android Studio
```bash
npm run android:open
```

### 5. Run!
- Click the green "Run" button (▶️) in Android Studio
- Or use: `npm run android:run`

## Common Commands

```bash
# Build web app and sync to Android
npm run android:sync

# Open Android Studio
npm run android:open

# Build debug APK
npm run android:build

# Build release AAB (for Play Store)
npm run android:build:release
```

## First Time Setup

If you haven't set up Android development before:

1. **Install Android Studio** from https://developer.android.com/studio
2. **Open Android Studio** → SDK Manager → Install:
   - Android SDK Platform 33+
   - Android SDK Build-Tools
3. **Set Environment Variables:**
   
   **Windows (PowerShell):**
   ```powershell
   [System.Environment]::SetEnvironmentVariable('ANDROID_HOME', 'C:\Users\YourUsername\AppData\Local\Android\Sdk', 'User')
   ```
   
   **macOS/Linux:**
   ```bash
   echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.bashrc
   echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.bashrc
   source ~/.bashrc
   ```

## Troubleshooting

**"SDK location not found"**
- Create `android/local.properties`:
  ```
  sdk.dir=C:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk
  ```

**"Command not found: gradlew"**
- Use: `cd android && ./gradlew assembleDebug` (or `gradlew.bat` on Windows)

**App shows blank screen**
- Run: `npm run build && npm run android:sync`
- Check Logcat in Android Studio for errors

## Next Steps

- See [ANDROID_SETUP.md](./ANDROID_SETUP.md) for detailed documentation
- Test on a physical device or emulator
- Customize app icon and splash screen
- Prepare for Play Store release


