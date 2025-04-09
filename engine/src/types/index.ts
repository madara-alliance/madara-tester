/**
 * Type definitions for the test engine components
 */

import { AccountConfig } from "../accounts/types";


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

// export interface TestContext {
//   config: TestConfig;
//   accounts: any; // Will be replaced with AccountsManager
//   l1: any; // Will be replaced with L1Gateway
//   l2: any; // Will be replaced with L2Gateway
//   bridge: any; // Will be replaced with BridgeService
//   verifier: any; // Will be replaced with StateVerifier
//   environment: any; // Will be replaced with EnvironmentManager
// } 