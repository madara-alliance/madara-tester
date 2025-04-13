import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { ethers } from 'ethers';
import { AccountsManager } from '../../src/accounts/AccountsManager';
import { TestConfig } from '../../src/config/types';
import { SignerTypeMemory } from '../../src/accounts/signer/memory/types';
import { SignerFileImpl } from '../../src/accounts/signer/file/SignerFileImpl';
import fs from 'fs';
import path from 'path';
import { AccountType } from '../../src/accounts/types';

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
          ethBridgeAddress: '0x0000000000000000000000000000000000000002',
          erc20BridgeAddress: '0x0000000000000000000000000000000000000003',
        },
      },
      l2: {
        rpcUrl: 'http://localhost:5050',
        contracts: {
          coreContractAddress: '0x0000000000000000000000000000000000000001',
          braavosClassHash: '0x1234',
          argentClassHash: '0x5678',
          ozClassHash: '0x9abc',
        },
      },
      AccountsConfig: [],
      logging: { level: 'info' },
    };

    manager = new AccountsManager(config);
  });

  describe('createRandom', () => {
    test('should create a random account with OpenZeppelin type', () => {
      const account = manager.createRandom('TestOZAccount', 'oz');

      expect(account).toBeDefined();
      expect(account.name).toBe('TestOZAccount');
      expect(account.accountType).toBe('oz');
      
      // Check that addresses and keys were generated
      expect(account.l1Address).toBeDefined();
      expect(account.l1PublicKey).toBeDefined();
      expect(account.l1PrivateKey).toBeDefined();
      expect(account.l2Address).toBeDefined();
      expect(account.l2PublicKey).toBeDefined();
      expect(account.l2PrivateKey).toBeDefined();
      
      // Verify the account is not deployed by default
      expect(account.deployed).toBe(false);
    });

    test('should create a random account with Braavos type', () => {
      const account = manager.createRandom('TestBraavosAccount', 'braavos');

      expect(account).toBeDefined();
      expect(account.name).toBe('TestBraavosAccount');
      expect(account.accountType).toBe('braavos');
      
      // Check that addresses and keys were generated
      expect(account.l1Address).toBeDefined();
      expect(account.l1PublicKey).toBeDefined();
      expect(account.l1PrivateKey).toBeDefined();
      expect(account.l2Address).toBeDefined();
      expect(account.l2PublicKey).toBeDefined();
      expect(account.l2PrivateKey).toBeDefined();
      
      // Verify the account is not deployed by default
      expect(account.deployed).toBe(false);
    });

    test('should create a random account with Argent type', () => {
      const account = manager.createRandom('TestArgentAccount', 'argent');

      expect(account).toBeDefined();
      expect(account.name).toBe('TestArgentAccount');
      expect(account.accountType).toBe('argent');
      
      // Check that addresses and keys were generated
      expect(account.l1Address).toBeDefined();
      expect(account.l1PublicKey).toBeDefined();
      expect(account.l1PrivateKey).toBeDefined();
      expect(account.l2Address).toBeDefined();
      expect(account.l2PublicKey).toBeDefined();
      expect(account.l2PrivateKey).toBeDefined();
      
      // Verify the account is not deployed by default
      expect(account.deployed).toBe(false);
    });
  });
});
