var parse = require('./parse');
var walk = require('./walk');

function createDescriptor(type, syntax) {
    var descriptor = {
        type: type,
        broken: null,
        syntax: null,
        match: null
    };

    if (typeof syntax === 'function') {
        descriptor.type = 'basic-type';
        descriptor.match = syntax;
    } else {
        descriptor.syntax = parse(syntax);
        descriptor.match = function() {
            // TODO
        };
    }

    return descriptor;
}

function dumpMap(map) {
    var result = {};

    for (var name in map) {
        result[name] = {
            type: map[name].type,
            broken: map[name].broken,
            syntax: map[name].syntax
        };
    }

    return result;
}

var Syntax = function(syntax) {
    this.properties = {};
    this.types = {};

    if (syntax) {
        if (syntax.types) {
            for (var name in syntax.types) {
                this.addType(name, syntax.types[name]);
            }
        }

        if (syntax.properties) {
            for (var name in syntax.properties) {
                this.addProperty(name, syntax.properties[name]);
            }
        }
    }
};

Syntax.create = function(syntax) {
    return new Syntax(syntax);
};

Syntax.prototype = {
    addProperty: function(name, syntax) {
        this.properties[name] = createDescriptor('Property', syntax);
    },
    addType: function(name, syntax) {
        this.types[name] = createDescriptor('Type', syntax);
    },
    getAll: function() {
        var all = [];

        for (var name in this.types) {
            all.push(this.types[name]);
        }

        for (var name in this.properties) {
            all.push(this.properties[name]);
        }

        return all;
    },
    validate: function() {
        var all = this.getAll();

        // reset broken state
        all.forEach(function(descriptor) {
            descriptor.broken = null;
        });

        // compute new broken state
        all.forEach(function validate(descriptor) {
            if (descriptor.broken === null) {
                descriptor.broken = false;

                if (descriptor.syntax !== null) {
                    walk(descriptor.syntax, function(node) {
                        if (node.type !== 'Type' && node.type !== 'Property') {
                            return;
                        }

                        var map = node.type === 'Property' ? this.properties : this.types;

                        if (!map.hasOwnProperty(node.name) || validate.call(this, map[node.name]).broken) {
                            descriptor.broken = true;
                        }
                    }, this);
                }
            }

            return descriptor;
        }, this);

        return all.some(function(descriptor) {
            return descriptor.broken;
        });
    },
    dump: function(dontValidate) {
        if (!dontValidate) {
            this.validate();
        }

        return {
            properties: dumpMap(this.properties),
            types: dumpMap(this.types)
        };
    },
    toString: function() {
        return JSON.stringify(this.dump());
    }
};

module.exports = Syntax;
