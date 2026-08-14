'use strict';

const fs = require('node:fs');
const upstream = require('image-size-upstream');

const METRO_IMAGE_TYPES = new Set([
  'bmp',
  'gif',
  'jpg',
  'ktx',
  'png',
  'psd',
  'svg',
  'tiff',
  'webp',
]);

if (!Array.isArray(upstream.types) || typeof upstream.disableTypes !== 'function') {
  throw new TypeError('The official image-size package did not expose type controls.');
}

upstream.disableTypes(
  upstream.types.filter((type) => !METRO_IMAGE_TYPES.has(type))
);

const upstreamImageSize = typeof upstream === 'function'
  ? upstream
  : upstream.imageSize ?? upstream.default;

if (typeof upstreamImageSize !== 'function') {
  throw new TypeError('The official image-size package did not expose an imageSize function.');
}

function imageSizeCompat(input) {
  const normalizedInput = typeof input === 'string'
    ? fs.readFileSync(input)
    : input;
  return upstreamImageSize(normalizedInput);
}

Object.defineProperties(imageSizeCompat, {
  default: {
    enumerable: true,
    value: imageSizeCompat,
  },
  imageSize: {
    enumerable: true,
    value: imageSizeCompat,
  },
  types: {
    enumerable: true,
    value: Object.freeze([...METRO_IMAGE_TYPES]),
  },
});

module.exports = Object.freeze(imageSizeCompat);
