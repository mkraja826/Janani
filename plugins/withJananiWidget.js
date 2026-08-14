const { AndroidConfig, withAndroidManifest, withDangerousMod, withMainApplication } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PACKAGE = 'com.mkraja826.janani';
const WIDGETS = [
  ['JananiCareWidget', 'Janani Today', 'janani_care_widget_info'],
  ['JananiMedicineWidget', 'Janani Medicine', 'janani_medicine_widget_info'],
  ['JananiLoveWidget', 'Thinking of You', 'janani_love_widget_info'],
  ['JananiBabyWidget', 'Baby This Week', 'janani_baby_widget_info'],
  ['JananiAppointmentWidget', 'Next Appointment', 'janani_appointment_widget_info'],
  ['JananiWellnessWidget', 'Daily Wellness', 'janani_wellness_widget_info'],
];

function write(filePath, content) { fs.mkdirSync(path.dirname(filePath), { recursive: true }); fs.writeFileSync(filePath, content); }
function receiver(name, label, info) { return { $: { 'android:name': `${PACKAGE}.${name}`, 'android:exported': 'false', 'android:label': label }, 'intent-filter': [{ action: [{ $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } }] }], 'meta-data': [{ $: { 'android:name': 'android.appwidget.provider', 'android:resource': `@xml/${info}` } }] }; }

module.exports = function withJananiWidget(config) {
  config = withAndroidManifest(config, (mod) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(mod.modResults);
    application.receiver = application.receiver || [];
    WIDGETS.forEach(([name, label, info]) => {
      const full = `${PACKAGE}.${name}`;
      const index = application.receiver.findIndex((item) => item.$?.['android:name'] === full);
      const value = receiver(name, label, info);
      if (index >= 0) application.receiver[index] = value; else application.receiver.push(value);
    });
    return mod;
  });

  config = withMainApplication(config, (mod) => {
    let contents = mod.modResults.contents;
    if (!contents.includes('import com.mkraja826.janani.JananiWidgetPackage')) {
      const packageLine = contents.match(/^package .*$/m)?.[0];
      if (packageLine) contents = contents.replace(packageLine, `${packageLine}\n\nimport com.mkraja826.janani.JananiWidgetPackage`);
    }
    if (!/^\s*(?:packages\.)?add\(JananiWidgetPackage\(\)\)\s*$/m.test(contents)) {
      const sdk54 = /^(\s*)PackageList\(this\)\.packages\.apply\s*\{/m;
      const legacy = /^(\s*)val packages = PackageList\(this\)\.packages\s*$/m;
      if (sdk54.test(contents)) contents = contents.replace(sdk54, (m, i) => `${m}\n${i}  add(JananiWidgetPackage())`);
      else if (legacy.test(contents)) contents = contents.replace(legacy, (m, i) => `${m}\n${i}packages.add(JananiWidgetPackage())`);
      else throw new Error('Janani widget package registration failed: unsupported Android MainApplication template.');
    }
    mod.modResults.contents = contents; return mod;
  });

  return withDangerousMod(config, ['android', async (mod) => {
    const root = mod.modRequest.platformProjectRoot;
    const javaRoot = path.join(root, 'app/src/main/java/com/mkraja826/janani');
    const res = path.join(root, 'app/src/main/res');

    write(path.join(javaRoot, 'JananiWidgetModule.kt'), `package ${PACKAGE}\n\nimport android.appwidget.AppWidgetManager\nimport android.content.ComponentName\nimport android.content.Context\nimport com.facebook.react.bridge.*\n\nclass JananiWidgetModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {\n override fun getName() = "JananiWidget"\n @ReactMethod fun update(state: ReadableMap, promise: Promise) { try {\n  val editor=reactContext.getSharedPreferences("janani_widget",Context.MODE_PRIVATE).edit(); state.toHashMap().forEach{(k,v)->editor.putString(k,v?.toString()?:"")}; editor.apply()\n  val manager=AppWidgetManager.getInstance(reactContext)\n  listOf(JananiCareWidget::class.java,JananiMedicineWidget::class.java,JananiLoveWidget::class.java,JananiBabyWidget::class.java,JananiAppointmentWidget::class.java,JananiWellnessWidget::class.java).forEach { klass -> val ids=manager.getAppWidgetIds(ComponentName(reactContext,klass)); if(ids.isNotEmpty()){ val provider=klass.getDeclaredConstructor().newInstance(); provider.onUpdate(reactContext,manager,ids) } }\n  promise.resolve(null)\n } catch(error:Exception){ promise.reject("JANANI_WIDGET_UPDATE",error) } }\n}\n`);
    write(path.join(javaRoot, 'JananiWidgetPackage.kt'), `package ${PACKAGE}\n\nimport com.facebook.react.ReactPackage\nimport com.facebook.react.bridge.*\nimport com.facebook.react.uimanager.ViewManager\nclass JananiWidgetPackage:ReactPackage{ override fun createNativeModules(c:ReactApplicationContext):List<NativeModule> = listOf(JananiWidgetModule(c)); override fun createViewManagers(c:ReactApplicationContext):List<ViewManager<*,*>> = emptyList() }\n`);
    write(path.join(javaRoot, 'JananiWidgets.kt'), `package ${PACKAGE}\n\nimport android.app.PendingIntent\nimport android.appwidget.*\nimport android.content.*\nimport android.net.Uri\nimport android.widget.RemoteViews\n\nabstract class JananiBaseWidget:AppWidgetProvider(){ fun p(c:Context,n:Int,r:String)=PendingIntent.getActivity(c,n,Intent(Intent.ACTION_VIEW,Uri.parse("janani://$r")).apply{flags=Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP},PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE); fun s(c:Context)=c.getSharedPreferences("janani_widget",Context.MODE_PRIVATE) }\nclass JananiCareWidget:JananiBaseWidget(){override fun onUpdate(c:Context,m:AppWidgetManager,ids:IntArray){val x=s(c);ids.forEach{id->val v=RemoteViews(c.packageName,R.layout.janani_care_widget);v.setTextViewText(R.id.title,x.getString("week_label",x.getString("widget_today_title","Janani Today")));v.setTextViewText(R.id.line1,x.getString("daily_message","A gentle day, one step at a time."));v.setTextViewText(R.id.line2,x.getString("next_reminder",x.getString("widget_care_fallback","Open Janani for today's care")));v.setOnClickPendingIntent(R.id.root,p(c,id*10,"home"));m.updateAppWidget(id,v)}}}\nclass JananiMedicineWidget:JananiBaseWidget(){override fun onUpdate(c:Context,m:AppWidgetManager,ids:IntArray){val x=s(c);ids.forEach{id->val v=RemoteViews(c.packageName,R.layout.janani_small_widget);v.setTextViewText(R.id.emoji,"💊");v.setTextViewText(R.id.title,x.getString("widget_medicine_title","Next medicine"));v.setTextViewText(R.id.line1,x.getString("next_medicine",x.getString("widget_medicine_fallback","No medicine due soon")));v.setOnClickPendingIntent(R.id.root,p(c,id*10+1,"reminders"));m.updateAppWidget(id,v)}}}\nclass JananiLoveWidget:JananiBaseWidget(){override fun onUpdate(c:Context,m:AppWidgetManager,ids:IntArray){val x=s(c);ids.forEach{id->val v=RemoteViews(c.packageName,R.layout.janani_small_widget);v.setTextViewText(R.id.emoji,"❤");v.setTextViewText(R.id.title,x.getString("widget_love_title","Thinking of you"));v.setTextViewText(R.id.line1,x.getString("partner_message","Send a little warmth"));v.setOnClickPendingIntent(R.id.root,p(c,id*10+2,"thinking-of-you"));m.updateAppWidget(id,v)}}}\nclass JananiBabyWidget:JananiBaseWidget(){override fun onUpdate(c:Context,m:AppWidgetManager,ids:IntArray){val x=s(c);ids.forEach{id->val v=RemoteViews(c.packageName,R.layout.janani_small_widget);v.setTextViewText(R.id.emoji,"👶");v.setTextViewText(R.id.title,x.getString("week_label","Baby this week"));v.setTextViewText(R.id.line1,x.getString("baby_message",x.getString("widget_baby_fallback","Open Janani for this week's journey")));v.setOnClickPendingIntent(R.id.root,p(c,id*10+3,"pregnancy-guide"));m.updateAppWidget(id,v)}}}\nclass JananiAppointmentWidget:JananiBaseWidget(){override fun onUpdate(c:Context,m:AppWidgetManager,ids:IntArray){val x=s(c);ids.forEach{id->val v=RemoteViews(c.packageName,R.layout.janani_small_widget);v.setTextViewText(R.id.emoji,"📅");v.setTextViewText(R.id.title,x.getString("widget_appointment_title","Next appointment"));v.setTextViewText(R.id.line1,x.getString("next_appointment",x.getString("widget_appointment_fallback","No appointment scheduled")));v.setOnClickPendingIntent(R.id.root,p(c,id*10+4,"reminders"));m.updateAppWidget(id,v)}}}\nclass JananiWellnessWidget:JananiBaseWidget(){override fun onUpdate(c:Context,m:AppWidgetManager,ids:IntArray){val x=s(c);ids.forEach{id->val v=RemoteViews(c.packageName,R.layout.janani_care_widget);v.setTextViewText(R.id.title,x.getString("widget_wellness_title","Daily wellness 🌿"));v.setTextViewText(R.id.line1,x.getString("wellness_message",x.getString("widget_wellness_fallback","Eat gently, hydrate, and rest when your body asks.")));v.setTextViewText(R.id.line2,x.getString("week_label","Janani"));v.setOnClickPendingIntent(R.id.root,p(c,id*10+5,"food-guide"));m.updateAppWidget(id,v)}}}\n`);

    write(path.join(res,'layout/janani_small_widget.xml'),`<?xml version="1.0" encoding="utf-8"?><LinearLayout xmlns:android="http://schemas.android.com/apk/res/android" android:id="@+id/root" android:layout_width="match_parent" android:layout_height="match_parent" android:orientation="vertical" android:gravity="center_vertical" android:padding="14dp" android:background="@drawable/janani_widget_background"><TextView android:id="@+id/emoji" android:layout_width="wrap_content" android:layout_height="wrap_content" android:text="❤" android:textSize="22sp"/><TextView android:id="@+id/title" android:layout_width="match_parent" android:layout_height="wrap_content" android:layout_marginTop="4dp" android:text="Janani" android:textStyle="bold" android:textSize="16sp" android:textColor="#713B44"/><TextView android:id="@+id/line1" android:layout_width="match_parent" android:layout_height="wrap_content" android:layout_marginTop="4dp" android:maxLines="2" android:ellipsize="end" android:textSize="12sp" android:textColor="#5D5052"/></LinearLayout>`);
    write(path.join(res,'layout/janani_care_widget.xml'),`<?xml version="1.0" encoding="utf-8"?><LinearLayout xmlns:android="http://schemas.android.com/apk/res/android" android:id="@+id/root" android:layout_width="match_parent" android:layout_height="match_parent" android:orientation="vertical" android:gravity="center_vertical" android:padding="16dp" android:background="@drawable/janani_widget_background"><TextView android:id="@+id/title" android:layout_width="match_parent" android:layout_height="wrap_content" android:text="Janani Today" android:textStyle="bold" android:textSize="20sp" android:textColor="#713B44"/><TextView android:id="@+id/line1" android:layout_width="match_parent" android:layout_height="wrap_content" android:layout_marginTop="8dp" android:maxLines="2" android:textSize="14sp" android:textColor="#312A2A"/><TextView android:id="@+id/line2" android:layout_width="match_parent" android:layout_height="wrap_content" android:layout_marginTop="7dp" android:maxLines="2" android:textSize="12sp" android:textColor="#8A6A70"/></LinearLayout>`);
    write(path.join(res,'drawable/janani_widget_background.xml'),`<?xml version="1.0" encoding="utf-8"?><shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle"><solid android:color="#FFF9F5"/><corners android:radius="24dp"/><stroke android:width="1dp" android:color="#EEDFD9"/></shape>`);
    const info=(layout,minW,minH)=>`<?xml version="1.0" encoding="utf-8"?><appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android" android:minWidth="${minW}dp" android:minHeight="${minH}dp" android:updatePeriodMillis="1800000" android:initialLayout="@layout/${layout}" android:resizeMode="horizontal|vertical" android:widgetCategory="home_screen"/>`;
    write(path.join(res,'xml/janani_care_widget_info.xml'),info('janani_care_widget',250,110));
    write(path.join(res,'xml/janani_medicine_widget_info.xml'),info('janani_small_widget',110,110));
    write(path.join(res,'xml/janani_love_widget_info.xml'),info('janani_small_widget',110,110));
    write(path.join(res,'xml/janani_baby_widget_info.xml'),info('janani_small_widget',180,110));
    write(path.join(res,'xml/janani_appointment_widget_info.xml'),info('janani_small_widget',180,110));
    write(path.join(res,'xml/janani_wellness_widget_info.xml'),info('janani_care_widget',250,110));
    return mod;
  }]);
};
