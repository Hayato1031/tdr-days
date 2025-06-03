// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for dev builds - ensure proper module resolution
config.resolver = {
  ...config.resolver,
  // Handle missing modules gracefully
  resolverMainFields: ['react-native', 'browser', 'main'],
  // Ensure proper import resolution
  sourceExts: [...(config.resolver?.sourceExts || []), 'cjs'],
};

// Optimize for production builds
config.transformer = {
  ...config.transformer,
  minifierPath: 'metro-minify-terser',
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

// Increase timeout for slower builds
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      req.setTimeout(0);
      res.setTimeout(0);
      return middleware(req, res, next);
    };
  },
};

module.exports = config;