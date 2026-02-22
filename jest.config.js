const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Map path aliases defined in tsconfig.json or jsconfig.json
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/app/\(app\)/(.*)$': '<rootDir>/src/app/(app)/$1',
  },
  // Add more setup options before each test is run
  testMatch: [
    "<rootDir>/src/app/(app)/**/*.test.ts?(x)",
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)"
  ],
  // For Next.js App Router, you might need to ignore specific files/folders
  testPathIgnorePatterns: ["/node_modules/", "/.next/"],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
