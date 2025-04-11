import { SignerFileConfig, SignerTypeFile } from './file/types';
import { SignerFileImpl } from './file/SignerFileImpl';
import { SignerMemoryImpl } from './memory/SignerMemoryImpl';
import { SignerMemoryConfig, SignerTypeMemory } from './memory/types';
import { Signer } from './Signer';
import { getComponentLogger } from '../../utils/logger';

const logger = getComponentLogger('SignerFactory');

/**
 * Creates a signer based on the provided configuration
 * @param config Signer configuration object
 * @returns A signer implementation
 */
export function createSigner(type: string, config: SignerFileConfig | SignerMemoryConfig): Signer {
  logger.debug(`Creating signer of type: ${type}`);
  switch (type) {
    case SignerTypeFile: {
      return new SignerFileImpl(config as SignerFileConfig);
    }

    case SignerTypeMemory: {
      return new SignerMemoryImpl(config as SignerMemoryConfig);
    }

    default:
      throw new Error(`Unsupported signer type: ${type}`);
  }
}
