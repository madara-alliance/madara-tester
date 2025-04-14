import { AccountsManager } from '../accounts/AccountsManager';
import { L1Gateway } from '../gateways/L1Gateway';
import { L2Gateway } from '../gateways/L2Gateway';
import { BridgeService } from '../bridge/BridgeService';
import { StateVerifier } from '../verifier/StateVerifier';
import { EnvironmentManager } from '../environment/EnvironmentManager';

export interface TestContext {
  getAccountsManager(): AccountsManager;
  getL1Gateway(): L1Gateway;
  getL2Gateway(): L2Gateway;
  getBridgeService(): BridgeService | null;
  getStateVerifier(): StateVerifier;
  getEnvironmentManager(): EnvironmentManager;
}
