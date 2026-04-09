// Jest setup file for backend tests
// This file runs before all tests

// Mock environment variables if needed
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-jest-tests';
process.env.PORT = '5001'; // Use different port for tests

// Suppress console.log during tests (optional - uncomment if needed)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

