const fs = require('fs');
const path = require('path');

function materializeBase64Asset(sourceRelativePath, outputRelativePath) {
  const sourcePath = path.join(__dirname, sourceRelativePath);
  const outputPath = path.join(__dirname, outputRelativePath);
  const base64 = fs.readFileSync(sourcePath, 'utf8').trim();
  const image = Buffer.from(base64, 'base64');

  if (!fs.existsSync(outputPath) || !fs.readFileSync(outputPath).equals(image)) {
    fs.writeFileSync(outputPath, image);
  }

  return `./${outputRelativePath.replace(/\\/g, '/')}`;
}

module.exports = ({ config }) => {
  const icon = materializeBase64Asset(
    'assets/branding/janani-app-icon.png.b64',
    'assets/.generated-janani-app-icon.png'
  );
  const adaptiveForeground = materializeBase64Asset(
    'assets/branding/janani-adaptive-foreground.png.b64',
    'assets/.generated-janani-adaptive-foreground.png'
  );

  return {
    ...config,
    icon,
    android: {
      ...config.android,
      adaptiveIcon: {
        ...config.android?.adaptiveIcon,
        foregroundImage: adaptiveForeground,
        backgroundColor: '#FFF7F2',
      },
    },
  };
};
