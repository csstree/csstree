var path = require('path');
var fs = require('fs');
var parse = require('esprima').parse;
var walk = require('estree-walker').walk;
var LIBPATH = path.resolve(__dirname, '../lib/');

function build(filename) {
    function unroll(filename) {
        if (visited.has(filename)) {
            return;
        } else {
            visited.add(filename);
        }

        var modulebasePath = path.dirname(filename);
        var source = fs.readFileSync(filename, 'utf-8');
        var ast = parse(source);

        walk(ast, {
            enter: function(node) {
                // require('smth')
                if (node.type === 'CallExpression' &&
                    node.callee.type === 'Identifier' &&
                    node.callee.name === 'require') {
                    var requirePath = node.arguments[0];
                    var requireFilename = require.resolve(
                        /^\./.test(requirePath.value)
                            ? path.resolve(modulebasePath, requirePath.value)
                            : requirePath.value
                    );

                    unroll(requireFilename, false);
                }
            }
        });
    };

    var visited = new Set();

    unroll(filename);

    return [...visited].map(function(filename) {
        return path.relative(LIBPATH, filename);
    });
}

var res = build(LIBPATH + '/syntax/default-parser.js');

console.log(res);
