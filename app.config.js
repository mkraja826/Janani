const fs = require('fs');
const path = require('path');

function materializeIconFromParts(partsRelativePath, outputRelativePath) {
  const partsPath = path.join(__dirname, partsRelativePath);
  const outputPath = path.join(__dirname, outputRelativePath);
  const base64 = fs
    .readdirSync(partsPath)
    .filter((file) => file.endsWith('.b64part'))
    .sort()
    .map((file) => fs.readFileSync(path.join(partsPath, file), 'utf8').trim())
    .join('');
  const image = Buffer.from(base64, 'base64');

  if (!fs.existsSync(outputPath) || !fs.readFileSync(outputPath).equals(image)) {
    fs.writeFileSync(outputPath, image);
  }

  return `./${outputRelativePath.replace(/\\/g, '/')}`;
}

module.exports = ({ config }) => {
  const icon = materializeIconFromParts(
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
