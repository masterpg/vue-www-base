module.exports = {
  moduleFileExtensions: ['js', 'jsx', 'json', 'vue', 'ts', 'tsx'],
  transform: {
    '^.+\\.vue$': 'vue-jest',
    '.+\\.(css|styl|less|sass|scss|svg|png|jpg|ttf|woff|woff2)$': 'jest-transform-stub',
    '^.+\\.tsx?$': 'ts-jest',
  },
  transformIgnorePatterns: ['/node_modules/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  snapshotSerializers: ['jest-serializer-vue'],
  testMatch: ['**/tests/unit/**/*.spec.(js|jsx|ts|tsx)|**/__tests__/*.(js|jsx|ts|tsx)'],
  testURL: 'http://localhost/',
  globals: {
    'ts-jest': {
      babelConfig: true,
    },
  },
  // collectCoverage: true,
  // collectCoverageFrom: ['**/*.{ts,vue}', '!**/node_modules/**'],
  setupTestFrameworkScriptFile: '<rootDir>/tests/setup.js',
  // setupFilesAfterEnv: ['<rootDir>/tests/tests/setup.js'],
}