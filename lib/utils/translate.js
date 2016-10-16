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

    if (node.expression && !node.expression.sequence.isEmpty()) {
        result += ' ' + translate(node.expression);
    }

    if (node.block) {
        result += '{' + translate(node.block) + '}';
    } else {
        result += ';';
    }

    return result;
}

function translateSimpleSelector(list) {
    var cursor = list.head;
    var result = '';

    if (cursor === null) {
        return result;
    }

    if (cursor === list.tail) {
        return translate(list.head.data);
    }

    while (cursor !== null) {
        if (cursor.data.type === 'Combinator' && cursor.data.name === '/deep/') {
            // add extra spaces around /deep/ combinator since comment beginning/ending may to be produced
            result += ' ' + translate(cursor.data) + ' ';
        } else {
            result += translate(cursor.data);
        }
        cursor = cursor.next;
    }

    return result;
}

function translate(node) {
    switch (node.type) {
        case 'StyleSheet':
            return each(node.rules);

        case 'Atrule':
            return translateAtRule(node);

        case 'Rule':
            return translate(node.selector) + '{' + translate(node.block) + '}';

        case 'Selector':
            return eachDelim(node.selectors, ',');

        case 'SimpleSelector':
            return translateSimpleSelector(node.sequence);

        case 'Block':
            return eachDelim(node.declarations, ';');

        case 'Declaration':
            return node.important
                ? node.property + ':' + translate(node.value) + '!important'
                : node.property + ':' + translate(node.value);

        case 'Value':
            return each(node.sequence);

        case 'Attribute':
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
            return node.name + '(' + each(node.sequence) + ')';

        case 'Negation':
            return ':not(' + eachDelim(node.sequence, ',') + ')';

        case 'Parentheses':
            return '(' + each(node.sequence) + ')';

        case 'AtruleExpression':
            return each(node.sequence);

        case 'Url':
            return 'url(' + translate(node.value) + ')';

        case 'Progid':
            return node.value;

        case 'Combinator':
            return node.name;

        case 'Type':
            return node.name;

        case 'Universal':
            return node.name;

        case 'Identifier':
            return node.name;

        case 'UnicodeRange':
            return node.name;

        case 'PseudoClass':
            return node.sequence !== null
                ? ':' + node.name + '(' + each(node.sequence) + ')'
                : ':' + node.name;

        case 'PseudoElement':
            return node.legacy
                ? ':'  + node.name  // :before, :after, :first-letter and :first-line
                : '::' + node.name;

        case 'Class':
            return '.' + node.name;

        case 'Id':
            return '#' + node.name;

        case 'Hash':
            return '#' + node.value;

        case 'Dimension':
            return node.value + node.unit;

        case 'Nth':
            return node.value;

        case 'Number':
            return node.value;

        case 'String':
            return node.value;

        case 'Operator':
            return node.value;

        case 'Raw':
            return node.value;

        case 'Percentage':
            return node.value + '%';

        case 'Space':
            return ' ';

        case 'Comment':
            return '/*' + node.value + '*/';

        default:
            throw new Error('Unknown node type: ' + node.type);
    }
}

module.exports = translate;
