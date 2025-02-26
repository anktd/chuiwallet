/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest/presets/default-esm', // Use the ESM preset
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@samouraiwallet/electrum-client$': '<rootDir>/__mocks__/@samouraiwallet/electrum-client.js',
  },
  transformIgnorePatterns: ['/node_modules/'],
};
