import fs from 'node:fs';

function fail(message) {
  console.error(`Android release validation failed: ${message}`);
  process.exitCode = 1;
}

const app = JSON.parse(fs.readFileSync('app.json', 'utf8')).expo;
const eas = JSON.parse(fs.readFileSync('eas.json', 'utf8'));
const firebase = JSON.parse(fs.readFileSync('google-services.json', 'utf8'));
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const expectedPackage = 'com.mkraja826.janani';

if (app.android?.package !== expectedPackage) {
  fail(`Expo Android package must remain ${expectedPackage}`);
}
if (app.ios?.bundleIdentifier !== expectedPackage) {
  fail(`iOS bundle identifier must remain ${expectedPackage}`);
}

const firebasePackages = (firebase.client ?? [])
  .map((client) => client?.client_info?.android_client_info?.package_name)
  .filter(Boolean);
if (!firebasePackages.includes(expectedPackage)) {
  fail('google-services.json does not contain the Janani Android package');
}

if (app.android?.googleServicesFile !== './google-services.json') {
  fail('Expo Android config must reference ./google-services.json');
}

if (eas.build?.production?.android?.buildType !== 'app-bundle') {
  fail('EAS production Android build must produce an app-bundle');
}
if (eas.build?.production?.autoIncrement !== true) {
  fail('EAS production build must auto-increment the remote app version');
}
if (eas.cli?.appVersionSource !== 'remote') {
  fail('EAS appVersionSource must remain remote');
}

if (!Number.isInteger(app.android?.versionCode) || app.android.versionCode < 1) {
  fail('Android versionCode must be a positive integer');
}
if (typeof app.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(app.version)) {
  fail('Expo version must use semantic x.y.z format');
}

const permissions = new Set(app.android?.permissions ?? []);
for (const permission of [
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.RECEIVE_BOOT_COMPLETED',
  'android.permission.VIBRATE',
]) {
  if (!permissions.has(permission)) fail(`missing required permission ${permission}`);
}

const unexpectedSensitivePermissions = [
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.CAMERA',
  'android.permission.READ_CONTACTS',
  'android.permission.RECORD_AUDIO',
  'android.permission.READ_SMS',
  'android.permission.READ_CALL_LOG',
].filter((permission) => permissions.has(permission));
if (unexpectedSensitivePermissions.length > 0) {
  fail(`unexpected sensitive permissions: ${unexpectedSensitivePermissions.join(', ')}`);
}

const plugins = app.plugins ?? [];
const pluginNames = plugins.map((plugin) => Array.isArray(plugin) ? plugin[0] : plugin);
for (const plugin of [
  '@react-native-firebase/app',
  '@react-native-firebase/crashlytics',
  '@react-native-firebase/perf',
  'expo-notifications',
  './plugins/withJananiWidget',
]) {
  if (!pluginNames.includes(plugin)) fail(`missing required Expo plugin ${plugin}`);
}

for (const dependency of [
  '@react-native-firebase/app',
  '@react-native-firebase/analytics',
  '@react-native-firebase/crashlytics',
  '@react-native-firebase/perf',
]) {
  if (!packageJson.dependencies?.[dependency]) {
    fail(`missing required Firebase dependency ${dependency}`);
  }
}

if (app.android?.allowBackup !== false) {
  fail('Android allowBackup must remain false for Janani');
}

if (process.exitCode) process.exit(process.exitCode);
console.log('Android release validation passed.');
