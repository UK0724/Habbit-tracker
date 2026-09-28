// Expo SDK 52's CLI expects a default tar export. The patched tar 7 release
// exposes named exports, so provide that alias before Expo's prebuild runs.
const tar = require("tar");
if (!tar.default) tar.default = tar;

module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
    [
      "expo-build-properties",
      {
        android: {
          // Google Play requires targeting Android 15 (API 35) or newer.
          compileSdkVersion: 35,
          targetSdkVersion: 35,
          usesCleartextTraffic: process.env.EAS_BUILD_PROFILE === "preview"
        }
      }
    ]
  ]
});
