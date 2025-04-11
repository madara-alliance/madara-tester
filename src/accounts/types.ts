import { Signer } from './signer/Signer';
/**
 * Represents a testing identity with associated signers for L1 and L2
 */
export interface Account {
  /**
   * Optional name for the account
   */
  name: string;
  /**
   * L1 address associated with the account
   */
  l1Address: string;
  /**
   * L1 public key associated with the account
   */
  l1PublicKey: string;
  /**
   * L2 address associated with the account
   */
  l2Address: string;
  /**
   * L2 public key associated with the account
   */
  l2PublicKey: string;
  /**
   * L2 private key associated with the account
   */
  l2PrivateKey: string;
  /**
   * Signer instance associated with the account
   */
  signer: any;
  /**
   * Whether this account has been deployed on-chain
   */
  deployed: boolean;
  /**
   * The type of L2 account contract (Braavos or Argent)
   */
  accountType: 'braavos' | 'argent' | 'oz';
}

/**
 * Type for account configuration
 */
export type AccountConfig = {
  /**
   * Whether to generate random accounts instead of using the mnemonic
   */
  random: boolean;
  /**
   * Mnemonic phrase used to derive account private keys
   */
  mnemonic: string;
  /**
   * Name for the account
   */
  name: string;
  /**
   * Type of signer to use for this account
   */
  signerType: string;
  /**
   * Configuration for the signer
   */
  signerConfig: any;
  /**
   * Account contract type to use (Braavos or Argent or OZ)
   */
  accountType: 'braavos' | 'argent' | 'oz';
};
