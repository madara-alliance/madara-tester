# Madara Tester

Testing framework for Madara L2 applications.

## Test Configuration

The Madara test engine supports flexible configuration options:

### Custom Configuration

You can create a configuration file for each test suite:

```typescript
// my-test.config.ts
export default {
  mode: 'local',
  // Test-specific configuration
  accounts: {
    mnemonic: 'test test test test test test test test test test test junk',
    name: 'MyTestSuite', // Optional name for identification
    signerType: 'file'
  },
  logging: {
    components: {
      BridgeService: 'debug', // Enable debug for specific components
    }
  }
};
```

Then use it in your tests:

```typescript
import { registerJestHooks } from '@madara/test-engine';

// Use custom configuration
registerJestHooks('./my-test.config.ts');
```

### Default Configuration

If no configuration file is specified, the engine will:

1. Look for a file named `engine.config-default.ts` in your project root
2. Fall back to the built-in default configuration if not found

The default configuration provides sensible defaults for local testing.

## Test Context

When writing tests, you can easily access the test context through a simple, consistent API:

```typescript
import { describe, test, expect } from '@jest/globals';
import { registerJestHooks, getTestContext } from '@madara/test-engine';

// Register Jest hooks once at the top of your test file
registerJestHooks();

describe('My Test Suite', () => {
  test('using test context', () => {
    // Access the test context - automatically set up by registerJestHooks
    const ctx = getTestContext();
    
    // Use ctx.accounts, ctx.l1, ctx.l2, etc.
    const accounts = ctx.accounts.get(0);
    // ...
  });
});
```

The `getTestContext()` function provides a clean, type-safe way to access the test context that's automatically set up when you call `registerJestHooks()`. You don't need to worry about initialization or cleanup.

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