import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { registerJestHooks, getTestContext, TestContext, setGlobalDebugMode, enableDebugForComponents } from '@madara/test-engine';

describe('Logger Configuration Example', () => {
  
  test('demonstrates enabling global debug mode', () => {
    // Enable debug mode for all components
    setGlobalDebugMode(true);
    
    // Run your test with debug logging enabled
    console.log('This test will have detailed debug logging for all components');
    
    // At the end, disable debug mode
    setGlobalDebugMode(false);
  });
  
  test('demonstrates enabling debug for specific components', () => {
    // Enable debug mode only for specific components
    enableDebugForComponents(['L1Gateway', 'BridgeService']);
    
    console.log('This test will have debug logging only for L1Gateway and BridgeService');
    
    // You could reset at the end if needed
    enableDebugForComponents([]);
  });
  
  test('demonstrates using environment variables for debug config', () => {
    // These would normally be set before the test process starts:
    // process.env.DEBUG_LOGGING = 'true';
    // process.env.DEBUG_COMPONENTS = 'AccountsManager,StateVerifier';
    
    console.log('Environment variables can control logging levels without code changes');
    console.log('Set DEBUG_LOGGING=true to enable debug for all components');
    console.log('Set DEBUG_COMPONENTS=Component1,Component2 for specific components');
  });
}); 