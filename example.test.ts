import { describe, test, expect, afterAll, beforeAll } from '@jest/globals';
import { AccountsManager, getTestContext, initEnvironment, setGlobalDebugMode } from './index';
import { L2InteractionWatcher } from './src/watcher/L2InteractionWatcher';
import { ethers } from 'ethers';

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
    const ozAccount = accountsManager.get('Account_OZ');
    let ok_funding = await accountsManager.fundAccount(ozAccount, getTestContext().getL1Gateway());
    expect(ok_funding).toBe(true);

    // wait for balance to update
    const watcher = new L2InteractionWatcher(getTestContext().getL2Gateway());
    const expectedAmountBridged = ethers.parseEther('0.01'); // Or use the variable passed to bridgeToL2
    await watcher.waitForBalanceUpdate(ozAccount.l2Address, { expectedIncrease: expectedAmountBridged });

    let ok_deploy = await accountsManager.deployAccount(ozAccount, getTestContext().getL2Gateway());
    expect(ok_deploy).toBe(true);
  }, 1200000);
});
