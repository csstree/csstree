var path = require('path');
var fs = require('fs');
var parse = require('esprima').parse;
var walk = require('estree-walker').walk;
var generate = require('escodegen').generate;
var LIBPATH = path.resolve(__dirname, '../lib/');

function umd(source) {
    return (
        ';(' + function(fn) {
            /* eslint-disable */
            if (typeof exports === 'object' && typeof module !== 'undefined') {
                module.exports = fn();
            } else if (typeof define === 'function' && define.amd) {
                define([], fn);
            } else {
                var host;
                if (typeof window !== 'undefined') {
                    host = window;
                } else if (typeof global !== 'undefined') {
                    host = global;
                } else if (typeof self !== 'undefined') {
                    host = self;
                } else {
                    host = this;
                }
                if (!host.csstree) {
                    host.csstree = {};
                }
                host.csstree.parse = fn();
            }
            /* eslint-enable */
        } +
        ')(function(){\n' + source + '\n});'
    );
}

function wrapModule(programm, filename) {
    return {
        type: 'FunctionExpression',
        id: null,
        params: [
            {
                type: 'Identifier',
                name: 'exports'
            },
            {
                type: 'Identifier',
                name: 'module'
            }
        ],
        body: {
            type: 'BlockStatement',
            body: programm.body
        },
        generator: false,
        expression: false,
        leadingComments: [{
            type: 'Block',
            value: ' ' + path.relative(LIBPATH, filename) + ' '
        }]
    };
}

function build(entryFilename) {
    function unroll(filename) {
        if (modulesMap.has(filename)) {
            return modulesMap.get(filename);
        }

        var moduleBasePath = path.dirname(filename);
        var source = fs.readFileSync(filename, 'utf-8');
        var ast = parse(source);

        modulesMap.set(filename, modules.push(wrapModule(ast, filename)) - 1);

        walk(ast, {
            enter: function(node) {
                // require('smth') -> require(moduleId /* 'smth' */)
                if (node.type === 'CallExpression' &&
                    node.callee.type === 'Identifier' &&
                    node.callee.name === 'require') {
                    var requirePath = node.arguments[0];
                    var requireFilename = require.resolve(
                        /^\./.test(requirePath.value)
                            ? path.resolve(moduleBasePath, requirePath.value)
                            : requirePath.value
                    );
                    var moduleId = unroll(requireFilename);

                    requirePath.value = moduleId;
                    requirePath.trailingComments = [{
                        type: 'Block',
                        value: ' ' + requirePath.raw + ' '
                    }];
                    requirePath.raw = String(moduleId);
                }
            }
        });

        return modulesMap.get(filename);
    };

    var modulesMap = new Map();
    var modules = [];
    var entryModuleId = unroll(entryFilename);

    return umd([
        function require(idx) {
            /* eslint-disable */
            if (!__exports.hasOwnProperty(idx)) {
                __exports[idx] = null;
                var module = { exports: {} };
                __modules[idx](module.exports, module);
                __exports[idx] = module.exports;
            }
            return __exports[idx];
            /* eslint-enable */
        },
        'var __modules = ' + generate({
            type: 'ArrayExpression',
            elements: modules
        }, { comment: true }),
        'var __exports = {};',
        'return require(' + entryModuleId + ');'
    ].join('\n\n'));
}

var res = build(LIBPATH + '/syntax/default-parser.js');

console.log(res);
