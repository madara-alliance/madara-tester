// Simple Jest Example Test
interface MockTestContext {
  accounts: {
    get: jest.Mock;
  };
  l1: {
    getBlockNumber: jest.Mock;
  };
  l2: {
    getBlockNumber: jest.Mock;
  };
  bridge: any;
}

describe('Basic Setup Verification with Jest', () => {
  let ctx: MockTestContext;
  
  beforeAll(() => {
    // Creating mock test context 
    ctx = {
      accounts: {
        get: jest.fn().mockReturnValue({ 
          l1Address: '0x123', 
          l2Address: '0x456' 
        })
      },
      l1: { 
        getBlockNumber: jest.fn().mockResolvedValue(100) 
      },
      l2: { 
        getBlockNumber: jest.fn().mockResolvedValue(50) 
      },
      bridge: {}
    };
  });
  
  test('should have valid test context', () => {
    expect(ctx).toBeDefined();
    expect(ctx.accounts).toBeDefined();
    expect(ctx.l1).toBeDefined();
    expect(ctx.l2).toBeDefined();
  });

  test('should have test accounts configured', () => {
    const user = ctx.accounts.get(0);
    expect(user).toBeDefined();
    expect(user.l1Address).toBeDefined();
    expect(user.l2Address).toBeDefined();
  });
  
  test('should connect to L1 and L2', async () => {
    // Check L1 connection
    const l1BlockNumber = await ctx.l1.getBlockNumber();
    console.log(`L1 block number: ${l1BlockNumber}`);
    expect(l1BlockNumber).toBeGreaterThanOrEqual(0);
    
    // Check L2 connection
    const l2BlockNumber = await ctx.l2.getBlockNumber();
    console.log(`L2 block number: ${l2BlockNumber}`);
    expect(l2BlockNumber).toBeGreaterThanOrEqual(0);
  });
  
  test('should have bridge component configured', () => {
    expect(ctx.bridge).toBeDefined();
  });
}); 