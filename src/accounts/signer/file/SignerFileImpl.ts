import { Wallet, TransactionRequest } from 'ethers';
import { ec, hash } from 'starknet';
import { Signer } from '../Signer';
import { getComponentLogger } from '../../../utils/logger';
import { SignerFileConfig } from './types';
import fs from 'fs';
import path from 'path';

/**
 * File-based signer implementation that uses a private key loaded from a file
 */
export class SignerFileImpl implements Signer {
  public config: SignerFileConfig;
  private ethWallet: Wallet;
  private logger = getComponentLogger('SignerFileImpl');

  /**
   * Creates a new file-based signer
   * @param privateKey The private key as a hex string (for Ethereum)
   * @param starkPrivateKey The private key for StarkNet (optional, generated from Ethereum key if not provided)
   */
  constructor(config: SignerFileConfig) {
    const privateKey = this.readAndValidatePrivateKey(config.privateKeyPath);
    this.ethWallet = new Wallet(privateKey);
    this.config = config;
    this.logger.debug(`Created File-based signer for Ethereum address: ${this.ethWallet.address}`);
  }

  /**
   * Reads and validates a private key from the specified file path
   * @param filePath Path to the file containing the private key
   * @returns The validated private key
   * @throws Error if the file doesn't exist or the private key is invalid
   */
  private readAndValidatePrivateKey(filePath: string): string {
    try {
      this.logger.debug(`Reading private key from file: ${filePath}`);
      const privateKey = fs.readFileSync(filePath, 'utf8').trim();

      // Validate format of the private key
      if (!privateKey.startsWith('0x')) {
        throw new Error('Private key must start with 0x');
      }

      // Validate length of the private key
      if (privateKey.length !== 66) {
        throw new Error('Private key must be 66 characters long');
      }

      return privateKey;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Private key file not found at path: ${filePath}`);
      }
      // Re-throw validation errors or other errors
      throw error;
    }
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
   * Note: The transaction parameter uses TransactionRequest for compatibility
   */
  async signL2Transaction(transaction: TransactionRequest): Promise<string> {
    this.logger.debug(`Signing StarkNet transaction`);

    // Read the private key from the file
    let starkPrivateKey;
    try {
      starkPrivateKey = this.readAndValidatePrivateKey(this.config.privateKeyPath);
    } catch (error) {
      this.logger.error(`Error reading private key file: ${(error as Error).message}`);
      throw new Error(
        `Failed to read private key from ${this.config.privateKeyPath}: ${(error as Error).message}`
      );
    }

    // Extract transaction data
    const data = transaction.data ? transaction.data.toString() : '';

    // Create a simplified hash for this demo implementation
    const messageHash = hash.getSelectorFromName(data || 'execute');

    try {
      // Sign the hash using StarkNet's signature scheme
      const signature = ec.starkCurve.sign(messageHash, starkPrivateKey);

      // Format and return the signature as required by StarkNet
      return `0x${signature.r.toString(16)},0x${signature.s.toString(16)}`;
    } catch (error) {
      this.logger.error(`Error signing StarkNet transaction: ${(error as Error).message}`);
      throw error;
    }
  }

  getPrivateKey(): string {
    return this.readAndValidatePrivateKey(this.config.privateKeyPath);
  }

  /**
   * Gets the public key for this signer
   */
  getPublicKey(): string {
    // If needed, derive the public key from the private key
    // For now, return an empty string as a placeholder
    return '';
  }
}
