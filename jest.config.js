/** @type {import('jest').Config} */
const config = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
  ],
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$|marked|ngx-markdown|@stomp|uuid)'],
  testEnvironment: 'jsdom',
};

export default config;
