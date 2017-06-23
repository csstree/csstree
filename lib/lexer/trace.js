function getNodeTrace(node) {
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
    var trace = getNodeTrace.call(match, node);

    if (trace === null) {
        return false;
    }

    return trace.some(fn);
}

function isNodeType(node, type) {
    return testNode(this, node, function(matchNode) {
        return matchNode.type === 'Type' && matchNode.name === type;
    });
}

function isNodeProperty(node, property) {
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
    getNodeTrace: getNodeTrace,
    isNodeType: isNodeType,
    isNodeProperty: isNodeProperty,
    isKeyword: isKeyword
};
