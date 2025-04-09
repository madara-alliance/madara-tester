import { ethers } from 'ethers';
import { RpcProvider, Account as StarknetAccount, ec, hash, CallData } from 'starknet';
import { Account, AccountConfig } from './types';
import { Signer } from './signer/Signer';
import { SignerFileImpl } from './signer/file/SignerFileImpl';
import { TestConfig } from '../types';
import { getComponentLogger } from '../utils/logger';
import { L1Gateway } from '../gateways/L1Gateway';
import { L2Gateway } from '../gateways/L2Gateway';

/**
 * Manages test accounts for both L1 and L2
 */
export class AccountsManager {
  private accounts: Account[] = [];
  private logger = getComponentLogger('AccountsManager');
  
  constructor() {
    this.logger.debug('AccountsManager created');
  }
  
  /**
   * Initializes the account pool from configuration
   */
  async initialize(
    config: TestConfig['AccountsConfig'],
    l1Gateway: L1Gateway, 
    l2Gateway: L2Gateway
  ): Promise<void> {
    this.logger.info(`Initializing account pool with ${config.length} account configs`);
    
    // Process each account configuration
    for (const accountConfig of config) {
      let account: Account;
      
      if (accountConfig.random === true) {
        account = await this.createRandom(
          accountConfig.name,
          accountConfig.accountType
        );
      } else if (accountConfig.mnemonic) {
        account = await this.createFromMnemonic(
          accountConfig.mnemonic, 
          0,
          accountConfig.name,
          accountConfig.accountType
        );
      } else {
        this.logger.warn(`Skipping account config with no mnemonic or random flag set`);
        continue;
      }
      
      this.accounts.push(account);
      this.logger.debug(`Added account: ${account.name} (${account.l1Address})`);
    }
    
    this.logger.info(`Initialized ${this.accounts.length} accounts`);
  }
  
  /**
   * Creates an account from a mnemonic phrase
   */
  async createFromMnemonic(
    mnemonic: string,
    index: number = 0,
    name?: string,
    accountType?: 'braavos' | 'argent'
  ): Promise<Account> {
    // Generate HD wallet from mnemonic
    const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic);
    const childNode = hdNode.deriveChild(index);
    const privateKey = childNode.privateKey;
    
    // Create L1 signer using the appropriate implementation
    const signer: Signer = new SignerFileImpl(privateKey);
    
    const l1Address = await signer.getAddress();
    // In this demo, we'll use the same address for L1 and L2
    const l2Address = l1Address;
    
    const account: Account = {
      name: name || `Account-${index}`,
      privateKey,
      l1Address,
      l2Address,
      signer,
      accountType,
      deployed: false
    };
    
    return account;
  }
  
  /**
   * Gets a pre-configured account by its index
   */
  get(index: number): Account {
    if (index < 0 || index >= this.accounts.length) {
      throw new Error(`Account index out of bounds: ${index}`);
    }
    return this.accounts[index];
  }
  
  /**
   * Returns all pre-configured accounts
   */
  list(): Account[] {
    return [...this.accounts];
  }
  
  /**
   * Creates a new random account
   */
  async createRandom(
    name?: string,
    accountType?: 'braavos' | 'argent'
  ): Promise<Account> {
    const wallet = ethers.Wallet.createRandom();
    const privateKey = wallet.privateKey;
    
    const signer: Signer = new SignerFileImpl(privateKey);
    const l1Address = await signer.getAddress();
    
    const account: Account = {
      name: name || `Random-${this.accounts.length}`,
      privateKey,
      l1Address,
      l2Address: l1Address,
      signer,
      accountType,
      deployed: false
    };
    
    this.logger.debug(`Created random account:
      Name: ${account.name}
      L1 Address: ${l1Address}
      L2 Address: ${account.l2Address}
    `);
    return account;
  }
  
  /**
   * Generates Starknet key pair from an Ethereum private key
   */
  private generateStarknetKeys(privateKey: string): { privateKey: string; publicKey: string } {    
    const ethPrivateKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
    const starkPrivateKey = ethers.hexlify(ethPrivateKey);
    const starkPublicKey = ec.starkCurve.getStarkKey(starkPrivateKey);
    return {
      privateKey: starkPrivateKey,
      publicKey: starkPublicKey
    };
  }
  
  /**
   * Calculates a Starknet account address based on the public key and class hash
   */
  private calculateAccountAddress(
    publicKey: string,
    classHash: string
  ): string {
    const accountConstructorCallData = CallData.compile({
      publicKey: publicKey,
    });
    
    // Salt is usually the public key in standard implementations
    const salt = publicKey;
    
    const accountAddress = hash.calculateContractAddressFromHash(
      salt,
      classHash,
      accountConstructorCallData,
      0 // We're using a new deployment, so no address is replaced
    );
    
    return accountAddress;
  }
  
  /**
   * Deploys a Starknet account contract on-chain
   */
  async deployAccount(
    account: Account,
    config: TestConfig,
    l2Gateway: L2Gateway
  ): Promise<void> {
    // If already deployed, just return
    if (account.deployed) {
      this.logger.info(`Account ${account.name} already deployed at ${account.l2Address}`);
      return;
    }
    
    // Check if account type and corresponding class hash are configured
    if (!account.accountType) {
      throw new Error(`Account ${account.name} has no accountType specified (braavos or argent)`);
    }
    
    // Get the class hash based on account type
    let classHash: string | undefined;
    switch (account.accountType) {
      case 'braavos':
        classHash = config.starknetAccounts?.braavosClassHash;
        break;
      case 'argent':
        classHash = config.starknetAccounts?.argentClassHash;
        break;
      default:
        throw new Error(`Unsupported account type: ${account.accountType}`);
    }
    
    if (!classHash) {
      throw new Error(`Class hash for ${account.accountType} not configured in TestConfig.starknetAccounts`);
    }
  
    
    // Generate Starknet keys if not already present
    if (!account.L2PublicKey) {
      const keys = this.generateStarknetKeys(account.privateKey);
      account.L2PublicKey = keys.publicKey;
      
      // Calculate account address
      account.l2Address = this.calculateAccountAddress(keys.publicKey, classHash);
      account.classHash = classHash;
    }
    
    this.logger.info(`Deploying ${account.accountType} account at ${account.l2Address}...`);
    
    try {
      // Create a temporary account instance for deployment
      const starknetAccount = new StarknetAccount(
        l2Gateway.provider,
        account.l2Address,
        account.privateKey,
        '1' // Use Cairo 1 version
      );
      
      // Make sure classHash is defined before deploying
      if (!account.classHash) {
        throw new Error(`Account ${account.name} has no classHash defined`);
      }
      
      // Deploy the account
      const { transaction_hash } = await starknetAccount.deployAccount({
        classHash: account.classHash,
        constructorCalldata: [account.L2PublicKey],
        addressSalt: account.L2PublicKey,
      });
      
      // Wait for deployment to complete
      const receipt = await l2Gateway.provider.waitForTransaction(transaction_hash);
      
      if (receipt.execution_status !== 'SUCCEEDED') {
        throw new Error(`Failed to deploy account - ${transaction_hash}`);
      }
      
      // Update account state
      account.deployed = true;
      account.deployTxHash = transaction_hash;
      
      this.logger.info(`✅ Account ${account.name} deployed successfully at ${account.l2Address} - tx: ${transaction_hash}`);
    } catch (error) {
      this.logger.error(`Failed to deploy account: ${(error as Error).message}`);
      throw error;
    }
  }
  
  /**
   * Deploys multiple Starknet accounts on-chain
   * @param indices Array of account indices to deploy. If not provided, deploys all accounts.
   */
  async deployAccounts(
    config: TestConfig,
    l2Gateway: L2Gateway,
  ): Promise<void> {
    this.logger.info(`Deploying ${this.accounts.length} Starknet accounts...`);
    
    for (let account of this.accounts) {
      try {
        await this.deployAccount(account, config, l2Gateway);
      } catch (error) {
        this.logger.error(`Failed to deploy account ${account.name}: ${(error as Error).message}`);
        continue;
      }
    }
    
    this.logger.info(`Completed account deployment process`);
  }
} 