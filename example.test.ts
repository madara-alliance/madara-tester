import { describe, test, expect, afterAll, beforeAll } from '@jest/globals';
import { AccountsManager, getTestContext, initEnvironment, setGlobalDebugMode } from './index';

process.setMaxListeners(20); // TODO: remove this
setGlobalDebugMode(true); // TODO: find a better place for this setting

// Register the Jest hooks which will automatically set up the test environment
// This function accepts a path as an optional argument that points to a config file,
// if not provided, the default config will be used
initEnvironment();

// Initialize shared resources once for all tests
let accountsManager: AccountsManager;

/**
 * Example test demonstrating testing engine with the test context
 */
describe('Testing Engine with Test Context', () => {
  // Set up the shared AccountsManager once before all tests
  beforeAll(async () => {
    const ctx = getTestContext();
    accountsManager = ctx.getAccountsManager();
    accountsManager.createAccountsFromConfig();
  });

  // Basic test to verify test context is available
  test('should have valid test context', () => {
    // Get the test context that was set up by registerJestHooks()
    const ctx = getTestContext();

    // Verify the test context was created correctly
    expect(ctx).toBeDefined();

    // Access the environment manager through the context
    const environmentManager = ctx.getEnvironmentManager();
    expect(environmentManager).toBeDefined();
  });

  test('should have valid accounts', async () => {
    // We're now using the shared accountsManager that was initialized in beforeAll
    expect(accountsManager).toBeDefined();
    expect(accountsManager.list().length).toBeGreaterThan(0);
    let ok = await accountsManager.deployAccounts(getTestContext().getL2Gateway());
    expect(ok).toBe(true);
  });
});
