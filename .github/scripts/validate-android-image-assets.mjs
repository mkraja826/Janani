import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Jimp = require('jimp-compact');
const root = process.cwd();

const candidates = [
  path.join(root, 'assets/branding/janani-app-icon.normalized.png'),
  path.join(root, 'assets/splash-icon.png'),
  path.join(root, 'assets/notification-icon.png'),
  path.join(root, 'assets/monochrome-icon.png'),
  path.join(root, 'assets/adaptive-icon.png'),
  path.join(root, 'assets/icon.png'),
  path.join(root, 'assets/branding/janani-mark.png'),
];

let failed = false;
for (const filename of candidates) {
  const relative = path.relative(root, filename);
  try {
    const image = await Jimp.read(filename);
    console.log(`PNG OK: ${relative} (${image.bitmap.width}x${image.bitmap.height})`);
  } catch (error) {
    failed = true;
    console.error(`PNG FAILED: ${relative}`);
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  }
}

if (failed) process.exit(1);
