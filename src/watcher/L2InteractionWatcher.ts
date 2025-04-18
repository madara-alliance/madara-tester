import { RpcProvider, GetTransactionReceiptResponse } from 'starknet';
import { L2Gateway } from '../gateways/L2Gateway';
import { getComponentLogger } from '../utils/logger';
import { Account } from '../accounts/types';

// Interface for optional parameters for waitForTransaction
interface WaitForTxOptions {
  /** Interval between checks in milliseconds. Defaults to provider's default (~5-6s). */
  retryInterval?: number;
  /** If true, waits for ACCEPTED_ON_L1, otherwise waits for ACCEPTED_ON_L2. Defaults to false. */
  waitForL1Acceptance?: boolean;
}

// Interface for optional parameters for waitForBalanceUpdate
interface WaitForBalanceOptions {
  /** Interval between balance checks in milliseconds. Defaults to 2000ms. */
  retryInterval?: number;
  /** Maximum time to wait in milliseconds. Defaults to 180000ms (3 minutes). */
  timeout?: number;
  /** The specific token contract address to check. Default is ETH. */
  tokenType?: string;
  /** Optional: Check if balance increased by AT LEAST this amount, instead of reaching a target */
  expectedIncrease?: BigInt;
}

const DEFAULT_BALANCE_RETRY_INTERVAL = 2000; // ms
const DEFAULT_BALANCE_TIMEOUT = 180000; // ms (3 minutes)

/**
 * Watches and monitors L2 interactions, including transactions and balance changes
 * resulting from L1→L2 messages.
 */
export class L2InteractionWatcher {
  private l2Provider: RpcProvider;
  private l2Gateway: L2Gateway;
  private logger = getComponentLogger('L2InteractionWatcher');

  constructor(l2Gateway: L2Gateway) {
    this.l2Gateway = l2Gateway;
    this.l2Provider = l2Gateway.provider;
    this.logger.debug('L2InteractionWatcher initialized');
  }

  /**
   * Waits for a specific L2 transaction (initiated on L2) to be accepted.
   * @param txHash The hash of the L2 transaction.
   * @param options Optional configuration.
   * @returns The transaction receipt.
   * @throws Error if transaction fails or times out.
   */
  async waitForTransaction(
    txHash: string,
    options: WaitForTxOptions = {}
  ): Promise<GetTransactionReceiptResponse> {
    this.logger.info(`Waiting for L2 transaction ${txHash} to be accepted...`);
    const { retryInterval, waitForL1Acceptance = false } = options;

    try {
      // Use provider's waitForTransaction without custom status checks
      const receipt = await this.l2Provider.waitForTransaction(txHash, {
        retryInterval,
      });

      // Check status for logging
      this.logger.info(`✅ Transaction ${txHash} completed`);

      // Safely check for revert_reason in a type-safe way
      const anyReceipt = receipt as any;
      if (anyReceipt.revert_reason) {
        throw new Error(`Transaction ${txHash} reverted: ${anyReceipt.revert_reason}`);
      }

      return receipt;
    } catch (error: any) {
      this.logger.error(`Error waiting for L2 transaction ${txHash}: ${error.message}`);
      throw error; // Re-throw for caller
    }
  }

  /**
   * Waits until the L2 balance for an account increases.
   * @param account The L2 account (or just its address) being monitored.
   * @param options Optional configuration for polling interval, timeout, token, and expected increase.
   * @returns The final balance after an increase is detected.
   * @throws Error if timeout occurs or polling fails critically.
   */
  async waitForBalanceUpdate(
    account: Account | string,
    options: WaitForBalanceOptions = {}
  ): Promise<BigInt> {
    const l2Address = typeof account === 'string' ? account : account.getL2Address();
    const {
      retryInterval = DEFAULT_BALANCE_RETRY_INTERVAL,
      timeout = DEFAULT_BALANCE_TIMEOUT,
      tokenType = 'ETH',
      expectedIncrease, // Optional: check for a specific increase amount
    } = options;

    // Automatically get the initial balance
    const initialBalance = await this.l2Gateway.getBalance(l2Address, tokenType);
    this.logger.info(
      `Waiting for balance of ${l2Address} (token: ${tokenType}) to increase from ${initialBalance}${
        expectedIncrease ? ` by at least ${expectedIncrease}` : ''
      }...`
    );

    const startTime = Date.now();
    let currentBalance = initialBalance;

    while (Date.now() - startTime < timeout) {
      try {
        currentBalance = await this.l2Gateway.getBalance(l2Address, tokenType);
        this.logger.debug(`Polling ${l2Address}. Current balance: ${currentBalance.toString()}`);

        const conditionMet = expectedIncrease
          ? BigInt(currentBalance.toString()) >=
            BigInt(initialBalance.toString()) + BigInt(expectedIncrease.toString())
          : BigInt(currentBalance.toString()) > BigInt(initialBalance.toString());

        if (conditionMet) {
          const increase = BigInt(currentBalance.toString()) - BigInt(initialBalance.toString());
          this.logger.info(
            `✅ Balance increased for ${l2Address}. Initial: ${initialBalance}, Current: ${currentBalance}, Increase: ${increase}`
          );
          return currentBalance; // Success
        }
      } catch (error: any) {
        // Log non-critical errors and continue polling
        this.logger.warn(`Polling balance for ${l2Address} failed: ${error.message}. Retrying...`);
        // Consider adding checks for specific fatal errors if needed
      }

      // Wait before the next poll
      await new Promise((resolve) => setTimeout(resolve, retryInterval));
    }

    // Timeout reached
    this.logger.error(
      `Timeout (${timeout}ms) waiting for balance update for ${l2Address}. Last checked balance: ${currentBalance}, Initial: ${initialBalance}`
    );
    throw new Error(`Timeout waiting for L2 balance increase for ${l2Address}`);
  }
}
