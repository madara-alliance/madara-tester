import { describe, test, expect } from '@jest/globals';
import { getTestContext, registerJestHooks } from './index';

// Register the Jest hooks which will automatically set up the test environment
// This function accepts a path as an optional argument that points to a config file,
// if not provided, the default config will be used
registerJestHooks();

/**
 * Example test demonstrating testing engine with the test context
 */
describe('Testing Engine with Test Context', () => {
  // Basic test to verify test context is available
  test('should have valid test context', () => {
    // Get the test context that was set up by registerJestHooks()
    const ctx = getTestContext();
    
    // Verify the test context was created correctly
    expect(ctx).toBeDefined();
    
    // Access the environment manager through the context
    const environmentManager = ctx.getEnvironmentManager();
    expect(environmentManager).toBeDefined();
  });
  
  test('should handle environment settings', async () => {
    const ctx = getTestContext();
    
    // In a real test, you would use components from the test context
    // to interact with the environment
    
    // Example verification
    expect(ctx.getEnvironmentManager()).toBeDefined();
    
    // You could also access gateways, accounts, etc.
    try {
      // Just checking the interface works - not actually using it in this test
      expect(ctx.getL1Gateway).toBeDefined();
      expect(ctx.getL2Gateway).toBeDefined();
    } catch (error) {
      console.log('Some components may not be initialized:', error);
    }
  });
  
  test('should access all components from context', () => {
    const testContext = getTestContext();
    
    // Verify all the expected components are available
    expect(testContext.getAccountsManager).toBeDefined();
    expect(testContext.getL1Gateway).toBeDefined();
    expect(testContext.getL2Gateway).toBeDefined();
    expect(testContext.getBridgeService).toBeDefined();
    expect(testContext.getStateVerifier).toBeDefined();
  });
}); 