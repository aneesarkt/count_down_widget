// Patch for: android/app/src/main/java/<your/package>/MainActivity.kt
//
// Goal: refresh the home-screen widget every time the Capacitor app opens or
// resumes. The widget itself also auto-updates every 30 minutes via
// updatePeriodMillis in res/xml/countdown_widget_info.xml.
//
// Steps:
// 1. Add the imports at the top of MainActivity.kt (alongside existing ones).
// 2. Override (or extend) onResume() inside the MainActivity class.
//
// ---------- IMPORTS (add near the top) ----------
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Intent

// ---------- INSIDE class MainActivity : BridgeActivity() { ... } ----------
override fun onResume() {
    super.onResume()
    refreshCountdownWidget()
}

private fun refreshCountdownWidget() {
    val intent = Intent(this, CountdownWidgetProvider::class.java).apply {
        action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
    }
    val ids = AppWidgetManager.getInstance(application)
        .getAppWidgetIds(ComponentName(application, CountdownWidgetProvider::class.java))
    intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
    sendBroadcast(intent)
}

// If CountdownWidgetProvider is in a different package than MainActivity,
// add: import com.yourapp.package.CountdownWidgetProvider
