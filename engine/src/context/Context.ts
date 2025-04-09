import { TestContext as TestContextInterface, TestConfig } from '../types';
import { AccountsManager, AccountConfig } from '../accounts/AccountsManager';
import { L1Gateway } from '../gateways/L1Gateway';
import { L2Gateway } from '../gateways/L2Gateway';
import { BridgeService } from '../bridge/BridgeService';
import { StateVerifier } from '../verifier/StateVerifier';
import { EnvironmentManager } from '../environment/EnvironmentManager';
import { getComponentLogger } from '../utils/logger';

/**
 * Factory for creating and assembling TestContext objects
 */
export class TestContext {
  private logger = getComponentLogger('TestContext');
  
  /**
   * Assembles a TestContext instance with all components
   */
  async createContext(
    config: TestConfig,
    environment: EnvironmentManager
  ): Promise<TestContextInterface> {
    this.logger.info('Assembling test context');
    
    // Get RPC URLs
    const l1RpcUrl = config.l1?.rpcUrl;
    const l2RpcUrl = config.l2?.rpcUrl;
    
    if (!l1RpcUrl || !l2RpcUrl) {
      throw new Error('Missing RPC URLs in configuration');
    }
    
    // Create the gateways
    const l1Gateway = new L1Gateway(l1RpcUrl);
    const l2Gateway = new L2Gateway(l2RpcUrl);
    
    // Create the accounts manager
    const accountsManager = new AccountsManager();
    
    // Create account config with required count property
    const accountConfig: AccountConfig = {
      ...config.accounts,
      count: 10 // Default number of accounts to generate
    };
    
    await accountsManager.initialize(
      accountConfig,
      l1Gateway.provider,
      l2Gateway.provider
    );
    
    // Create the bridge service
    const l1BridgeAddress = typeof config.contracts.l1Bridge === 'string' 
      ? config.contracts.l1Bridge 
      : config.contracts.l1Bridge[config.environment.type];
      
    const l2BridgeAddress = typeof config.contracts.l2Bridge === 'string'
      ? config.contracts.l2Bridge
      : config.contracts.l2Bridge[config.environment.type];
    
    const bridgeService = new BridgeService(
      l1Gateway,
      l2Gateway,
      l1BridgeAddress,
      l2BridgeAddress
    );
    
    // Create the state verifier
    const stateVerifier = new StateVerifier(l1Gateway, l2Gateway);
    
    // Assemble the context
    const context: TestContextInterface = {
      config,
      accounts: accountsManager,
      l1: l1Gateway,
      l2: l2Gateway,
      bridge: bridgeService,
      verifier: stateVerifier,
      environment
    };
    
    this.logger.debug('Test context assembled');
    return context;
  }
} 