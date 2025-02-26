module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  moduleNameMapper: {
    '^@samouraiwallet/electrum-client$': '<rootDir>/__mocks__/@samouraiwallet/electrum-client.js',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {},
};
