import { describe, test, expect } from '@jest/globals';
import { registerJestHooks, getTestContext } from '../index';


// Register jest hooks
registerJestHooks();

// Basic setup verification test suite
describe('Basic Setup Verification', () => {
  // We still get the context automatically, but to avoid TypeScript issues,
  // we'll access it through the getTestContext() function which properly handles types
  
  test('should have valid test context', () => {
    const ctx = getTestContext();
    expect(ctx).toBeDefined();
    expect(ctx.getAccountsManager()).toBeDefined();
    expect(ctx.getL1Gateway()).toBeDefined();
    expect(ctx.getL2Gateway()).toBeDefined();
  });

  test('should have test accounts configured', () => {
    const ctx = getTestContext();
    const user = ctx.getAccountsManager().get(0);
    expect(user).toBeDefined();
    expect(user.l1Address).toBeDefined();
    expect(user.l2Address).toBeDefined();
  });
  
  test('should connect to L1 and L2', async () => {
    const ctx = getTestContext();
    // Check L1 connection
    const l1BlockNumber = await ctx.getL1Gateway().getLatestBlockNumber();
    console.log(`L1 block number: ${l1BlockNumber}`);
    expect(l1BlockNumber).toBeGreaterThanOrEqual(0);
    
    // Check L2 connection
    const l2BlockNumber = await ctx.getL2Gateway().getLatestBlockNumber();
    console.log(`L2 block number: ${l2BlockNumber}`);
    expect(l2BlockNumber).toBeGreaterThanOrEqual(0);
  });
}); 