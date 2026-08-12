import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);

export const { version } = require(fileURLToPath(new URL('../package.json', import.meta.url)));
