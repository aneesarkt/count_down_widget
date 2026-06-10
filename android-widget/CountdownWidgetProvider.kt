package com.yourapp.package

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import java.util.Calendar
import java.util.TimeZone

/**
 * Home-screen widget that counts down to retirement.
 *
 * Reads the target date (ISO-8601) from SharedPreferences "CapacitorStorage"
 * under the key "countdown_target_iso". If absent, computes a default target
 * of 4 years, 10 months, 25 days from "first run" (the first time the widget
 * is updated) and persists it so the countdown stays stable.
 *
 * Refresh strategy:
 *  - Declared updatePeriodMillis = 1_800_000 (30 minutes) in
 *    res/xml/countdown_widget_info.xml.
 *  - MainActivity sends ACTION_APPWIDGET_UPDATE on open/resume for an
 *    immediate refresh.
 */
class CountdownWidgetProvider : AppWidgetProvider() {

    companion object {
        private const val PREFS_NAME = "CapacitorStorage"
        private const val KEY_TARGET_ISO = "countdown_target_iso"
        private const val KEY_DEFAULT_TARGET_MS = "countdown_default_target_ms"

        // Default countdown duration if no target is set: 4y 10m 25d.
        private const val DEFAULT_YEARS = 4
        private const val DEFAULT_MONTHS = 10
        private const val DEFAULT_DAYS = 25
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
    ) {
        for (id in appWidgetIds) {
            updateWidget(context, appWidgetManager, id)
        }
    }

    private fun updateWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        widgetId: Int,
    ) {
        val views = RemoteViews(context.packageName, R.layout.countdown_widget_layout)
        val targetMs = resolveTargetMillis(context)
        val nowMs = System.currentTimeMillis()
        val remainingMs = (targetMs - nowMs).coerceAtLeast(0L)

        val totalMinutes = remainingMs / 60_000L
        val days = totalMinutes / (60 * 24)
        val hours = (totalMinutes / 60) % 24
        val minutes = totalMinutes % 60

        views.setTextViewText(R.id.widget_title, "SHIFTS UNTIL RETIREMENT")
        views.setTextViewText(R.id.widget_days, days.toString())
        views.setTextViewText(R.id.widget_days_label, if (days == 1L) "DAY" else "DAYS")
        views.setTextViewText(
            R.id.widget_hms,
            String.format("%02d:%02d", hours, minutes),
        )
        views.setTextViewText(R.id.widget_hms_label, "HOURS · MINUTES")

        // Tap → open app
        val launchIntent =
            context.packageManager.getLaunchIntentForPackage(context.packageName)
        if (launchIntent != null) {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            val pi = PendingIntent.getActivity(
                context,
                widgetId,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
            views.setOnClickPendingIntent(R.id.widget_root, pi)
        }

        appWidgetManager.updateAppWidget(widgetId, views)
    }

    /**
     * Returns the target time in epoch millis. Priority:
     *  1. ISO-8601 string in CapacitorStorage["countdown_target_iso"]
     *  2. Cached default in CapacitorStorage["countdown_default_target_ms"]
     *  3. Compute fresh default and cache it.
     */
    private fun resolveTargetMillis(context: Context): Long {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

        val iso = prefs.getString(KEY_TARGET_ISO, null)
        if (!iso.isNullOrBlank()) {
            val parsed = parseIso8601(iso)
            if (parsed != null) return parsed
        }

        val cached = prefs.getLong(KEY_DEFAULT_TARGET_MS, 0L)
        if (cached > 0L) return cached

        val cal = Calendar.getInstance(TimeZone.getDefault()).apply {
            timeInMillis = System.currentTimeMillis()
            add(Calendar.YEAR, DEFAULT_YEARS)
            add(Calendar.MONTH, DEFAULT_MONTHS)
            add(Calendar.DAY_OF_MONTH, DEFAULT_DAYS)
        }
        val computed = cal.timeInMillis
        prefs.edit().putLong(KEY_DEFAULT_TARGET_MS, computed).apply()
        return computed
    }

    /**
     * Lightweight ISO-8601 parser for common shapes:
     *   2031-05-01T00:00:00Z
     *   2031-05-01T00:00:00.000Z
     *   2031-05-01T00:00:00+00:00
     *   2031-05-01
     * Returns null if the string isn't parseable.
     */
    private fun parseIso8601(iso: String): Long? {
        return try {
            val s = iso.trim()
            // Try Java 8+ Instant.parse via reflection-free direct call.
            // android.text.format ISO parsing isn't available everywhere, so do it manually.
            val datePart: String
            val timePart: String
            val tzOffsetMinutes: Int

            val tIdx = s.indexOf('T')
            if (tIdx < 0) {
                datePart = s
                timePart = "00:00:00"
                tzOffsetMinutes = 0
            } else {
                datePart = s.substring(0, tIdx)
                var rest = s.substring(tIdx + 1)
                tzOffsetMinutes = when {
                    rest.endsWith("Z") -> {
                        rest = rest.dropLast(1)
                        0
                    }
                    rest.contains('+') -> {
                        val i = rest.lastIndexOf('+')
                        val off = rest.substring(i + 1)
                        rest = rest.substring(0, i)
                        parseOffset(off)
                    }
                    rest.lastIndexOf('-') > 2 -> {
                        val i = rest.lastIndexOf('-')
                        val off = rest.substring(i + 1)
                        rest = rest.substring(0, i)
                        -parseOffset(off)
                    }
                    else -> 0
                }
                // Strip fractional seconds if present.
                val dotIdx = rest.indexOf('.')
                timePart = if (dotIdx > 0) rest.substring(0, dotIdx) else rest
            }

            val dateParts = datePart.split('-')
            val timeParts = timePart.split(':')
            val year = dateParts[0].toInt()
            val month = dateParts[1].toInt() - 1
            val day = dateParts[2].toInt()
            val hour = timeParts.getOrNull(0)?.toIntOrNull() ?: 0
            val minute = timeParts.getOrNull(1)?.toIntOrNull() ?: 0
            val second = timeParts.getOrNull(2)?.toIntOrNull() ?: 0

            val cal = Calendar.getInstance(TimeZone.getTimeZone("UTC"))
            cal.clear()
            cal.set(year, month, day, hour, minute, second)
            cal.timeInMillis - tzOffsetMinutes * 60_000L
        } catch (e: Exception) {
            null
        }
    }

    private fun parseOffset(off: String): Int {
        // Accept "HH:MM" or "HHMM" or "HH"
        val cleaned = off.replace(":", "")
        return when (cleaned.length) {
            4 -> cleaned.substring(0, 2).toInt() * 60 + cleaned.substring(2).toInt()
            2 -> cleaned.toInt() * 60
            else -> 0
        }
    }
}
