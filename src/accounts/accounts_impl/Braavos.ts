import { hash } from 'starknet';
import { CallData } from 'starknet';
import { BaseAccount } from '../BaseAccount';
import { AccountConfig, AccountTypes, AccountProperties } from '../types';
import { TestConfig } from '../../config/types';

/**
 * Implementation of Braavos account
 */
export class BraavosAccount extends BaseAccount {
  constructor(
    config: AccountConfig,
    accountProperties: AccountProperties = {},
    testConfig: TestConfig
  ) {
    // Ensure the account type is correct
    const braavosConfig = { ...config, accountType: AccountTypes.BRAAVOS };
    
    // Set the class hash from the test config
    const classHash = testConfig.l2.contracts?.braavosClassHash;
    if (!classHash) {
      throw new Error('Braavos class hash not configured in TestConfig.l2.contracts.braavosClassHash');
    }
    
    // Add class hash to account properties
    const propertiesWithClassHash = {
      ...accountProperties,
      classHash
    };
    
    super(braavosConfig, propertiesWithClassHash);
  }

  /**
   * Gets the constructor calldata for this account
   */
  getConstructorCallData(): any {
    // Get the implementation hash (needed for proxy initialization)
    const initialImplementationHash = this.accountProperties.classHash;
    const initializerCalldata = CallData.compile({ public_key: this.accountProperties.l2PublicKey });

    // Calculate the proxy constructor calldata
    return CallData.compile({
      implementation_address: initialImplementationHash,
      initializer_selector: hash.getSelectorFromName('initializer'),
      calldata: initializerCalldata,
    });
  }
} 