# Madara Tester

**Madara Tester** is an integration testing framework designed specifically for testing decentralized applications (dApps) and infrastructure built on the Madara L2 scaling solution.

## Purpose

The primary goal of this engine is to simplify the complex process of setting up and running integration tests that involve interactions between Layer 1 (L1) and Layer 2 (L2). It provides a unified environment and a set of tools to:

*   **Configure Test Environments:** Easily set up local or forked test environments mimicking real network conditions.
*   **Manage Accounts:** Handle L1 and L2 account creation, funding, and transaction signing.
*   **Interact with Networks:** Provide convenient gateways for sending transactions and querying state on both L1 and L2.
*   **Bridge Assets:** Facilitate testing of asset bridging mechanisms (e.g., ETH, ERC20) between L1 and L2.
*   **Verify State:** Offer tools to verify transaction outcomes and blockchain state consistency across layers.
*   **Access Test Context:** Expose a consistent `TestContext` object within tests for easy access to all engine components.

By abstracting away the boilerplate setup and interaction logic, Madara Tester allows developers to focus on writing meaningful integration tests for their Madara-based applications.

## Core Components

The engine is structured into several key components located within the `src` directory:

*   **`accounts`:** Manages L1 and L2 accounts, including generation, loading, signing, and deployment logic. Supports different signer types (e.g., in-memory, file).
*   **`bridge`:** Currently a stub module (`BridgeService`) for L1↔L2 asset bridging; under development.
*   **`config`:** Handles loading and validation of test configurations from JSON files, providing defaults and allowing overrides.
*   **`context`:** Defines and manages the `TestContext`, which acts as a central access point to all engine features (gateways, accounts, etc.) within test suites.
*   **`environment`:** Responsible for setting up and managing the underlying testing environment (e.g., spinning up local nodes, handling L1 forks).
*   **`gateways`:** Provides abstracted interfaces (`L1Gateway`, `L2Gateway`) for interacting with the L1 and L2 networks (sending transactions, reading contract state, querying RPC endpoints).
*   **`types`:** Contains shared TypeScript type definitions and interfaces used throughout the engine for consistency and type safety.
*   **`utils`:** Includes common utility functions, most notably the logging system (`pino`-based) which allows configurable log levels per component.
*   **`verifier`:** Offers tools (`StateVerifier`) to assert and verify expected states or outcomes on L1 and L2 after performing actions (e.g., checking balances after a bridge transfer).
*   **`watcher`:** Implements `L2InteractionWatcher` for monitoring L2 transaction status and balance changes during tests.

## Test Configuration

The Madara test engine supports flexible configuration options:

### Custom Configuration

You can create a configuration file (in JSON format) for each test suite:

```json
// my-test.config.json
{
  "mode": "local",
  "l1": {
    "rpcUrl": "http://localhost:8545",
    "chainId": 1337,
    "contracts": {
      "coreContractAddress": "0x...",
      "ethBridgeAddress": "0x...",
      "erc20BridgeAddress": "0x..."
    }
  },
  "l2": {
    "rpcUrl": "http://localhost:5050",
    "chainId": 0,
    "contracts": {
      "coreContractAddress": "0x...",
      "braavosClassHash": "...",
      "argentClassHash": "...",
      "ozClassHash": "...",
      "ethTokenProxyAddress": "0x..."
    }
  },
  "AccountsConfig": [
    {
      "name": "MyTestAccount",
      "accountType": "FUNDING",
      "privateKey": "YOUR_PRIVATE_KEY",
      "signerType": "memory"
    }
  ],
  "logging": {
    "level": "info",
    "components": {
      "BridgeService": "debug"
    }
  }
}
```

_Note: The above example covers the core `TestConfig` properties. See `src/config/types.ts` for the full interface._

Initialize the test environment in your tests:

```typescript
import { initEnvironment } from '@madara/test-engine';

// In a setup file or beforeAll
beforeAll(async () => {
  await initEnvironment('./my-test.config.json');
});
```

### Default Configuration

If you omit the file path, `initEnvironment()` will:

1. Look for `engine.config-default.json` in your project root.
2. Fall back to built‑in defaults if that file is not found.

Defaults are optimized for local testing.

## Test Context

After initialization, access the test context:

```typescript
import { describe, test, expect } from '@jest/globals';
import { getTestContext } from '@madara/test-engine';

describe('My Test Suite', () => {
  test('using test context', () => {
    const ctx = getTestContext();

    // Example usage:
    const accountsManager = ctx.getAccountsManager();
    const l1Gateway        = ctx.getL1Gateway();
    const l2Gateway        = ctx.getL2Gateway();
    // ... interact with other components via ctx ...
  });
});
```

The `TestContext` object exposes getters for all core engine services.

## Logger Configuration

The testing framework includes a flexible logging system that can be controlled through:

### Environment Variables

Set these before running your tests:

```bash
# Enable DEBUG level for all components
DEBUG_LOGGING=true npm test

# Enable DEBUG level for specific components
DEBUG_COMPONENTS=EnvironmentManager,L1Gateway npm test

# Disable all logging
DISABLE_LOGGING=true npm test
```

### Programmatic Control

You can also control logging from within your tests:

```typescript
import { setGlobalDebugMode, enableDebugForComponents } from '@madara/test-engine';

// Enable debug mode for all components
setGlobalDebugMode(true);

// Enable debug mode only for specific components
enableDebugForComponents(['L1Gateway', 'BridgeService']);
```

This allows fine-grained control over which components produce detailed logs, making it easier to debug specific parts of the system while keeping noise to a minimum.

## Roadmap

The following items are planned for future development:

* **Bridge Service Implementation:** Complete the `BridgeService` implementation for asset bridging between L1 and L2. Currently a placeholder stub is available. Related TODOs:
  * Move `bridgeToL2` functionality from `L1Gateway` to the `BridgeService`
  * Initialize the `BridgeService` component in the `ContextFactory`

* **Environment Configuration:** Enhance the environment configuration with additional contract addresses needed for proper bridging and interaction. The `EnvironmentManager` will be extended to support more comprehensive contract and token configurations.

* **Standardized API Server Configuration:** Formalize the specification for the API server configuration format that is received when running in `testnet` mode.

* **Transaction Signing Verification:** Verify the transaction signing process in the `L1Gateway` to ensure it works correctly with different account types.