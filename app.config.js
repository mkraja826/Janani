/* global Buffer, __dirname */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const APPROVED_ICON_SHA256 =
  'bcc71c6c06bc51f78b247d4bdc60acdb4c0ab69826f83eca114f97d14344048b';

function validateProductionIcon(base64, image) {
  const normalizedBase64 = base64.replace(/\s/g, '');

  if (
    normalizedBase64.length % 4 !== 0 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      normalizedBase64
    )
  ) {
    throw new Error(
      'Invalid Janani app icon: the Base64 parts are incomplete or malformed. Restore the complete approved PNG source before building.'
    );
  }

  if (image.length < PNG_SIGNATURE.length || !image.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('Invalid Janani app icon: reconstructed asset is not a PNG file.');
  }

  let offset = PNG_SIGNATURE.length;
  let width;
  let height;
  let chunkIndex = 0;
  let foundIdat = false;
  let foundIend = false;

  while (offset < image.length) {
    if (offset + 12 > image.length) {
      throw new Error('Invalid Janani app icon: PNG ends inside a chunk header.');
    }

    const chunkLength = image.readUInt32BE(offset);
    const chunkType = image.toString('ascii', offset + 4, offset + 8);
    const chunkEnd = offset + 12 + chunkLength;

    if (!/^[A-Za-z]{4}$/.test(chunkType)) {
      throw new Error(`Invalid Janani app icon: malformed PNG chunk at byte ${offset}.`);
    }

    if (chunkEnd > image.length) {
      throw new Error(
        `Invalid Janani app icon: PNG ${chunkType} chunk declares ${chunkLength} bytes, but the reconstructed file is truncated.`
      );
    }

    if (chunkIndex === 0 && (chunkType !== 'IHDR' || chunkLength !== 13)) {
      throw new Error('Invalid Janani app icon: PNG must begin with a 13-byte IHDR chunk.');
    }

    if (chunkType === 'IHDR') {
      if (chunkIndex !== 0) {
        throw new Error('Invalid Janani app icon: PNG contains an unexpected IHDR chunk.');
      }

      width = image.readUInt32BE(offset + 8);
      height = image.readUInt32BE(offset + 12);
    }

    if (chunkType === 'IDAT') {
      foundIdat = true;
    }

    if (chunkType === 'IEND') {
      if (chunkLength !== 0 || chunkEnd !== image.length) {
        throw new Error('Invalid Janani app icon: PNG has a malformed IEND chunk.');
      }

      foundIend = true;
      break;
    }

    offset = chunkEnd;
    chunkIndex += 1;
  }

  if (!foundIend) {
    throw new Error('Invalid Janani app icon: PNG is missing its final IEND chunk.');
  }

  if (!foundIdat) {
    throw new Error('Invalid Janani app icon: PNG is missing image data.');
  }

  if (width !== height || width < 1024 || height < 1024) {
    throw new Error(
      `Invalid Janani app icon: expected a square PNG at least 1024x1024, received ${width}x${height}.`
    );
  }

  const digest = crypto.createHash('sha256').update(image).digest('hex');
  if (digest !== APPROVED_ICON_SHA256) {
    throw new Error(
      'Invalid Janani app icon: reconstructed PNG does not match the approved production artwork.'
    );
  }
}

function materializeIconFromParts(partsRelativePath, outputRelativePath) {
  const partsPath = path.join(__dirname, partsRelativePath);
  const outputPath = path.join(__dirname, outputRelativePath);
  const base64 = fs
    .readdirSync(partsPath)
    .filter((file) => file.endsWith('.b64part'))
    .sort()
    .map((file) => fs.readFileSync(path.join(partsPath, file), 'utf8'))
    .join('');
  const image = Buffer.from(base64.replace(/\s/g, ''), 'base64');

  validateProductionIcon(base64, image);

  if (!fs.existsSync(outputPath) || !fs.readFileSync(outputPath).equals(image)) {
    fs.writeFileSync(outputPath, image);
  }

  return `./${outputRelativePath.replace(/\\/g, '/')}`;
}

module.exports = ({ config }) => {
  const icon = materializeIconFromParts(
    'assets/branding/janani-approved-app-icon.parts',
    'assets/.generated-janani-app-icon.png'
  );

  return {
    ...config,
    icon,
  };
};
