import { ethers } from 'ethers';
import { Account as StarknetAccount, ec, hash } from 'starknet';
import { IAccount } from './IAccount';
import { AccountType, AccountConfig, AccountProperties } from './types';
import { L1Gateway } from '../gateways/L1Gateway';
import { L2Gateway } from '../gateways/L2Gateway';
import { TestConfig } from '../config/types';
import { getComponentLogger } from '../utils/logger';

/**
 * Default Cairo version for Starknet accounts
 */
const DEFAULT_CAIRO_VERSION = '1';
const MIN_BALANCE_FOR_DEPLOY = BigInt(10000000000000000);

/**
 * Base implementation for all account types
 */
export abstract class BaseAccount implements IAccount {
  name: string;
  accountType: AccountType;
  l1Address: string;
  l1PublicKey: string;
  l1PrivateKey: string;
  l2Address: string;
  l2PublicKey: string;
  l2PrivateKey: string;
  deployed: boolean;
  protected logger = getComponentLogger('Account');

  constructor(
    config: AccountConfig,
    accountProperties: AccountProperties = {}
  ) {
    this.name = config.name;
    this.accountType = config.accountType;
    this.l1Address = accountProperties.l1Address || '';
    this.l1PublicKey = accountProperties.l1PublicKey || '';
    this.l1PrivateKey = accountProperties.l1PrivateKey || '';
    this.l2Address = accountProperties.l2Address || '';
    this.l2PublicKey = accountProperties.l2PublicKey || '';
    this.l2PrivateKey = accountProperties.l2PrivateKey || '';
    this.deployed = accountProperties.deployed || false;
  }

  /**
   * Calculates the L2 address for this account
   * @param config Global test configuration
   */
  calculateL2Address(config: TestConfig): string {
    if (!this.l2PublicKey) {
      throw new Error('Cannot calculate L2 address: L2 public key is missing');
    }
    
    const constructorCallData = this.getConstructorCallData(config);
    const classHash = this.getClassHash(config);
    
    const l2Address = hash.calculateContractAddressFromHash(
      this.l2PublicKey,
      classHash,
      constructorCallData,
      0
    );
    
    // Update the l2Address property
    this.l2Address = l2Address;
    
    return l2Address;
  }

  /**
   * Gets the L1 signer for this account
   */
  getL1Signer(): ethers.Wallet | undefined {
    if (!this.l1PrivateKey) {
      return undefined;
    }
    return new ethers.Wallet(this.l1PrivateKey);
  }

  /**
   * Gets the L2 signer for this account
   */
  getL2Signer(): any {
    return ec.starkCurve;
  }

  /**
   * Gets the constructor calldata for this account
   * @param config Global test configuration
   */
  abstract getConstructorCallData(config: TestConfig): any;

  /**
   * Gets the class hash for this account type
   * @param config Global test configuration
   */
  abstract getClassHash(config: TestConfig): string;

  /**
   * Deploys this account on L2
   * @param l2Gateway L2 gateway to use for deployment
   * @param config Global test configuration
   */
  async deploy(l2Gateway: L2Gateway, config: TestConfig): Promise<boolean> {
    // If already deployed, just return
    if (this.deployed) {
      this.logger.info(`Account ${this.name} already deployed`);
      return true;
    }

    // Check if the account has enough funds to deploy
    const balance = await l2Gateway.getBalance(this.l2Address, 'ETH');
    if (balance.valueOf() < MIN_BALANCE_FOR_DEPLOY) {
      // 0.01 ETH in wei
      throw new Error(
        `Account ${this.name} has insufficient funds on L2. current balance: ${balance.toLocaleString()}`
      );
    }

    // Get the class hash based on account type
    const classHash = this.getClassHash(config);

    const starknetAccount = new StarknetAccount(
      l2Gateway.provider,
      this.l2Address,
      this.l2PrivateKey,
      DEFAULT_CAIRO_VERSION
    );

    this.logger.info(
      `Deploying ${this.accountType} account with public key: ${this.l2PublicKey}...`
    );

    try {
      // Get the correct constructor calldata based on the account type
      const constructorCalldata = this.getConstructorCallData(config);
      const { transaction_hash } = await starknetAccount.deployAccount({
        classHash: classHash,
        constructorCalldata: constructorCalldata,
        contractAddress: this.l2Address,
        addressSalt: this.l2PublicKey,
      });

      // Wait for deployment to complete
      const receipt = await l2Gateway.provider.waitForTransaction(transaction_hash);

      if (!receipt.isSuccess()) {
        throw new Error(`Failed to deploy account - ${transaction_hash}`);
      }

      // Update account state
      this.deployed = true;

      this.logger.info(
        `✅ Account ${this.name} deployed successfully at ${this.l2Address} - tx: ${transaction_hash}`
      );
      return true;
    } catch (error) {
      this.logger.error(`Failed to deploy account: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Funds this account with ETH
   * @param l1Gateway L1 gateway to use for funding
   * @param fundingAccount Account to use for funding
   */
  async fund(l1Gateway: L1Gateway, fundingAccount: IAccount): Promise<boolean> {
    this.logger.info(`Funding account ${this.name} on L2`);

    // Create a signer with provider
    const fundingSigner = fundingAccount.getL1Signer();
    if (!fundingSigner) {
      throw new Error(`Funding account ${fundingAccount.name} has no L1 signer`);
    }
    
    fundingSigner.connect(l1Gateway.provider);

    // Check if the fund account has enough ETH
    const fundAccountBalance = await l1Gateway.getBalance(fundingSigner.address);

    if (fundAccountBalance < ethers.parseEther('0.05')) {
      throw new Error(`Funding account ${fundingAccount.name} has insufficient balance`);
    }

    // Send ETH to the L2 account through the bridge
    try {
      const txHash = await l1Gateway.bridgeToL2(
        fundingAccount,
        this,
        '5' // Amount in ETH
      );

      this.logger.info(`✅ Successfully initiated funding for ${this.name} - tx: ${txHash}`);
    } catch (error) {
      this.logger.error(`Failed to fund account ${this.name}: ${(error as Error).message}`);
      throw error;
    }

    return true;
  }
} 