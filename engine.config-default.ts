/**
 * Default configuration for the Madara test engine
 * Used as a fallback when no specific configuration is provided
 */
export default {
  // Environment mode: 'local' or 'testnet'
  mode: 'local',

  l1: {
    // Used for local Anvil
    chainId: 31337,
  },

  l2: {
    // RPC URL will be obtained dynamically by EnvironmentManager
  },

  environment: {
    // Path to madara-cli for local environment setup
    madaraCliPath: 'madara-cli',
    // Optional forking configuration
    fork: {
      l1BlockNumber: 'latest',
    }
  },

  // Use AccountsConfig instead of accounts
  AccountsConfig: [
    {
      // Default test mnemonic (DO NOT use in production)
      mnemonic: 'test test test test test test test test test test test junk',
      // Optional name for identification  
      name: 'Default Test Account',
      // Default signer type
      signerType: 'file',
    }
  ],

  contracts: {
    // Default contract addresses (replace with actual addresses when available)
    l1CoreContractAddress: '0x0000000000000000000000000000000000000001',
    l2CoreContractAddress: '0x0000000000000000000000000000000000000001',
  },

  logging: {
    // Default log level
    level: 'info',
    // Component-specific log levels
    components: {
      EnvironmentManager: 'info',
      L1Gateway: 'info',
      L2Gateway: 'info',
      BridgeService: 'info',
      StateVerifier: 'info',
    }
  },
}; 