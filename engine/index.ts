import { beforeAll, beforeEach, afterAll, afterEach } from '@jest/globals';
import { loadConfig } from './src/config/loader';
import { EnvironmentManager } from './src/environment/EnvironmentManager';
import { TestContextFactory } from './src/context/TestContext';
import { TestContext, TestConfig } from './src/types';
import { getComponentLogger, setGlobalDebugMode, enableDebugForComponents, LoggerConfig } from './src/utils/logger';

// Declare global augmentation for TypeScript
declare global {
  // eslint-disable-next-line no-var
  var __testContext: TestContext | undefined;
  
  namespace NodeJS {
    interface Global {
      __testContext?: TestContext;
    }
  }
}

// Export core components and types
export * from './src/accounts/Signer';
export * from './src/accounts/types';
export { TestContext, TestConfig } from './src/types';
export { setGlobalDebugMode, enableDebugForComponents, LoggerConfig };

// Logger
const logger = getComponentLogger('TestEngine');

// Global state
let _context: TestContext | null = null;
let _environment: EnvironmentManager | null = null;
let _config: TestConfig | null = null;

/**
 * Sets up the test environment and context
 */
export async function setupTestEnvironment(configPath?: string): Promise<TestContext> {
  // Load and resolve configuration
  const config = await loadConfig(configPath);
  _config = config;
  
  logger.info(`Setting up test environment in ${config.mode} mode`);
  
  // Create environment manager
  const environment = new EnvironmentManager(config);
  _environment = environment;
  
  // Start environment
  await environment.up(config.mode, config);
  
  // Create test context
  const contextFactory = new TestContextFactory();
  const context = await contextFactory.createContext(config, environment);
  _context = context;
  
  logger.info('Test environment ready');
  return context;
}

/**
 * Tears down the test environment
 */
export async function teardownTestEnvironment(): Promise<void> {
  if (_environment) {
    logger.info('Tearing down test environment');
    await _environment.down();
    _environment = null;
    _context = null;
    _config = null;
    logger.info('Test environment shut down');
  }
}

/**
 * Register jest setup hooks
 */
export function registerJestHooks(configPath?: string): void {
  logger.info('Registering jest hooks');
  
  // beforeAll hook - sets up the environment
  beforeAll(async () => {
    const ctx = await setupTestEnvironment(configPath);
    
    // Make ctx globally available
    global.__testContext = ctx;
  });
  
  // No need for beforeEach hook anymore since we're using global.__testContext directly
  
  // afterAll hook - tears down the environment
  afterAll(async () => {
    await teardownTestEnvironment();
    // Clean up global reference
    global.__testContext = undefined;
  });
}

/**
 * Gets the current test context
 * Simple wrapper around the global reference that provides proper typing
 */
export function getTestContext(): TestContext {
  if (!global.__testContext) {
    throw new Error('Test context not initialized. Call setupTestEnvironment first or use registerJestHooks.');
  }
  return global.__testContext;
}

// For backward compatibility, keep this function but use registerJestHooks inside
export function registerVitestHooks(configPath?: string): void {
  logger.warn('registerVitestHooks is deprecated, use registerJestHooks instead');
  registerJestHooks(configPath);
}
