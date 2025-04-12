import { AccountConfig } from '../accounts/types';

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
 * Configuration for the test environment
 */
export interface TestConfig {
  mode: 'local' | 'testnet';
  l1: {
    rpcUrl: string;
    chainId?: number;
    contracts: {
      coreContractAddress: string;
      ethBridgeAddress: string;
      erc20BridgeAddress: string;
    };
  };
  l2: {
    rpcUrl: string;
    chainId?: number;
    contracts: {
      coreContractAddress?: string;
      braavosClassHash?: string;
      argentClassHash?: string;
      ozClassHash?: string;
      ethTokenProxyAddress?: string;
    };
  };
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
