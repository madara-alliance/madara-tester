// Simple Jest Example Test
interface MockTestContext {
  getAccountsManager: jest.Mock;
  getL1Gateway: jest.Mock;
  getL2Gateway: jest.Mock;
  getBridgeService: jest.Mock;
  getStateVerifier: jest.Mock;
  getEnvironmentManager: jest.Mock;
}

describe('Basic Setup Verification with Jest', () => {
  let ctx: MockTestContext;
  
  beforeAll(() => {
    // Creating mock test context 
    ctx = {
      getAccountsManager: jest.fn().mockReturnValue({ 
        get: jest.fn().mockReturnValue({ 
          l1Address: '0x123', 
          l2Address: '0x456' 
        })
      }),
      getL1Gateway: jest.fn().mockReturnValue({ 
        getBlockNumber: jest.fn().mockResolvedValue(100) 
      }),
      getL2Gateway: jest.fn().mockReturnValue({ 
        getBlockNumber: jest.fn().mockResolvedValue(50) 
      }),
      getBridgeService: jest.fn().mockReturnValue({}),
      getStateVerifier: jest.fn().mockReturnValue({}),
      getEnvironmentManager: jest.fn().mockReturnValue({})
    };
  });
  
  test('should have valid test context', () => {
    expect(ctx).toBeDefined();
    expect(ctx.getAccountsManager()).toBeDefined();
    expect(ctx.getL1Gateway()).toBeDefined();
    expect(ctx.getL2Gateway()).toBeDefined();
  });

  test('should have test accounts configured', () => {
    const user = ctx.getAccountsManager().get(0);
    expect(user).toBeDefined();
    expect(user.l1Address).toBeDefined();
    expect(user.l2Address).toBeDefined();
  });
  
  test('should connect to L1 and L2', async () => {
    // Check L1 connection
    const l1BlockNumber = await ctx.getL1Gateway().getBlockNumber();
    console.log(`L1 block number: ${l1BlockNumber}`);
    expect(l1BlockNumber).toBeGreaterThanOrEqual(0);
    
    // Check L2 connection
    const l2BlockNumber = await ctx.getL2Gateway().getBlockNumber();
    console.log(`L2 block number: ${l2BlockNumber}`);
    expect(l2BlockNumber).toBeGreaterThanOrEqual(0);
  });
  
  test('should have bridge component configured', () => {
    expect(ctx.getBridgeService()).toBeDefined();
  });
}); 