const { withAppBuildGradle } = require('@expo/config-plugins');

const MARKER = '// JANANI_PRODUCTION_SIGNING';

module.exports = function withJananiReleaseSigning(config) {
  return withAppBuildGradle(config, (mod) => {
    if (mod.modResults.language !== 'groovy') {
      throw new Error('Janani release signing currently supports the Groovy Android Gradle template only.');
    }

    let contents = mod.modResults.contents;
    if (contents.includes(MARKER)) return mod;

    contents += `\n\n${MARKER}\ndef jananiReleaseTask = gradle.startParameter.taskNames.any { it.toLowerCase().contains("release") }\ndef jananiKeystorePath = System.getenv("JANANI_ANDROID_KEYSTORE_PATH")\ndef jananiKeystorePassword = System.getenv("JANANI_ANDROID_KEYSTORE_PASSWORD")\ndef jananiKeyAlias = System.getenv("JANANI_ANDROID_KEY_ALIAS")\ndef jananiKeyPassword = System.getenv("JANANI_ANDROID_KEY_PASSWORD")\n\nif (jananiReleaseTask) {\n    if (!jananiKeystorePath || !jananiKeystorePassword || !jananiKeyAlias || !jananiKeyPassword) {\n        throw new GradleException("Janani production release signing variables are required for release tasks.")\n    }\n\n    android {\n        signingConfigs {\n            jananiProduction {\n                storeFile file(jananiKeystorePath)\n                storePassword jananiKeystorePassword\n                keyAlias jananiKeyAlias\n                keyPassword jananiKeyPassword\n            }\n        }\n        buildTypes {\n            release {\n                signingConfig signingConfigs.jananiProduction\n            }\n        }\n    }\n}\n`;

    mod.modResults.contents = contents;
    return mod;
  });
};
