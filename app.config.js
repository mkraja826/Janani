const fs = require('fs');
const path = require('path');

function materializeIconFromParts(partsRelativePath, outputRelativePath) {
  const partsPath = path.join(__dirname, partsRelativePath);
  const outputPath = path.join(__dirname, outputRelativePath);
  const base64 = fs
    .readdirSync(partsPath)
    .filter((file) => file.endsWith('.b64part'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((file) => fs.readFileSync(path.join(partsPath, file), 'utf8').trim())
    .join('');
  const image = Buffer.from(base64, 'base64');

  if (!fs.existsSync(outputPath) || !fs.readFileSync(outputPath).equals(image)) {
    fs.writeFileSync(outputPath, image);
  }

  return `./${outputRelativePath.replace(/\\/g, '/')}`;
}

module.exports = ({ config }) => {
  // Native CI diagnostics may use the repository's known-good icon so that a
  // damaged branding source does not hide unrelated prebuild/widget/Gradle
  // failures. Release builds never set this flag and continue to require the
  // approved Janani launcher artwork.
  const useCiNativeIconFallback = process.env.JANANI_CI_NATIVE_ICON_FALLBACK === '1';
  const icon = useCiNativeIconFallback
    ? './assets/icon.png'
    : materializeIconFromParts(
        'assets/branding/janani-app-icon.parts',
        'assets/.generated-janani-app-icon.png'
      );

  return {
    ...config,
    icon,
    android: {
      ...config.android,
      adaptiveIcon: {
        ...config.android?.adaptiveIcon,
        foregroundImage: icon,
        backgroundColor: '#FFF7F2',
      },
    },
  };
};
