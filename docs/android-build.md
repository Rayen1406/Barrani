# Building the برّاني APK

The `android/` directory is generated (`npx cap add android`) and untracked.
These are the manual customizations applied on top of it — **if you ever
regenerate the platform, reapply each one**.

## Prerequisites

- Android Studio (for its bundled JDK 21 — system Java 25 is too new for Gradle)
- Android SDK at `~/Library/Android/sdk`
- Signing keystore at `~/keystores/barrani-release.keystore` with
  `~/keystores/barrani-keystore.properties` beside it (storeFile,
  storePassword, keyAlias, keyPassword). **Back both files up** — losing the
  keystore means installed copies can never be updated.

## One-time setup after `npx cap add android`

1. `printf 'sdk.dir=%s/Library/Android/sdk\n' "$HOME" > android/local.properties`
2. **Strip the INTERNET permission** from
   `android/app/src/main/AndroidManifest.xml` (delete the
   `<uses-permission android:name="android.permission.INTERNET" />` line).
   Capacitor serves the bundled assets by intercepting WebView requests
   in-process, so the app runs without it — the APK is provably offline.
3. **Icons and splash**: `npx @capacitor/assets generate --android
   --iconBackgroundColor '#141416' ...` (sources live in `assets/`), then
   delete the ~10 MB of generated `drawable-land-*`, `drawable-port-*` and
   `drawable-night` splash variants and `drawable/splash.png`, and replace
   with the layer-list `drawable/splash.xml` (solid `#141416` + centered
   `drawable-nodpi/splash_logo.png` at 640px).
4. **Signing**: in `android/app/build.gradle`, load
   `~/keystores/barrani-keystore.properties` and wire a release
   `signingConfig` (see the properties-file pattern in git history or the
   Capacitor docs). Also set `versionName` to match `package.json`.

## Build

```bash
npm run build && npx cap sync android
cd android
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk` — a signed
universal APK, sideloadable over WhatsApp/Bluetooth. Bump `versionCode` (and
`versionName`) in `android/app/build.gradle` before each shared release, or
phones will refuse to update over an installed copy.

## On the receiving phone

Installing a self-signed APK triggers the "install unknown apps" warning —
expected. Tap through: Settings → allow from this source, then install.
