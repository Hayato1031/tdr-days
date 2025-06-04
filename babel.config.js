module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Reanimated plugin must be listed last
      [
        'react-native-reanimated/plugin',
        {
          globals: ['__scanCodes'],
        },
      ],
    ],
    env: {
      production: {
        plugins: [
          'react-native-paper/babel',
        ],
      },
    },
  };
};