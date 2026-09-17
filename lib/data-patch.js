import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const patch = require(fileURLToPath(new URL('../data/patch.json', import.meta.url)));

export default patch;
