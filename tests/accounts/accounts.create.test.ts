import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { ethers } from 'ethers';
import { AccountsManager } from '../../src/accounts/AccountsManager';
import { TestConfig } from '../../src/config/types';
import { SignerTypeMemory } from '../../src/accounts/signer/memory/types';
import { SignerFileImpl } from '../../src/accounts/signer/file/SignerFileImpl';
import fs from 'fs';
import path from 'path';

// Mock the logger to avoid console output during tests
jest.mock('../../src/utils/logger', () => ({
  getComponentLogger: jest.fn(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

describe('AccountsManager', () => {
  let manager: AccountsManager;

  beforeEach(() => {
    const config: TestConfig = {
      mode: 'local',
      l1: {
        rpcUrl: 'http://localhost:8545',
        contracts: {
          coreContractAddress: '0x0000000000000000000000000000000000000001',
        },
      },
      l2: {
        rpcUrl: 'http://localhost:5050',
        contracts: {
          coreContractAddress: '0x0000000000000000000000000000000000000001',
          braavosClassHash: '0x1234',
          argentClassHash: '0x5678',
        },
      },
      AccountsConfig: [],
      logging: { level: 'info' },
    };

    manager = new AccountsManager(config);
  });

  test('creates an account from mnemonic', async () => {
    const mnemonic = 'test test test test test test test test test test test junk';

    const account = manager.createFromMnemonic(
      mnemonic,
      'Test Account',
      'argent',
      SignerTypeMemory,
      {}
    );

    expect(account.name).toBe('Test Account');
    expect(account.accountType).toBe('argent');
    expect(account.deployed).toBe(false);
    expect(account.l1Address).toBe(account.signer.getPublicKey());
    expect(account.l2Address).toBe(account.l1Address);
  });

  test('creates a random account', async () => {
    const account = manager.createRandom('Random Account', 'braavos');

    expect(account.name).toBe('Random Account');
    expect(account.accountType).toBe('braavos');
    expect(account.deployed).toBe(false);
    console.log(account);
  });
});
