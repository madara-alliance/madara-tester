export const SignerTypeMemory = 'memory';

/**
 * Configuration for memory-based signer
 */
export type SignerMemoryConfig = {
  /**
   * The private key as a hex string
   */
  privateKey: string;
};
