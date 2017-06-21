'use strict';

var MatchError = require('./error').MatchError;
var names = require('../utils/names');
var generic = require('./generic');
var parse = require('./grammar/parse');
var translate = require('./grammar/translate');
var walk = require('./grammar/walk');
var match = require('./match');
var trace = require('./trace');
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

    this.syntax.walk(value, function(node) {
        if (node.type === 'Function' && node.name.toLowerCase() === 'var') {
            hasVar = true;
        }
    });

    return hasVar;
}

// check node is \0 or \9 hack
function isHack(node) {
    return node.type === 'Identifier' && /^\\[09]/.test(node.name);
}

function returnNull() {
    return null;
}

function returnFalse() {
    return false;
}

// white spaces, comments and some hacks can to be ignored at the end of value
function isNextMayToBeIgnored(cursor) {
    while (cursor !== null) {
        if (cursor.data.type !== 'WhiteSpace' &&
            cursor.data.type !== 'Comment' &&
            !isHack(cursor.data)) {
            return false;
        }

        cursor = cursor.next;
    }

    return true;
}

function buildMatchResult(match, error) {
    return {
        matched: match || null,
        error: error || null,
        getNodeTrace: match === null ? returnNull : trace.getNodeTrace,
        isNodeType: match === null ? returnFalse : trace.isNodeType,
        isNodeProperty: match === null ? returnFalse : trace.isNodeProperty
    };
}

function matchSyntax(lexer, syntax, value) {
    var result;

    if (!value || value.type !== 'Value') {
        return buildMatchResult(null, new Error('Not a Value node'));
    }

    if (valueHasVar.call(lexer, value)) {
        return buildMatchResult(null, new Error('Due to matching for value with var() is very complex those values are always valid for now'));
    }

    result = match(lexer, lexer.valueCommonSyntax, value.children.head);

    if (!result.match) {
        result = syntax.match(value.children.head);
        if (!result.match) {
            return buildMatchResult(null, new MatchError('Mismatch', lexer, syntax.syntax, value, result.badNode || unwrapNode(result.next)));
        }
    }

    if (result.next && !isNextMayToBeIgnored(result.next)) {
        return buildMatchResult(null, new MatchError('Uncomplete match', lexer, syntax.syntax, value, result.badNode || unwrapNode(result.next)));
    }

    return buildMatchResult(result.match, null);
}

var Lexer = function(config, syntax, structure) {
    this.valueCommonSyntax = cssWideKeywords;
    this.syntax = syntax;
    this.generic = false;
    this.properties = {};
    this.types = {};
    this.structure = structure;

    if (config) {
        if (config.generic) {
            this.generic = true;
            for (var name in generic) {
                this.addType_(name, generic[name]);
            }
        }

        if (config.types) {
            for (var name in config.types) {
                this.addType_(name, config.types[name]);
            }
        }

        if (config.properties) {
            for (var name in config.properties) {
                this.addProperty_(name, config.properties[name]);
            }
        }
    }
};

Lexer.prototype = {
    structure: {},
    checkStructure: function(ast) {
        var structure = this.structure;
        var warns = [];

        this.syntax.walk(ast, function(node) {
            if (structure.hasOwnProperty(node.type)) {
                structure[node.type].check(node, warns.push.bind(warns));
            } else {
                throw new Error('Unknown node type: ' + node.type);
            }
        });

        return warns.length ? warns : false;
    },

    createDescriptor: function(syntax) {
        var self = this;
        var descriptor = {
            syntax: null,
            match: null
        };

        if (typeof syntax === 'function') {
            syntax = {
                type: 'ASTNode',
                match: syntax
            };

            descriptor.match = function(item) {
                return match(self, syntax, item);
            };
        } else {
            if (typeof syntax === 'string') {
                // lazy parsing on first access
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

            descriptor.match = function(item) {
                return match(self, descriptor.syntax, item);
            };
        }

        return descriptor;
    },
    addProperty_: function(name, syntax) {
        this.properties[name] = this.createDescriptor(syntax);
    },
    addType_: function(name, syntax) {
        this.types[name] = this.createDescriptor(syntax);

        if (syntax === generic.expression) {
            this.valueCommonSyntax = cssWideKeywordsWithExpression;
        }
    },

    matchProperty: function(propertyName, value) {
        var property = names.property(propertyName);

        // don't match syntax for a custom property
        if (property.variable) {
            return {
                type: 'NoMatch',
                comment: 'Lexer matching doesn\'t applicable for custom properties'
            };
        }

        var propertySyntax = property.vendor
            ? this.getProperty(property.vendor + property.name) || this.getProperty(property.name)
            : this.getProperty(property.name);

        if (!propertySyntax) {
            return buildMatchResult(null, new Error('Unknown property: ' + propertyName));
        }

        return matchSyntax(this, propertySyntax, value);
    },
    matchType: function(typeName, value) {
        var typeSyntax = this.getType(typeName);

        if (!typeSyntax) {
            return buildMatchResult(null, new Error('Unknown type: ' + typeName));
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

module.exports = Lexer;
