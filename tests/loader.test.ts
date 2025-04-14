import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import {
  setupFsPathMocks,
  mockReadFileSync,
  mockReadFileSyncError,
  mockReadFileSyncSequence,
  mockDefaultConfigPath,
} from './utils/fs-path-mocks'; 

// Define a valid test config object for all tests to use
const validTestConfig = {
  apiUrl: 'https://api.example.com',
};

// Mock fs and path - this must be done before importing the loader
jest.mock('fs');
jest.mock('path');

// Set up a consistent default config path for all tests
const DEFAULT_CONFIG_PATH = mockDefaultConfigPath();

// Now import the loader which will use the mocked path.join
import { loadConfig } from '../src/config/loader';

describe('Config Loader', () => {
  // Setup and teardown
  beforeEach(() => {
    setupFsPathMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should load config from specified path', async () => {
    // Mock fs.readFileSync to return a valid config
    mockReadFileSync(validTestConfig);

    const config = await loadConfig('/test/config.json');

    // Verify the correct path was used
    expect(fs.readFileSync).toHaveBeenCalledWith('/test/config.json', 'utf8');
    expect(config).toEqual(validTestConfig);
  });

  test('should resolve relative paths', async () => {
    // Mock path.isAbsolute to return false for relative paths
    (path.isAbsolute as jest.Mock).mockReturnValue(false);
    // Mock fs.readFileSync to return a valid config
    mockReadFileSync(validTestConfig);

    await loadConfig('relative/path/config.json');

    // Verify the path was resolved
    expect(path.resolve).toHaveBeenCalled();
    expect(fs.readFileSync).toHaveBeenCalled();
  });

  test('should throw error for invalid JSON', async () => {
    // Mock fs.readFileSync to return invalid JSON
    (fs.readFileSync as jest.Mock).mockReturnValue('{ invalid json }');

    await expect(loadConfig('/test/invalid.json')).rejects.toThrow();
  });

  test('should fall back to default config if specified file fails to load', async () => {
    // First call throws an error, second call succeeds with default config
    mockReadFileSyncSequence([
      () => {
        throw new Error('File not found');
      },
      () => JSON.stringify(validTestConfig),
    ]);

    const config = await loadConfig('/non-existent/config.json');

    // Verify fallback was used
    expect(console.warn).toHaveBeenCalled();
    expect(config).toEqual(validTestConfig);
  });

  test('should throw error if default config fails to load', async () => {
    // Both attempts to read file fail
    mockReadFileSyncError('File not found');

    await expect(loadConfig(DEFAULT_CONFIG_PATH)).rejects.toThrow('Error loading default config');
  });
});
