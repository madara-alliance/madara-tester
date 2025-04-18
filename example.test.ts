import { describe, test, expect, afterAll, beforeAll } from '@jest/globals';
import { AccountsManager, getTestContext, initEnvironment, setGlobalDebugMode } from './index';
import { L2InteractionWatcher } from './src/watcher/L2InteractionWatcher';
import { AccountTypes } from './src/accounts/types';

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
    expect(ctx).toBeDefined();

    accountsManager = ctx.getAccountsManager();
    expect(accountsManager).toBeDefined();

    // Load the accounts from the config file. This will create the funding accounts
    // and any random accounts specified in the config file.
    accountsManager.createAccountsFromConfig();

    const watcher = ctx.getL2Watcher();
    expect(watcher).toBeDefined();
  });

  test('should deploy and fund OZ account', async () => {
    // Create the account
    const ozAccount = accountsManager.createAccount({
      name: 'Account_OZ',
      accountType: AccountTypes.OZ,
      signerType: 'memory',
      random: true,
      signerConfig: {},
    });

    if (!ozAccount) {
      throw new Error('Failed to create OZ account');
    }

    // Funding process.
    // Start waiting for the balance update BEFORE sending funds so we can detect the balance change
    const waitForBalance = getTestContext()
      .getL2Watcher()
      .waitForBalanceUpdate(ozAccount.getL2Address(), {
        tokenType: 'ETH',
      });
    
    // Fund the account using the account name
    let ok_funding_oz = await accountsManager.fundAccount(
      'Account_OZ',
      getTestContext().getL1Gateway()
    );
    expect(ok_funding_oz).toBe(true);
    
    const balance_oz = await waitForBalance;
    expect(balance_oz).toBeGreaterThan(0);
    
    // Deploy the account using the account's deploy method
    let ok_deploy_oz = await ozAccount.deploy(
      getTestContext().getL2Gateway()
    );
    expect(ok_deploy_oz).toBe(true);
  }, 1200000);

  test('should deploy and fund Argent account', async () => {
    // Create the account
    const argentAccount = accountsManager.createAccount({
      name: 'Account_Argent',
      accountType: AccountTypes.ARGENT,
      signerType: 'memory',
      random: true,
      signerConfig: {},
    });

    if (!argentAccount) {
      throw new Error('Failed to create Argent account');
    }

    // Start waiting for the balance update BEFORE sending funds
    const waitForBalance = getTestContext()
      .getL2Watcher()
      .waitForBalanceUpdate(argentAccount.getL2Address(), {
        tokenType: 'ETH',
      });
    
    // Fund the account using the account name
    let ok_funding_argent = await accountsManager.fundAccount(
      'Account_Argent',
      getTestContext().getL1Gateway()
    );
    expect(ok_funding_argent).toBe(true);
    
    const balance_argent = await waitForBalance;
    expect(balance_argent).toBeGreaterThan(0);
    
    // Deploy the account using the account's deploy method
    let ok_deploy_argent = await argentAccount.deploy(
      getTestContext().getL2Gateway()
    );
    expect(ok_deploy_argent).toBe(true);
  }, 1200000);

  test('should deploy and fund Braavos account', async () => {
    // Create the account
    const braavosAccount = accountsManager.createAccount({
      name: 'Account_Braavos',
      accountType: AccountTypes.BRAAVOS,
      signerType: 'memory',
      random: true,
      signerConfig: {},
    });

    if (!braavosAccount) {
      throw new Error('Failed to create Braavos account');
    }

    // Start waiting for the balance update BEFORE sending funds
    const waitForBalance = getTestContext()
      .getL2Watcher()
      .waitForBalanceUpdate(braavosAccount.getL2Address(), {
        tokenType: 'ETH',
      });
    
    // Fund the account using the account name
    let ok_funding_braavos = await accountsManager.fundAccount(
      'Account_Braavos',
      getTestContext().getL1Gateway()
    );
    expect(ok_funding_braavos).toBe(true);
    
    const balance_braavos = await waitForBalance;
    expect(balance_braavos).toBeGreaterThan(0);
    
    // Deploy the account using the account's deploy method
    let ok_deploy_braavos = await braavosAccount.deploy(
      getTestContext().getL2Gateway()
    );
    expect(ok_deploy_braavos).toBe(true);
  }, 1200000);

  test('should send transactions between two OZ accounts', async () => {
    // Create first OZ account
    const ozAccount1 = accountsManager.createAccount({
      name: 'OZ_Sender',
      accountType: AccountTypes.OZ,
      signerType: 'memory',
      random: true,
      signerConfig: {},
    });

    if (!ozAccount1) {
      throw new Error('Failed to create first OZ account');
    }

    // Create second OZ account
    const ozAccount2 = accountsManager.createAccount({
      name: 'OZ_Receiver',
      accountType: AccountTypes.OZ,
      signerType: 'memory',
      random: true,
      signerConfig: {},
    });

    if (!ozAccount2) {
      throw new Error('Failed to create second OZ account');
    }

    // Fund and deploy first account
    const waitForBalance1 = getTestContext()
      .getL2Watcher()
      .waitForBalanceUpdate(ozAccount1.getL2Address(), {
        tokenType: 'ETH',
      });

    // Fund the account using the account name
    await accountsManager.fundAccount('OZ_Sender', getTestContext().getL1Gateway());

    await waitForBalance1;

    // Deploy the account using the account's deploy method
    const deployOk1 = await ozAccount1.deploy(
      getTestContext().getL2Gateway()
    );

    // Fund and deploy second account
    const waitForBalance2 = getTestContext()
      .getL2Watcher()
      .waitForBalanceUpdate(ozAccount2.getL2Address(), {
        tokenType: 'ETH',
      });

    // Fund the account using the account name
    const fundingOk2 = await accountsManager.fundAccount(
      'OZ_Receiver',
      getTestContext().getL1Gateway()
    );
    expect(fundingOk2).toBe(true);

    await waitForBalance2;

    // Deploy the account using the account's deploy method
    await ozAccount2.deploy(getTestContext().getL2Gateway());

    // Get initial balances before transaction
    const l2Gateway = getTestContext().getL2Gateway();
    const initialBalance2 = await l2Gateway.getBalance(ozAccount2.getL2Address(), 'ETH');

    // Transfer tokens from account1 to account2
    const transferAmount = 1n;

    // Set up watcher to detect the balance change
    const waitForReceiverBalance = getTestContext()
      .getL2Watcher()
      .waitForBalanceUpdate(ozAccount2.getL2Address(), {
        tokenType: 'ETH',
        expectedIncrease: transferAmount,
      });

    // Execute the transfer - note that the actual amount used will be 1 regardless
    // of what we pass here, due to the hardcoded value in L2Gateway
    const txHash = await l2Gateway.transferToken(
      ozAccount1,
      ozAccount2.getL2Address(),
      transferAmount,
      'ETH'
    );

    // Wait for the watcher to confirm the transaction completed
    const watcher = getTestContext().getL2Watcher();
    await watcher.waitForTransaction(txHash);

    // Verify balance update
    const finalBalance = await waitForReceiverBalance;
    expect(
      BigInt(finalBalance.toString()) - BigInt(initialBalance2.toString())
    ).toBeGreaterThanOrEqual(transferAmount);
  }, 1200000);
});
