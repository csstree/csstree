var path = require('path');
var fs = require('fs');
var parse = require('esprima').parse;
var walk = require('estree-walker').walk;
var generate = require('escodegen').generate;
var escope = require('escope');
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

function renameScopeReferences(scope, renameMap) {
    scope.references.forEach(function(reference) {
        if (!reference.init && !reference.resolved) {
            if (reference.identifier.name in renameMap) {
                reference.identifier.name = renameMap[reference.identifier.name];
            }
        }
    });

    scope.childScopes.forEach(function(scope) {
        renameScopeReferences(scope, renameMap);
    });
}

function renameVariables(ast, moduleId) {
    var renameMap = Object.create(null);
    var rootScope = escope.analyze(ast).globalScope;

    rootScope.variables.forEach(function(variable) {
        variable.identifiers.forEach(function(ident) {
            var newName = moduleId + '_' + ident.name;
            renameMap[ident.name] = newName;
            ident.name = newName;
        });
    });

    renameScopeReferences(rootScope, renameMap);
}

function preprocessModule(program, filename, moduleId) {
    renameVariables(program, moduleId);
    program.body[0].leadingComments = [{
        type: 'Block',
        value: ' ' + path.relative(LIBPATH, filename) + ' '
    }];

    return program.body;
}

function replaceChild(parent, node, replaceFor) {
    for (var key in parent) {
        if (Array.isArray(parent[key])) {
            var idx = parent[key].indexOf(node);
            if (idx !== -1) {
                parent[key].splice(idx, 1, replaceFor);
                return;
            }
        } else if (parent[key] === node) {
            parent[key] = replaceFor;
            return;
        }
    }
}

function build(entryFilename) {
    function unroll(filename) {
        if (moduleExports.has(filename)) {
            return moduleExports.get(filename);
        }

        var moduleBasePath = path.dirname(filename);
        var source = fs.readFileSync(filename, 'utf-8');
        var ast = parse(source);
        var moduleId = '__module' + moduleExports.size;

        moduleExports.set(filename, moduleId + '_moduleExports');

        walk(ast, {
            enter: function(node, parent) {
                // require('smth') -> __moduleN__moduleExports /* require('smth') */
                if (node.type === 'CallExpression' &&
                    node.callee.type === 'Identifier' &&
                    node.callee.name === 'require') {
                    var requirePath = node.arguments[0];
                    var requireFilename = require.resolve(
                        /^\./.test(requirePath.value)
                            ? path.resolve(moduleBasePath, requirePath.value)
                            : requirePath.value
                    );
                    var requireModuleExports = unroll(requireFilename);

                    replaceChild(parent, node, {
                        type: 'Identifier',
                        name: requireModuleExports,
                        trailingComments: [{
                            type: 'Block',
                            value: ' ' + generate(node) + ' '
                        }]
                    });
                }
            },
            leave: function(node, parent) {
                // module.exports = <expression>
                // ->
                // var moduleExports = <expression>
                if (node.type === 'ExpressionStatement' &&
                    node.expression.type === 'AssignmentExpression' &&
                    node.expression.operator === '=' &&
                    parent !== null &&
                    parent.type === 'Program') {

                    var left = node.expression.left;
                    if (left.type === 'MemberExpression' &&
                        left.object.type === 'Identifier' &&
                        left.object.name === 'module' &&
                        left.property.type === 'Identifier' &&
                        left.property.name === 'exports') {

                        replaceChild(parent, node, {
                            type: 'VariableDeclaration',
                            kind: 'var',
                            declarations: [{
                                type: 'VariableDeclarator',
                                id: {
                                    type: 'Identifier',
                                    name: 'moduleExports'
                                },
                                init: node.expression.right
                            }]
                        });
                    }
                }
            }
        });

        modules.push(preprocessModule(ast, filename, moduleId));

        return moduleExports.get(filename);
    };

    var moduleExports = new Map();
    var modules = [];
    var entryModuleExports = unroll(entryFilename);

    return umd([
        generate({
            type: 'Program',
            body: modules.reduce(function(res, module) {
                return res.concat(module);
            }, [])
        }, { comment: true }),
        'return ' + entryModuleExports
    ].join('\n\n'));
}

var res = build(LIBPATH + '/syntax/default-parser.js');

console.log(res);
