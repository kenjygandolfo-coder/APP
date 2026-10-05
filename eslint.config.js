const expoConfig = require('eslint-config-expo/flat');

module.exports = [].concat(
  expoConfig,
  { ignores: ['dist/*', 'coverage/*', 'android/*', 'ios/*'] },
  { rules: { 'no-console': 'error' } },
);
