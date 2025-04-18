// Account type constants
export enum AccountTypes {
  OZ = 'OZ',
  ARGENT = 'ARGENT',
  BRAAVOS = 'BRAAVOS',
  FUNDING = 'FUNDING',
}

export type AccountType = keyof typeof AccountTypes;

/**
 * Account properties used for initialization
 */
export interface AccountProperties {
  l1Address?: string;
  l1PublicKey?: string;
  l1PrivateKey?: string;
  l2Address?: string;
  l2PublicKey?: string;
  l2PrivateKey?: string;
  deployed?: boolean;
  classHash?: string;
}

/**
 * Represents a testing identity with associated signers for L1 and L2
 */
export interface Account {
  /**
   * Optional name for the account
   */
  name: string;
  /**
   * The type of L2 account contract (Braavos or Argent)
   */
  accountType: AccountType;
  /**
   * Account properties with all fields required
   */
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
   * Signer instance associated with the account for L1 transactions
   */
  getL1Signer(): any;

  /**
   * Signer instance associated with the account for L2 transactions
   */
  getL2Signer(): any;
}

/**
 * Type for account configuration
 */
export interface AccountConfig {
  /**
   * Name for the account
   */
  name: string;
  /**
   * Whether to generate random accounts instead of using the mnemonic
   */
  random?: boolean;
  /**
   * Mnemonic phrase used to derive account private keys
   */
  mnemonic?: string;
  /**
   * Private key for the account
   */
  privateKey?: string;
  /**
   * Type of signer to use for this account
   */
  signerType?: string;
  /**
   * Configuration for the signer
   */
  signerConfig?: any;
  /**
   * Account contract type to use (Braavos or Argent or OZ)
   */
  accountType: AccountType;
}
