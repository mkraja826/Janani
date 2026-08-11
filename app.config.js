module.exports = ({ config }) => ({
  ...config,
  // Keep launcher artwork sourced from app.json static PNG assets.
  // The previous base64 materialization path produced a PNG that Expo/Jimp
  // could not decode during Android prebuild ("Unrecognised filter type - 9").
  // Static icon/adaptive-icon assets are already tracked and have passed
  // clean native prebuild/Gradle compilation.
});
