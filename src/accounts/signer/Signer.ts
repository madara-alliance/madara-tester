
/**
 * Interface for transaction and message signing
 */
export interface Signer {
  /** Returns the public key associated with this signer */
  getPublicKey(): string;

  /** Signs a standard Ethereum transaction */
  signL1Transaction(transaction: any): Promise<string>;

  /** Signs a StarkNet transaction */
  signL2Transaction(transaction: any): Promise<string>;

  /** Returns the private key FOR TESTING ONLY */
  getPrivateKey(): string;
}
