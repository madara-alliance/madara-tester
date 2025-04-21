import pino from 'pino';
import pretty from 'pino-pretty';
import { TestConfig } from '../config/types';

// Global logger configuration
export const LoggerConfig = {
  // Set to true to enable DEBUG level for all components
  DEBUG: process.env.DEBUG_LOGGING === 'true',

  // Set to false to disable all logging
  ENABLED: process.env.DISABLE_LOGGING !== 'true',

  // Allow specific components to be included/excluded from debug logging
  // Format: comma-separated list of component names
  // e.g. "TestEngine,L1Gateway,AccountsManager"
  DEBUG_COMPONENTS: process.env.DEBUG_COMPONENTS?.split(',') || [],
};

function getLogLevelEmoji(level: string): string {
  switch (level) {
    case 'error':
      return '❌ '; // Red cross for errors
    case 'warn':
      return '⚠️ '; // Warning symbol for warnings
    case 'info':
      return '✅ '; // Green check for info/success
    case 'debug':
      return '🔍 '; // Magnifying glass for debug
    case 'trace':
      return '🔎 '; // Detailed tracing
    default:
      return '📝 '; // Note for unknown levels
  }
}

const prettyStream = pretty({
  colorize: true,
  ignore: 'pid,hostname',
  // Use a function for messageFormat to conditionally format messages
  messageFormat: (log, messageKey, levelLabel) => {
    const emoji = getLogLevelEmoji(log.level as string);
    const message = log[messageKey] as string;
    
    // If it's an error level message, wrap the entire message in red color codes
    if (log.level === 'error') {
      return `\u001b[31m${emoji}${message}\u001b[0m`;
    }
    
    return `${emoji}${message}`;
  },
  customColors: 'error:red,warn:yellow,info:green,debug:blue,trace:magenta',
  sync: true, // Force synchronous writing
});

/**
 * Creates a logger instance for a specific component
 */
export function createLogger(componentName: string, config?: TestConfig) {
  // If logging is disabled globally, set to silent
  if (!LoggerConfig.ENABLED) {
    return pino({ level: 'silent' });
  }

  // Check if this component should get debug logging from the environment config
  const isComponentInDebugList = LoggerConfig.DEBUG_COMPONENTS.includes(componentName);

  // Determine log level with priority:
  // 1. Component-specific config from TestConfig
  // 2. Global DEBUG flag or component in DEBUG_COMPONENTS list
  // 3. Global log level from TestConfig
  // 4. Default to 'info'
  const configLevel = config?.logging?.components?.[componentName];
  const globalConfigLevel = config?.logging?.level;

  let level: string;

  if (configLevel) {
    // Use component-specific config if available
    level = configLevel;
  } else if (LoggerConfig.DEBUG || isComponentInDebugList) {
    // Use debug if global debug is enabled or component is in debug list
    level = 'debug';
  } else {
    // Fall back to global config level or default info
    level = globalConfigLevel || 'info';
  }

  return pino(
    {
      name: componentName,
      level,
    },
    prettyStream
  );
}

/**
 * Root logger instance
 */
export const logger = createLogger('TestEngine');

/**
 * Creates a child logger with component-specific configuration
 */
export function getComponentLogger(componentName: string, config?: TestConfig) {
  return createLogger(componentName, config);
}

/**
 * Enable or disable debug mode for all loggers
 */
export function setGlobalDebugMode(enabled: boolean): void {
  LoggerConfig.DEBUG = enabled;
  console.log(`Global debug logging ${enabled ? 'enabled' : 'disabled'}`);
}

/**
 * Enable debug for specific components
 */
export function enableDebugForComponents(componentNames: string[]): void {
  LoggerConfig.DEBUG_COMPONENTS = componentNames;
  console.log(`Debug logging enabled for components: ${componentNames.join(', ')}`);
}
