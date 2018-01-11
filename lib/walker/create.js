'use strict';

var hasOwnProperty = Object.prototype.hasOwnProperty;
var noop = function() {};

function ensureFunction(value) {
    return typeof value === 'function' ? value : noop;
}

function invokeForType(fn, type) {
    return function(node, item, list) {
        if (node.type === type) {
            fn.call(this, node, item, list);
        }
    };
}

function getWalkersFromStructure(name, nodeType) {
    var structure = nodeType.structure;
    var walkers = [];

    for (var key in structure) {
        if (hasOwnProperty.call(structure, key) === false) {
            continue;
        }

        var fieldTypes = structure[key];
        var walker = {
            name: key,
            type: false,
            nullable: false
        };

        if (!Array.isArray(structure[key])) {
            fieldTypes = [structure[key]];
        }

        for (var i = 0; i < fieldTypes.length; i++) {
            var fieldType = fieldTypes[i];
            if (fieldType === null) {
                walker.nullable = true;
            } else if (typeof fieldType === 'string') {
                walker.type = 'node';
            } else if (Array.isArray(fieldType)) {
                walker.type = 'list';
            }
        }

        if (walker.type) {
            walkers.push(walker);
        }
    }

    if (walkers.length) {
        return {
            context: nodeType.walkContext,
            fields: walkers
        };
    }

    return null;
}

function getTypesFromConfig(config) {
    var types = {};

    for (var name in config.node) {
        if (hasOwnProperty.call(config.node, name)) {
            var nodeType = config.node[name];

            if (nodeType.structure) {
                var walkers = getWalkersFromStructure(name, nodeType);
                if (walkers !== null) {
                    types[name] = walkers;
                }
            } else {
                throw new Error('Missed `structure` field in `' + name + '` node type definition');
            }
        }
    }

    return types;
}

function createTypeHandler(config, reverse) {
    var fields = reverse ? config.fields.slice().reverse() : config.fields;
    var body = fields.map(function(field) {
        var ref = 'node.' + field.name;
        var line;

        if (field.type === 'list') {
            if (reverse) {
                line = [
                    'if (Array.isArray(' + ref + ')) {',
                        'for (var i = ' + ref + '.length - 1; i >= 0; i++) {',
                            'walk(' + ref + '[i], i, ' + ref + ')',
                        '}',
                    '} else {',
                        ref + '.forEachRight(walk);',
                    '}'
                ].join('');
            } else {
                line = ref + '.forEach(walk);';
            }
        } else {
            line = 'walk(' + ref + ');';
        }

        if (field.nullable) {
            line = 'if (' + ref + ') {\n    ' + line + '}';
        }

        return line;
    }).join('\n');

    if (config.context) {
        body = [
            'var old = context.' + config.context + ';' +
            'context.' + config.context + ' = node;' +
            body +
            'context.' + config.context + ' = old;'
        ].join('\n');
    }

    return new Function('node', 'context', 'walk', body);
}

function createVisitHandlers(handlers) {
    return {
        Atrule: {
            StyleSheet: handlers.StyleSheet,
            Atrule: handlers.Atrule,
            Rule: handlers.Rule,
            Block: handlers.Block
        },
        Rule: {
            StyleSheet: handlers.StyleSheet,
            Atrule: handlers.Atrule,
            Rule: handlers.Rule,
            Block: handlers.Block
        },
        Declaration: {
            StyleSheet: handlers.StyleSheet,
            Atrule: handlers.Atrule,
            Rule: handlers.Rule,
            Block: handlers.Block
        }
    };
}

module.exports = function createWalker(config) {
    var types = getTypesFromConfig(config);
    var handlers = {};
    var handlersReverse = {};

    for (var name in types) {
        if (hasOwnProperty.call(types, name)) {
            handlers[name] = createTypeHandler(types[name], false);
            handlersReverse[name] = createTypeHandler(types[name], true);
        }
    }

    var visitHandlers = createVisitHandlers(handlers);
    var visitHandlersReverse = createVisitHandlers(handlersReverse);

    return function walk(root, options) {
        function walkNode(node, item, list) {
            enter.call(context, node, item, list);

            if (contextHandlers.hasOwnProperty(node.type)) {
                contextHandlers[node.type](node, context, walkNode);
            }

            leave.call(context, node, item, list);
        }

        var enter = noop;
        var leave = noop;
        var contextHandlers = handlers;
        var context = {
            root: root,
            stylesheet: null,
            atrule: null,
            atrulePrelude: null,
            rule: null,
            selector: null,
            block: null,
            declaration: null,
            function: null
        };

        if (typeof options === 'function') {
            enter = options;
        } else if (options) {
            enter = ensureFunction(options.enter);
            leave = ensureFunction(options.leave);

            if (options.visit) {
                if (visitHandlers.hasOwnProperty(options.visit)) {
                    contextHandlers = options.reverse
                        ? visitHandlersReverse[options.visit]
                        : visitHandlers[options.visit];
                    enter = invokeForType(enter, options.visit);
                    leave = invokeForType(leave, options.visit);
                } else {
                    throw new Error('Bad value `' + options.visit + '` for `visit` option (should be: ' + Object.keys(visitHandlers).join(', ') + ')');
                }
            } else if (options.reverse) {
                contextHandlers = handlersReverse;
            }
        }

        if (enter === noop && leave === noop) {
            throw new Error('Neither `enter` nor `leave` walker handler is set or both aren\'t a function');
        }

        // swap handlers in reverse mode to provide reverse visit order
        if (options.reverse) {
            var tmp = enter;
            enter = leave;
            leave = tmp;
        }

        walkNode(root);
    };
};
