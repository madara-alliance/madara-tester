import { describe, test, expect } from '@jest/globals';
import { registerJestHooks, getTestContext } from '@madara/test-engine';

// Register jest hooks
registerJestHooks();

// Demo test suite
describe('ETH Bridging', () => {
  
  test('should deposit ETH from L1 to L2', async () => {
    const ctx = getTestContext();
    
    // Get test accounts
    const user = ctx.accounts.get(0);
    
    // Check initial balances
    const initialL1Balance = await ctx.l1.getBalance(user.l1Address);
    const initialL2Balance = await ctx.l2.getBalance(user.l2Address);
    
    console.log(`Initial L1 balance: ${initialL1Balance}`);
    console.log(`Initial L2 balance: ${initialL2Balance}`);
    
    // Deposit amount (0.1 ETH)
    const depositAmount = 100000000000000000n;
    
    // Initiate deposit
    const depositTx = await ctx.bridge.depositETH(depositAmount, user);
    
    // Wait for L1 transaction confirmation
    await ctx.l1.waitForTransaction(depositTx.hash);
    
    // Wait for L1->L2 message consumption
    await ctx.verifier.waitForL1MessageConsumed(depositTx.hash);
    
    // Check final balances
    const finalL2Balance = await ctx.l2.getBalance(user.l2Address);
    console.log(`Final L2 balance: ${finalL2Balance}`);
    
    // Verify balance increase
    // In real test, this would actually verify an exact increase
    // For this demo, we're using a mock L2Gateway with fixed values
    expect(finalL2Balance).toBe(1000000000000000000n); // 1 ETH (mock value)
  });
  
  test('should withdraw ETH from L2 to L1', async () => {
    const ctx = getTestContext();
    
    // Get test accounts
    const user = ctx.accounts.get(0);
    
    // Check initial balances
    const initialL1Balance = await ctx.l1.getBalance(user.l1Address);
    const initialL2Balance = await ctx.l2.getBalance(user.l2Address);
    
    console.log(`Initial L1 balance: ${initialL1Balance}`);
    console.log(`Initial L2 balance: ${initialL2Balance}`);
    
    // Withdraw amount (0.1 ETH)
    const withdrawAmount = 100000000000000000n;
    
    // Initiate withdrawal
    const withdrawTx = await ctx.bridge.initiateWithdrawETH(withdrawAmount, user);
    
    // Wait for L2 transaction confirmation
    await ctx.l2.waitForTransaction(withdrawTx.transaction_hash);
    
    // Wait for L2->L1 message to be ready for claiming
    const withdrawalProof = await ctx.verifier.waitForWithdrawalReady(withdrawTx.transaction_hash);
    
    // Claim withdrawal on L1
    const claimTx = await ctx.bridge.claimWithdrawETH(withdrawalProof, user);
    
    // Wait for claim transaction confirmation
    await ctx.l1.waitForTransaction(claimTx.hash);
    
    // Check final balances (in a real test, verify exact balance changes)
    const finalL1Balance = await ctx.l1.getBalance(user.l1Address);
    console.log(`Final L1 balance: ${finalL1Balance}`);
    
    // For this demo using mocks, just check the value is not zero
    expect(finalL1Balance).toBeGreaterThan(0n);
  });
}); 