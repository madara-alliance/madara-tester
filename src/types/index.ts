/**
 * Type definitions for the test engine components
 */

import { AccountConfig } from "../accounts/types";
import { AccountsManager } from "../accounts/AccountsManager";
import { L1Gateway } from "../gateways/L1Gateway";
import { L2Gateway } from "../gateways/L2Gateway";
import { BridgeService } from "../bridge/BridgeService";
import { StateVerifier } from "../verifier/StateVerifier";
import { EnvironmentManager } from "../environment/EnvironmentManager";


// TODO: check all these types, should be replaced with the actual types in the corresponding types.ts files
/**
 * Configuration returned from the API server
 * Placeholder that will be populated with more fields later
 */
export interface ServerConfig {
  // L1 configuration
  l1RpcUrl?: string;
  l1ChainId?: number;
  // L2 configuration
  l2RpcUrl?: string;
  l2ChainId?: number;
  // Contract addresses
  contractAddresses?: {
    [key: string]: string;
  };
  // Network state
  blockHeight?: {
    l1: number;
    l2: number;
  };
}

export interface TestConfig {
  mode: 'local' | 'testnet';
  l1?: {
    rpcUrl?: string;
    chainId?: number;
  };
  l2?: {
    rpcUrl?: string;
  };
  useApiServer?: boolean;
  apiServerUrl?: string;
  environment: {
    type: 'local' | 'testnet' | 'mainnet' | 'mainnet-fork';
    madaraCliPath: string;
    fork?: {
      l1RpcUrl?: string;
      l1BlockNumber?: number | 'latest';
    };
  };

  AccountsConfig: AccountConfig[];

  /**
   * Starknet account contracts configuration
   */
  starknetAccounts?: {
    /**
     * Braavos account contract class hash
     */
    braavosClassHash?: string;
    /**
     * Argent account contract class hash
     */
    argentClassHash?: string;
  };

  contracts: {
    [key: string]: string | { [env: string]: string };
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    components?: {
      [componentName: string]: 'debug' | 'info' | 'warn' | 'error';
    };
  };
}

export interface TestContext {
  getAccountsManager(): AccountsManager;
  getL1Gateway(): L1Gateway;
  getL2Gateway(): L2Gateway;
  getBridgeService(): BridgeService | null;
  getStateVerifier(): StateVerifier;
  getEnvironmentManager(): EnvironmentManager;
} 