import fs from 'fs';
import path from 'path';
import { TestConfig } from '../types';

/**
 * Get package root directory (more robust than relative paths)
 */
const packageRootDir = path.resolve(__dirname, '../../');

/**
 * Default configuration file path
 */
const DEFAULT_CONFIG_PATH = path.join(packageRootDir, 'engine.config-default.ts');

/**
 * Loads the test configuration from the specified path
 * Defaults to the built-in engine.config-default.ts
 */
export async function loadConfig(configPath: string = DEFAULT_CONFIG_PATH): Promise<TestConfig> {
  try {
    // Resolve to absolute path if relative
    const absolutePath = path.isAbsolute(configPath) 
      ? configPath 
      : path.resolve(process.cwd(), configPath);
    
    // Dynamic import for the configuration file
    const configModule = await import(absolutePath);
    const config = configModule.default as TestConfig;
    
    if (!config) {
      throw new Error(`Configuration file at ${absolutePath} must export a default configuration object`);
    }
    
    console.log('Loaded config from file:', configPath);
    return config;
  } catch (error) {
    // If the specified file fails to load, fall back to the built-in default
    if (configPath !== DEFAULT_CONFIG_PATH) {
      console.warn(`Error loading config from ${configPath}: ${(error as Error).message}`);
      console.warn('Falling back to built-in default configuration');
      return loadConfig(DEFAULT_CONFIG_PATH);
    }
    
    // If we're already trying to load the default and it fails, rethrow
    throw new Error(`Error loading default config: ${(error as Error).message}`);
  }
} 