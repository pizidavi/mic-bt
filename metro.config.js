const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Apply uniwind modifications before exporting
const uniwindConfig = withUniwindConfig(config, {
  // Relative path to your global.css file
  cssEntryFile: './src/global.css',
  // Path to typings
  dtsFile: './uniwind-types.d.ts',
});

module.exports = uniwindConfig;
