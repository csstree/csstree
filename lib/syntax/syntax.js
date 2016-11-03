var MatchError = require('./error').MatchError;
var walkAst = require('../utils/walk').all;
var names = require('../utils/names');
var generic = require('./generic');
var parse = require('./parse');
var translate = require('./translate');
var walk = require('./walk');
var match = require('./match');
var cssWideKeywords = parse('inherit | initial | unset');
var cssWideKeywordsWithExpression = parse('inherit | initial | unset | <expression>');

function dumpMapSyntax(map, syntaxAsAst) {
    var result = {};

    for (var name in map) {
        if (map[name].syntax) {
            result[name] = syntaxAsAst ? map[name].syntax : translate(map[name].syntax);
        }
    }

    return result;
}

function unwrapNode(item) {
    return item && item.data;
}

function valueHasVar(value) {
    var hasVar = false;

    walkAst(value, function(node) {
        if (node.type === 'Function' && node.name.toLowerCase() === 'var') {
            hasVar = true;
        }
    });

    return hasVar;
}

function matchSyntax(dictionary, syntax, value) {
    var result;

    if (valueHasVar(value)) {
        return {
            type: 'NoMatch',
            comment: 'Due to matching for value with var() is very complex those values are always valid for now'
        };
    }

    result = match(dictionary, dictionary.valueCommonSyntax, value.sequence.head);

    if (!result.match) {
        result = syntax.match(value.sequence.head);
        if (!result || !result.match) {
            dictionary.lastMatchError = new MatchError('Mismatch', syntax.syntax, value, result.badNode || unwrapNode(result.next));
            return null;
        }
    }

    if (result.next) {
        dictionary.lastMatchError = new MatchError('Uncomplete match', syntax.syntax, value, result.badNode || unwrapNode(result.next));
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
        var self = this;
        var descriptor = {
            syntax: null,
            match: null
        };

        if (typeof syntax === 'function') {
            descriptor.match = function(node) {
                if (node && syntax(node)) {
                    return {
                        badNode: null,
                        lastNode: null,
                        next: node.next,
                        match: [node.data]
                    };
                }

                return null;
            };
        } else {
            if (typeof syntax === 'string') {
                Object.defineProperty(descriptor, 'syntax', {
                    get: function() {
                        Object.defineProperty(descriptor, 'syntax', {
                            value: parse(syntax)
                        });

                        return descriptor.syntax;
                    }
                });
            } else {
                descriptor.syntax = syntax;
            }

            descriptor.match = function(ast) {
                return match(self, descriptor.syntax, ast);
            };
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
