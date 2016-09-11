var MatchError = require('./error').MatchError;
var names = require('../utils/names');
var generic = require('./generic');
var parse = require('./parse');
var walk = require('./walk');
var match = require('./match');
var cssWideKeywords = parse('inherit | initial | unset');
var cssWideKeywordsWithExpression = parse('inherit | initial | unset | <expression>');

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
    this.valueCommonSyntax = cssWideKeywords;

    if (syntax) {
        if (syntax.generic) {
            for (var name in generic) {
                this.addType(name, generic[name]);
            }
        }

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
    createDescriptor: function(name, type, syntax) {
        var descriptor = {
            type: type,
            name: name,
            broken: null,
            syntax: null,
            match: null
        };

        if (typeof syntax === 'function') {
            descriptor.type = 'basic-type';
            descriptor.match = syntax;
        } else {
            descriptor.syntax = parse(syntax);
            descriptor.match = match.bind(null, this, descriptor.syntax);
        }

        return descriptor;
    },
    addProperty: function(name, syntax) {
        this.properties[name] = this.createDescriptor(name, 'Property', syntax);
    },
    addType: function(name, syntax) {
        this.types[name] = this.createDescriptor(name, 'Type', syntax);

        if (syntax === generic.expression) {
            this.valueCommonSyntax = cssWideKeywordsWithExpression;
        }
    },

    match: function(propertyName, value) {
        var property = names.property(propertyName);
        var propertySyntax = property.vendor
            ? this.getProperty(property.vendor + property.name) || this.getProperty(property.name)
            : this.getProperty(property.name);
        var result;

        // console.log(JSON.stringify(propertySyntax.syntax, null, 4));
        // console.log(JSON.stringify(value, null, 4));
        // console.log('-----');
        // debugger;

        if (!propertySyntax) {
            throw new Error('Unknown property: ' + propertyName);
        }

        result = propertySyntax.match(value.sequence.head);

        if (!result || !result.match) {
            result = match(this, this.valueCommonSyntax, value.sequence.head);
            if (!result || !result.match) {
                throw new MatchError('Mismatch', propertySyntax.syntax, value, result.next);
            }
        }

        if (result.next) {
            throw new MatchError('Uncomplete match', propertySyntax.syntax, value, result.next);
        }

        return result.match;
    },

    getProperty: function(name) {
        return this.properties.hasOwnProperty(name) ? this.properties[name] : null;
    },
    getType: function(name) {
        return this.types.hasOwnProperty(name) ? this.types[name] : null;
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

        var broken = all
            .filter(function(descriptor) {
                return descriptor.broken;
            })
            .map(function(descriptor) {
                return descriptor.name;
            });

        return broken.length ? broken : null;
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
