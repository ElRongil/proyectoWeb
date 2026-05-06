export default {
  testEnvironment: 'node',
  transform: {},
  extensionsToTreatAsEsm: [],
  testMatch: ['**/tests/**/*.test.js'],
  globalSetup: './tests/setup.js',
  globalTeardown: './tests/teardown.js',
  testTimeout: 30000
};
