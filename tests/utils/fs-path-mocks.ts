import fs from 'fs';
import path from 'path';
import { jest } from '@jest/globals';

/**
 * Sets up common fs and path mocks for configuration tests
 */
export function setupFsPathMocks() {
  // Reset all mocks
  jest.clearAllMocks();
  
  // Mock path functions
  (path.isAbsolute as jest.Mock).mockImplementation((p: any) => p.startsWith('/'));
  (path.resolve as jest.Mock).mockImplementation((...args: any[]) => '/resolved/' + args.join('/'));
  (path.join as jest.Mock).mockImplementation((...args: any[]) => {
    const result = args.join('/');
    console.debug(`path.join called with: ${args}, result: ${result}`);
    return result;
  });
  
  // Mock console methods to avoid noise in tests
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  // Allow debug logs to pass through for troubleshooting
  jest.spyOn(console, 'debug').mockImplementation(console.log);
}

/**
 * Mocks fs.readFileSync to return a valid JSON string from the provided object
 * @param returnValue The object to stringify and return from the mock
 */
export function mockReadFileSync(returnValue: any) {
  (fs.readFileSync as jest.Mock).mockImplementation((...args: any[]) => {
    const [filePath, encoding] = args;
    console.debug(`fs.readFileSync called with path: ${filePath}, encoding: ${encoding}`);
    return JSON.stringify(returnValue);
  });
}

/**
 * Mocks fs.readFileSync to throw an error
 * @param errorMessage Optional custom error message
 */
export function mockReadFileSyncError(errorMessage = 'File not found') {
  (fs.readFileSync as jest.Mock).mockImplementation((...args: any[]) => {
    const [filePath] = args;
    console.debug(`fs.readFileSync error called with path: ${filePath}`);
    throw new Error(errorMessage);
  });
}

/**
 * Mocks fs.readFileSync with a sequence of different behaviors
 * @param implementations Array of functions that implement different behaviors
 */
export function mockReadFileSyncSequence(implementations: (() => any)[]) {
  let callCount = 0;
  (fs.readFileSync as jest.Mock).mockImplementation((...args: any[]) => {
    const [filePath] = args;
    console.debug(`fs.readFileSync sequence call #${callCount+1} with path: ${filePath}`);
    const impl = implementations[callCount];
    callCount = Math.min(callCount + 1, implementations.length - 1);
    return impl();
  });
}

/**
 * Makes DEFAULT_CONFIG_PATH deterministic in tests 
 * Use this in tests where you need to mock the default config path
 */
export function mockDefaultConfigPath() {
  // Make sure path.join for the default config returns a predictable value
  // This needs to be done before the loader module is imported
  const defaultPath = '/default/engine.config-default.json';
  (path.join as jest.Mock).mockImplementation((...args: any[]) => {
    if (args.includes('engine.config-default.json')) {
      console.debug(`Default config path requested, returning: ${defaultPath}`);
      return defaultPath;
    }
    return args.join('/');
  });
  return defaultPath;
} 