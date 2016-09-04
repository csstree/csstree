var parse = require('../lib/syntax/parse.js');
var walk = require('../lib/syntax/walk.js');
var types = require('../lib/syntax/types');
var data = require('../data');

var map = {
    Property: {},
    Type: types
};
var required = {
    Type: {},
    Property: {}
};

function reg(type, name, ast) {
    if (map[type].hasOwnProperty(name)) {
        console.warn('Duplicate for ' + name);
    }

    map[type][name] = {
        type: 'regular',
        broken: false,
        syntax: ast
    };

    walk(ast, function(node) {
        var type = node.type;
        var ref;
        switch (node.type) {
            case 'Type':
            case 'Property':
                ref = node.name;
                break;
            case 'Function':
                type = 'Type';
                ref = node.name + '()';
                break;
            default:
                return;
        }

        if (!required[type].hasOwnProperty(ref)) {
            required[type][ref] = [];
        }

        required[type][ref].push(name);
    });
}

for (var key in types) {
    map.Type[key] = {
        type: 'basic-type',
        broken: false,
        syntax: null
    };
}

for (var key in data.properties) {
    var syntax = data.properties[key].syntax
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&amp;/g, '&');

    reg('Property', key, parse(syntax));
}

for (var key in data.syntaxes) {
    var syntax = data.syntaxes[key]
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&amp;/g, '&');

    reg('Type', key, parse(syntax));
}

var warns = [];
for (var type in required) {
    for (var name in required[type]) {
        if (!map[type].hasOwnProperty(name)) {
            warns.push('Required missed ' + type + ' ' + name + ' (' + required[type][name].join(', ') + ')');
        }
    }
}

// find broken syntax
for (var type in map) {
    for (var name in map[type]) {
        if (map[type][name].syntax) {
            var broken = false;
            var visited = {};

            walk(map[type][name].syntax, function w(node) {
                if (broken) {
                    return;
                }

                var type = node.type;
                var ref;
                switch (node.type) {
                    case 'Type':
                    case 'Property':
                        ref = node.name;
                        break;
                    case 'Function':
                        type = 'Type';
                        ref = node.name + '()';
                        break;
                    default:
                        return;
                }

                if (map[type][ref]) {
                    if (visited[type + ':' + ref]) {
                        return;
                    }

                    visited[type + ':' + ref] = true;
                    if (map[type][ref].syntax) {
                        walk(map[type][ref].syntax, w);
                    } else {
                        if (map[type][ref].type !== 'basic-type') {
                            broken = true;
                        }
                    }
                } else {
                    broken = true;
                }
            });

            if (broken) {
                map[type][name].broken = true;
            }
        }
    }
}

console.log(warns.sort().join('\n'));

console.log('Write data to ./docs/syntax.json');
require('fs').writeFileSync(__dirname + '/../docs/syntax.json', JSON.stringify(map, null, 4));
