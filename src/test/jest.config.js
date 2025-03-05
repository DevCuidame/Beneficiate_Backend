module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/test/**/*.js'],
    verbose: true,
    clearMocks: true,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coveragePathIgnorePatterns: ['/node_modules/'],
    // Configuración importante para evitar problemas con timers asincrónicos
    setupFilesAfterEnv: ['./jest.setup.js']
  };