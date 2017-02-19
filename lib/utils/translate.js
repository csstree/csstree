'use strict';

var SEMICOLON = 59; // ';'.charCodeAt()
var RIGHTCURLYBRACKET = 125; // '}'.charCodeAt();

var Generator = function() {};
Generator.prototype = {
    generate: function(node) {
        if (this.type.hasOwnProperty(node.type)) {
            return this.type[node.type].call(this, node);
        } else {
            throw new Error('Unknown node type: ' + node.type);
        }
    },

    each: function(list) {
        var cursor = list.head;
        var result = '';

        if (cursor === null) {
            return result;
        }

        if (cursor === list.tail) {
            return this.generate(list.head.data);
        }

        while (cursor !== null) {
            result += this.generate(cursor.data);
            cursor = cursor.next;
        }

        return result;
    },
    eachDelim: function(list, delimeter) {
        var cursor = list.head;
        var result = '';

        if (cursor === null) {
            return result;
        }

        if (cursor === list.tail) {
            return this.generate(list.head.data);
        }

        while (cursor !== null) {
            if (result.length) {
                result += delimeter;
            }
            result += this.generate(cursor.data);
            cursor = cursor.next;
        }

        return result;
    },
    generateBlock: function(list) {
        var cursor = list.head;
        var result = '';

        if (cursor === null) {
            return result;
        }

        if (cursor === list.tail) {
            return this.generate(list.head.data);
        }

        while (cursor !== null) {
            if (result.length > 0) {
                var code = result.charCodeAt(result.length - 1);
                if (code !== RIGHTCURLYBRACKET &&
                    code !== SEMICOLON) {
                    result += ';';
                }
            }

            result += this.generate(cursor.data, cursor.next !== null);
            cursor = cursor.next;
        }

        return result;
    },

    type: {
        StyleSheet: function(node) {
            return this.each(node.children);
        },
        Atrule: function(node) {
            var result = '@' + node.name;

            if (node.expression !== null) {
                result += ' ' + this.generate(node.expression);
            }

            if (node.block) {
                result += this.generate(node.block);
            } else {
                result += ';';
            }

            return result;
        },
        AtruleExpression: function(node) {
            return this.each(node.children);
        },
        MediaQueryList: function(node) {
            return this.eachDelim(node.children, ',');
        },
        MediaQuery: function(node) {
            return this.each(node.children);
        },
        MediaFeature: function(node) {
            return node.value !== null
                ? '(' + node.name + ':' + this.generate(node.value) + ')'
                : '(' + node.name + ')';
        },
        Rule: function(node) {
            return this.generate(node.selector) + this.generate(node.block);
        },
        SelectorList: function(node) {
            return this.eachDelim(node.children, ',');
        },
        Selector: function(node) {
            return this.each(node.children);
        },
        Combinator: function(node) {
            return node.name;
        },
        TypeSelector: function(node) {
            return node.name;
        },
        ClassSelector: function(node) {
            return '.' + node.name;
        },
        IdSelector: function(node) {
            return '#' + node.name;
        },
        AttributeSelector: function(node) {
            var result = this.generate(node.name);
            var flagsPrefix = ' ';

            if (node.operator !== null) {
                result += node.operator;

                if (node.value !== null) {
                    result += this.generate(node.value);

                    // space between string and flags is not required
                    if (node.value.type === 'String') {
                        flagsPrefix = '';
                    }
                }
            }

            if (node.flags !== null) {
                result += flagsPrefix + node.flags;
            }

            return '[' + result + ']';
        },
        PseudoClassSelector: function(node) {
            return node.children !== null
                ? ':' + node.name + '(' + this.each(node.children) + ')'
                : ':' + node.name;
        },
        PseudoElementSelector: function(node) {
            return node.children !== null
                ? '::' + node.name + '(' + this.each(node.children) + ')'
                : '::' + node.name;
        },
        Nth: function(node) {
            var result = this.generate(node.nth);
            if (node.selector !== null) {
                result += ' of ' + this.generate(node.selector);
            }
            return result;
        },
        AnPlusB: function(node) {
            var result = '';
            var a = node.a !== null && node.a !== undefined;
            var b = node.b !== null && node.b !== undefined;

            if (a) {
                result += node.a === '+1' || node.a === '1' ? 'n' :
                          node.a === '-1' ? '-n' :
                          node.a + 'n';
            }

            if (a && b) {
                if (String(node.b).charAt(0) !== '-' &&
                    String(node.b).charAt(0) !== '+') {
                    result += '+';
                }
            }

            if (b) {
                result += node.b;
            }

            return result;
        },
        Block: function(node) {
            return '{' + this.generateBlock(node.children) + '}';
        },
        DeclarationList: function(node) {
            return this.generateBlock(node.children);
        },
        Declaration: function(node) {
            return node.important
                ? node.property + ':' + this.generate(node.value) + '!important'
                : node.property + ':' + this.generate(node.value);
        },
        Value: function(node) {
            return this.each(node.children);
        },
        Function: function(node) {
            return node.name + '(' + this.each(node.children) + ')';
        },
        Parentheses: function(node) {
            return '(' + this.each(node.children) + ')';
        },
        Brackets: function(node) {
            return '[' + this.each(node.children) + ']';
        },
        Url: function(node) {
            return 'url(' + this.generate(node.value) + ')';
        },
        Identifier: function(node) {
            return node.name;
        },
        UnicodeRange: function(node) {
            return node.value;
        },
        HexColor: function(node) {
            return '#' + node.value;
        },
        Dimension: function(node) {
            return node.value + node.unit;
        },
        Number: function(node) {
            return node.value;
        },
        String: function(node) {
            return node.value;
        },
        Operator: function(node) {
            return node.value;
        },
        Ratio: function(node) {
            return node.left + '/' + node.right;
        },
        Percentage: function(node) {
            return node.value + '%';
        },
        Raw: function(node) {
            return node.value;
        },
        WhiteSpace: function(node) {
            return node.value;
        },
        Comment: function(node) {
            return '/*' + node.value + '*/';
        }
    }
};

var generator = new Generator();
module.exports = generator.generate.bind(generator);
