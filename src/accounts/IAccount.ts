import { ethers } from 'ethers';
import { CairoCustomEnum, CairoOption, CallData } from 'starknet';
import { AccountType, AccountProperties } from './types';
import { L1Gateway } from '../gateways/L1Gateway';
import { L2Gateway } from '../gateways/L2Gateway';
import { TestConfig } from '../config/types';

/**
 * Interface for all account types
 */
export interface IAccount {
  name: string;
  accountType: AccountType;
  accountProperties: Required<AccountProperties>;

  /**
   * Gets the L1 address
   */
  getL1Address(): string;

  /**
   * Gets the L1 public key
   */
  getL1PublicKey(): string;

  /**
   * Gets the L1 private key
   */
  getL1PrivateKey(): string;

  /**
   * Gets the L2 address
   */
  getL2Address(): string;

  /**
   * Gets the L2 public key
   */
  getL2PublicKey(): string;

  /**
   * Gets the L2 private key
   */
  getL2PrivateKey(): string;

  /**
   * Checks if the account is deployed
   */
  isDeployed(): boolean;

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
   */
  getConstructorCallData(): any;

  /**
   * Gets the class hash for this account type
   */
  getClassHash(): string;

  /**
   * Calculates the L2 address for this account
   */
  calculateL2Address(): string;

  /**
   * Deploys this account on L2
   * @param l2Gateway L2 gateway to use for deployment
   */
  deploy(l2Gateway: L2Gateway): Promise<boolean>;
} 