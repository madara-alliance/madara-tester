import { Signer } from './signer/Signer';
import {SignerTypeFile } from './signer/file/types';
/**
 * Represents a testing identity with associated signers for L1 and L2
 */
export interface Account {
  name?: string;
  privateKey: string;
  l1Address: string;
  l2Address: string;
  signer: Signer;
  /**
   * Whether this account has been deployed on-chain
   */
  deployed?: boolean;
  /**
   * L2 public key derived from private key
   */
  L2PublicKey?: string;
  /**
   * The type of L2 account contract (Braavos or Argent)
   */
  accountType?: 'braavos' | 'argent';
  /**
   * The class hash used for deploying this account
   */
  classHash?: string;
  /**
   * The transaction hash of the account deployment transaction
   */
  deployTxHash?: string;
} 


/**
 * Type for account configuration
 */
export type AccountConfig = {
  /**
   * Whether to generate random accounts instead of using the mnemonic
   */
  random?: boolean;
  /**
   * Mnemonic phrase used to derive account private keys
   */
  mnemonic: string;
  /**
   * Optional name for the account
   */
  name?: string;
  /**
   * Type of signer to use for this account
   * When adding other signer types, add them here
   */
  signerType: SignerTypeFile;
  /**
   * Account contract type to use (Braavos or Argent)
   */
  accountType?: 'braavos' | 'argent';
};