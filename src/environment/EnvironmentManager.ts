import { spawn } from 'child_process';
import { getComponentLogger } from '../utils/logger';
import { TestConfig, ServerConfig } from '../types';

/**
 * EnvironmentManager class responsible for managing the testing environment
 */
export class EnvironmentManager {
  private logger = getComponentLogger('EnvironmentManager');
  private config: TestConfig;
  private serverConfig: ServerConfig | null = null;

  constructor(config: TestConfig) {
    this.config = config;
    this.logger.debug('EnvironmentManager initialized');
  }

  async initFromServer(apiServerUrl: string) {
    this.serverConfig = await this.getConfigFromAPIServer(apiServerUrl);
    this.applyServerConfigToTestConfig(this.serverConfig);
    console.log('EnvironmentManager initialized from server in url: ', apiServerUrl);
  }

  /**
   * Gets configuration from the API server
   * This will be populated with more fields later
   * @param url The URL of the API server to query
   */
  async getConfigFromAPIServer(url: string): Promise<ServerConfig> {
    this.logger.info(`Fetching configuration from API server at ${url}`);

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const serverConfig = (await response.json()) as ServerConfig;

      this.serverConfig = serverConfig;
      this.logger.debug(`Received server config: ${JSON.stringify(serverConfig)}`);
      return serverConfig;
    } catch (error) {
      this.logger.error(`Failed to get config from API server: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Applies server configuration to fill in missing values in TestConfig
   */
  applyServerConfigToTestConfig(serverConfig: ServerConfig): TestConfig {
    this.logger.debug('Applying server configuration to test config');

    // Create a copy of the current config
    const updatedConfig = { ...this.config };

    // Always override with server config values if they exist
    if (serverConfig.l1RpcUrl) {
      updatedConfig.l1.rpcUrl = serverConfig.l1RpcUrl;
    }
    if (serverConfig.l1ChainId) {
      updatedConfig.l1.chainId = serverConfig.l1ChainId;
    }

    // Always override with server config value if it exists
    if (serverConfig.l2RpcUrl) {
      updatedConfig.l2.rpcUrl = serverConfig.l2RpcUrl;
    }
    if (serverConfig.l2ChainId) {
      // Using type assertion as a workaround
      (updatedConfig.l2 as any).chainId = serverConfig.l2ChainId;
    }

    // Update contract addresses if provided
    // TODO: add needed contract, token and bridge addresses

    this.config = updatedConfig;
    return updatedConfig;
  }
}
