// Replace the entire contents of:
//   android/app/src/main/java/com/anees/countdownwidget/MainActivity.java
//
// This drop-in version keeps your existing Capacitor BridgeActivity behavior
// and additionally refreshes the home-screen widget every time the app opens
// or resumes. The 30-minute auto-refresh is configured in
// res/xml/countdown_widget_info.xml — this code adds the on-open refresh.

package com.anees.countdownwidget;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Intent;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onResume() {
        super.onResume();
        refreshCountdownWidget();
    }

    private void refreshCountdownWidget() {
        ComponentName cn =
                new ComponentName(getApplication(), CountdownWidgetProvider.class);
        int[] ids = AppWidgetManager.getInstance(getApplication())
                .getAppWidgetIds(cn);
        if (ids == null || ids.length == 0) {
            // No widgets placed on the home screen yet — nothing to refresh.
            return;
        }
        Intent intent = new Intent(this, CountdownWidgetProvider.class);
        intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
        sendBroadcast(intent);
    }
}
