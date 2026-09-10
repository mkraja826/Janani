import fs from 'node:fs';

const rootAppExists = fs.existsSync('app');
const srcAppExists = fs.existsSync('src/app');

if (!rootAppExists) {
  console.error('Expo Router route root missing: expected root app/ directory.');
  process.exit(1);
}

if (srcAppExists) {
  console.error('Expo Router route root conflict: src/app/ exists and takes precedence over root app/. Remove src/app/ or migrate the complete route tree intentionally.');
  process.exit(1);
}

for (const required of ['app/index.tsx', 'app/_layout.tsx', 'app/+native-intent.tsx', 'app/+not-found.tsx']) {
  if (!fs.existsSync(required)) {
    console.error(`Required Expo Router entry missing: ${required}`);
    process.exit(1);
  }
}

console.log('Expo Router root invariant passed: using root app/ only.');
