import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Jimp = require('jimp-compact');
const root = process.cwd();

function materializeGeneratedIcon() {
  const partsDir = path.join(root, 'assets/branding/janani-app-icon.parts');
  const output = path.join(root, 'assets/.generated-janani-app-icon.png');
  const base64 = fs
    .readdirSync(partsDir)
    .filter((file) => file.endsWith('.b64part'))
    .sort()
    .map((file) => fs.readFileSync(path.join(partsDir, file), 'utf8').trim())
    .join('');
  fs.writeFileSync(output, Buffer.from(base64, 'base64'));
  return output;
}

const generatedIcon = materializeGeneratedIcon();
const candidates = [
  generatedIcon,
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
