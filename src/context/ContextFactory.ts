import { TestConfig } from '../config/types';
import { TestContext } from '../types';
import { AccountsManager } from '../accounts/AccountsManager';
import { L1Gateway } from '../gateways/L1Gateway';
import { L2Gateway } from '../gateways/L2Gateway';
import { StateVerifier } from '../verifier/StateVerifier';
import { EnvironmentManager } from '../environment/EnvironmentManager';
import { getComponentLogger } from '../utils/logger';
import { L2InteractionWatcher } from '../watcher/L2InteractionWatcher';

/**
 * Factory for creating and assembling TestContext objects
 */
export class ContextFactory {
  private logger = getComponentLogger('TestContext');

  /**
   * Assembles a TestContext instance with all components
   */
  async create(config: TestConfig): Promise<TestContext> {
    this.logger.info('Assembling test context');

    // Create environment manager
    const environment = new EnvironmentManager(config);

    // Create the gateways
    const l1Gateway = new L1Gateway(config);
    const l2Gateway = new L2Gateway(config);

    // Create watchers
    const l2Watcher = new L2InteractionWatcher(l2Gateway);

    // Create the accounts manager
    const accountsManager = new AccountsManager(config);

    // Create the bridge service
    // TODO: init bridge component

    // Create the state verifier
    const stateVerifier = new StateVerifier(l1Gateway, l2Gateway);

    // Assemble the context
    const context: TestContext = {
      getAccountsManager: () => accountsManager,
      getL1Gateway: () => l1Gateway,
      getL2Gateway: () => l2Gateway,
      getBridgeService: () => null,
      getStateVerifier: () => stateVerifier,
      getEnvironmentManager: () => environment,
      getL2Watcher: () => l2Watcher,
    };

    this.logger.debug('Test context assembled');
    return context;
  }
}
