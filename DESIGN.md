# Test Engine Design Document

**Version:** 1.0
**Date:** <Today's Date>

## 1. Introduction

This document outlines the design for the `test-engine`, a comprehensive Typescript testing framework specifically tailored for testing applications built on or interacting with the Madara L2 stack. Its primary goal is to provide developers with a frictionless, robust, and powerful environment for writing various tests, ranging from simple unit tests of L2 contracts to complex end-to-end scenarios involving L1/L2 interactions, environment orchestration, and transaction replay.

## 2. Goals and Objectives

*   **Ensure Application Chain Reliability:** Provide tools to rigorously test Madara-based appchains, L1/L2 bridges, and deployed contracts under various conditions.
*   **Optimize Developer Experience:** Offer intuitive APIs, strong type safety (Typescript), and abstractions to minimize boilerplate code and setup overhead, allowing developers to focus on test logic.
*   **Enable Advanced Scenario Testing:** Support complex test cases including L1<->L2 messaging, bridging, state verification/reconciliation, network behavior simulations (future), and mainnet transaction replication.
*   **Facilitate Collaboration:** Design for ease of use and clear test structure to encourage adoption by core developers and the community.
*   **Provide Debugging Assistance:** Integrated logging and clear error reporting to aid in debugging failed tests.
*   **Support Multiple Environments:** Allow tests to be configured and run against local development setups, public testnets, and potentially mainnet forks with minimal code changes.

## 3. Non-Goals

*   Become a generic UI testing framework (though it might integrate with tools like Playwright for specific wallet interactions).
*   Act as a production deployment or orchestration tool.
*   Initially provide deep, protocol-level attack simulations (focus first on functional correctness and common scenarios).
*   Replace the need for unit testing within individual smart contracts (focuses on integration and E2E).

## 4. Architecture Overview

The `test-engine` integrates with a standard Javascript/Typescript test runner (e.g., Vitest, Jest, Bun) and orchestrates various underlying services and components.

```
+---------------------+      +---------------------+      +-------------------------+
|    Test Runner      |----->|    Test Engine      |<---->|      Test Suite         |
| (Vitest/Jest/Bun)   |      | (Provides `ctx`)    |      | (User's test files)     |
| - Discovery         |      +----------+----------+      +-------------------------+
| - Execution         |                 | Uses
| - Assertions        |                 v
| - Reporting         |      +-------------------------+
+---------------------+      |      `test.context`     |
                             |-------------------------|
                             | - EnvironmentManager    |
                             | - AccountsManager       | ----> Signer Interface
                             | - L1Gateway             |        - SignerFileImpl
                             | - L2Gateway             |        - SignerMetamaskImpl*
                             | - BridgeService         |        - SignerLedgerImpl*
                             | - StateVerifier         |
                             | - ReplayHelper (TBD)    |
                             +-------------------------+
                                 |          |      |
            Interact via RPC/CLI |          |      | Interact via RPC
           +---------------------+          |      +-----------------------+
           |                                v                              v
+----------v----------+      +-------------------------+      +-----------v-----------+
|     `madara-cli`    |----->| Docker Compose Services |      | Remote RPC Services   |
| - Env Up/Down       |<---- |-------------------------|      | (Testnet/Mainnet RPC) |
| - Bootstrapping (?) |      | - API Server (Router)   |      +-----------------------+
+---------------------+      | - Orchestrator          |
                             | - Anvil (L1)            |
                             | - Madara Node (L2)      |
                             +-------------------------+
```
*(Diagram Notes: `*` denotes optional/future implementation. Arrows indicate primary control flow or data interaction.)*

**Flow:**
1.  The **Test Runner** discovers and executes tests defined in the **Test Suite**.
2.  The **Test Engine** provides lifecycle hooks (`beforeAll`, `beforeEach`, etc.) that set up the environment.
3.  During setup, the `EnvironmentManager` uses `madara-cli` to start/configure the required **Docker Compose Services** (local Anvil L1, Madara L2 Node, Orchestrator, and an internal API Server acting as a router/gateway).
4.  The **Test Engine** creates a `test.context` object (`ctx`) which is injected into each test function.
5.  The `ctx` object provides access to all core components (`AccountsManager`, `L1/L2Gateway`, `BridgeService`, `StateVerifier`).
6.  Test logic within the **Test Suite** uses `ctx` methods to interact with the blockchain environments (local or remote). `EnvironmentManager` provides the necessary service URLs (e.g., L1/L2 RPC URLs) potentially obtained by querying the internal API Server after startup.
7.  Gateways (`L1Gateway`, `L2Gateway`) interact with the respective blockchain nodes (Anvil, Madara Node, or Remote RPCs) via RPC using the obtained URLs.
8.  Account actions (signing transactions) are delegated to a selected `Signer` implementation via the `AccountsManager`.
9.  The `StateVerifier` uses the Gateways to fetch data for assertions.
10. Transaction Replay functionality (using a `ReplayHelper`) is planned for the future (TBD).

## 5. Technology Stack

*   **Language:** Typescript (strict mode enabled)
*   **Test Runner:** Vitest (Recommended due to speed, TS support, Jest compatibility) or Bun Test.
*   **Blockchain Interaction (EVM L1):** `ethers.js` v6 (or `viem`) - Provides robust abstractions for interacting with Ethereum-like chains (Anvil).
*   **Blockchain Interaction (Starknet L2):** `starknet.js` - For interacting with the Madara node (Starknet).
*   **Environment Orchestration:**
    *   `madara-cli`: To manage the lifecycle of the local Madara development environment stack.
    *   `Dockerode` (or similar Node.js Docker library): For more granular control over Docker containers if needed beyond `madara-cli`.
    *   Node.js `child_process`: To execute CLI commands.
*   **Wallet Integration (Optional):** `Playwright` - For automating browser interactions needed for Metamask/Ledger testing.
*   **Utilities:** `dotenv` (for environment variables), potentially a logging library like `pino`.

## 6. Project Structure (Proposed)

A well-organized directory structure is crucial for maintainability and clarity. The proposed structure separates the core test engine logic from user-defined test suites and configuration.

## 7. Core Components (Detailed Design)

### 7.1. `test.context` (`ctx`)

*   **Purpose:** Acts as the central access point for all framework functionalities within a test. It aggregates instances of the core service components.
*   **Structure (Conceptual):**
    ```typescript
    interface TestContext {
        config: ResolvedTestConfig; // Resolved configuration for the current test run
        accounts: AccountsManager;
        l1: L1Gateway;
        l2: L2Gateway;
        bridge: BridgeService;
        verifier: StateVerifier;
        environment: EnvironmentManager; // Access to env controls if needed within tests
        // Utility functions like parseUnits, formatUnits etc. could be added here
    }
    ```
*   **Instantiation:** Created by the test engine's setup hooks and passed to test functions.

### 7.2. `EnvironmentManager`

*   **Purpose:** Manages the lifecycle and configuration of the testing environment, primarily by orchestrating `madara-cli` for local setups and handling connections for remote networks.
*   **Key Responsibilities:**
    *   Parse test configuration (`test-engine.config.ts`) to determine required environment mode (local, testnet, mainnet-fork).
    *   Use `madara-cli` to start/stop the local L1/L2 stack (Docker Compose services).
    *   Handle network forking setup if specified (primarily for L1 Anvil).
    *   Query the internal API Server (run by `madara-cli`) or parse `madara-cli` output to obtain runtime service endpoints (RPC URLs) required by other components (Gateways).
    *   Provide resolved service endpoints (RPC URLs) to other components.
*   **API Design (Conceptual Interface):**
    ```typescript
    /** Defines the necessary L1 and L2 RPC URLs after environment startup */
    interface ResolvedRpcUrls {
        l1RpcUrl: string;
        l2RpcUrl: string;
        // Potentially the main API Server URL if direct interaction is needed later
        // apiServerUrl?: string;
    }

    interface EnvironmentManager {
        /**
         * Sets up the environment based on the mode. Starts local services via madara-cli.
         * @param mode - 'local', 'testnet', 'mainnet-fork'
         * @param config - Test configuration object
         * @returns The resolved L1 and L2 RPC URLs required by the Gateways.
         */
        up(mode: string, config: TestConfig): Promise<ResolvedRpcUrls>;

        /**
         * Tears down the environment, stopping local services via madara-cli.
         */
        down(): Promise<void>;

        /**
         * Gets the configuration details for running services.
         * @returns The currently active L1 and L2 RPC URLs.
         */
        getActiveRpcUrls(): ResolvedRpcUrls;
    }
    ```
*   **Implementation Notes:** Will heavily rely on executing `madara-cli` commands via `child_process`. Needs robust error handling for external process failures and parsing output or querying the internal API server to get service details (L1/L2 RPC URLs).

### 7.3. `Signer Interface` and Implementations

*   **Purpose:** Abstract the mechanism for signing transactions and messages, allowing different key management strategies.
*   **Interface Design:**
    ```typescript
    interface Signer {
        /** Returns the address associated with this signer. */
        getAddress(): Promise<string>;
        /** Signs a standard EVM-style transaction. */
        signTransaction(transaction: ethers.TransactionRequest): Promise<string>;
        /** Signs a message according to EIP-191. */
        signMessage(message: ethers.BytesLike | string): Promise<string>;
        // Potentially add signTypedData (EIP-712)
        // Potentially add Starknet-specific signing method if needed
    }
    ```
*   **Implementations:**
    *   **`SignerFileImpl`:** Reads private keys (from config, env vars, or a dedicated file - NOT recommended for production keys). Primarily for automated local/CI testing. *This will be the default for most automated tests.*
    *   **`SignerMetamaskImpl` (Optional/Future):** Uses Playwright to interact with a browser instance running Metamask. Requires browser automation setup. For E2E tests involving the actual Metamask flow.
    *   **`SignerLedgerImpl` (Optional/Future):** Interacts with Ledger hardware wallets, potentially via Playwright and Metamask's Ledger integration or specific Ledger libraries. Complex, for specific hardware wallet testing.

### 7.4. `Account` Object

*   **Purpose:** Represents a single logical testing identity, holding signers and addresses for both L1 and L2 derived from the same private key.
*   **Structure:**
    ```typescript
    interface TestAccount {
        name?: string; // Optional friendly name
        privateKey: string; // Underlying private key
        l1Address: string;
        l2Address: string; // May be different from l1Address in some L2s, but often the same derived EOA
        l1Signer: Signer; // An instance conforming to the Signer interface for L1
        l2Signer: Signer; // An instance conforming to the Signer interface for L2 (might be specific Starknet signer)
    }
    ```
*   **Instantiation:** Created by the `AccountsManager`.

### 7.5. `AccountsManager`

*   **Purpose:** Manages a pool of `TestAccount` objects for use in tests. Handles derivation, instantiation, and potentially funding on local networks.
*   **Key Responsibilities:**
    *   Initialize from mnemonic or list of private keys provided in config.
    *   Derive L1/L2 addresses and create corresponding `Signer` instances (defaulting to `SignerFileImpl`).
    *   Provide access to pre-configured accounts by index or name.
    *   Allow dynamic creation of temporary accounts during tests.
    *   Provide utility to fund accounts on local devnets (e.g., transferring from a faucet account).
    *   Select the appropriate `Signer` implementation based on configuration or test needs (advanced).
*   **API Design (Conceptual Interface):**
    ```typescript
    interface AccountsManager {
        /**
         * Initializes the account pool from configuration.
         * Called during test setup.
         * @param config - Account configuration (mnemonic, count, etc.)
         * @param l1Provider - L1 provider instance
         * @param l2Provider - L2 provider instance
         */
        initialize(config: AccountConfig, l1Provider: ethers.Provider, l2Provider: RpcProvider): Promise<void>;

        /**
         * Gets a pre-configured account by its index.
         * @param index - Zero-based index.
         * @returns The TestAccount object. Throws if index is out of bounds.
         */
        get(index: number): TestAccount;

        /**
         * Gets the primary deployment account (often index 0).
         * @returns The deployer TestAccount.
         */
        deployer(): TestAccount;

        /**
         * Returns all pre-configured accounts.
         * @returns Array of TestAccount objects.
         */
        list(): TestAccount[];

        /**
         * Creates a new, temporary account (not pre-funded).
         * @returns A new TestAccount object.
         */
        createRandom(): Promise<TestAccount>;

        /**
         * (Local Devnet Only) Sends native currency from the deployer/faucet account to the target address on L2.
         * @param targetAddress - The L2 address to fund.
         * @param amount - Amount (e.g., in Wei for ETH-like L2, adjust for Starknet) using BigNumberish.
         * @returns Transaction hash or confirmation.
         */
        fundL2(targetAddress: string, amount: ethers.BigNumberish): Promise<string>; // Adjust 'ethers.BigNumberish' for Starknet

         /**
         * (Local Devnet Only) Sends native currency from the deployer/faucet account to the target address on L1.
         * @param targetAddress - The L1 address to fund.
         * @param amount - Amount in Wei using BigNumberish.
         * @returns Transaction hash or confirmation.
         */
        fundL1(targetAddress: string, amount: ethers.BigNumberish): Promise<string>;
    }
    ```

### 7.6. `L1Gateway`

*   **Purpose:** Provides a simplified and typed interface for interacting with the L1 EVM network (Anvil, Testnet, Mainnet).
*   **Key Responsibilities:**
    *   Wrap `ethers.js` provider and signer interactions.
    *   Send transactions, call contract methods, get balances, fetch receipts/logs.
    *   Deploy L1 contracts.
    *   Interact with the L1 side of the Bridge contract and the L1 Core/Settlement contract.
    *   Retrieve L2 state roots settled on L1.
*   **API Design (Conceptual Interface - Selected Methods):**
    ```typescript
    interface L1Gateway {
        provider: ethers.Provider;

        /** Gets a typed ethers.js Contract instance for L1. */
        getContract<T extends ethers.BaseContract>(address: string, abi: ethers.InterfaceAbi): Promise<T>;

        /** Sends an L1 transaction. */
        sendTransaction(txRequest: ethers.TransactionRequest, signer: Signer): Promise<ethers.TransactionResponse>;

        /** Calls a view/pure function on an L1 contract. */
        callContract(txRequest: ethers.TransactionRequest): Promise<string>;

        /** Gets the native balance of an L1 address. */
        getBalance(address: string): Promise<bigint>;

        /** Waits for an L1 transaction to be mined. */
        waitForTransaction(txHash: string, confirmations?: number): Promise<ethers.TransactionReceipt | null>;

        /** Deploys a contract on L1. */
        deployContract<T extends ethers.BaseContract>(
            abi: ethers.InterfaceAbi,
            bytecode: ethers.BytesLike,
            args: any[],
            signer: Signer
        ): Promise<T>;

        /** Queries the L1 Core Contract for the settled L2 state root. */
        getL2StateRootOnL1(l2BlockNumber: number): Promise<string | null>;

        /** Sends a message to L2 via the L1 bridge/messaging contract. */
        sendMessageToL2(targetContract: string, selector: string, args: any[], fee: ethers.BigNumberish, signer: Signer): Promise<ethers.TransactionResponse>;

        // ... other L1 specific methods
    }
    ```

### 7.7. `L2Gateway`

*   **Purpose:** Provides a simplified and typed interface for interacting with the L2 Starknet network (Madara Node).
*   **Key Responsibilities:**
    *   Wrap `starknet.js` provider, account, and contract interactions.
    *   Send transactions (invokes), call contract methods, get balances, fetch receipts.
    *   Deploy L2 contracts (declare & deploy).
    *   Interact with the L2 side of the Bridge contract.
    *   Query L2 state root for a given block.
    *   Initiate L2 -> L1 messages.
*   **API Design (Conceptual Interface - Selected Methods):**
    ```typescript
    import { RpcProvider, Account as StarknetAccount, Contract as StarknetContract, Abi } from 'starknet';

    interface L2Gateway {
        provider: RpcProvider;

        /** Gets a typed starknet.js Contract instance for L2. */
        getContract<T extends StarknetContract>(address: string, abi: Abi): Promise<T>;

        /** Sends an invoke transaction to L2 using a TestAccount's L2 signer (Starknet Account). */
        invokeFunction(
            contractAddress: string,
            entryPoint: string,
            calldata: any[] | object, // Starknet.js allows object calldata with ABI
            account: TestAccount // Use the TestAccount which holds the StarknetAccount signer
        ): Promise<InvokeTransactionResponse>; // Starknet specific response type

        /** Calls a view function on an L2 contract. */
        callContract(
            contractAddress: string,
            entryPoint: string,
            calldata: any[]
        ): Promise<CallContractResponse>; // Starknet specific response type

        /** Gets the native balance (ETH on Starknet) of an L2 address. */
        getBalance(address: string): Promise<bigint>; // Assuming ETH balance method exists

        /** Waits for an L2 transaction to be included. */
        waitForTransaction(txHash: string): Promise<GetTransactionReceiptResponse>; // Starknet specific response type

        /** Declares a contract class on L2. */
        declareContract(
            contractPayload: DeclareContractPayload, // Starknet specific payload
            account: TestAccount
        ): Promise<DeclareContractResponse>;

        /** Deploys a contract instance from a declared class hash. */
        deployContract(
            deployPayload: DeployContractPayload, // Starknet specific payload
            account: TestAccount
        ): Promise<DeployContractResponse>;

        /** Queries the L2 node for its state root at a specific block. */
        getStateRoot(blockIdentifier: BlockIdentifier): Promise<string>; // BlockIdentifier = number | 'latest' etc.

        /** Initiates an L2 -> L1 message via the L2 messaging contract. */
        sendMessageToL1(payload: L2ToL1MessagePayload, account: TestAccount): Promise<InvokeTransactionResponse>; // Define payload structure

        // ... other L2 specific methods (e.g., getting storage)
    }
    ```
*   **Implementation Notes:** Requires careful mapping of `TestAccount` (which holds keys) to `starknet.js` `Account` objects needed for sending transactions.

### 7.8. `BridgeService`

*   **Purpose:** Abstract the multi-step process of bridging assets (initially ETH) between L1 and L2.
*   **Key Responsibilities:**
    *   Interact with L1 and L2 bridge contracts via the respective Gateways.
    *   Handle the sequence of actions for deposit (L1 tx -> wait for L2 finalization).
    *   Handle the sequence of actions for withdrawal (L2 tx -> wait for settlement/proof -> L1 claim tx).
*   **API Design (Conceptual Interface):**
    ```typescript
    interface BridgeService {
        /**
         * Initiates an ETH deposit from L1 to an L2 address.
         * @param amount - Amount in Wei.
         * @param l1SignerAccount - The TestAccount initiating on L1.
         * @param l2RecipientAddress - Optional L2 recipient, defaults to sender's L2 address.
         * @returns L1 transaction response. Caller needs to wait for L2 finalization separately or use a verifier helper.
         */
        depositETH(
            amount: ethers.BigNumberish,
            l1SignerAccount: TestAccount,
            l2RecipientAddress?: string
        ): Promise<ethers.TransactionResponse>;

        /**
         * Initiates an ETH withdrawal from L2 to an L1 address.
         * This only sends the L2 transaction. Claiming on L1 is separate.
         * @param amount - Amount (adjust unit for Starknet ETH).
         * @param l2SignerAccount - The TestAccount initiating on L2.
         * @param l1RecipientAddress - Optional L1 recipient, defaults to sender's L1 address.
         * @returns L2 invoke transaction response.
         */
        initiateWithdrawETH(
            amount: ethers.BigNumberish, // Adjust unit if needed
            l2SignerAccount: TestAccount,
            l1RecipientAddress?: string
        ): Promise<InvokeTransactionResponse>; // Starknet specific response

        /**
         * Executes the claim step on L1 for a completed withdrawal.
         * Requires proof/attestation data from the L2->L1 message.
         * @param withdrawalProofData - Data needed to prove the withdrawal on L1.
         * @param l1SignerAccount - Account executing the claim on L1.
         * @returns L1 transaction response for the claim.
         */
        claimWithdrawETH(
            withdrawalProofData: any, // Define structure based on actual bridge mechanism
            l1SignerAccount: TestAccount
        ): Promise<ethers.TransactionResponse>;

        // Future: depositERC20, withdrawERC20
    }
    ```

### 7.9. `StateVerifier`

*   **Purpose:** Provides helper functions and integrates with the test runner's assertion library (`expect`) to verify blockchain state and transaction outcomes.
*   **Key Responsibilities:**
    *   Provide utilities to check balances, storage slots, contract states.
    *   Offer helpers to wait for specific conditions (e.g., message consumption, withdrawal readiness).
    *   Verify state roots between L1 and L2.
    *   Potentially integrate custom matchers with `expect` (e.g., `toEmitEvent`, `toBeRevertedWith`).
*   **API Design (Conceptual Interface / Utility Functions):**
    ```typescript
    interface StateVerifier {
        // Direct utility functions
        /** Waits for an L1->L2 message to be consumed on L2. */
        waitForL1MessageConsumed(l1TxHash: string, timeout?: number): Promise<boolean>;
        /** Waits for an L2->L1 withdrawal to be ready for claiming on L1. */
        waitForWithdrawalReady(l2TxHash: string, timeout?: number): Promise<any>; // Returns proof data?
        /** Checks if L2 state root matches L1 settled root for a block. */
        verifyL1StateRoot(l2BlockNumber: number): Promise<boolean>;
        /** Gets the status of a specific cross-chain message. */
        getMessageStatus(messageIdentifier: any): Promise<'PENDING' | 'DELIVERED' | 'FAILED'>;

        // Could also be implemented as custom matchers for `expect`
        // e.g. await expect(ctx.verifier.waitForL1MessageConsumed(txHash)).resolves.toBe(true);
        // e.g. await expect(l1Receipt).toEmitEvent(myContract, 'MyEvent').withArgs(...);
    }
    ```
*   **Implementation Notes:** Will rely heavily on polling L1/L2 Gateway methods. Needs configurable timeouts and retry logic. Custom matchers require integration with the specific test runner (Vitest/Jest).

## 8. Key Workflows

*   **Test Initialization (`beforeAll`/`beforeEach`):**
    1.  Read `test-engine.config.ts`.
    2.  `EnvironmentManager.up()` starts services based on mode and obtains service URLs.
    3.  `AccountsManager.initialize()` creates account pool.
    4.  L1/L2 Gateways are instantiated with service RPC URLs.
    5.  BridgeService, StateVerifier instantiated with Gateways/Accounts.
    6.  `TestContext` (`ctx`) is assembled and made available.
*   **Simple L2 Transfer Test:**
    1.  Test function receives `ctx`.
    2.  `sender = ctx.accounts.get(0)`, `recipient = ctx.accounts.get(1)`.
    3.  `initialBalance = await ctx.l2.getBalance(recipient.l2Address)`.
    4.  `txResponse = await ctx.l2.invokeFunction(TOKEN_ADDRESS, 'transfer', [recipient.l2Address, AMOUNT], sender)`. (Uses `AccountsManager` to get Starknet `Account` from `TestAccount` for signing).
    5.  `receipt = await ctx.l2.waitForTransaction(txResponse.transaction_hash)`.
    6.  `expect(receipt.status).toBe('ACCEPTED_ON_L2')`. // Or similar Starknet status
    7.  `finalBalance = await ctx.l2.getBalance(recipient.l2Address)`.
    8.  `expect(finalBalance).toEqual(initialBalance + AMOUNT)`.
*   **L1 -> L2 ETH Deposit Test:**
    1.  Test function receives `ctx`.
    2.  `user = ctx.accounts.get(0)`.
    3.  `initialL2Balance = await ctx.l2.getBalance(user.l2Address)`.
    4.  `l1Tx = await ctx.bridge.depositETH(AMOUNT, user)`.
    5.  `await ctx.l1.waitForTransaction(l1Tx.hash)`.
    6.  `await ctx.verifier.waitForL1MessageConsumed(l1Tx.hash)`. // Waits for L2 side
    7.  `finalL2Balance = await ctx.l2.getBalance(user.l2Address)`.
    8.  `expect(finalL2Balance).toEqual(initialL2Balance + AMOUNT)`.
*   **Test Teardown (`afterAll`/`afterEach`):**
    1.  `EnvironmentManager.down()` stops local services.

## 9. Configuration (`test-engine.config.ts`)

A configuration file (e.g., using Typescript for type safety) will define framework behavior.

```typescript
// Example test-engine.config.ts
import { defineConfig } from '@madara/test-engine'; // Hypothetical package name

export default defineConfig({
  // Environment mode: 'local', 'testnet', 'mainnet-fork'
  mode: process.env.TEST_MODE || 'local',

  l1: {
    // Used only if mode requires L1 connection (testnet, mainnet-fork, or local w/ Anvil)
    rpcUrl: process.env.L1_RPC_URL, // Typically obtained dynamically by EnvironmentManager
    chainId: process.env.L1_CHAIN_ID ? parseInt(process.env.L1_CHAIN_ID) : 31337, // Default for local Anvil
  },

  l2: {
    // Used for all modes connecting to Madara
    rpcUrl: process.env.L2_RPC_URL, // Typically obtained dynamically by EnvironmentManager
    // Chain ID can often be fetched from provider
  },

  environment: {
    // Configuration for local environment setup via madara-cli/Docker
    // e.g., path to docker-compose, specific madara-cli flags
    madaraCliPath: 'madara-cli', // Or specific path
    // Forking config if mode is 'mainnet-fork'
    fork: {
      l1RpcUrl: process.env.MAINNET_L1_RPC_URL,
      l1BlockNumber: process.env.MAINNET_L1_FORK_BLOCK ? parseInt(process.env.MAINNET_L1_FORK_BLOCK) : 'latest',
    }
  },

  accounts: {
    mnemonic: process.env.TEST_MNEMONIC || 'test test test test test test test test test test test junk',
    count: 10, // Number of accounts to derive
    // Config for default funding on local network startup
    localFunding: {
      l1Eth: '1000', // Fund each L1 account with 1000 ETH
      l2Eth: '1000', // Fund each L2 account with 1000 ETH (adjust unit name if needed)
    },
    // Default signer type: 'file', 'metamask', 'ledger'
    signerType: 'file',
  },

  contracts: {
    // Pre-deployed contract addresses for different environments
    // Addresses can be strings or objects mapping mode -> address
    l1Bridge: process.env.L1_BRIDGE_ADDRESS || '0x...',
    l2Bridge: process.env.L2_BRIDGE_ADDRESS || '0x...',
    myToken: {
      local: '0x...',
      testnet: '0x...'
    }
    // Add other commonly used contract addresses
  },

  logging: {
    level: 'info', // 'debug', 'info', 'warn', 'error'
    // Component-specific levels (optional)
    components: {
        EnvironmentManager: 'debug',
        L2Gateway: 'info',
    }
  },
});
```

## 10. Extensibility

*   **Custom Verifiers:** Users can write their own async functions using `ctx` for complex state checks.
*   **Contract Helpers:** Users can create wrapper classes or functions around `ctx.l1.getContract` / `ctx.l2.getContract` to provide higher-level interactions specific to their application's contracts.
*   **Custom Setup:** The core framework setup can potentially expose hooks for users to add custom deployment or configuration steps during environment initialization.

## 11. Implementation Notes & Considerations

*   **Asynchronicity:** Nearly all interactions are asynchronous. Use `async/await` extensively and manage Promises correctly.
*   **Error Handling:** Implement robust error handling, especially around RPC calls, external process execution (`madara-cli`, `docker`), and transaction finalization. Provide informative error messages.
*   **Type Safety:** Leverage Typescript strict mode and define clear interfaces for all components and data structures. Use `ethers.js` and `starknet.js` provided types.
*   **Logging:** Implement configurable logging throughout the framework to aid debugging. Log key actions, RPC calls (optional), errors, and configuration loading.
*   **Testing the Framework:** The `test-engine` itself needs its own test suite to ensure its components function correctly.
*   **Dependencies:** Keep external dependencies updated. Be mindful of potential breaking changes in `ethers.js`, `starknet.js`, `madara-cli`.
*   **Starknet Nuances:** Pay close attention to Starknet-specific details like account abstraction (using `Account` to send txs), fee mechanisms, transaction statuses, and Cairo data types/ABIs. The Starknet interaction logic in `L2Gateway` and `BridgeService` will require careful implementation based on `starknet.js`.

This document provides a detailed blueprint. The implementing engineer/LLM should refer to the specific documentation of `ethers.js`, `starknet.js`, `madara-cli`, and the chosen test runner for precise API usage and types. 