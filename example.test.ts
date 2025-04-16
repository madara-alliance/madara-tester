import { describe, test, expect, afterAll, beforeAll } from '@jest/globals';
import { AccountsManager, getTestContext, initEnvironment, setGlobalDebugMode } from './index';
import { L2InteractionWatcher } from './src/watcher/L2InteractionWatcher';
import { ethers } from 'ethers';

process.setMaxListeners(20); // TODO: remove this
setGlobalDebugMode(true); // TODO: find a better place for this setting

// Register the Jest hooks which will automatically set up the test environment
// This function accepts a path as an optional argument that points to a config file,
// if not provided, the default config will be used
initEnvironment('./engine.config-testing.json');

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

  test('should deploy accounts and fund them', async () => {
    expect(accountsManager).toBeDefined();
    const watcher = new L2InteractionWatcher(getTestContext().getL2Gateway());
    expect(watcher).toBeDefined();

    // Check that all accounts were created. Accounts are defined in the config file.
    const ozAccount = accountsManager.get('Account_OZ');
    expect(ozAccount).toBeDefined();
    const argentAccount = accountsManager.get('Account_Argent');
    expect(argentAccount).toBeDefined();
    const braavosAccount = accountsManager.get('Account_Braavos');
    expect(braavosAccount).toBeDefined();

    // Fund the account with ETH from the funding account
    let ok_funding = await accountsManager.fundAccount(ozAccount, getTestContext().getL1Gateway());
    expect(ok_funding).toBe(true);

    // Funding tx succeeded, now wait for balance to update
    const balance = await watcher.waitForBalanceUpdate(ozAccount.l2Address, { tokenType: 'ETH' });
    expect(balance).toBeGreaterThan(0);

    // Account funded, now deploy it
    let ok_deploy = await accountsManager.deployAccount(ozAccount, getTestContext().getL2Gateway());
    expect(ok_deploy).toBe(true);
  }, 1200000);
});
