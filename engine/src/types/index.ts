/**
 * Type definitions for the test engine components
 */

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
  accounts: {
    mnemonic: string;
    name?: string;
    localFunding?: {
      l1Eth?: string;
      l2Eth?: string;
    };
    signerType: 'file';
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

export interface ResolvedRpcUrls {
  l1RpcUrl: string;
  l2RpcUrl: string;
}

export interface TestContext {
  config: TestConfig;
  accounts: any; // Will be replaced with AccountsManager
  l1: any; // Will be replaced with L1Gateway
  l2: any; // Will be replaced with L2Gateway
  bridge: any; // Will be replaced with BridgeService
  verifier: any; // Will be replaced with StateVerifier
  environment: any; // Will be replaced with EnvironmentManager
} 