const csstree = require('./lib');
const css = require('fs').readFileSync('./1.css', 'utf8');
const ast = csstree.parse(css, { positions: true });

csstree.generate(ast);
csstree.generate(ast, { sourceMap: true }).map.toString();
csstree.generate(ast, { sourceMap: 'new' }).map.toString();
// console.log(csstree.generate(ast, { sourceMap: 'new' }).map._mappings._array.length)

console.time('generate');
csstree.generate(ast);
console.timeEnd('generate');

console.time('generateSourceMap');
const old = csstree.generate(ast, { sourceMap: true }).map.toString();
console.timeEnd('generateSourceMap');

console.time('generateSourceMapNew');
const map = csstree.generate(ast, { sourceMap: 'new' }).map.toString();
console.timeEnd('generateSourceMapNew');

console.log(old === map ? 'OK' : 'ERROR');

// require('fs').writeFileSync('1-new.css.map', String(map));
