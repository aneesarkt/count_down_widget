# Native Android Home-Screen Widget — Drop-in Files

These files add a real native Android home-screen widget to your Capacitor app.
Emergent cannot edit your `android/` project directly (it lives on your machine),
so copy each file to the path listed below inside your local Capacitor project,
then build the APK in Android Studio.

> ⚠️ **Replace `com.yourapp.package`** in every file with your real package name
> (the one in `capacitor.config.ts` / `applicationId` in `android/app/build.gradle`).
> Example: `com.example.retirementwidget`.

---

## Files & their destinations

| File in this folder | Copy to (inside your Capacitor `android/` project) |
| --- | --- |
| `CountdownWidgetProvider.kt` | `android/app/src/main/java/<your/package/path>/CountdownWidgetProvider.kt` |
| `res/xml/countdown_widget_info.xml` | `android/app/src/main/res/xml/countdown_widget_info.xml` |
| `res/layout/countdown_widget_layout.xml` | `android/app/src/main/res/layout/countdown_widget_layout.xml` |
| `res/drawable/widget_background.xml` | `android/app/src/main/res/drawable/widget_background.xml` |
| `AndroidManifest.snippet.xml` | Merge the `<receiver>` block into `android/app/src/main/AndroidManifest.xml` (inside `<application>`) |
| `MainActivity.patch.kt` | Apply the two-line patch to your `MainActivity.kt` (`onCreate` and `onResume`) |

If you don't have an `xml/` or `drawable/` folder under `res/`, just create them.

---

## Step-by-step

### 1. Create the package folder
In Android Studio, open `android/app/src/main/java/` and locate your package
folder (e.g. `com/example/retirementwidget`). Drop
`CountdownWidgetProvider.kt` there and update its `package` line to match.

### 2. Add resource files
Copy:
- `res/xml/countdown_widget_info.xml`
- `res/layout/countdown_widget_layout.xml`
- `res/drawable/widget_background.xml`

into the corresponding folders under `android/app/src/main/res/`.

### 3. Register the widget in `AndroidManifest.xml`
Open `android/app/src/main/AndroidManifest.xml` and, **inside** the
`<application>` tag, paste the `<receiver>` block from
`AndroidManifest.snippet.xml`. It must sit alongside your existing
`<activity>` entry, not inside it.

### 4. Refresh the widget when the app opens
Open `android/app/src/main/java/<your/package>/MainActivity.kt` and apply the
patch shown in `MainActivity.patch.kt`. It sends an
`ACTION_APPWIDGET_UPDATE` broadcast so the widget refreshes whenever the app is
opened or resumed.

### 5. (Optional) Share the target date from the web app
The widget will use a default target (4 years 10 months 25 days from first
launch), stored in `SharedPreferences`. If you also want the web/React side to
write the target, install the Capacitor Preferences plugin and write the key
`countdown_target_iso` with an ISO-8601 string:

```bash
yarn add @capacitor/preferences
npx cap sync android
```

```js
import { Preferences } from "@capacitor/preferences";
await Preferences.set({
  key: "countdown_target_iso",
  value: "2031-05-01T00:00:00Z",
});
```

Capacitor Preferences uses the SharedPreferences file named `CapacitorStorage`,
which is exactly what the widget reads from. After writing, call your existing
"refresh widget" flow (or just close and reopen the app — step 4 triggers a
refresh on resume).

### 6. Build & install
In Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**, install
on your Samsung device, then long-press home → **Widgets** → scroll to your
app. You'll see "Shifts Until Retirement". Drag it onto the home screen.

---

## What the widget shows
- Title: **SHIFTS UNTIL RETIREMENT**
- Big number: **days** remaining
- Smaller: **HH:MM** hours/minutes remaining
- Tapping the widget opens the Capacitor app
- Auto-refresh every 30 minutes (Android's minimum allowed period) + every
  time the app opens.
