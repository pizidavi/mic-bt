const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const testFileRe = /\.(?:test|spec)\.[cm]?[jt]sx?$/u;
const testOnlyPackageRe =
  /^(?:vitest|vite|vitest-native|@vitest\/[^/]+|@testing-library\/react-native|test-renderer)(?:\/|$)/u;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (testFileRe.test(moduleName) || testOnlyPackageRe.test(moduleName)) {
    return { type: 'empty' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Apply uniwind modifications before exporting
const uniwindConfig = withUniwindConfig(config, {
  // Relative path to your global.css file
  cssEntryFile: './src/global.css',
  // Path to typings
  dtsFile: './uniwind-types.d.ts',
});

module.exports = uniwindConfig;
