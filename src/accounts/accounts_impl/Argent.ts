import { ec } from 'starknet';
import { CallData, CairoCustomEnum, CairoOption, CairoOptionVariant } from 'starknet';
import { BaseAccount } from '../BaseAccount';
import { AccountConfig, AccountTypes, AccountProperties } from '../types';
import { TestConfig } from '../../config/types';

/**
 * Implementation of Argent account
 */
export class ArgentAccount extends BaseAccount {
  constructor(
    config: AccountConfig,
    accountProperties: AccountProperties = {},
    testConfig: TestConfig
  ) {
    // Ensure the account type is correct
    const argentConfig = { ...config, accountType: AccountTypes.ARGENT };
    
    // Set the class hash from the test config
    const classHash = testConfig.l2.contracts?.argentClassHash;
    if (!classHash) {
      throw new Error('Argent class hash not configured in TestConfig.l2.contracts.argentClassHash');
    }
    
    // Add class hash to account properties
    const propertiesWithClassHash = {
      ...accountProperties,
      classHash
    };
    
    super(argentConfig, propertiesWithClassHash);
  }

  /**
   * Gets the constructor calldata for this account
   */
  getConstructorCallData(): any {
    const axSigner = new CairoCustomEnum({ Starknet: { pubkey: this.accountProperties.l2PublicKey } });
    const axGuardian = new CairoOption<unknown>(CairoOptionVariant.None);
    return CallData.compile({
      owner: axSigner,
      guardian: axGuardian,
    });
  }
} 