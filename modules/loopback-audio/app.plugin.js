const { withAndroidManifest } = require('expo/config-plugins');

const RECORD_AUDIO_PERMISSION = 'android.permission.RECORD_AUDIO';

const withLoopbackAudio = config =>
  withAndroidManifest(config, projectConfig => {
    const manifest = projectConfig.modResults;
    const permissions = manifest.manifest['uses-permission'] ?? [];
    const hasPermission = permissions.some(
      item => item.$?.['android:name'] === RECORD_AUDIO_PERMISSION,
    );
    if (!hasPermission) {
      manifest.manifest['uses-permission'] = [
        ...permissions,
        { $: { 'android:name': RECORD_AUDIO_PERMISSION } },
      ];
    }
    return projectConfig;
  });

module.exports = withLoopbackAudio;
