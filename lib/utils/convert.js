var walk = require('./walk').all;
var walkUp = require('./walk').allUp;
var List = require('./list');

function fromPlainObject(ast) {
    walk(ast, function(node) {
        if (node.children && node.children instanceof List === false) {
            node.children = new List().fromArray(node.children);
        }
    });

    return ast;
}

function toPlainObject(ast) {
    walkUp(ast, function(node) {
        if (node.children && node.children instanceof List) {
            node.children = node.children.toArray();
        }
    });

    return ast;
}

module.exports = {
    fromPlainObject: fromPlainObject,
    toPlainObject: toPlainObject
};
