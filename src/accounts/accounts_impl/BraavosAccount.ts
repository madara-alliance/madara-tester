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
    accountProperties: AccountProperties = {}
  ) {
    // Ensure the account type is correct
    const braavosConfig = { ...config, accountType: AccountTypes.BRAAVOS };
    super(braavosConfig, accountProperties);
  }

  /**
   * Gets the constructor calldata for this account
   */
  getConstructorCallData(config: TestConfig): any {
    const initialImplementationHash = config.l2.contracts?.braavosClassHash;
    const initializerCalldata = CallData.compile({ public_key: this.l2PublicKey });

    // Calculate the proxy constructor calldata
    return CallData.compile({
      implementation_address: initialImplementationHash,
      initializer_selector: hash.getSelectorFromName('initializer'),
      calldata: initializerCalldata,
    });
  }

  /**
   * Gets the class hash for this account type
   */
  getClassHash(config: TestConfig): string {
    const classHash = config.l2.contracts?.braavosClassHash;
    if (!classHash) {
      throw new Error('Braavos class hash not configured in TestConfig.l2.contracts.braavosClassHash');
    }
    return classHash;
  }
} 