import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { ethers } from 'ethers';
import { AccountsManager } from '../../src/accounts/AccountsManager';
import { TestConfig } from '../../src/config/types';
import { SignerTypeMemory } from '../../src/accounts/signer/memory/types';
import { SignerFileImpl } from '../../src/accounts/signer/file/SignerFileImpl';
import fs from 'fs';
import path from 'path';
import { AccountType, AccountTypes } from '../../src/accounts/types';

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
      const account = manager.createRandom('TestOZAccount', AccountTypes.OZ);

      expect(account).toBeDefined();
      expect(account.name).toBe('TestOZAccount');
      expect(account.accountType).toBe(AccountTypes.OZ);
      
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
      const account = manager.createRandom('TestBraavosAccount', AccountTypes.BRAAVOS);

      expect(account).toBeDefined();
      expect(account.name).toBe('TestBraavosAccount');
      expect(account.accountType).toBe(AccountTypes.BRAAVOS);
      
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
      const account = manager.createRandom('TestArgentAccount', AccountTypes.ARGENT);

      expect(account).toBeDefined();
      expect(account.name).toBe('TestArgentAccount');
      expect(account.accountType).toBe(AccountTypes.ARGENT);
      
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

    test('should create account by config', () => {
      // Create three accounts using createAccount with config
      manager.createAccount({
        name: 'Account1',
        accountType: AccountTypes.OZ,
        random: true,
        mnemonic: '',  // Empty as we're using random=true
        signerType: SignerTypeMemory,
        signerConfig: {}
      });
      
      manager.createAccount({
        name: 'Account2',
        accountType: AccountTypes.BRAAVOS,
        random: true,
        mnemonic: '',  // Empty as we're using random=true
        signerType: SignerTypeMemory,
        signerConfig: {}
      });
      
      manager.createAccount({
        name: 'Account3',
        accountType: AccountTypes.ARGENT,
        random: true,
        mnemonic: '',  // Empty as we're using random=true
        signerType: SignerTypeMemory,
        signerConfig: {}
      });

      // Get list of accounts
      const accounts = manager.list();
      expect(accounts.length).toBe(3);

      // Retrieve accounts using get method
      const account1 = manager.get('Account1');
      const account2 = manager.get('Account2');
      const account3 = manager.get('Account3');

      // Verify account properties
      expect(account1.name).toBe('Account1');
      expect(account1.accountType).toBe(AccountTypes.OZ);
      
      expect(account2.name).toBe('Account2');
      expect(account2.accountType).toBe(AccountTypes.BRAAVOS);
      
      expect(account3.name).toBe('Account3');
      expect(account3.accountType).toBe(AccountTypes.ARGENT);
    });
  });
});
