import { ethers } from 'ethers';
import { Signer } from '../accounts/Signer';
import { getComponentLogger } from '../utils/logger';
import { TestConfig } from '../types';

/**
 * Gateway for interacting with the L1 EVM network
 */
export class L1Gateway {
  public provider: ethers.Provider;
  private logger = getComponentLogger('L1Gateway');
  
  constructor(config: TestConfig) {
    if (!config.l1?.rpcUrl) {
      throw new Error('L1 RPC URL is required in the config');
    }
    
    this.provider = new ethers.JsonRpcProvider(config.l1.rpcUrl);
    this.logger.info(`L1Gateway connected to ${config.l1.rpcUrl}`);
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
  async sendTransaction(
    txRequest: ethers.TransactionRequest,
    signer: Signer
  ): Promise<ethers.TransactionResponse> {
    this.logger.debug(`Sending transaction to ${txRequest.to}`);
    
    const address = await signer.getAddress();
    const signedTx = await signer.signTransaction(txRequest);
    
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
   * Deploys a contract on L1
   */
  async deployContract<T extends ethers.BaseContract>(
    abi: ethers.InterfaceAbi,
    bytecode: ethers.BytesLike,
    args: any[],
    signer: Signer
  ): Promise<T> {
    this.logger.info('Deploying contract');
    
    const factory = new ethers.ContractFactory(abi, bytecode);
    const deployTx = factory.getDeployTransaction(...args);
    
    const tx = await this.sendTransaction(deployTx as unknown as ethers.TransactionRequest, signer);
    this.logger.debug(`Deployment transaction sent: ${tx.hash}`);
    
    const receipt = await this.waitForTransaction(tx.hash, 1);
    
    if (receipt && receipt.status === 1 && receipt.contractAddress) {
      this.logger.info(`Contract deployed at ${receipt.contractAddress}`);
      return this.getContract<T>(receipt.contractAddress, abi);
    } else {
      throw new Error(`Contract deployment failed: ${tx.hash}`);
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
   * Sends a message to L2 via the L1 bridge/messaging contract
   * This is a placeholder in the demo implementation
   */
  async sendMessageToL2(
    targetContract: string,
    selector: string,
    args: any[],
    fee: ethers.BigNumberish,
    signer: Signer
  ): Promise<ethers.TransactionResponse> {
    this.logger.info(`Sending message to L2 contract ${targetContract}`);
    
    // In a real implementation, this would call the bridge contract
    const tx = await this.sendTransaction({
      to: '0x0000000000000000000000000000000000000001', // Bridge contract placeholder
      value: fee,
      data: ethers.concat([
        ethers.getBytes('0x12345678'), // Function selector placeholder
        ethers.getBytes(targetContract),
        ethers.getBytes(selector),
        ethers.getBytes('0x' + args.map(a => a.toString(16).padStart(64, '0')).join(''))
      ])
    }, signer);
    
    this.logger.debug(`L1->L2 message transaction sent: ${tx.hash}`);
    return tx;
  }
} 