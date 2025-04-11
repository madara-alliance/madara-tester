export const SignerTypeFile = 'file';

/**
 * Configuration for file-based signer
 */
export type SignerFileConfig = {
  /**
   * Path to the file containing the private key
   */
  privateKeyPath: string;
};
