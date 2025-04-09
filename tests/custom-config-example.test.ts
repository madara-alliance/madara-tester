import { describe, test, expect } from '@jest/globals';
import { registerJestHooks, getTestContext } from '@madara/test-engine';

// Register Jest hooks with a custom configuration
// registerJestHooks('./my-custom-config.ts');

// For this example, we'll use the default configuration
registerJestHooks();

describe('Configuration Example', () => {
  test('should load configuration correctly', () => {
    const ctx = getTestContext();
    
    // Test configuration is loaded
    expect(ctx.config).toBeDefined();
    expect(ctx.config.mode).toBe('local'); // Default is 'local'
    
    // Log the configuration
    console.log('Test running with configuration:');
    console.log(`Mode: ${ctx.config.mode}`);
    console.log(`L1 Chain ID: ${ctx.config.l1?.chainId}`);
    console.log(`Logging level: ${ctx.config.logging.level}`);
    
    // Verify specific configuration values
    expect(ctx.config.accounts).toBeDefined();
    expect(ctx.config.accounts.mnemonic).toBeDefined();
    expect(ctx.config.logging.level).toBeDefined();
  });
  
  test('should have contract addresses', () => {
    const ctx = getTestContext();
    
    // Contract addresses should be defined
    expect(ctx.config.contracts).toBeDefined();
    
    // Log some contract addresses
    console.log('Contract addresses:');
    Object.entries(ctx.config.contracts).forEach(([name, address]) => {
      console.log(`${name}: ${typeof address === 'string' ? address : JSON.stringify(address)}`);
    });
    
    // Check for expected contracts
    expect(ctx.config.contracts.l1Bridge).toBeDefined();
    expect(ctx.config.contracts.l2Bridge).toBeDefined();
  });
}); 