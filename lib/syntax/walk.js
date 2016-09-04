module.exports = function walk(node, fn) {
    switch (node.type) {
        case 'Sequence':
        case 'Group':
            node.terms.forEach(function(term) {
                walk(term, fn);
            });
            break;

        case 'Function':
        case 'Parentheses':
            walk(node.sequence, fn);
            break;

        case 'Keyword':
        case 'Type':
        case 'Property':
        case 'Combinator':
        case 'Comma':
        case 'Slash':
        case 'String':
        case 'Percent':
            break;

        default:
            throw new Error('Unknown type: ' + node.type);
    }

    fn(node);
};
