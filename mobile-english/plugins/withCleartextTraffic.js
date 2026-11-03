const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');

/**
 * Config Plugin cho phép Android (API 28+) kết nối HTTP (Cleartext Traffic)
 * tới máy chủ Backend Local (http://192.168.x.x:3000) khi build APK Release.
 */
module.exports = function withCleartextTraffic(config) {
  return withAndroidManifest(config, (modConfig) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(modConfig.modResults);
    mainApplication.$['android:usesCleartextTraffic'] = 'true';
    return modConfig;
  });
};
