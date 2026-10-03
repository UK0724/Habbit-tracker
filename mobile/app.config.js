// Expo SDK 52's CLI expects a default tar export. The patched tar 7 release
// exposes named exports, so provide that alias before Expo's prebuild runs.
const tar = require("tar");
if (!tar.default) tar.default = tar;

module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
    "./plugins/withOptionalQrCamera.cjs",
    [
      "expo-build-properties",
      {
        android: {
          // Google Play requires targeting Android 16 (API 36) or newer.
          compileSdkVersion: 36,
          targetSdkVersion: 36,
          usesCleartextTraffic: process.env.EAS_BUILD_PROFILE === "preview"
        }
      }
    ]
  ]
});
