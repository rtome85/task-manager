module.exports = {
    testEnvironment: 'node',
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/tests/',
    ],
    testMatch: [
        '**/tests/**/*.test.js',
        '**/src/**/*.test.js'
    ],
    setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
    testTimeout: 10000
};