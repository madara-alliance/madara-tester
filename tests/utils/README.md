# Test Utilities

This directory contains shared utilities for test files to reduce duplication and improve maintainability.

## Available Utilities

### `fs-path-mocks.ts`

Provides helper functions for mocking filesystem and path operations:

- `setupFsPathMocks()`: Sets up common mocks for fs and path modules
- `mockReadFileSync(value)`: Mocks fs.readFileSync to return a stringified JSON object
- `mockReadFileSyncError(message)`: Mocks fs.readFileSync to throw an error
- `mockReadFileSyncSequence(implementations)`: Mocks fs.readFileSync with a sequence of implementations

### `test-configs.ts`

Provides common test configurations:

- `validTestConfig`: A valid sample configuration for testing

## Usage Example

```typescript
import { setupFsPathMocks, mockReadFileSync } from '../utils/fs-path-mocks';
import { validTestConfig } from '../utils/test-configs';
import fs from 'fs';
import path from 'path';

// Mock modules
jest.mock('fs');
jest.mock('path');

describe('My Test Suite', () => {
  beforeEach(() => {
    setupFsPathMocks();
  });

  test('my test', async () => {
    mockReadFileSync(validTestConfig);
    // Your test code here
  });
});
``` 