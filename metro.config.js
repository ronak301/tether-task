const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const { transformer, resolver } = config;

config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

config.resolver = {
  ...resolver,
  assetExts: resolver.assetExts.filter(ext => ext !== 'svg'),
  sourceExts: [...resolver.sourceExts, 'svg'],
  nodeModulesPaths: [path.resolve(__dirname, 'node_modules')],
  // Node.js core module polyfills for React Native
  extraNodeModules: {
    stream: require.resolve('stream-browserify'),
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    zlib: require.resolve('browserify-zlib'),
    path: require.resolve('path-browserify'),
    events: require.resolve('events'),
    process: require.resolve('process/browser'),
    querystring: require.resolve('querystring-es3'),
    buffer: require.resolve('@craftzdog/react-native-buffer'),
    crypto: require.resolve('react-native-crypto'),
  },
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Force all consumers to use root expo-crypto@15.x — prevents nested 55.x
  // from being resolved (which would eagerly load the missing ExpoCryptoAES native module)
  if (moduleName === 'expo-crypto') {
    return context.resolveRequest(
      { ...context, originModulePath: __filename },
      moduleName,
      platform
    );
  }

  // Handle @/ alias
  if (moduleName.startsWith('@/')) {
    const resolvedPath = moduleName.replace('@/', path.resolve(__dirname, 'src') + '/');
    try {
      return context.resolveRequest(context, resolvedPath, platform);
    } catch (_) {
      // fall through to default resolver
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
