import { ethers } from 'ethers';
import {
  Account as StarknetAccount,
  CallData,
  ec,
  hash,
  stark,
  CairoOption,
  CairoCustomEnum,
  CairoOptionVariant,
} from 'starknet';
import { Account, AccountConfig, AccountType } from './types';
import { Signer } from './signer/Signer';
import { TestConfig } from '../config/types';
import { getComponentLogger } from '../utils/logger';
import { L2Gateway } from '../gateways/L2Gateway';
import { createSigner } from './signer/factory';
import { SignerTypeMemory } from './signer/memory/types';

/**
 * Manages test accounts for both L1 and L2
 */
export class AccountsManager {
  private accounts: Account[] = [];
  private accountsMap: Record<string, Account> = {};
  private logger = getComponentLogger('AccountsManager');

  globalConfig: TestConfig;

  constructor(globalConfig: TestConfig) {
    this.globalConfig = globalConfig;
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

      this.logger.debug(`Added account: ${account.name}, (${account.l1Address})`);
    }

    this.logger.debug(`Initialized ${this.accounts.length} accounts`);
  }

  /**
   * Creates an account from a configuration
   */
  createAccount(accountConfig: AccountConfig): Account | undefined {
    let account: Account | undefined;

    if (accountConfig.random) {
      account = this.createRandom(accountConfig.name, accountConfig.accountType);
    }

    if (accountConfig.mnemonic) {
      account = this.createFromMnemonic(
        accountConfig.mnemonic,
        accountConfig.name,
        accountConfig.accountType,
        accountConfig.signerType,
        accountConfig.signerConfig
      );
    }

    if (!account) {
      this.logger.warn(
        `Cannot create account "${accountConfig.name}" - no mnemonic or random flag set`
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
    this.logger.info(`Deploying ${this.accounts.length} Starknet accounts...`);

    for (let account of this.accounts) {
      try {
        await this.deployAccount(account, l2Gateway);
      } catch (error) {
        this.logger.error(`Failed to deploy account ${account.name}: ${(error as Error).message}`);
        return false;
      }
    }

    this.logger.info(`Completed account deployment process`);
    return true;
  }

  /**
   * Creates an account from a mnemonic phrase
   */
  createFromMnemonic(
    mnemonic: string,
    name: string,
    accountType: AccountType,
    signerType: string,
    signerConfig: any
  ): Account {
    // This method is still under development
    throw new Error('Method not implemented');
  }

  /**
   * Creates a new random account
   */
  createRandom(name: string, accountType: AccountType): Account {
    let newAccount = this._createEmptyAccount();

    // Generate random L1 wallet
    const wallet = ethers.Wallet.createRandom();
    const l1PrivateKey = wallet.privateKey;
    const l1Address = wallet.address;
    const l1PublicKey = wallet.publicKey;

    // Generate random L2 wallet
    const l2PrivateKey = stark.randomAddress();
    const l2PublicKey = ec.starkCurve.getStarkKey(l2PrivateKey);

    // Populate newAccount
    newAccount.name = name;
    newAccount.accountType = accountType;
    newAccount.l1Address = l1Address;
    newAccount.l1PublicKey = l1PublicKey;
    newAccount.l1PrivateKey = l1PrivateKey;
    newAccount.l2PublicKey = l2PublicKey;
    newAccount.l2PrivateKey = l2PrivateKey;
    newAccount.getL1Signer = () => wallet;
    newAccount.getL2Signer = () => ec.starkCurve;

    const constructorCallData = this.getConstructorCallData(newAccount);
    newAccount.l2Address = hash.calculateContractAddressFromHash(
      l2PublicKey,
      this.getAccountTypeClassHash(accountType),
      constructorCallData,
      0
    );

    this.logger.debug(
      `Created random account: 
      Name: ${newAccount.name}
      L1 Address: ${newAccount.l1Address}
      L1 Public Key: ${newAccount.l1PublicKey}
      L1 Private Key: ${newAccount.l1PrivateKey}
      L2 Address: ${newAccount.l2Address}
      L2 Public Key: ${newAccount.l2PublicKey}
      L2 Private Key: ${newAccount.l2PrivateKey}
      Account Type: ${newAccount.accountType}
      Deployed: ${newAccount.deployed}`
    );

    return newAccount;
  }
  getConstructorCallData(account: Account): any {
    switch (account.accountType) {
      case 'oz':
        return CallData.compile({
          publicKey: account.l2PublicKey,
        });
      case 'argent':
        const axSigner = new CairoCustomEnum({ Starknet: { pubkey: account.l2PublicKey } });
        const axGuardian = new CairoOption<unknown>(CairoOptionVariant.None);
        return CallData.compile({
          owner: axSigner,
          guardian: axGuardian,
        });
      case 'braavos':
        return CallData.compile({
          // TODO: check this
          publicKey: account.l2PublicKey,
        });
      default:
        throw new Error(`Unsupported account type: ${account.accountType}`);
    }
  }

  private _createEmptyAccount(): Account {
    return {
      name: '',
      l1Address: '',
      l1PublicKey: '',
      l1PrivateKey: '',
      l2Address: '',
      l2PublicKey: '',
      l2PrivateKey: '',
      getL1Signer: () => undefined,
      getL2Signer: () => undefined,
      accountType: undefined,
      deployed: false,
    };
  }

  /**
   * Gets a pre-configured account by its name
   * @param name The name of the account to retrieve
   * @returns The account with the specified name
   * @throws Error if no account with the given name exists
   */
  get(name: string): Account {
    const account = this.accountsMap[name];
    if (!account) {
      throw new Error(`Account with name "${name}" not found`);
    }
    return account;
  }

  /**
   * Returns all pre-configured accounts with only name and l1address
   */
  list(): Pick<Account, 'name' | 'l1Address'>[] {
    return this.accounts.map((account) => ({
      name: account.name,
      l1Address: account.l1Address,
    }));
  }

  /**
   * Gets the class hash for a specific account type
   */
  private getAccountTypeClassHash(accountType: AccountType): string {
    let classHash: string | undefined;

    switch (accountType) {
      case 'braavos':
        classHash = this.globalConfig.l2.contracts?.braavosClassHash;
        break;
      case 'argent':
        classHash = this.globalConfig.l2.contracts?.argentClassHash;
        break;
      case 'oz':
        classHash = this.globalConfig.l2.contracts?.ozClassHash;
        break;
      default:
        throw new Error(`Unsupported account type: ${accountType}`);
    }

    if (!classHash) {
      throw new Error(`Class hash for ${accountType} not configured in TestConfig.l2Contracts`);
    }

    return classHash;
  }

  /**
   * Deploys a Starknet account contract on-chain
   */

  // TODO: add deployers for each account type
  async deployAccount(account: Account, l2Gateway: L2Gateway): Promise<void> {
    // If already deployed, just return
    if (account.deployed) {
      this.logger.info(`Account ${account.name} already deployed at ${account.l2Address}`);
      return;
    }

    // Check if account type and corresponding class hash are configured
    if (!account.accountType) {
      throw new Error(`Account ${account.name} has no accountType specified`);
    }

    // Get the class hash based on account type
    const classHash = this.getAccountTypeClassHash(account.accountType);

    const starknetAccount = new StarknetAccount(
      l2Gateway.provider,
      account.l2Address,
      account.l2PrivateKey,
      '1' // Use Cairo 1 version
    );

    this.logger.info(
      `Deploying ${account.accountType} account with public key: ${account.l2PublicKey}...`
    );

    try {
      const { transaction_hash } = await starknetAccount.deployAccount({
        classHash: classHash,
        constructorCalldata: [account.l2PublicKey],
        contractAddress: account.l2Address,
        addressSalt: account.l2PublicKey,
      });

      // Wait for deployment to complete
      const receipt = await l2Gateway.provider.waitForTransaction(transaction_hash);

      if (!receipt.isSuccess()) {
        throw new Error(`Failed to deploy account - ${transaction_hash}`);
      }

      // Update account state
      account.deployed = true;

      this.logger.info(
        `✅ Account ${account.name} deployed successfully at ${account.l2Address} - tx: ${transaction_hash}`
      );
    } catch (error) {
      this.logger.error(`Failed to deploy account: ${(error as Error).message}`);
      throw error;
    }
  }

  private deployOZAccount(account: Account, l2Gateway: L2Gateway): Promise<void> {
    // TODO: implement
    throw new Error('Method not implemented');
  }

  /**
   * Adds an account to the internal collections if no account with the same name exists
   * @param account The account to add
   * @returns True if the account was added, false if an account with the same name already exists
   */
  private addAccount(account: Account): boolean {
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
