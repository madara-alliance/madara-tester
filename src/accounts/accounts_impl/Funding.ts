import { ethers } from 'ethers';
import { BaseAccount } from '../BaseAccount';
import { AccountConfig, AccountTypes, AccountProperties } from '../types';
import { TestConfig } from '../../config/types';
import { L1Gateway } from '../../gateways/L1Gateway';
import { IAccount } from '../IAccount';

/**
 * Implementation of Funding account (L1 only)
 */
export class FundingAccount extends BaseAccount {
  constructor(
    config: AccountConfig,
    initialProperties: Required<Pick<AccountProperties, 'l1Address' | 'l1PublicKey' | 'l1PrivateKey'>>
  ) {
    // Ensure the account type is correct
    const fundingConfig = { ...config, accountType: AccountTypes.FUNDING };
    
    // Funding accounts are always deployed and have no L2 component
    super(fundingConfig, {
      ...initialProperties,
      l2Address: '',
      l2PublicKey: '',
      l2PrivateKey: '',
      deployed: true,
      classHash: '' // Funding accounts don't have a class hash
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
  getConstructorCallData(): any {
    throw new Error('Funding account has no constructor calldata (L1 only)');
  }

  /**
   * Calculates the L2 address for this account - not applicable for funding account
   */
  calculateL2Address(): string {
    // Funding accounts don't have L2 addresses
    return '';
  }

  /**
   * Funds another account with ETH
   * @param l1Gateway L1 gateway to use for funding
   * @param targetAccount Account to fund or L2 address as a string
   * @param amount Amount of ETH to send (default: 5)
   */
  async fundOtherAccount(
    l1Gateway: L1Gateway, 
    targetAccount: IAccount | string, 
    amount: string = '5'
  ): Promise<boolean> {
    // Determine if we're funding an account object or an address string
    const isAddressString = typeof targetAccount === 'string';
    
    // Get a friendly name for logging
    let recipientName: string;
    if (isAddressString) {
      recipientName = `address ${targetAccount}`;
    } else {
      recipientName = `account ${(targetAccount as IAccount).name}`;
    }
    
    this.logger.info(`Funding ${recipientName} on L2`);

    // Create a signer with provider
    const fundingSigner = this.getL1Signer();
    if (!fundingSigner) {
      throw new Error(`Funding account ${this.name} has no L1 signer`);
    }
    
    fundingSigner.connect(l1Gateway.provider);

    // Check if the fund account has enough ETH
    const fundAccountBalance = await l1Gateway.getBalance(fundingSigner.address);

    if (fundAccountBalance < ethers.parseEther('0.05')) {
      throw new Error(`Funding account ${this.name} has insufficient balance`);
    }

    // Send ETH to the L2 account through the bridge
    try {
      const txHash = await l1Gateway.bridgeToL2(
        this,
        targetAccount,
        amount
      );

      this.logger.info(`✅ Successfully initiated funding for ${recipientName} - tx: ${txHash}`);
    } catch (error) {
      this.logger.error(`Failed to fund ${recipientName}: ${(error as Error).message}`);
      throw error;
    }

    return true;
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