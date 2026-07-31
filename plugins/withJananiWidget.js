const { AndroidConfig, withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PACKAGE = 'com.mkraja826.janani';
const RECEIVER = `${PACKAGE}.JananiCareWidget`;

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

module.exports = function withJananiWidget(config) {
  config = withAndroidManifest(config, (mod) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(mod.modResults);
    application.receiver = application.receiver || [];
    if (!application.receiver.some((item) => item.$?.['android:name'] === RECEIVER)) {
      application.receiver.push({
        $: { 'android:name': RECEIVER, 'android:exported': 'true', 'android:label': 'Janani care' },
        'intent-filter': [{ action: [{ $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } }] }],
        'meta-data': [{ $: { 'android:name': 'android.appwidget.provider', 'android:resource': '@xml/janani_care_widget_info' } }],
      });
    }
    return mod;
  });

  return withDangerousMod(config, ['android', async (mod) => {
    const root = mod.modRequest.platformProjectRoot;
    const javaRoot = path.join(root, 'app/src/main/java/com/mkraja826/janani');
    const res = path.join(root, 'app/src/main/res');

    write(path.join(javaRoot, 'JananiCareWidget.kt'), `package ${PACKAGE}\n\nimport android.app.PendingIntent\nimport android.appwidget.AppWidgetManager\nimport android.appwidget.AppWidgetProvider\nimport android.content.Context\nimport android.content.Intent\nimport android.net.Uri\nimport android.widget.RemoteViews\n\nclass JananiCareWidget : AppWidgetProvider() {\n  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {\n    ids.forEach { id ->\n      val preferences = context.getSharedPreferences("janani_widget", Context.MODE_PRIVATE)\n      val views = RemoteViews(context.packageName, R.layout.janani_care_widget)\n      views.setTextViewText(R.id.janani_week, preferences.getString("week_label", "Janani"))\n      views.setTextViewText(R.id.janani_next, preferences.getString("next_reminder", "Open Janani for today’s care"))\n      val intent = Intent(Intent.ACTION_VIEW, Uri.parse("janani://home"))\n      val pending = PendingIntent.getActivity(context, id, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)\n      views.setOnClickPendingIntent(R.id.janani_widget_root, pending)\n      manager.updateAppWidget(id, views)\n    }\n  }\n}\n`);

    write(path.join(res, 'layout/janani_care_widget.xml'), `<?xml version="1.0" encoding="utf-8"?>\n<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android" android:id="@+id/janani_widget_root" android:layout_width="match_parent" android:layout_height="match_parent" android:orientation="vertical" android:padding="16dp" android:background="@drawable/janani_widget_background">\n  <TextView android:id="@+id/janani_week" android:layout_width="match_parent" android:layout_height="wrap_content" android:text="Janani" android:textSize="20sp" android:textStyle="bold" android:textColor="#713B44" />\n  <TextView android:id="@+id/janani_next" android:layout_width="match_parent" android:layout_height="wrap_content" android:layout_marginTop="8dp" android:text="Open Janani for today’s care" android:textSize="14sp" android:textColor="#312A2A" />\n</LinearLayout>\n`);
    write(path.join(res, 'drawable/janani_widget_background.xml'), `<?xml version="1.0" encoding="utf-8"?>\n<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle"><solid android:color="#FFF9F5"/><corners android:radius="24dp"/><stroke android:width="1dp" android:color="#EEDFD9"/></shape>\n`);
    write(path.join(res, 'xml/janani_care_widget_info.xml'), `<?xml version="1.0" encoding="utf-8"?>\n<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android" android:minWidth="180dp" android:minHeight="90dp" android:updatePeriodMillis="1800000" android:initialLayout="@layout/janani_care_widget" android:resizeMode="horizontal|vertical" android:widgetCategory="home_screen" />\n`);
    return mod;
  }]);
};
