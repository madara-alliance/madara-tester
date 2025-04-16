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

  test('should deploy and fund OZ account', async () => {
    expect(accountsManager).toBeDefined();
    const watcher = new L2InteractionWatcher(getTestContext().getL2Gateway());
    expect(watcher).toBeDefined();

    const ozAccount = accountsManager.get('Account_OZ');
    expect(ozAccount).toBeDefined();

    // Start waiting for the balance update BEFORE sending funds
    const waitForBalance = watcher.waitForBalanceUpdate(ozAccount.l2Address, {
      tokenType: 'ETH',
    });
    let ok_funding_oz = await accountsManager.fundAccount(
      ozAccount,
      getTestContext().getL1Gateway()
    );
    expect(ok_funding_oz).toBe(true);
    const balance_oz = await waitForBalance;
    expect(balance_oz).toBeGreaterThan(0);
    let ok_deploy_oz = await accountsManager.deployAccount(
      ozAccount,
      getTestContext().getL2Gateway()
    );
    expect(ok_deploy_oz).toBe(true);
  }, 1200000);

  test('should deploy and fund Argent account', async () => {
    expect(accountsManager).toBeDefined();
    const watcher = new L2InteractionWatcher(getTestContext().getL2Gateway());
    expect(watcher).toBeDefined();

    const argentAccount = accountsManager.get('Account_Argent');
    expect(argentAccount).toBeDefined();

    // Start waiting for the balance update BEFORE sending funds
    const waitForBalance = watcher.waitForBalanceUpdate(argentAccount.l2Address, {
      tokenType: 'ETH',
    });
    let ok_funding_argent = await accountsManager.fundAccount(
      argentAccount,
      getTestContext().getL1Gateway()
    );
    expect(ok_funding_argent).toBe(true);
    const balance_argent = await waitForBalance;
    expect(balance_argent).toBeGreaterThan(0);
    let ok_deploy_argent = await accountsManager.deployAccount(
      argentAccount,
      getTestContext().getL2Gateway()
    );
    expect(ok_deploy_argent).toBe(true);
  }, 1200000);

  test('should deploy and fund Braavos account', async () => {
    expect(accountsManager).toBeDefined();
    const watcher = new L2InteractionWatcher(getTestContext().getL2Gateway());
    expect(watcher).toBeDefined();

    const braavosAccount = accountsManager.get('Account_Braavos');
    expect(braavosAccount).toBeDefined();

    // Start waiting for the balance update BEFORE sending funds
    const waitForBalance = watcher.waitForBalanceUpdate(braavosAccount.l2Address, {
      tokenType: 'ETH',
    });
    let ok_funding_braavos = await accountsManager.fundAccount(
      braavosAccount,
      getTestContext().getL1Gateway()
    );
    expect(ok_funding_braavos).toBe(true);
    const balance_braavos = await waitForBalance;
    expect(balance_braavos).toBeGreaterThan(0);
    let ok_deploy_braavos = await accountsManager.deployAccount(
      braavosAccount,
      getTestContext().getL2Gateway()
    );
    expect(ok_deploy_braavos).toBe(true);
  }, 1200000);
});
