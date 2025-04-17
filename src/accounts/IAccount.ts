import { ethers } from 'ethers';
import { CairoCustomEnum, CairoOption, CallData } from 'starknet';
import { AccountType } from './types';
import { L1Gateway } from '../gateways/L1Gateway';
import { L2Gateway } from '../gateways/L2Gateway';
import { TestConfig } from '../config/types';

/**
 * Interface for all account types
 */
export interface IAccount {
  name: string;
  accountType: AccountType;
  l1Address: string;
  l1PublicKey: string;
  l1PrivateKey: string;
  l2Address: string;
  l2PublicKey: string;
  l2PrivateKey: string;
  deployed: boolean;

  /**
   * Gets the L1 signer for this account
   */
  getL1Signer(): ethers.Wallet | undefined;

  /**
   * Gets the L2 signer for this account
   */
  getL2Signer(): any;

  /**
   * Gets the constructor calldata for this account
   * @param config Global test configuration
   */
  getConstructorCallData(config: TestConfig): any;

  /**
   * Gets the class hash for this account type
   * @param config Global test configuration
   */
  getClassHash(config: TestConfig): string;

  /**
   * Calculates the L2 address for this account
   * @param config Global test configuration
   */
  calculateL2Address(config: TestConfig): string;

  /**
   * Deploys this account on L2
   * @param l2Gateway L2 gateway to use for deployment
   * @param config Global test configuration
   */
  deploy(l2Gateway: L2Gateway, config: TestConfig): Promise<boolean>;

  /**
   * Funds this account with ETH
   * @param l1Gateway L1 gateway to use for funding
   * @param fundingAccount Account to use for funding
   */
  fund(l1Gateway: L1Gateway, fundingAccount: IAccount): Promise<boolean>;
} 