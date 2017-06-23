function getTrace(node) {
    function hasMatch(matchNode) {
        if (matchNode.type === 'ASTNode') {
            if (matchNode.node === node) {
                return true;
            }

            if (matchNode.childrenMatch) {
                for (var i = 0; i < matchNode.childrenMatch.length; i++) {
                    if (hasMatch(matchNode.childrenMatch[i])) {
                        return true;
                    }
                }
            }
        } else {
            var addToStack = matchNode.syntax.type === 'Type' ||
                             matchNode.syntax.type === 'Property' ||
                             matchNode.syntax.type === 'Keyword';

            if (addToStack) {
                stack.push(matchNode.syntax);
            }

            for (var i = 0; i < matchNode.match.length; i++) {
                if (hasMatch(matchNode.match[i], node, stack)) {
                    return true;
                }
            }

            if (addToStack) {
                stack.pop();
            }
        }

        return false;
    }

    var stack = [];
    return this.match !== null && hasMatch(this.matched) ? stack : null;
}

function testNode(match, node, fn) {
    var trace = getTrace.call(match, node);

    if (trace === null) {
        return false;
    }

    return trace.some(fn);
}

function isType(node, type) {
    return testNode(this, node, function(matchNode) {
        return matchNode.type === 'Type' && matchNode.name === type;
    });
}

function isProperty(node, property) {
    return testNode(this, node, function(matchNode) {
        return matchNode.type === 'Property' && matchNode.name === property;
    });
}

function isKeyword(node) {
    return testNode(this, node, function(matchNode) {
        return matchNode.type === 'Keyword';
    });
}

module.exports = {
    getTrace: getTrace,
    isType: isType,
    isProperty: isProperty,
    isKeyword: isKeyword
};
