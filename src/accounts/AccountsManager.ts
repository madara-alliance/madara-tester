import { AccountConfig, AccountTypes } from './types';
import { TestConfig } from '../config/types';
import { getComponentLogger } from '../utils/logger';
import { L2Gateway } from '../gateways/L2Gateway';
import { L1Gateway } from '../gateways/L1Gateway';
import { IAccount } from './IAccount';
import { AccountFactory } from './AccountFactory';
import { FundingAccount } from './accounts_impl/Funding';

/**
 * Manages test accounts for both L1 and L2
 */
export class AccountsManager {
  private accounts: IAccount[] = [];
  private accountsMap: Record<string, IAccount> = {};
  private logger = getComponentLogger('AccountsManager');
  private accountFactory: AccountFactory;

  globalConfig: TestConfig;

  constructor(globalConfig: TestConfig) {
    this.globalConfig = globalConfig;
    this.accountFactory = new AccountFactory(globalConfig);
    this.logger.debug('AccountsManager created');
  }

  /**
   *  Creates accounts based on the configuration
   */
  createAccountsFromConfig(): void {
    this.logger.debug(
      `Initializing account pool with ${this.globalConfig.AccountsConfig.length} accounts`
    );

    for (const accountConfig of this.globalConfig.AccountsConfig) {
      const account = this.createAccount(accountConfig);

      if (!account) {
        continue;
      }

      this.logger.debug(`Added account: ${account.name}, (${account.getL1Address()})`);
    }

    this.logger.debug(`Initialized ${this.accounts.length} accounts`);
  }

  /**
   * Creates an account from a configuration
   */
  createAccount(accountConfig: AccountConfig): IAccount | undefined {
    const account = this.accountFactory.createFromConfig(accountConfig);

    if (!account) {
      this.logger.warn(
        `Cannot create account "${accountConfig.name}" - unable to create account from configuration`
      );
      return undefined;
    }

    this.addAccount(account);
    return account;
  }

  /**
   * Deploys multiple Starknet accounts on-chain
   * @param l2Gateway
   */
  async deployAccounts(l2Gateway: L2Gateway): Promise<boolean> {
    this.logger.info(`Deploying accounts on L2 ...`);

    for (let account of this.accounts) {
      try {
        // Skip accounts that are funding-only (no L2 component)
        if (!account.getL2Address() || account.getL2Address() === '') {
          this.logger.debug(`Skipping L1-only account: ${account.name}`);
          continue;
        }
        
        await account.deploy(l2Gateway);
      } catch (error) {
        this.logger.error(`Failed to deploy account ${account.name}: ${(error as Error).message}`);
        return false;
      }
    }

    this.logger.info(`Completed account deployment process`);
    return true;
  }

  /**
   * Funds an account or L2 address
   * @param accountNameOrL2Address Name of the account to fund or L2 address
   * @param l1Gateway L1 gateway to use for funding
   */
  async fundAccount(accountNameOrL2Address: string, l1Gateway: L1Gateway): Promise<boolean> {
    // Determine if this is a direct L2 address (starting with 0x) or an account name
    const isL2Address = accountNameOrL2Address.startsWith('0x');
    
    // Either use the address directly or get the account
    const targetAccount = isL2Address 
      ? accountNameOrL2Address 
      : this.get(accountNameOrL2Address);
    
    // Find a funding account from the existing accounts
    const fundingAccount = this.getFundingAccount();

    if (!fundingAccount) {
      throw new Error('No funding account found in account manager');
    }

    return fundingAccount.fundOtherAccount(l1Gateway, targetAccount);
  }

  /**
   * Finds a funding account in the account pool
   */
  private getFundingAccount(): FundingAccount | undefined {
    return this.accounts.find((acc) => acc.accountType === AccountTypes.FUNDING) as FundingAccount;
  }

  /**
   * Gets a pre-configured account by its name
   * @param name The name of the account to retrieve
   * @returns The account with the specified name
   * @throws Error if no account with the given name exists
   */
  get(name: string): IAccount {
    const account = this.accountsMap[name];
    if (!account) {
      throw new Error(`Account with name "${name}" not found`);
    }
    return account;
  }

  /**
   * Returns all pre-configured accounts with only name and l1address
   */
  list(): { name: string; l1Address: string; }[] {
    return this.accounts.map((account) => ({
      name: account.name,
      l1Address: account.getL1Address(),
    }));
  }

  /**
   * Adds an account to the internal collections if no account with the same name exists
   * @param account The account to add
   * @returns True if the account was added, false if an account with the same name already exists
   */
  private addAccount(account: IAccount): boolean {
    if (this.accountsMap[account.name]) {
      this.logger.warn(`Account with name "${account.name}" already exists`);
      return false;
    }

    this.accounts.push(account);
    this.accountsMap[account.name] = account;
    return true;
  }

  /**
   * Cleans up all accounts from the manager
   * Removes all accounts from both the array and the map
   */
  cleanup(): void {
    this.logger.debug(`Cleaning up ${this.accounts.length} accounts`);
    this.accounts = [];
    this.accountsMap = {};
    this.logger.debug('All accounts have been removed');
  }
}
