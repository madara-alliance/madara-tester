import { AccountConfig } from '../accounts/types';

/**
 * Configuration for ETH Bridge setup outputs
 */
export interface EthBridgeSetupOutputs {
  l2_legacy_proxy_class_hash: string;
  l2_erc20_legacy_class_hash: string;
  l2_eth_proxy_address: string;
  l2_starkgate_proxy_class_hash: string;
  l2_legacy_eth_bridge_class_hash: string;
  l2_eth_bridge_proxy_address: string;
  l1_bridge_address: string;
}

/**
 * Configuration for ERC20 Bridge setup outputs
 */
export interface ERC20BridgeSetupOutputs {
  erc20_cairo_one_class_hash: string;
  l1_token_bridge_proxy: string;
  l1_manager_address: string;
  l1_registry_address: string;
  l2_token_bridge: string;
  test_erc20_token_address: string;
}

/**
 * Configuration for UDC setup outputs
 */
export interface UDCSetupOutputs {
  udc_class_hash: string;
  udc_address: string;
}

/**
 * Configuration for Argent setup outputs
 */
export interface ArgentSetupOutputs {
  argent_class_hash: string;
}

/**
 * Configuration for Braavos setup outputs
 */
export interface BraavosSetupOutputs {
  braavos_class_hash: string;
}

/**
 * Configuration returned from the API server - TODO: should follow a spec
 */
export interface ServerConfig {
  l1RpcUrl: string;
  l1ChainId: number;
  l2RpcUrl: string;
  l2ChainId: number;
  // ETH Bridge setup outputs
  eth_bridge_setup_outputs: {
    l2_legacy_proxy_class_hash: string;
    l2_erc20_legacy_class_hash: string;
    l2_eth_proxy_address: string;
    l2_starkgate_proxy_class_hash: string;
    l2_legacy_eth_bridge_class_hash: string;
    l2_eth_bridge_proxy_address: string;
    l1_bridge_address: string;
  };
  // ERC20 Bridge setup outputs
  erc20_bridge_setup_outputs: {
    erc20_cairo_one_class_hash: string;
    l1_token_bridge_proxy: string;
    l1_manager_address: string;
    l1_registry_address: string;
    l2_token_bridge: string;
    test_erc20_token_address: string;
  };
  // UDC setup outputs
  udc_setup_outputs?: {
    udc_class_hash: string;
    udc_address: string;
  };
  // Argent setup outputs
  argent_setup_outputs: {
    argent_class_hash: string;
  };
  // Braavos setup outputs
  braavos_setup_outputs: {
    braavos_class_hash: string;
  };
}

/**
 * Configuration for L1 (Ethereum) contracts
 */
export interface L1Contracts {
  coreContractAddress: string;
  ethBridgeAddress: string;
  erc20BridgeAddress: string;
}

/**
 * Configuration for L2 (Starknet) contracts
 */
export interface L2Contracts {
  coreContractAddress: string;
  braavosClassHash: string;
  argentClassHash: string;
  ozClassHash: string;
  ethTokenProxyAddress: string;
}

/**
 * Configuration for L1 (Ethereum) network
 */
export interface L1Config {
  rpcUrl: string;
  chainId?: number;
  contracts: L1Contracts;
}

/**
 * Configuration for L2 (Starknet) network
 */
export interface L2Config {
  rpcUrl: string;
  chainId?: number;
  contracts: L2Contracts;
}

/**
 * Logging level type
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Configuration for logging
 */
export interface LoggingConfig {
  level: LogLevel;
  components?: {
    [componentName: string]: LogLevel;
  };
}

/**
 * Configuration for the test environment
 */
export interface TestConfig {
  mode: 'local' | 'testnet';
  l1: L1Config;
  l2: L2Config;
  useApiServer?: boolean;
  apiServerUrl?: string;

  AccountsConfig: AccountConfig[];

  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    components?: {
      [componentName: string]: 'debug' | 'info' | 'warn' | 'error';
    };
  };
}
