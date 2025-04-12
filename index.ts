import { afterAll, beforeAll } from '@jest/globals';
import { loadConfig } from './src/config/loader';
import { EnvironmentManager } from './src/environment/EnvironmentManager';
import { TestConfig } from './src/config/types';
import { TestContext } from './src/types';
import { ContextFactory } from './src/context/ContextFactory';
import {
  enableDebugForComponents,
  getComponentLogger,
  LoggerConfig,
  setGlobalDebugMode,
} from './src/utils/logger';

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
export * from './src/accounts/signer/Signer';
export * from './src/accounts/types';
export type { TestConfig, ServerConfig } from './src/config/types';
export { L1Gateway } from './src/gateways/L1Gateway';
export { L2Gateway } from './src/gateways/L2Gateway';
export { StateVerifier } from './src/verifier/StateVerifier';
export { AccountsManager } from './src/accounts/AccountsManager';
export { setGlobalDebugMode, enableDebugForComponents, LoggerConfig };
export { loadConfig } from './src/config/loader';
export { EnvironmentManager } from './src/environment/EnvironmentManager';

// Logger
const logger = getComponentLogger('TestEngine');

// Global state
let _context: TestContext | null = null;
let _environment: EnvironmentManager | null = null;
let _config: TestConfig | null = null;

/**
 * Sets up the test environment and context
 */
export async function setupTestEnvironment(engineConfigPath?: string): Promise<TestContext> {
  // Load and resolve configuration
  const config = await loadConfig(engineConfigPath);
  _config = config;

  logger.info(`Setting up test environment in ${config.mode} mode`);

  // Create test context
  const contextFactory = new ContextFactory();
  const context = await contextFactory.create(config);
  _context = context;

  logger.info('Test environment ready');
  return context;
}

/**
 * Register jest setup hooks
 */
export function initEnvironment(configPath?: string): void {
  logger.debug('Registering jest hooks');

  // beforeAll hook - sets up the environment
  beforeAll(async () => {
    // Make ctx globally available
    global.__testContext = await setupTestEnvironment(configPath);
  });

  // afterAll hook - tears down the environment
  afterAll(async () => {
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
    throw new Error(
      'Test context not initialized. Call setupTestEnvironment first or use registerJestHooks.'
    );
  }
  return global.__testContext;
}
