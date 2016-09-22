var MatchError = require('./error').MatchError;
var names = require('../utils/names');
var generic = require('./generic');
var parse = require('./parse');
var stringify = require('./stringify');
var walk = require('./walk');
var match = require('./match');
var cssWideKeywords = parse('inherit | initial | unset');
var cssWideKeywordsWithExpression = parse('inherit | initial | unset | <expression>');

function dumpMapSyntax(map, syntaxAsAst) {
    var result = {};

    for (var name in map) {
        if (map[name].syntax) {
            result[name] = syntaxAsAst ? map[name].syntax : stringify(map[name].syntax);
        }
    }

    return result;
}

function matchSyntax(dictionary, syntax, value) {
    var result = syntax.match(value.sequence.head);

    if (!result || !result.match) {
        result = match(dictionary, dictionary.valueCommonSyntax, value.sequence.head);
        if (!result || !result.match) {
            dictionary.lastMatchError = MatchError('Mismatch', syntax.syntax, value, result.next);
            return null;
        }
    }

    if (result.next) {
        dictionary.lastMatchError = MatchError('Uncomplete match', syntax.syntax, value, result.next);
        return null;
    }

    dictionary.lastMatchError = null;
    return result.match;
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

    lastMatchError: null,
    match: function(propertyName, value) {
        console.warn('Syntax#match() method is deprecated. Please, use Syntax#matchProperty() or Syntax#matchType() instead');
        return this.matchProperty(propertyName, value);
    },
    matchProperty: function(propertyName, value) {
        var property = names.property(propertyName);
        var propertySyntax = property.vendor
            ? this.getProperty(property.vendor + property.name) || this.getProperty(property.name)
            : this.getProperty(property.name);

        if (!propertySyntax) {
            this.lastMatchError = new Error('Unknown property: ' + propertyName);
            return null;
        }

        return matchSyntax(this, propertySyntax, value);
    },
    matchType: function(typeName, value) {
        var typeSyntax = this.getType(typeName);

        if (!typeSyntax) {
            this.lastMatchError = new Error('Unknown type: ' + typeName);
            return null;
        }

        return matchSyntax(this, typeSyntax, value);
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
    dump: function(syntaxAsAst) {
        return {
            generic: this.generic,
            types: dumpMapSyntax(this.types, syntaxAsAst),
            properties: dumpMapSyntax(this.properties, syntaxAsAst)
        };
    },
    toString: function() {
        return JSON.stringify(this.dump());
    }
};

module.exports = Syntax;
