import { BytesLike, TransactionRequest } from 'ethers';


/**
 * Interface for transaction and message signing
 */
export interface Signer {
  /** Returns the address associated with this signer */
  getAddress(): Promise<string>;
  
  /** Signs a standard Ethereum transaction using ECDSA over secp256k1 */
  signL1Transaction(transaction: TransactionRequest): Promise<string>;

  /** Signs a StarkNet transaction using the STARK curve and Pedersen hash */
  signL2Transaction(transaction: TransactionRequest): Promise<string>;
} 