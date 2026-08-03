const { AndroidConfig, withAndroidManifest, withDangerousMod, withMainApplication } = require('@expo/config-plugins');
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
    let receiver = application.receiver.find((item) => item.$?.['android:name'] === RECEIVER);
    if (!receiver) {
      receiver = {
        $: { 'android:name': RECEIVER, 'android:exported': 'false', 'android:label': 'Janani care' },
        'intent-filter': [{ action: [{ $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } }] }],
        'meta-data': [{ $: { 'android:name': 'android.appwidget.provider', 'android:resource': '@xml/janani_care_widget_info' } }],
      };
      application.receiver.push(receiver);
    }
    receiver.$ = {
      ...receiver.$,
      'android:name': RECEIVER,
      'android:exported': 'false',
      'android:label': 'Janani care',
    };
    return mod;
  });

  config = withMainApplication(config, (mod) => {
    let contents = mod.modResults.contents;
    if (!contents.includes('import com.mkraja826.janani.JananiWidgetPackage')) {
      const packageLine = contents.match(/^package .*$/m)?.[0];
      if (packageLine) contents = contents.replace(packageLine, `${packageLine}\n\nimport com.mkraja826.janani.JananiWidgetPackage`);
    }
    const hasRegistration = /^\s*(?:packages\.)?add\(JananiWidgetPackage\(\)\)\s*$/m.test(contents);
    if (!hasRegistration) {
      const sdk54Packages = /^(\s*)PackageList\(this\)\.packages\.apply\s*\{/m;
      const legacyPackages = /^(\s*)val packages = PackageList\(this\)\.packages\s*$/m;

      if (sdk54Packages.test(contents)) {
        contents = contents.replace(
          sdk54Packages,
          (match, indentation) => `${match}\n${indentation}  add(JananiWidgetPackage())`,
        );
      } else if (legacyPackages.test(contents)) {
        contents = contents.replace(
          legacyPackages,
          (match, indentation) => `${match}\n${indentation}packages.add(JananiWidgetPackage())`,
        );
      } else {
        throw new Error(
          'Janani widget package registration failed: unsupported Android MainApplication template.',
        );
      }
    }
    mod.modResults.contents = contents;
    return mod;
  });

  return withDangerousMod(config, ['android', async (mod) => {
    const root = mod.modRequest.platformProjectRoot;
    const javaRoot = path.join(root, 'app/src/main/java/com/mkraja826/janani');
    const res = path.join(root, 'app/src/main/res');

    write(path.join(javaRoot, 'JananiWidgetModule.kt'), `package ${PACKAGE}\n\nimport android.appwidget.AppWidgetManager\nimport android.content.ComponentName\nimport android.content.Context\nimport com.facebook.react.bridge.Promise\nimport com.facebook.react.bridge.ReactApplicationContext\nimport com.facebook.react.bridge.ReactContextBaseJavaModule\nimport com.facebook.react.bridge.ReactMethod\nimport com.facebook.react.bridge.ReadableMap\n\nclass JananiWidgetModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {\n  override fun getName() = "JananiWidget"\n\n  @ReactMethod\n  fun update(state: ReadableMap, promise: Promise) {\n    try {\n      val editor = reactContext.getSharedPreferences("janani_widget", Context.MODE_PRIVATE).edit()\n      state.toHashMap().forEach { (key, value) -> editor.putString(key, value?.toString() ?: "") }\n      editor.apply()\n      val manager = AppWidgetManager.getInstance(reactContext)\n      val component = ComponentName(reactContext, JananiCareWidget::class.java)\n      val ids = manager.getAppWidgetIds(component)\n      JananiCareWidget().onUpdate(reactContext, manager, ids)\n      promise.resolve(null)\n    } catch (error: Exception) {\n      promise.reject("JANANI_WIDGET_UPDATE", error)\n    }\n  }\n}\n`);

    write(path.join(javaRoot, 'JananiWidgetPackage.kt'), `package ${PACKAGE}\n\nimport com.facebook.react.ReactPackage\nimport com.facebook.react.bridge.NativeModule\nimport com.facebook.react.bridge.ReactApplicationContext\nimport com.facebook.react.uimanager.ViewManager\n\nclass JananiWidgetPackage : ReactPackage {\n  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> = listOf(JananiWidgetModule(reactContext))\n  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()\n}\n`);

    write(path.join(javaRoot, 'JananiCareWidget.kt'), `package ${PACKAGE}\n\nimport android.app.PendingIntent\nimport android.appwidget.AppWidgetManager\nimport android.appwidget.AppWidgetProvider\nimport android.content.Context\nimport android.content.Intent\nimport android.net.Uri\nimport android.widget.RemoteViews\n\nclass JananiCareWidget : AppWidgetProvider() {\n  private fun pending(context: Context, requestCode: Int, route: String): PendingIntent {\n    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("janani://$route")).apply { flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP }\n    return PendingIntent.getActivity(context, requestCode, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)\n  }\n\n  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {\n    val preferences = context.getSharedPreferences("janani_widget", Context.MODE_PRIVATE)\n    ids.forEach { id ->\n      val views = RemoteViews(context.packageName, R.layout.janani_care_widget)\n      views.setTextViewText(R.id.janani_week, preferences.getString("week_label", "Janani"))\n      views.setTextViewText(R.id.janani_family, preferences.getString("family_label", "Our little family"))\n      views.setTextViewText(R.id.janani_next, preferences.getString("next_reminder", "No care reminder scheduled"))\n      views.setTextViewText(R.id.janani_partner, preferences.getString("partner_message", "Send a little warmth"))\n      views.setOnClickPendingIntent(R.id.janani_widget_root, pending(context, id * 10, "home"))\n      views.setOnClickPendingIntent(R.id.janani_reminders_button, pending(context, id * 10 + 1, "reminders"))\n      views.setOnClickPendingIntent(R.id.janani_partner_button, pending(context, id * 10 + 2, "thinking-of-you"))\n      manager.updateAppWidget(id, views)\n    }\n  }\n}\n`);

    write(path.join(res, 'layout/janani_care_widget.xml'), `<?xml version="1.0" encoding="utf-8"?>\n<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android" android:id="@+id/janani_widget_root" android:layout_width="match_parent" android:layout_height="match_parent" android:orientation="vertical" android:padding="16dp" android:background="@drawable/janani_widget_background">\n  <TextView android:id="@+id/janani_week" android:layout_width="match_parent" android:layout_height="wrap_content" android:text="Janani" android:textSize="20sp" android:textStyle="bold" android:textColor="#713B44" />\n  <TextView android:id="@+id/janani_family" android:layout_width="match_parent" android:layout_height="wrap_content" android:layout_marginTop="2dp" android:text="Our little family" android:textSize="12sp" android:textColor="#8A6A70" />\n  <TextView android:id="@+id/janani_next" android:layout_width="match_parent" android:layout_height="wrap_content" android:layout_marginTop="10dp" android:text="No care reminder scheduled" android:textSize="14sp" android:textColor="#312A2A" />\n  <TextView android:id="@+id/janani_partner" android:layout_width="match_parent" android:layout_height="wrap_content" android:layout_marginTop="6dp" android:maxLines="1" android:ellipsize="end" android:text="Send a little warmth" android:textSize="13sp" android:textColor="#713B44" />\n  <LinearLayout android:layout_width="match_parent" android:layout_height="wrap_content" android:layout_marginTop="12dp" android:orientation="horizontal">\n    <Button android:id="@+id/janani_reminders_button" android:layout_width="0dp" android:layout_height="42dp" android:layout_weight="1" android:text="Reminders" android:textAllCaps="false" android:textSize="12sp" />\n    <Button android:id="@+id/janani_partner_button" android:layout_width="0dp" android:layout_height="42dp" android:layout_marginStart="8dp" android:layout_weight="1" android:text="Thinking of you" android:textAllCaps="false" android:textSize="12sp" />\n  </LinearLayout>\n</LinearLayout>\n`);
    write(path.join(res, 'drawable/janani_widget_background.xml'), `<?xml version="1.0" encoding="utf-8"?>\n<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle"><solid android:color="#FFF9F5"/><corners android:radius="24dp"/><stroke android:width="1dp" android:color="#EEDFD9"/></shape>\n`);
    write(path.join(res, 'xml/janani_care_widget_info.xml'), `<?xml version="1.0" encoding="utf-8"?>\n<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android" android:minWidth="250dp" android:minHeight="150dp" android:updatePeriodMillis="1800000" android:initialLayout="@layout/janani_care_widget" android:resizeMode="horizontal|vertical" android:widgetCategory="home_screen" />\n`);
    return mod;
  }]);
};
