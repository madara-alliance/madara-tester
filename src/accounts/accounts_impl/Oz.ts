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
    accountProperties: AccountProperties = {},
    testConfig: TestConfig
  ) {
    // Ensure the account type is correct
    const ozConfig = { ...config, accountType: AccountTypes.OZ };
    
    // Set the class hash from the test config
    const classHash = testConfig.l2.contracts?.ozClassHash;
    if (!classHash) {
      throw new Error('OZ class hash not configured in TestConfig.l2.contracts.ozClassHash');
    }
    
    // Add class hash to account properties
    const propertiesWithClassHash = {
      ...accountProperties,
      classHash
    };
    
    super(ozConfig, propertiesWithClassHash);
  }

  /**
   * Gets the constructor calldata for this account
   */
  getConstructorCallData(): any {
    return CallData.compile({
      publicKey: this.accountProperties.l2PublicKey,
    });
  }
}