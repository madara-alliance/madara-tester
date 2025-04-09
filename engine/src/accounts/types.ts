import { Signer } from './Signer';

/**
 * Represents a testing identity with associated signers for L1 and L2
 */
export interface TestAccount {
  name?: string;
  privateKey: string;
  l1Address: string;
  l2Address: string;
  l1Signer: Signer;
  l2Signer: any; // Will be replaced with a proper Starknet signer type
} 