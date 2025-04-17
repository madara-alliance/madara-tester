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
    accountProperties: AccountProperties = {}
  ) {
    // Ensure the account type is correct
    const argentConfig = { ...config, accountType: AccountTypes.ARGENT };
    super(argentConfig, accountProperties);
  }

  /**
   * Gets the constructor calldata for this account
   */
  getConstructorCallData(config: TestConfig): any {
    const axSigner = new CairoCustomEnum({ Starknet: { pubkey: this.l2PublicKey } });
    const axGuardian = new CairoOption<unknown>(CairoOptionVariant.None);
    return CallData.compile({
      owner: axSigner,
      guardian: axGuardian,
    });
  }

  /**
   * Gets the class hash for this account type
   */
  getClassHash(config: TestConfig): string {
    const classHash = config.l2.contracts?.argentClassHash;
    if (!classHash) {
      throw new Error('Argent class hash not configured in TestConfig.l2.contracts.argentClassHash');
    }
    return classHash;
  }
} 