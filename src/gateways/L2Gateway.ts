import { RpcProvider } from 'starknet';
import { getComponentLogger } from '../utils/logger';
import { TestConfig } from '../config/types';
import * as starknet from 'starknet';
import { Account } from '../accounts/types';
import { cairo, Uint256, Call } from 'starknet';

type BlockIdentifier = number | 'latest' | 'pending';

/**
 * Gateway for interacting with the L2 Starknet network
 */
export class L2Gateway {
  public provider: RpcProvider;
  config: TestConfig;
  private logger = getComponentLogger('L2Gateway');

  constructor(config: TestConfig) {
    if (!config.l2.rpcUrl) {
      throw new Error('L2 RPC URL is required in the config');
    }

    this.provider = new RpcProvider({ nodeUrl: config.l2.rpcUrl });
    this.logger.info(`L2Gateway connected to ${config.l2.rpcUrl}`);
    this.config = config;
  }

  /**
   * Gets the latest block number from the L2 chain
   */
  async getLatestBlockNumber(): Promise<number> {
    this.logger.debug('Getting latest L2 block number');
    try {
      // For starknet.js, the equivalent of getBlockNumber is getting the latest block and reading its number
      const block = await this.provider.getBlock('latest');
      const blockNumber = Number(block.block_number);
      this.logger.debug(`Latest L2 block number: ${blockNumber}`);
      return blockNumber;
    } catch (error) {
      this.logger.error(`Failed to get latest block number: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Gets a typed starknet.js Contract instance for L2
   * This is a placeholder implementation
   */
  async getContract<T>(address: string, abi: any): Promise<T> {
    this.logger.debug(`Creating contract instance at ${address}`);
    // In a real implementation, this would create a Starknet contract
    return { address, abi } as unknown as T;
  }

  async getBalance(address: string, tokenType: string): Promise<BigInt> {
    const tokenAddress = this.getTokenAddress(tokenType);
    const abi = [
      {
        name: 'balanceOf',
        type: 'function',
        inputs: [{ name: 'account', type: 'felt' }],
        outputs: [{ name: 'balance', type: 'Uint256' }],
        stateMutability: 'view',
      },
    ];
    const tokenContract = new starknet.Contract(abi, tokenAddress, this.provider);

    try {
      const balance = await tokenContract.balanceOf(address);
      this.logger.debug(
        `Got balance for ${address} for token ${tokenType} at ${tokenAddress}: ${balance.balance}`
      );
      return BigInt(balance.balance.toString());
    } catch (error) {
      this.logger.error(
        `Failed to get balance for ${address} for token ${tokenType} at ${tokenAddress}: ${(error as Error).message}`
      );
      throw error;
    }
  }

  /**
   * Gets the token address for a specific token type
   * @param tokenType The type of token (e.g., "ETH")
   * @returns The address of the token contract
   */
  private getTokenAddress(tokenType: string): string {
    switch (tokenType) {
      case 'ETH':
        if (this.config.l2?.contracts?.ethTokenProxyAddress) {
          return this.config.l2?.contracts?.ethTokenProxyAddress;
        }
      default:
        throw new Error(`Unsupported token type: ${tokenType}`);
    }
  }

  /**
   * Queries the L2 node for its state root at a specific block
   * This is a placeholder implementation
   */
  async getStateRoot(blockIdentifier: BlockIdentifier): Promise<string> {
    this.logger.debug(`Getting state root for block ${blockIdentifier}`);

    // In a real implementation, this would query the Starknet node
    const blockId = blockIdentifier === 'latest' ? Date.now() : blockIdentifier;
    return `0x${blockId.toString(16).padStart(64, '0')}`; // Placeholder value
  }

  /**
   * Transfers a specified token from a sender account to a recipient address on L2.
   * @param senderAccount The custom Account interface representing the sender.
   * @param recipientAddress The address receiving the tokens.
   * @param amount The amount of tokens to transfer (as a bigint, string, or number).
   * @param tokenType The type of token (e.g., "ETH").
   * @returns The result of the invoke function call.
   */
  async transferToken(
    senderAccount: Account,
    recipientAddress: string,
    amount: bigint | string | number,
    tokenType: string
  ): Promise<string> {
    this.logger.info(
      `Initiating transfer of ${amount} ${tokenType} from ${senderAccount.getL2Address()} to ${recipientAddress}`
    );
    const tokenAddress = this.getTokenAddress(tokenType);
    const l2Signer = senderAccount.getL2Signer() as starknet.Account;

    const abi = [
      {
        name: 'transfer',
        type: 'function',
        inputs: [
          { name: 'recipient', type: 'felt' },
          { name: 'amount', type: 'Uint256' },
        ],
        outputs: [{ name: 'success', type: 'felt' }],
      },
    ];

    const tokenContract = new starknet.Contract(abi, tokenAddress, l2Signer);

    try {
      // Convert amount to a scaled value with 18 decimals (standard for most tokens)
      const amountValue = BigInt(amount.toString());
      const tokenDecimals = 18; // Standard for most ERC20 tokens
      const scaledAmount = amountValue * (10n ** BigInt(tokenDecimals));

      this.logger.debug(
        `Creating transfer call on token ${tokenType} (${tokenAddress}) with amount ${amount} (${scaledAmount} base units)`
      );

      // Use the populate pattern with correctly formatted Uint256 amount
      const transferCall: Call = tokenContract.populate('transfer', {
        recipient: recipientAddress,
        amount: cairo.uint256(scaledAmount), // Format the amount as Uint256
      });

      // Execute the populated call using the account signer
      const { transaction_hash } = await l2Signer.execute(transferCall);

      this.logger.info(`Transfer transaction submitted: ${transaction_hash}`);

      return transaction_hash;
    } catch (error) {
      this.logger.error(
        `Failed to transfer ${tokenType} from ${senderAccount.getL2Address()} to ${recipientAddress}: ${(error as Error).message}`
      );
      throw error;
    }
  }
}
