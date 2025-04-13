import { ethers } from 'ethers';
import { Signer } from '../accounts/signer/Signer';
import { getComponentLogger } from '../utils/logger';
import { TestConfig } from '../config/types';
import { Account } from '../accounts/types';

/**
 * Gateway for interacting with the L1 EVM network
 */
export class L1Gateway {
  public provider: ethers.Provider;
  private logger = getComponentLogger('L1Gateway');

  globalConfig: TestConfig;

  constructor(config: TestConfig) {
    if (!config.l1?.rpcUrl) {
      throw new Error('L1 RPC URL is required in the config');
    }

    this.provider = new ethers.JsonRpcProvider(config.l1.rpcUrl);
    this.logger.debug(`L1Gateway connected to ${config.l1.rpcUrl}`);
    this.globalConfig = config;
  }

  /**
   * Gets the latest block number from the L1 chain
   */
  async getLatestBlockNumber(): Promise<number> {
    this.logger.debug('Getting latest L1 block number');
    try {
      const blockNumber = await this.provider.getBlockNumber();
      this.logger.debug(`Latest L1 block number: ${blockNumber}`);
      return blockNumber;
    } catch (error) {
      this.logger.error(`Failed to get latest block number: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Gets a typed ethers.js Contract instance for L1
   */
  async getContract<T extends ethers.BaseContract>(
    address: string,
    abi: ethers.InterfaceAbi
  ): Promise<T> {
    this.logger.debug(`Creating contract instance at ${address}`);
    return new ethers.Contract(address, abi, this.provider) as unknown as T;
  }

  /**
   * Sends an L1 transaction
   */
  async sendL1Transaction(
    txRequest: ethers.TransactionRequest,
    fromAccount: Account
  ): Promise<ethers.TransactionResponse> {
    this.logger.debug(`Sending transaction to ${txRequest.to}`);

    // TODO: check if this is correct
    const l1Signer = fromAccount.getL1Signer() as ethers.Wallet;
    const signedTx = await l1Signer.signTransaction(txRequest);

    try {
      const tx = await this.provider.broadcastTransaction(signedTx);
      this.logger.debug(`Transaction sent: ${tx.hash}`);
      return tx;
    } catch (error) {
      this.logger.error(`Failed to send transaction: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Calls a view/pure function on an L1 contract
   */
  async callContract(txRequest: ethers.TransactionRequest): Promise<string> {
    this.logger.debug(`Calling contract at ${txRequest.to}`);

    try {
      const result = await this.provider.call(txRequest);
      return result;
    } catch (error) {
      this.logger.error(`Failed to call contract: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Gets the native balance of an L1 address
   */
  async getBalance(address: string): Promise<bigint> {
    this.logger.debug(`Getting balance for ${address}`);

    try {
      const balance = await this.provider.getBalance(address);
      this.logger.debug(`Balance: ${balance}`);
      return balance;
    } catch (error) {
      this.logger.error(`Failed to get balance: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Waits for an L1 transaction to be mined
   */
  async waitForTransaction(
    txHash: string,
    confirmations: number = 1
  ): Promise<ethers.TransactionReceipt | null> {
    this.logger.debug(`Waiting for transaction ${txHash} with ${confirmations} confirmations`);

    try {
      const receipt = await this.provider.waitForTransaction(txHash, confirmations);
      this.logger.debug(`Transaction ${txHash} confirmed: ${receipt ? 'success' : 'failed'}`);
      return receipt;
    } catch (error) {
      this.logger.error(`Failed while waiting for transaction: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Queries the L1 Core Contract for the settled L2 state root
   * This is a placeholder in the demo implementation
   */
  async getL2StateRootOnL1(l2BlockNumber: number): Promise<string | null> {
    this.logger.debug(`Getting L2 state root for block ${l2BlockNumber}`);
    // In a real implementation, this would call the core contract
    return `0x${l2BlockNumber.toString(16).padStart(64, '0')}`; // Placeholder value
  }

  /**
   * Bridges ETH to an L2 account
   * @param fromAccount - Sender account on L1
   * @param toAccount - The destination account on L2
   * @param amount - The amount of ETH to bridge
   * @returns The transaction hash of the bridge operation
   */
  async bridgeToL2(fromAccount: Account, toAccount: Account, amount: string): Promise<string> {
    this.logger.info(
      `Bridging ${amount} ETH to ${toAccount.l2Address} from ${fromAccount.l1Address}`
    );

    const contract = new ethers.Contract(
      this.globalConfig.l1.contracts.ethBridgeAddress,
      ['function deposit(uint256, uint256)'],
      fromAccount.getL1Signer()
    );

    const amountWithFees = (parseFloat(amount) + 0.01).toString();
    const tx = await contract.deposit(ethers.parseEther(amount), toAccount.l2Address, {
      value: ethers.parseEther(amountWithFees),
    });

    await tx.wait();
    this.logger.info(`✅ Successfully sent ${amount} ETH on L1 bridge`);
    return tx.hash;
  }
}
