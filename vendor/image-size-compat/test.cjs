'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const imageSize = require('./index.cjs');

assert.equal(imageSize.disableTypes, undefined);
assert.equal(Object.isFrozen(imageSize), true);
assert.equal(Object.isFrozen(imageSize.types), true);
assert.deepEqual(
  [...imageSize.types].sort(),
  ['bmp', 'gif', 'jpg', 'ktx', 'png', 'psd', 'svg', 'tiff', 'webp']
);

const projectRoot = path.resolve(__dirname, '..', '..');
const trackedIconPath = path.join(projectRoot, 'assets', 'icon.png');
const trackedIcon = fs.readFileSync(trackedIconPath);

assert.deepEqual(imageSize(trackedIconPath), { width: 1024, height: 1024, type: 'png' });
assert.deepEqual(imageSize(trackedIcon), { width: 1024, height: 1024, type: 'png' });

const onePixelJpeg = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAwAAABB//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPxB//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPxB//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxB//9k=',
  'base64'
);
assert.deepEqual(imageSize(onePixelJpeg), { width: 1, height: 1, type: 'jpg' });

const rejectedInputs = [
  ['empty', Buffer.alloc(0)],
  ['icns', Buffer.from([0x69, 0x63, 0x6e, 0x73, 0, 0, 0, 8])],
  ['jxl', Buffer.from([0xff, 0x0a, 0, 0, 0, 0, 0, 0])],
  ['jxl-stream', Buffer.from([0, 0, 0, 0x0c, 0x4a, 0x58, 0x4c, 0x20, 0x0d, 0x0a, 0x87, 0x0a])],
  ['heif', Buffer.from([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66, 0, 0, 0, 0, 0x61, 0x76, 0x69, 0x66, 0x6d, 0x69, 0x66, 0x31])],
];

const startedAt = Date.now();
for (const [name, input] of rejectedInputs) {
  assert.throws(() => imageSize(input), undefined, `${name} input must be rejected`);
}
assert.ok(Date.now() - startedAt < 1000, 'rejected inputs must fail without expensive parsing');

console.log('Verified Metro image-size compatibility and restricted parser allowlist.');
