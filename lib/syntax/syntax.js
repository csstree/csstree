var MatchError = require('./error').MatchError;
var names = require('../utils/names');
var generic = require('./generic');
var parse = require('./parse');
var walk = require('./walk');
var match = require('./match');
var cssWideKeywords = parse('inherit | initial | unset');
var cssWideKeywordsWithExpression = parse('inherit | initial | unset | <expression>');

function dumpMapSyntax(map) {
    var result = {};

    for (var name in map) {
        if (map[name].syntax) {
            result[name] = map[name].syntax;
        }
    }

    return result;
}

var Syntax = function(syntax) {
    this.generic = false;
    this.properties = {};
    this.types = {};
    this.valueCommonSyntax = cssWideKeywords;

    if (syntax) {
        if (syntax.generic) {
            this.generic = true;
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
    createDescriptor: function(syntax) {
        var descriptor = {
            syntax: null,
            match: null
        };

        if (typeof syntax === 'function') {
            descriptor.match = syntax;
        } else {
            descriptor.syntax = typeof syntax === 'string' ? parse(syntax) : syntax;
            descriptor.match = match.bind(null, this, descriptor.syntax);
        }

        return descriptor;
    },
    addProperty: function(name, syntax) {
        this.properties[name] = this.createDescriptor(syntax);
    },
    addType: function(name, syntax) {
        this.types[name] = this.createDescriptor(syntax);

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
            if (this.types[name].type !== 'generic') {
                all.push(this.types[name]);
            }
        }

        for (var name in this.properties) {
            all.push(this.properties[name]);
        }

        return all;
    },

    validate: function() {
        function validate(syntax, name, broken, descriptor) {
            if (broken.hasOwnProperty(name)) {
                return broken[name];
            }

            broken[name] = false;
            if (descriptor.syntax !== null) {
                walk(descriptor.syntax, function(node) {
                    if (node.type !== 'Type' && node.type !== 'Property') {
                        return;
                    }

                    var map = node.type === 'Type' ? syntax.types : syntax.properties;
                    var brokenMap = node.type === 'Type' ? brokenTypes : brokenProperties;

                    if (!map.hasOwnProperty(node.name) || validate(syntax, node.name, brokenMap, map[node.name])) {
                        broken[name] = true;
                    }
                }, this);
            }
        }

        var brokenTypes = {};
        var brokenProperties = {};

        for (var key in this.types) {
            validate(this, key, brokenTypes, this.types[key]);
        }

        for (var key in this.properties) {
            validate(this, key, brokenProperties, this.properties[key]);
        }

        brokenTypes = Object.keys(brokenTypes).filter(function(name) {
            return brokenTypes[name];
        });
        brokenProperties = Object.keys(brokenProperties).filter(function(name) {
            return brokenProperties[name];
        });

        if (brokenTypes.length || brokenProperties.length) {
            return {
                types: brokenTypes,
                properties: brokenProperties
            };
        }

        return null;
    },
    dump: function() {
        return {
            generic: this.generic,
            properties: dumpMapSyntax(this.properties),
            types: dumpMapSyntax(this.types)
        };
    },
    toString: function() {
        return JSON.stringify(this.dump());
    }
};

module.exports = Syntax;
