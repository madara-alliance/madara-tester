import { Wallet, TransactionRequest } from 'ethers';
import { ec, hash } from 'starknet';
import { Signer } from '../Signer';
import { getComponentLogger } from '../../../utils/logger';
import { SignerMemoryConfig } from './types';

/**
 * Memory-based signer implementation that holds the private key in memory
 */
export class SignerMemoryImpl implements Signer {
  private ethWallet: Wallet;
  private privateKey: string;
  private logger = getComponentLogger('SignerMemoryImpl');

  /**
   * Creates a new memory-based signer
   */
  constructor(config: SignerMemoryConfig) {
    this.privateKey = config.privateKey;

    // Validate format of the private key
    if (!this.privateKey.startsWith('0x')) {
      throw new Error('Private key must start with 0x');
    }

    // Validate length of the private key
    if (this.privateKey.length !== 66) {
      throw new Error('Private key must be 66 characters long');
    }
    this.ethWallet = new Wallet(this.privateKey);
    this.logger.debug(
      `Created memory-based signer for Ethereum address: ${this.ethWallet.address}`
    );
  }

  /**
   * Gets the public key associated with this signer
   */
  getPublicKey(): string {
    return '0x' + Buffer.from(this.ethWallet.address.slice(2), 'hex').toString('hex');
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
   */
  async signL2Transaction(transaction: TransactionRequest): Promise<string> {
    this.logger.debug(`Signing StarkNet transaction`);

    // Extract transaction data
    const data = transaction.data ? transaction.data.toString() : '';

    // Create a simplified hash for this demo implementation
    const messageHash = hash.getSelectorFromName(data || 'execute');

    try {
      // Sign the hash using StarkNet's signature scheme
      const signature = ec.starkCurve.sign(messageHash, this.privateKey);

      // Format and return the signature as required by StarkNet
      return `0x${signature.r.toString(16)},0x${signature.s.toString(16)}`;
    } catch (error) {
      this.logger.error(`Error signing StarkNet transaction: ${(error as Error).message}`);
      throw error;
    }
  }

  getPrivateKey(): string {
    return this.privateKey;
  }
}
