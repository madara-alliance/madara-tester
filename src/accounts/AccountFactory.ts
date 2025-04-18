import { ethers } from 'ethers';
import { ec, hash, stark } from 'starknet';
import { IAccount } from './IAccount';
import { AccountConfig, AccountType, AccountTypes, AccountProperties } from './types';
import { TestConfig } from '../config/types';
import { getComponentLogger } from '../utils/logger';
import { OzAccount, ArgentAccount, BraavosAccount, FundingAccount } from './accounts_impl';

/**
 * Factory class for creating different types of accounts
 */
export class AccountFactory {
  private logger = getComponentLogger('AccountFactory');
  private config: TestConfig;

  constructor(config: TestConfig) {
    this.config = config;
  }

  /**
   * Creates an account from a configuration
   */
  createFromConfig(accountConfig: AccountConfig): IAccount | undefined {
    let account: IAccount | undefined;

    if (accountConfig.random) {
      account = this.createRandom(accountConfig);
    } else if (accountConfig.mnemonic) {
      account = this.createFromMnemonic(accountConfig);
    } else if (accountConfig.privateKey) {
      account = this.createFromPrivateKey(accountConfig);
    } else {
      this.logger.warn(
        `Cannot create account "${accountConfig.name}" - no mnemonic, private key, or random flag set`
      );
      return undefined;
    }

    return account;
  }

  /**
   * Creates an account from a mnemonic phrase
   */
  createFromMnemonic(accountConfig: AccountConfig): IAccount {
    // This method is still under development
    throw new Error('Method not implemented');
  }

  /**
   * Creates an account from a private key
   */
  createFromPrivateKey(accountConfig: AccountConfig): IAccount {
    if (accountConfig.accountType !== AccountTypes.FUNDING) {
      throw new Error('Only funding account can be created from private key');
    }

    if (!accountConfig.privateKey) {
      throw new Error('Private key is required for creating a funding account');
    }

    return FundingAccount.fromPrivateKey(accountConfig.privateKey, accountConfig.name);
  }

  /**
   * Creates a new random account based on the specified type
   */
  createRandom(accountConfig: AccountConfig): IAccount {
    // Generate random L1 wallet
    const wallet = ethers.Wallet.createRandom();
    const l1PrivateKey = wallet.privateKey;
    const l1Address = wallet.address;
    const l1PublicKey = wallet.publicKey;

    // Generate random L2 wallet
    const l2PrivateKey = stark.randomAddress();
    const l2PublicKey = ec.starkCurve.getStarkKey(l2PrivateKey);

    // Common account properties
    const accountProperties: AccountProperties = {
      l1Address,
      l1PublicKey,
      l1PrivateKey,
      l2PublicKey,
      l2PrivateKey,
      deployed: false
    };

    let account: IAccount;

    switch (accountConfig.accountType) {
      case AccountTypes.OZ:
        account = new OzAccount(accountConfig, accountProperties, this.config);
        break;
      case AccountTypes.ARGENT:
        account = new ArgentAccount(accountConfig, accountProperties, this.config);
        break;
      case AccountTypes.BRAAVOS:
        account = new BraavosAccount(accountConfig, accountProperties, this.config);
        break;
      case AccountTypes.FUNDING:
        account = FundingAccount.fromPrivateKey(l1PrivateKey, accountConfig.name);
        break;
      default:
        throw new Error(`Unsupported account type: ${accountConfig.accountType}`);
    }

    // If this is an L2 account, calculate its address
    if (accountConfig.accountType !== AccountTypes.FUNDING) {
      account.calculateL2Address();
    }

    this.logger.debug(
      `Created random account: 
      Name: ${account.name}
      L1 Address: ${account.getL1Address()}
      L2 Address: ${account.getL2Address()}
      Account Type: ${account.accountType}
      Deployed: ${account.isDeployed()}`
    );

    return account;
  }
} 