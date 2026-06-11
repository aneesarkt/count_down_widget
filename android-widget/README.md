# Native Android Home-Screen Widget — Java Drop-in for Capacitor

Package: `com.anees.countdownwidget`
Capacitor project: Java-based (`MainActivity extends BridgeActivity`)

These files add a real native Android home-screen widget to your local
Capacitor Android Studio project. Emergent cannot edit your `android/` folder
directly (your APK lives on your machine), so copy each file to the path below,
then build the APK in Android Studio.

---

## File map

| File in this folder | Copy to (inside your Capacitor `android/` project) |
| --- | --- |
| `CountdownWidgetProvider.java` | `android/app/src/main/java/com/anees/countdownwidget/CountdownWidgetProvider.java` |
| `MainActivity.java` | `android/app/src/main/java/com/anees/countdownwidget/MainActivity.java` (replaces your current 3-line MainActivity) |
| `res/xml/countdown_widget_info.xml` | `android/app/src/main/res/xml/countdown_widget_info.xml` |
| `res/layout/countdown_widget_layout.xml` | `android/app/src/main/res/layout/countdown_widget_layout.xml` |
| `res/drawable/widget_background.xml` | `android/app/src/main/res/drawable/widget_background.xml` |
| `AndroidManifest.snippet.xml` | Merge the `<receiver>` block into `android/app/src/main/AndroidManifest.xml` (inside `<application>`) |
| `strings.snippet.xml` | Merge the two `<string>` entries into `android/app/src/main/res/values/strings.xml` (inside `<resources>`) |

If the `xml/` or `drawable/` folders don't exist under `res/`, create them.

---

## Step-by-step (Java, Capacitor)

### 1. Drop in the Java files
- Copy `CountdownWidgetProvider.java` into
  `android/app/src/main/java/com/anees/countdownwidget/`.
- Replace `android/app/src/main/java/com/anees/countdownwidget/MainActivity.java`
  with the version in this folder. It keeps `extends BridgeActivity` and adds
  an `onResume()` that refreshes the widget.

### 2. Add the resource files
Copy:
- `res/xml/countdown_widget_info.xml`
- `res/layout/countdown_widget_layout.xml`
- `res/drawable/widget_background.xml`

into the matching folders under `android/app/src/main/res/`.

### 3. Register the receiver in `AndroidManifest.xml`
Open `android/app/src/main/AndroidManifest.xml` and, **inside** the
`<application>` tag, paste the `<receiver>` block from
`AndroidManifest.snippet.xml`. Put it next to your existing `<activity>` entry.

### 4. Add the strings
Open `android/app/src/main/res/values/strings.xml` and, **inside** the
`<resources>` root, paste the two `<string>` lines from `strings.snippet.xml`.

### 5. Sync Capacitor (only if you changed anything in `frontend/`)
```bash
npx cap sync android
```
(You can skip this if you only added the native files above.)

### 6. Build & install
In Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)** → install
on your Samsung device → long-press home → **Widgets** → scroll to "Shifts
Until Retirement" → drag onto the home screen.

---

## Behavior

- Title: `SHIFTS UNTIL RETIREMENT`
- Big number: **days** remaining
- Smaller: `HH:MM` hours/minutes remaining
- Tapping the widget opens the Capacitor app via the launch intent for
  `com.anees.countdownwidget`.
- The widget auto-refreshes every **30 minutes** (`updatePeriodMillis=1800000`).
- `MainActivity.onResume()` broadcasts `ACTION_APPWIDGET_UPDATE` so the widget
  refreshes the moment the app is opened or returned to.

---

## (Optional) Driving the target date from the web/React side

The widget reads `SharedPreferences("CapacitorStorage")["countdown_target_iso"]`.
Capacitor's official Preferences plugin writes to that exact SharedPreferences
file, so you can control the target from the React app:

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

The widget falls back to a stored 4y 10m 25d default if the key is missing.

---

## Troubleshooting

- **Widget doesn't appear in the picker** → the `<receiver>` wasn't added to
  `AndroidManifest.xml`, or `widgetCategory="home_screen"` is missing in
  `countdown_widget_info.xml`. Both are correct in this drop, so double-check
  the manifest merge.
- **App crashes opening widget picker** → check Logcat for an
  `InflateException`; usually means `widget_background.xml` wasn't copied to
  `res/drawable/`.
- **Tap doesn't open the app** → make sure your `applicationId` in
  `android/app/build.gradle` is `com.anees.countdownwidget` (it should be — it
  matches the `package` line in the Java files).
- **`Locale` / `String.format` import error** → unlikely; both are
  `java.util.Locale` and `java.lang.String` which are imported / built in.
