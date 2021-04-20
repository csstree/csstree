import * as x from './lib/index.js';
// import * as x2 from './lib/tokenizer/index.js';
// import x3 from './package.json';

// console.log(csstree.generate(csstree.parse('.a { color: red }')));
console.log(x.parse(':matches(.a{)', { context: 'selector' }));
