import { CallData } from 'starknet';
import { BaseAccount } from '../BaseAccount';
import { AccountConfig, AccountTypes, AccountProperties } from '../types';
import { TestConfig } from '../../config/types';

/**
 * Implementation of OpenZeppelin account
 */
export class OzAccount extends BaseAccount {
  constructor(
    config: AccountConfig,
    accountProperties: AccountProperties = {}
  ) {
    // Ensure the account type is correct
    const ozConfig = { ...config, accountType: AccountTypes.OZ };
    super(ozConfig, accountProperties);
  }

  /**
   * Gets the constructor calldata for this account
   */
  getConstructorCallData(config: TestConfig): any {
    return CallData.compile({
      publicKey: this.l2PublicKey,
    });
  }

  /**
   * Gets the class hash for this account type
   */
  getClassHash(config: TestConfig): string {
    const classHash = config.l2.contracts?.ozClassHash;
    if (!classHash) {
      throw new Error('OZ class hash not configured in TestConfig.l2.contracts.ozClassHash');
    }
    return classHash;
  }
} 