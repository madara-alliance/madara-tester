import { BytesLike, TransactionRequest } from 'ethers';

/**
 * Interface for transaction and message signing
 */
export interface Signer {
  /** Returns the address associated with this signer */
  getAddress(): Promise<string>;
  
  /** Signs a standard EVM-style transaction */
  signTransaction(transaction: TransactionRequest): Promise<string>;
  
  /** Signs a message according to EIP-191 */
  signMessage(message: BytesLike | string): Promise<string>;
} 