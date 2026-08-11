import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
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

async function probeRecovery(filename) {
  const normalized = path.join(os.tmpdir(), 'janani-approved-icon-normalized.png');
  const python = spawnSync(
    'python3',
    [
      '-c',
      [
        'from PIL import Image',
        'import sys',
        'img = Image.open(sys.argv[1])',
        'img.load()',
        'print(f"PIL OK: {img.size[0]}x{img.size[1]} {img.mode}")',
        'img.convert("RGBA").save(sys.argv[2], format="PNG")',
      ].join('; '),
      filename,
      normalized,
    ],
    { encoding: 'utf8' },
  );

  if (python.status === 0) {
    process.stdout.write(python.stdout);
    try {
      const image = await Jimp.read(normalized);
      console.log(`Recovered PNG is Expo/Jimp-readable: ${image.bitmap.width}x${image.bitmap.height}`);
    } catch (error) {
      console.error('PIL wrote a file, but Expo/Jimp still rejected the normalized PNG.');
      console.error(error instanceof Error ? error.message : String(error));
    }
    return;
  }

  console.warn('PIL recovery probe failed or Pillow is unavailable.');
  if (python.stdout) process.stdout.write(python.stdout);
  if (python.stderr) process.stderr.write(python.stderr);

  const identify = spawnSync('identify', [filename], { encoding: 'utf8' });
  if (identify.status === 0) {
    console.log(`ImageMagick identify OK: ${identify.stdout.trim()}`);
  } else {
    console.warn('ImageMagick recovery probe also failed or is unavailable.');
    if (identify.stderr) process.stderr.write(identify.stderr);
  }
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
    if (filename === generatedIcon) await probeRecovery(filename);
  }
}

if (failed) process.exit(1);
