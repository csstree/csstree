import * as types from './types.js';

export default Object.fromEntries(Object.entries(types).map(([a, b]) => [b, a]));
