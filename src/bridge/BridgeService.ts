import { L1Gateway } from '../gateways/L1Gateway';
import { L2Gateway } from '../gateways/L2Gateway';
import { getComponentLogger } from '../utils/logger';

/**
 * Service for handling L1<->L2 asset bridging
 */
export class BridgeService {
  private logger = getComponentLogger('BridgeService');
  private l1Gateway: L1Gateway;
  private l2Gateway: L2Gateway;
  private l1BridgeAddress: string;
  private l2BridgeAddress: string;

  constructor(
    l1Gateway: L1Gateway,
    l2Gateway: L2Gateway,
    l1BridgeAddress: string,
    l2BridgeAddress: string
  ) {
    this.l1Gateway = l1Gateway;
    this.l2Gateway = l2Gateway;
    this.l1BridgeAddress = l1BridgeAddress;
    this.l2BridgeAddress = l2BridgeAddress;

    this.logger.debug(
      `BridgeService initialized with L1 bridge: ${l1BridgeAddress}, L2 bridge: ${l2BridgeAddress}`
    );
  }

  // TODO: Implement bridge service
}
