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
                             matchNode.syntax.type === 'Property';

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
};

function isNodeType(node, type) {
    return getNodeTrace.call(this, node).some(function(matchNode) {
        return matchNode.type === 'Type' && matchNode.name === type;
    });
}

function isNodeProperty(node, property) {
    return getNodeTrace.call(this, node).some(function(matchNode) {
        return matchNode.type === 'Property' && matchNode.name === property;
    });
}

module.exports = {
    getNodeTrace: getNodeTrace,
    isNodeType: isNodeType,
    isNodeProperty: isNodeProperty
};
