import fs from 'node:fs';

function read(path) {
  if (!fs.existsSync(path)) {
    console.error(`Generated Android validation failed: missing ${path}`);
    process.exit(1);
  }
  return fs.readFileSync(path, 'utf8');
}

function requirePattern(text, pattern, message) {
  if (!pattern.test(text)) {
    console.error(`Generated Android validation failed: ${message}`);
    process.exitCode = 1;
  }
}

const expectedPackage = 'com.mkraja826.janani';
const buildGradle = read('android/app/build.gradle');
const manifest = read('android/app/src/main/AndroidManifest.xml');
const mainApplication = read(`android/app/src/main/java/${expectedPackage.replaceAll('.', '/')}/MainApplication.kt`);

requirePattern(
  buildGradle,
  new RegExp(`namespace\\s+["']${expectedPackage.replaceAll('.', '\\.') }["']`),
  `generated namespace must remain ${expectedPackage}`,
);
requirePattern(
  buildGradle,
  new RegExp(`applicationId\\s+["']${expectedPackage.replaceAll('.', '\\.') }["']`),
  `generated applicationId must remain ${expectedPackage}`,
);
requirePattern(
  buildGradle,
  /com\.google\.gms\.google-services/,
  'Google Services Gradle plugin is not wired',
);
requirePattern(
  buildGradle,
  /com\.google\.firebase\.crashlytics/,
  'Firebase Crashlytics Gradle plugin is not wired',
);

for (const permission of [
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.RECEIVE_BOOT_COMPLETED',
  'android.permission.VIBRATE',
]) {
  requirePattern(
    manifest,
    new RegExp(`<uses-permission[^>]+android:name=["']${permission.replaceAll('.', '\\.') }["']`),
    `generated manifest is missing ${permission}`,
  );
}

requirePattern(
  manifest,
  /<application[^>]+android:allowBackup=["']false["']/s,
  'generated Android application must keep allowBackup=false',
);
requirePattern(
  manifest,
  /JananiCareWidget/,
  'Janani home-screen widget receiver is missing from the generated manifest',
);
requirePattern(
  mainApplication,
  /add\(JananiWidgetPackage\(\)\)/,
  'JananiWidgetPackage is not registered in generated MainApplication.kt',
);

const forbiddenPermissions = [
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.CAMERA',
  'android.permission.READ_CONTACTS',
  'android.permission.RECORD_AUDIO',
  'android.permission.READ_SMS',
  'android.permission.READ_CALL_LOG',
];
for (const permission of forbiddenPermissions) {
  if (manifest.includes(permission)) {
    console.error(`Generated Android validation failed: unexpected sensitive permission ${permission}`);
    process.exitCode = 1;
  }
}

if (process.exitCode) process.exit(process.exitCode);
console.log('Generated Android validation passed.');
