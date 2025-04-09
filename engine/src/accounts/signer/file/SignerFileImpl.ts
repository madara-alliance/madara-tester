import { Wallet, BytesLike, TransactionRequest } from 'ethers';
import { ec, constants, hash } from 'starknet';
import { Signer } from '../Signer';
import { getComponentLogger } from '../../../utils/logger';

/**
 * File-based signer implementation that uses a private key
 */
export class SignerFileImpl implements Signer {
  private ethWallet: Wallet;
  private starkPrivateKey: string;
  private logger = getComponentLogger('SignerFileImpl');
  
  /**
   * Creates a new file-based signer
   * @param privateKey The private key as a hex string (for Ethereum)
   * @param starkPrivateKey The private key for StarkNet (optional, generated from Ethereum key if not provided)
   */
  constructor(privateKey: string, starkPrivateKey?: string) {
    this.ethWallet = new Wallet(privateKey);
    
    // If no StarkNet private key is provided, derive one from the Ethereum key
    // This is just one approach - in production you might want a more secure derivation
    if (!starkPrivateKey) {
      // Generate a StarkNet private key by hashing the Ethereum private key
      // This is simplified - a real implementation would use a more robust approach
      const ethPrivateKeyBytes = Buffer.from(privateKey.replace(/^0x/, ''), 'hex');
      const hash = Buffer.from(ethPrivateKeyBytes).toString('hex');
      // Ensure it's a valid StarkNet private key (smaller than the prime field size)
      this.starkPrivateKey = `0x${hash.slice(0, 62)}`;
    } else {
      this.starkPrivateKey = starkPrivateKey;
    }
    
    // Ensure the private key is properly formatted
    if (!this.starkPrivateKey.startsWith('0x')) {
      this.starkPrivateKey = `0x${this.starkPrivateKey}`;
    }
    
    this.logger.debug(`Created signer for Ethereum address: ${this.ethWallet.address}`);
  }
  
  /**
   * Gets the Ethereum address associated with this signer
   */
  async getAddress(): Promise<string> {
    return this.ethWallet.address;
  }
  
  /**
   * Signs an Ethereum transaction using ECDSA over secp256k1
   */
  async signL1Transaction(transaction: TransactionRequest): Promise<string> {
    this.logger.debug(`Signing Ethereum transaction to: ${transaction.to}`);
    return await this.ethWallet.signTransaction(transaction);
  }
  
  /**
   * Signs a StarkNet transaction using the STARK curve and Pedersen hash
   * Note: The transaction parameter uses TransactionRequest for compatibility,
   * but it should be adapted for StarkNet-specific fields
   */
  async signL2Transaction(transaction: TransactionRequest): Promise<string> {
    this.logger.debug(`Signing StarkNet transaction`);
    
    // For a proper implementation, this should be using StarkNet-specific types
    // This is a simplified implementation that extracts data from the generic TransactionRequest
    
    // Extract transaction data from Ethereum format (not ideal, but working with the interface)
    const contractAddress = transaction.to as string;
    const data = transaction.data ? transaction.data.toString() : '';
    
    // Create a hash of the message to sign
    // In a real implementation, you would properly format the message based on StarkNet transaction structure
    const messageHash = hash.getSelectorFromName(data || 'execute');
    
    try {
      // Sign the hash using StarkNet's signature scheme
      const signature = ec.starkCurve.sign(messageHash, this.starkPrivateKey);
      
      // Format and return the signature as required by StarkNet
      return `0x${signature.r.toString(16)},0x${signature.s.toString(16)}`;
    } catch (error) {
      this.logger.error(`Error signing StarkNet transaction: ${(error as Error).message}`);
      throw error;
    }
  }
}