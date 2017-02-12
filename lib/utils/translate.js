'use strict';

function each(list) {
    var cursor = list.head;
    var result = '';

    if (cursor === null) {
        return result;
    }

    if (cursor === list.tail) {
        return translate(list.head.data);
    }

    while (cursor !== null) {
        result += translate(cursor.data);
        cursor = cursor.next;
    }

    return result;
}

function eachDelim(list, delimeter) {
    var cursor = list.head;
    var result = '';

    if (cursor === null) {
        return result;
    }

    if (cursor === list.tail) {
        return translate(list.head.data);
    }

    while (true) {
        result += translate(cursor.data);
        cursor = cursor.next;
        if (cursor === null) {
            break;
        }
        result += delimeter;
    }

    return result;
}

function translateAtRule(node) {
    var result = '@' + node.name;

    if (node.expression !== null) {
        result += ' ' + translate(node.expression);
    }

    if (node.block) {
        result += translate(node.block);
    } else {
        result += ';';
    }

    return result;
}

function translateBlock(list) {
    var cursor = list.head;
    var result = '';

    if (cursor === null) {
        return result;
    }

    if (cursor === list.tail) {
        return translate(list.head.data);
    }

    while (cursor !== null) {
        result += translate(cursor.data);
        if (cursor.next && cursor.data.type === 'Declaration') {
            result += ';';
        }
        cursor = cursor.next;
    }

    return result;
}

function translate(node) {
    switch (node.type) {
        case 'StyleSheet':
            return each(node.children);

        case 'Atrule':
            return translateAtRule(node);

        case 'Rule':
            return translate(node.selector) + translate(node.block);

        case 'SelectorList':
            return eachDelim(node.children, ',');

        case 'Selector':
            return each(node.children);

        case 'Block':
            return '{' + translateBlock(node.children) + '}';

        case 'DeclarationList':
            return translateBlock(node.children);

        case 'Declaration':
            return node.important
                ? node.property + ':' + translate(node.value) + '!important'
                : node.property + ':' + translate(node.value);

        case 'Value':
            return each(node.children);

        case 'Nth':
            var result = translate(node.nth);
            if (node.selector !== null) {
                result += ' of ' + translate(node.selector);
            }
            return result;

        case 'AttributeSelector':
            var result = translate(node.name);
            var flagsPrefix = ' ';

            if (node.operator !== null) {
                result += node.operator;

                if (node.value !== null) {
                    result += translate(node.value);

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

        case 'Function':
            return node.name + '(' + each(node.children) + ')';

        case 'Parentheses':
            return '(' + each(node.children) + ')';

        case 'Brackets':
            return '[' + each(node.children) + ']';

        case 'AtruleExpression':
            return each(node.children);

        case 'MediaQueryList':
            return eachDelim(node.children, ',');

        case 'MediaQuery':
            return each(node.children);

        case 'MediaFeature':
            return node.value !== null
                ? '(' + node.name + ':' + translate(node.value) + ')'
                : '(' + node.name + ')';

        case 'Url':
            return 'url(' + translate(node.value) + ')';

        case 'Combinator':
            return node.name;

        case 'TypeSelector':
            return node.name;

        case 'Identifier':
            return node.name;

        case 'PseudoClassSelector':
            return node.children !== null
                ? ':' + node.name + '(' + each(node.children) + ')'
                : ':' + node.name;

        case 'PseudoElementSelector':
            return node.children !== null
                ? '::' + node.name + '(' + each(node.children) + ')'
                : '::' + node.name;

        case 'ClassSelector':
            return '.' + node.name;

        case 'IdSelector':
            return '#' + node.name;

        case 'UnicodeRange':
            return node.value;

        case 'HexColor':
            return '#' + node.value;

        case 'Dimension':
            return node.value + node.unit;

        case 'AnPlusB':
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

        case 'Number':
            return node.value;

        case 'String':
            return node.value;

        case 'Operator':
            return node.value;

        case 'Ratio':
            return node.left + '/' + node.right;

        case 'Raw':
            return node.value;

        case 'Percentage':
            return node.value + '%';

        case 'WhiteSpace':
            return node.value;

        case 'Comment':
            return '/*' + node.value + '*/';

        default:
            throw new Error('Unknown node type: ' + node.type);
    }
}

module.exports = translate;
