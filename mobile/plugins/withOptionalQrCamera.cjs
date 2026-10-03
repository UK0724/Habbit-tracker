const { withAndroidManifest } = require('@expo/config-plugins');

// QR scanning is optional. Users can still record expenses without a camera.
module.exports = function withOptionalQrCamera(config) {
  return withAndroidManifest(config, (result) => {
    const manifest = result.modResults.manifest;
    const names = ['android.hardware.camera', 'android.hardware.camera.autofocus'];
    manifest['uses-feature'] = [
      ...(manifest['uses-feature'] ?? []).filter((entry) => !names.includes(entry.$?.['android:name'])),
      ...names.map((name) => ({ $: { 'android:name': name, 'android:required': 'false' } }))
    ];
    return result;
  });
};
