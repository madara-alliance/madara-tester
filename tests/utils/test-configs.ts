import { TestConfig } from '../../src/types';

/**
 * Sample valid configuration object for testing
 */
export const validTestConfig: Partial<TestConfig> = {
  mode: 'local',
  environment: {
    type: 'local',
  },
  AccountsConfig: [],
  contracts: {},
  logging: {
    level: 'info',
  },
} as TestConfig; 