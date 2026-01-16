# Testing Guide

This document describes how to run tests for the UTMGradient application.

## Backend Tests

Backend tests are located in the `backend/tests/` directory and use Jest as the testing framework.

### Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Run tests:
```bash
npm test
```

3. Run tests in watch mode:
```bash
npm run test:watch
```

4. Run tests with coverage:
```bash
npm run test:coverage
```

### Test Structure

- `backend/tests/setup.js` - Jest setup file that runs before all tests
- `backend/tests/utils/` - Utility function tests
- `backend/tests/routes/` - API route tests
- `backend/tests/middleware/` - Middleware tests
- `backend/tests/services/` - Service function tests

### Writing Backend Tests

Example test structure:

```javascript
describe('Feature Name', () => {
  describe('Function Name', () => {
    it('should do something', () => {
      expect(true).toBe(true);
    });
  });
});
```

## Frontend Tests

Frontend tests are located in the `__tests__/` directory and use Jest with React Testing Library.

### Setup

1. Install dependencies:
```bash
npm install
```

2. Run tests:
```bash
npm test
```

3. Run tests in watch mode:
```bash
npm run test:watch
```

4. Run tests with coverage:
```bash
npm run test:coverage
```

### Test Structure

- `__tests__/lib/` - Library function tests
- `__tests__/utils/` - Utility function tests
- `jest.setup.js` - Jest setup file for frontend tests

### Writing Frontend Tests

Example test structure:

```typescript
import { render, screen } from '@testing-library/react';

describe('Component Name', () => {
  it('should render correctly', () => {
    // Test implementation
  });
});
```

## Test Coverage

Coverage reports are generated in the `coverage/` directory after running tests with the `--coverage` flag.

- Backend coverage: `backend/coverage/`
- Frontend coverage: `coverage/`

## Notes

- Backend tests currently use placeholder test structures. Full implementation requires:
  - Test database setup
  - Mock database connections
  - Actual endpoint testing with supertest
  
- Frontend tests currently include basic utility tests. Full implementation requires:
  - Component testing setup
  - Mock API responses
  - Integration testing

## Running All Tests

To run both backend and frontend tests:

```bash
# Backend tests
cd backend && npm test

# Frontend tests (from root)
npm test
```

