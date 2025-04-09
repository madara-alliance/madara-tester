import { Wallet, BytesLike, TransactionRequest } from 'ethers';
import { Signer } from '../Signer';
import { getComponentLogger } from '../../utils/logger';

/**
 * File-based signer implementation that uses a private key
 */
export class SignerFileImpl implements Signer {
  private wallet: Wallet;
  private logger = getComponentLogger('SignerFileImpl');
  
  /**
   * Creates a new file-based signer
   * @param privateKey The private key as a hex string
   */
  constructor(privateKey: string) {
    this.wallet = new Wallet(privateKey);
    this.logger.debug(`Created signer for address: ${this.wallet.address}`);
  }
  
  /**
   * Gets the address associated with this signer
   */
  async getAddress(): Promise<string> {
    return this.wallet.address;
  }
  
  /**
   * Signs an EVM transaction
   */
  async signTransaction(transaction: TransactionRequest): Promise<string> {
    this.logger.debug(`Signing transaction to: ${transaction.to}`);
    return await this.wallet.signTransaction(transaction);
  }
  
  /**
   * Signs a message using EIP-191
   */
  async signMessage(message: BytesLike | string): Promise<string> {
    this.logger.debug(`Signing message`);
    return await this.wallet.signMessage(message);
  }
} 