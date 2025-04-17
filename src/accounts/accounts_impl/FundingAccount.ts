import { ethers } from 'ethers';
import { BaseAccount } from '../BaseAccount';
import { AccountConfig, AccountTypes, AccountProperties } from '../types';
import { TestConfig } from '../../config/types';

/**
 * Implementation of Funding account (L1 only)
 */
export class FundingAccount extends BaseAccount {
  constructor(
    config: AccountConfig,
    accountProperties: Required<Pick<AccountProperties, 'l1Address' | 'l1PublicKey' | 'l1PrivateKey'>>
  ) {
    // Ensure the account type is correct
    const fundingConfig = { ...config, accountType: AccountTypes.FUNDING };
    
    // Funding accounts are always deployed and have no L2 component
    super(fundingConfig, {
      ...accountProperties,
      l2Address: '',
      l2PublicKey: '',
      l2PrivateKey: '',
      deployed: true
    });
  }

  /**
   * Gets the L2 signer for this account - not applicable for funding account
   */
  getL2Signer(): any {
    return undefined;
  }

  /**
   * Gets the constructor calldata for this account - not applicable for funding account
   */
  getConstructorCallData(config: TestConfig): any {
    throw new Error('Funding account has no constructor calldata (L1 only)');
  }

  /**
   * Gets the class hash for this account type - not applicable for funding account
   */
  getClassHash(config: TestConfig): string {
    throw new Error('Funding account has no class hash (L1 only)');
  }

  /**
   * Calculates the L2 address for this account - not applicable for funding account
   */
  calculateL2Address(config: TestConfig): string {
    // Funding accounts don't have L2 addresses
    return '';
  }

  /**
   * Factory method to create a funding account from a private key
   */
  static fromPrivateKey(privateKey: string, name: string): FundingAccount {
    const wallet = new ethers.Wallet(privateKey);
    
    const config: AccountConfig = {
      name,
      accountType: AccountTypes.FUNDING
    };
    
    return new FundingAccount(
      config,
      {
        l1Address: wallet.address,
        l1PublicKey: wallet.signingKey.publicKey,
        l1PrivateKey: wallet.privateKey
      }
    );
  }
} 