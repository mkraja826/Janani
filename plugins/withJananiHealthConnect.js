const { withAndroidManifest, withAppBuildGradle, withDangerousMod, withMainApplication } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PACKAGE = 'com.mkraja826.janani';
const HEALTH_PERMISSIONS = [
  'android.permission.health.READ_STEPS',
  'android.permission.health.READ_SLEEP',
  'android.permission.health.READ_HEART_RATE',
  'android.permission.health.READ_WEIGHT',
];

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

module.exports = function withJananiHealthConnect(config) {
  config = withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;
    manifest['uses-permission'] = manifest['uses-permission'] || [];
    for (const name of HEALTH_PERMISSIONS) {
      if (!manifest['uses-permission'].some((item) => item.$?.['android:name'] === name)) {
        manifest['uses-permission'].push({ $: { 'android:name': name } });
      }
    }
    return mod;
  });

  config = withAppBuildGradle(config, (mod) => {
    let contents = mod.modResults.contents;
    const dependency = 'implementation "androidx.health.connect:connect-client:1.1.0"';
    if (!contents.includes('androidx.health.connect:connect-client')) {
      contents = contents.replace(/dependencies\s*\{/, (match) => `${match}\n    ${dependency}`);
    }
    contents = contents.replace(
      /minSdkVersion\s+rootProject\.ext\.minSdkVersion/g,
      'minSdkVersion 26'
    );
    mod.modResults.contents = contents;
    return mod;
  });

  config = withMainApplication(config, (mod) => {
    let contents = mod.modResults.contents;
    if (!contents.includes('import com.mkraja826.janani.JananiHealthConnectPackage')) {
      const packageLine = contents.match(/^package .*$/m)?.[0];
      if (packageLine) contents = contents.replace(packageLine, `${packageLine}\n\nimport com.mkraja826.janani.JananiHealthConnectPackage`);
    }
    if (!/^\s*(?:packages\.)?add\(JananiHealthConnectPackage\(\)\)\s*$/m.test(contents)) {
      const sdk54 = /^(\s*)PackageList\(this\)\.packages\.apply\s*\{/m;
      const legacy = /^(\s*)val packages = PackageList\(this\)\.packages\s*$/m;
      if (sdk54.test(contents)) contents = contents.replace(sdk54, (m, i) => `${m}\n${i}  add(JananiHealthConnectPackage())`);
      else if (legacy.test(contents)) contents = contents.replace(legacy, (m, i) => `${m}\n${i}packages.add(JananiHealthConnectPackage())`);
      else throw new Error('Health Connect package registration failed: unsupported Android MainApplication template.');
    }
    mod.modResults.contents = contents;
    return mod;
  });

  return withDangerousMod(config, ['android', async (mod) => {
    const root = mod.modRequest.platformProjectRoot;
    const javaRoot = path.join(root, 'app/src/main/java/com/mkraja826/janani');

    write(path.join(javaRoot, 'JananiHealthConnectPackage.kt'), `package ${PACKAGE}\n\nimport com.facebook.react.ReactPackage\nimport com.facebook.react.bridge.NativeModule\nimport com.facebook.react.bridge.ReactApplicationContext\nimport com.facebook.react.uimanager.ViewManager\n\nclass JananiHealthConnectPackage : ReactPackage {\n  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> = listOf(JananiHealthConnectModule(reactContext))\n  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()\n}\n`);

    write(path.join(javaRoot, 'JananiHealthConnectModule.kt'), `package ${PACKAGE}\n\nimport android.app.Activity\nimport android.content.Intent\nimport android.os.Build\nimport androidx.health.connect.client.HealthConnectClient\nimport androidx.health.connect.client.PermissionController\nimport androidx.health.connect.client.permission.HealthPermission\nimport androidx.health.connect.client.records.HeartRateRecord\nimport androidx.health.connect.client.records.SleepSessionRecord\nimport androidx.health.connect.client.records.StepsRecord\nimport androidx.health.connect.client.records.WeightRecord\nimport androidx.health.connect.client.request.ReadRecordsRequest\nimport androidx.health.connect.client.time.TimeRangeFilter\nimport com.facebook.react.bridge.*\nimport kotlinx.coroutines.*\nimport java.time.Instant\nimport java.time.LocalDate\nimport java.time.ZoneId\nimport java.time.temporal.ChronoUnit\n\nclass JananiHealthConnectModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), ActivityEventListener {\n  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)\n  private var permissionPromise: Promise? = null\n  private val permissionRequestCode = 45142\n\n  init { reactContext.addActivityEventListener(this) }\n\n  override fun getName() = \"JananiHealthConnect\"\n\n  private fun requiredPermissions() = setOf(\n    HealthPermission.getReadPermission(StepsRecord::class),\n    HealthPermission.getReadPermission(SleepSessionRecord::class),\n    HealthPermission.getReadPermission(HeartRateRecord::class),\n    HealthPermission.getReadPermission(WeightRecord::class),\n  )\n\n  private fun sdkStatus(): Int = try { HealthConnectClient.getSdkStatus(reactContext) } catch (_: Throwable) { HealthConnectClient.SDK_UNAVAILABLE }\n\n  private fun client(): HealthConnectClient? = if (sdkStatus() == HealthConnectClient.SDK_AVAILABLE) HealthConnectClient.getOrCreate(reactContext) else null\n\n  @ReactMethod fun getCapability(promise: Promise) {\n    val status = sdkStatus()\n    val map = Arguments.createMap()\n    map.putBoolean(\"available\", status == HealthConnectClient.SDK_AVAILABLE)\n    map.putString(\"reason\", when (status) {\n      HealthConnectClient.SDK_AVAILABLE -> null\n      HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> \"provider_update_required\"\n      else -> if (Build.VERSION.SDK_INT < 28) \"android_version\" else \"not_supported\"\n    })\n    map.putArray(\"supportedMetrics\", Arguments.fromList(listOf(\"steps\", \"sleep\", \"heart_rate\", \"weight\")))\n    promise.resolve(map)\n  }\n\n  @ReactMethod fun getPermissions(promise: Promise) {\n    val hc = client() ?: return promise.resolve(permissionMap(emptySet()))\n    scope.launch {\n      try { promise.resolve(permissionMap(hc.permissionController.getGrantedPermissions())) }\n      catch (error: Throwable) { promise.reject(\"HEALTH_CONNECT_PERMISSIONS\", error) }\n    }\n  }\n\n  @ReactMethod fun requestPermissions(promise: Promise) {\n    val activity = currentActivity ?: return promise.reject(\"HEALTH_CONNECT_NO_ACTIVITY\", \"PregaLove must be open to request Health Connect permissions.\")\n    val hc = client() ?: return promise.resolve(permissionMap(emptySet()))\n    if (permissionPromise != null) return promise.reject(\"HEALTH_CONNECT_PERMISSION_ACTIVE\", \"A Health Connect permission request is already open.\")\n    try {\n      permissionPromise = promise\n      val contract = PermissionController.createRequestPermissionResultContract()\n      val intent = contract.createIntent(activity, requiredPermissions())\n      activity.startActivityForResult(intent, permissionRequestCode)\n    } catch (error: Throwable) {\n      permissionPromise = null\n      promise.reject(\"HEALTH_CONNECT_PERMISSION_REQUEST\", error)\n    }\n  }\n\n  @ReactMethod fun readSummary(promise: Promise) {\n    val hc = client() ?: return promise.resolve(emptySummary())\n    scope.launch {\n      try {\n        val granted = hc.permissionController.getGrantedPermissions()\n        val now = Instant.now()\n        val zone = ZoneId.systemDefault()\n        val todayStart = LocalDate.now(zone).atStartOfDay(zone).toInstant()\n        val yesterdayStart = LocalDate.now(zone).minusDays(1).atStartOfDay(zone).toInstant()\n        val recentStart = now.minus(7, ChronoUnit.DAYS)\n\n        var steps: Long? = null\n        var sleepMinutes: Long? = null\n        var latestHeartRate: Long? = null\n        var latestWeight: Double? = null\n\n        if (granted.contains(HealthPermission.getReadPermission(StepsRecord::class))) {\n          val result = hc.readRecords(ReadRecordsRequest(StepsRecord::class, TimeRangeFilter.between(todayStart, now)))\n          steps = result.records.sumOf { it.count }\n        }\n        if (granted.contains(HealthPermission.getReadPermission(SleepSessionRecord::class))) {\n          val result = hc.readRecords(ReadRecordsRequest(SleepSessionRecord::class, TimeRangeFilter.between(yesterdayStart, now)))\n          sleepMinutes = result.records.sumOf { ChronoUnit.MINUTES.between(it.startTime, it.endTime).coerceAtLeast(0) }\n        }\n        if (granted.contains(HealthPermission.getReadPermission(HeartRateRecord::class))) {\n          val result = hc.readRecords(ReadRecordsRequest(HeartRateRecord::class, TimeRangeFilter.between(recentStart, now), ascendingOrder = false, pageSize = 50))\n          latestHeartRate = result.records.flatMap { it.samples }.maxByOrNull { it.time }?.beatsPerMinute\n        }\n        if (granted.contains(HealthPermission.getReadPermission(WeightRecord::class))) {\n          val result = hc.readRecords(ReadRecordsRequest(WeightRecord::class, TimeRangeFilter.between(now.minus(90, ChronoUnit.DAYS), now), ascendingOrder = false, pageSize = 1))\n          latestWeight = result.records.firstOrNull()?.weight?.inKilograms\n        }\n\n        val map = Arguments.createMap()\n        map.putString(\"source\", \"health_connect\")\n        map.putString(\"generatedAt\", now.toString())\n        if (steps == null) map.putNull(\"stepsToday\") else map.putDouble(\"stepsToday\", steps.toDouble())\n        if (sleepMinutes == null) map.putNull(\"sleepMinutesLastNight\") else map.putDouble(\"sleepMinutesLastNight\", sleepMinutes.toDouble())\n        if (latestHeartRate == null) map.putNull(\"latestHeartRateBpm\") else map.putDouble(\"latestHeartRateBpm\", latestHeartRate.toDouble())\n        if (latestWeight == null) map.putNull(\"latestWeightKg\") else map.putDouble(\"latestWeightKg\", latestWeight)\n        promise.resolve(map)\n      } catch (error: Throwable) { promise.reject(\"HEALTH_CONNECT_READ\", error) }\n    }\n  }\n\n  private fun permissionMap(granted: Set<String>): WritableMap {\n    val map = Arguments.createMap()\n    map.putBoolean(\"steps\", granted.contains(HealthPermission.getReadPermission(StepsRecord::class)))\n    map.putBoolean(\"sleep\", granted.contains(HealthPermission.getReadPermission(SleepSessionRecord::class)))\n    map.putBoolean(\"heart_rate\", granted.contains(HealthPermission.getReadPermission(HeartRateRecord::class)))\n    map.putBoolean(\"weight\", granted.contains(HealthPermission.getReadPermission(WeightRecord::class)))\n    return map\n  }\n\n  private fun emptySummary(): WritableMap {\n    val map = Arguments.createMap()\n    map.putString(\"source\", \"health_connect\")\n    map.putString(\"generatedAt\", Instant.now().toString())\n    map.putNull(\"stepsToday\")\n    map.putNull(\"sleepMinutesLastNight\")\n    map.putNull(\"latestHeartRateBpm\")\n    map.putNull(\"latestWeightKg\")\n    return map\n  }\n\n  override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {\n    if (requestCode != permissionRequestCode) return\n    val promise = permissionPromise ?: return\n    permissionPromise = null\n    val hc = client() ?: return promise.resolve(permissionMap(emptySet()))\n    scope.launch {\n      try { promise.resolve(permissionMap(hc.permissionController.getGrantedPermissions())) }\n      catch (error: Throwable) { promise.reject(\"HEALTH_CONNECT_PERMISSION_RESULT\", error) }\n    }\n  }\n\n  override fun onNewIntent(intent: Intent) = Unit\n}\n`);

    return mod;
  }]);
};
