'use strict';

var Generator = function() {
};

Generator.prototype = {
    generate: function(node, item, list) {
        if (this.type.hasOwnProperty(node.type)) {
            return this.type[node.type].call(this, node, item, list);
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
            return this.generate(list.head.data, cursor, list);
        }

        while (cursor !== null) {
            result += this.generate(cursor.data, cursor, list);
            cursor = cursor.next;
        }

        return result;
    },
    eachComma: function(list) {
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
                result += ',';
            }
            result += this.generate(cursor.data);
            cursor = cursor.next;
        }

        return result;
    },

    type: {
        AnPlusB: require('../syntax/type/AnPlusB').generate,
        Atrule: require('../syntax/type/Atrule').generate,
        AtruleExpression: require('../syntax/type/AtruleExpression').generate,
        AttributeSelector: require('../syntax/type/AttributeSelector').generate,
        Block: require('../syntax/type/Block').generate,
        Brackets: require('../syntax/type/Brackets').generate,
        ClassSelector: require('../syntax/type/ClassSelector').generate,
        Combinator: require('../syntax/type/Combinator').generate,
        Comment: require('../syntax/type/Comment').generate,
        Declaration: require('../syntax/type/Declaration').generate,
        DeclarationList: require('../syntax/type/DeclarationList').generate,
        Dimension: require('../syntax/type/Dimention').generate,
        Function: require('../syntax/type/Function').generate,
        HexColor: require('../syntax/type/HexColor').generate,
        Identifier: require('../syntax/type/Identifier').generate,
        IdSelector: require('../syntax/type/IdSelector').generate,
        MediaFeature: require('../syntax/type/MediaFeature').generate,
        MediaQuery: require('../syntax/type/MediaQuery').generate,
        MediaQueryList: require('../syntax/type/MediaQueryList').generate,
        Nth: require('../syntax/type/Nth').generate,
        Number: require('../syntax/type/Number').generate,
        Operator: require('../syntax/type/Operator').generate,
        Parentheses: require('../syntax/type/Parentheses').generate,
        Percentage: require('../syntax/type/Percentage').generate,
        PseudoClassSelector: require('../syntax/type/PseudoClassSelector').generate,
        PseudoElementSelector: require('../syntax/type/PseudoElementSelector').generate,
        Ratio: require('../syntax/type/Ratio').generate,
        Raw: require('../syntax/type/Raw').generate,
        Rule: require('../syntax/type/Rule').generate,
        Selector: require('../syntax/type/Selector').generate,
        SelectorList: require('../syntax/type/SelectorList').generate,
        String: require('../syntax/type/String').generate,
        StyleSheet: require('../syntax/type/StyleSheet').generate,
        TypeSelector: require('../syntax/type/TypeSelector').generate,
        UnicodeRange: require('../syntax/type/UnicodeRange').generate,
        Url: require('../syntax/type/Url').generate,
        Value: require('../syntax/type/Value').generate,
        WhiteSpace: require('../syntax/type/WhiteSpace').generate
    }
};

module.exports = Generator;
