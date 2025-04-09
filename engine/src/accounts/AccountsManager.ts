import { ethers } from 'ethers';
import { TestAccount } from './types';
import { Signer } from './Signer';
import { SignerFileImpl } from './implementation/SignerFileImpl';
import { TestConfig } from '../types';
import { getComponentLogger } from '../utils/logger';

/**
 * Interface for account configuration
 */
export interface AccountConfig {
  mnemonic: string;
  count: number;
  localFunding?: {
    l1Eth?: string;
    l2Eth?: string;
  };
  signerType: 'file';
}

/**
 * Manages test accounts for both L1 and L2
 */
export class AccountsManager {
  private accounts: TestAccount[] = [];
  private logger = getComponentLogger('AccountsManager');
  private l1Provider: ethers.Provider;
  private l2Provider: any; // Will be replaced with a proper Starknet provider type
  
  constructor() {
    this.logger.debug('AccountsManager created');
  }
  
  /**
   * Initializes the account pool from configuration
   */
  async initialize(
    config: AccountConfig,
    l1Provider: ethers.Provider,
    l2Provider: any
  ): Promise<void> {
    this.logger.info(`Initializing account pool with ${config.count} accounts`);
    this.l1Provider = l1Provider;
    this.l2Provider = l2Provider;
    
    // Generate HD wallet from mnemonic
    const hdNode = ethers.HDNodeWallet.fromPhrase(config.mnemonic);
    
    // Create accounts
    for (let i = 0; i < config.count; i++) {
      const childNode = hdNode.deriveChild(i);
      const privateKey = childNode.privateKey;
      
      // Create L1 signer using the appropriate implementation
      let l1Signer: Signer = new SignerFileImpl(privateKey);
      
      // For L2, we'll use a placeholder for now
      // In a real implementation, this would be a proper Starknet signer
      const l2Signer = {
        getAddress: async () => await l1Signer.getAddress()
      };
      
      const l1Address = await l1Signer.getAddress();
      // In this demo, we'll use the same address for L1 and L2
      // In a real implementation, this would be the actual Starknet account address
      const l2Address = l1Address;
      
      const account: TestAccount = {
        name: `Account-${i}`,
        privateKey,
        l1Address,
        l2Address,
        l1Signer,
        l2Signer
      };
      
      this.accounts.push(account);
      this.logger.debug(`Created account: ${account.name} (${l1Address})`);
    }
    
    this.logger.info(`Initialized ${this.accounts.length} accounts`);
  }
  
  /**
   * Gets a pre-configured account by its index
   */
  get(index: number): TestAccount {
    if (index < 0 || index >= this.accounts.length) {
      throw new Error(`Account index out of bounds: ${index}`);
    }
    return this.accounts[index];
  }
  
  /**
   * Gets the primary deployment account (index 0)
   */
  deployer(): TestAccount {
    return this.get(0);
  }
  
  /**
   * Returns all pre-configured accounts
   */
  list(): TestAccount[] {
    return [...this.accounts];
  }
  
  /**
   * Creates a new, temporary account
   */
  async createRandom(): Promise<TestAccount> {
    const wallet = ethers.Wallet.createRandom();
    const privateKey = wallet.privateKey;
    
    const l1Signer: Signer = new SignerFileImpl(privateKey);
    const l1Address = await l1Signer.getAddress();
    
    // Placeholder L2 signer
    const l2Signer = {
      getAddress: async () => l1Address
    };
    
    const account: TestAccount = {
      name: `Random-${this.accounts.length}`,
      privateKey,
      l1Address,
      l2Address: l1Address,
      l1Signer,
      l2Signer
    };
    
    this.logger.debug(`Created random account: ${account.name} (${l1Address})`);
    return account;
  }
  
  /**
   * Funds an account on L1 (local devnet only)
   */
  async fundL1(
    targetAddress: string,
    amount: ethers.BigNumberish
  ): Promise<string> {
    this.logger.info(`Funding L1 address ${targetAddress} with ${amount} wei`);
    
    const deployer = this.deployer();
    
    try {
      const tx = await this.l1Provider.send('eth_sendTransaction', [
        {
          from: deployer.l1Address,
          to: targetAddress,
          value: ethers.toQuantity(amount),
          gas: ethers.toQuantity(21000)
        }
      ]);
      
      this.logger.debug(`Funding transaction sent: ${tx}`);
      return tx;
    } catch (error) {
      this.logger.error(`Failed to fund L1 address: ${(error as Error).message}`);
      throw error;
    }
  }
  
  /**
   * Funds an account on L2 (local devnet only)
   */
  async fundL2(
    targetAddress: string,
    amount: ethers.BigNumberish
  ): Promise<string> {
    this.logger.info(`Funding L2 address ${targetAddress} with ${amount}`);
    
    // In a real implementation, this would use a proper Starknet transaction
    // For this demo, we'll just return a placeholder transaction hash
    const txHash = `0x${Buffer.from(`fund-${targetAddress}-${amount.toString()}`).toString('hex')}`;
    this.logger.debug(`L2 funding simulation, tx: ${txHash}`);
    return txHash;
  }
} 