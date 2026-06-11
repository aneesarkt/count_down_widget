package com.anees.countdownwidget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import java.util.Calendar;
import java.util.Locale;
import java.util.TimeZone;

/**
 * Home-screen widget that counts down to retirement.
 *
 * Reads an ISO-8601 target date from SharedPreferences("CapacitorStorage")
 * under the key "countdown_target_iso" (the same store that the Capacitor
 * Preferences plugin writes to from the React app). If absent, it computes a
 * default target of 4 years, 10 months, 25 days from the first widget update
 * and persists it so the countdown remains stable.
 *
 * Refresh strategy:
 *   - res/xml/countdown_widget_info.xml sets updatePeriodMillis = 1_800_000
 *     (30 minutes — Android's minimum allowed period).
 *   - MainActivity sends ACTION_APPWIDGET_UPDATE on resume so the widget
 *     refreshes every time the app is opened.
 */
public class CountdownWidgetProvider extends AppWidgetProvider {

    private static final String PREFS_NAME = "CapacitorStorage";
    private static final String KEY_TARGET_ISO = "countdown_target_iso";
    private static final String KEY_DEFAULT_TARGET_MS = "countdown_default_target_ms";

    // Default countdown duration if no target is set: 4y 10m 25d.
    private static final int DEFAULT_YEARS = 4;
    private static final int DEFAULT_MONTHS = 10;
    private static final int DEFAULT_DAYS = 25;

    @Override
    public void onUpdate(Context context,
                         AppWidgetManager appWidgetManager,
                         int[] appWidgetIds) {
        for (int id : appWidgetIds) {
            updateWidget(context, appWidgetManager, id);
        }
    }

    private void updateWidget(Context context,
                              AppWidgetManager appWidgetManager,
                              int widgetId) {
        RemoteViews views = new RemoteViews(
                context.getPackageName(), R.layout.countdown_widget_layout);

        long targetMs = resolveTargetMillis(context);
        long nowMs = System.currentTimeMillis();
        long remainingMs = Math.max(0L, targetMs - nowMs);

        long totalMinutes = remainingMs / 60_000L;
        long days = totalMinutes / (60L * 24L);
        long hours = (totalMinutes / 60L) % 24L;
        long minutes = totalMinutes % 60L;

        views.setTextViewText(R.id.widget_title, "SHIFTS UNTIL RETIREMENT");
        views.setTextViewText(R.id.widget_days, String.valueOf(days));
        views.setTextViewText(R.id.widget_days_label, days == 1L ? "DAY" : "DAYS");
        views.setTextViewText(
                R.id.widget_hms,
                String.format(Locale.US, "%02d:%02d", hours, minutes));
        views.setTextViewText(R.id.widget_hms_label, "HOURS · MINUTES");

        // Tap → open the Capacitor app
        Intent launchIntent =
                context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launchIntent != null) {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            PendingIntent pi = PendingIntent.getActivity(
                    context,
                    widgetId,
                    launchIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            views.setOnClickPendingIntent(R.id.widget_root, pi);
        }

        appWidgetManager.updateAppWidget(widgetId, views);
    }

    /**
     * Returns the target time in epoch millis. Priority:
     *   1. ISO-8601 string in CapacitorStorage["countdown_target_iso"]
     *   2. Cached default in CapacitorStorage["countdown_default_target_ms"]
     *   3. Compute a fresh default (now + 4y 10m 25d) and cache it.
     */
    private long resolveTargetMillis(Context context) {
        SharedPreferences prefs =
                context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        String iso = prefs.getString(KEY_TARGET_ISO, null);
        if (iso != null && !iso.trim().isEmpty()) {
            Long parsed = parseIso8601(iso);
            if (parsed != null) {
                return parsed;
            }
        }

        long cached = prefs.getLong(KEY_DEFAULT_TARGET_MS, 0L);
        if (cached > 0L) {
            return cached;
        }

        Calendar cal = Calendar.getInstance(TimeZone.getDefault());
        cal.setTimeInMillis(System.currentTimeMillis());
        cal.add(Calendar.YEAR, DEFAULT_YEARS);
        cal.add(Calendar.MONTH, DEFAULT_MONTHS);
        cal.add(Calendar.DAY_OF_MONTH, DEFAULT_DAYS);
        long computed = cal.getTimeInMillis();
        prefs.edit().putLong(KEY_DEFAULT_TARGET_MS, computed).apply();
        return computed;
    }

    /**
     * Lightweight ISO-8601 parser covering common shapes:
     *   2031-05-01T00:00:00Z
     *   2031-05-01T00:00:00.000Z
     *   2031-05-01T00:00:00+00:00
     *   2031-05-01
     * Returns null if the string can't be parsed.
     */
    private Long parseIso8601(String iso) {
        try {
            String s = iso.trim();
            String datePart;
            String timePart;
            int tzOffsetMinutes;

            int tIdx = s.indexOf('T');
            if (tIdx < 0) {
                datePart = s;
                timePart = "00:00:00";
                tzOffsetMinutes = 0;
            } else {
                datePart = s.substring(0, tIdx);
                String rest = s.substring(tIdx + 1);

                if (rest.endsWith("Z")) {
                    rest = rest.substring(0, rest.length() - 1);
                    tzOffsetMinutes = 0;
                } else if (rest.contains("+")) {
                    int i = rest.lastIndexOf('+');
                    String off = rest.substring(i + 1);
                    rest = rest.substring(0, i);
                    tzOffsetMinutes = parseOffset(off);
                } else if (rest.lastIndexOf('-') > 2) {
                    int i = rest.lastIndexOf('-');
                    String off = rest.substring(i + 1);
                    rest = rest.substring(0, i);
                    tzOffsetMinutes = -parseOffset(off);
                } else {
                    tzOffsetMinutes = 0;
                }

                int dotIdx = rest.indexOf('.');
                timePart = dotIdx > 0 ? rest.substring(0, dotIdx) : rest;
            }

            String[] dp = datePart.split("-");
            String[] tp = timePart.split(":");
            int year = Integer.parseInt(dp[0]);
            int month = Integer.parseInt(dp[1]) - 1;
            int day = Integer.parseInt(dp[2]);
            int hour = tp.length > 0 ? safeInt(tp[0]) : 0;
            int minute = tp.length > 1 ? safeInt(tp[1]) : 0;
            int second = tp.length > 2 ? safeInt(tp[2]) : 0;

            Calendar cal = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
            cal.clear();
            cal.set(year, month, day, hour, minute, second);
            return cal.getTimeInMillis() - tzOffsetMinutes * 60_000L;
        } catch (Exception e) {
            return null;
        }
    }

    private int parseOffset(String off) {
        String cleaned = off.replace(":", "");
        try {
            if (cleaned.length() == 4) {
                return Integer.parseInt(cleaned.substring(0, 2)) * 60
                        + Integer.parseInt(cleaned.substring(2));
            } else if (cleaned.length() == 2) {
                return Integer.parseInt(cleaned) * 60;
            }
        } catch (NumberFormatException ignored) {
        }
        return 0;
    }

    private int safeInt(String s) {
        try {
            return Integer.parseInt(s);
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
