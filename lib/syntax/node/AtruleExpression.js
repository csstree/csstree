var List = require('../../utils/list');
var TYPE = require('../../tokenizer').TYPE;
var SEMICOLON = TYPE.Semicolon;
var LEFTCURLYBRACKET = TYPE.LeftCurlyBracket;
var BALANCED = true;

module.exports = {
    name: 'AtruleExpression',
    structure: {
        children: [[]]
    },
    parse: function(name) {
        var children = null;

        if (name !== null) {
            name = name.toLowerCase();
        }

        if (this.parseAtruleExpression) {
            // custom consumer
            if (this.atrule.hasOwnProperty(name)) {
                if (typeof this.atrule[name].expression === 'function') {
                    children = this.atrule[name].expression.call(this);

                    if (children instanceof List === false) {
                        return children;
                    }
                }
            } else {
                // default consumer
                this.scanner.skipSC();
                children = this.readSequence(this.scope.AtruleExpression);
            }
        } else {
            children = new List().appendData(
                this.Raw(BALANCED, SEMICOLON, LEFTCURLYBRACKET)
            );
        }

        if (children === null || children.isEmpty()) {
            return null;
        }

        return {
            type: 'AtruleExpression',
            loc: this.getLocationFromList(children),
            children: children
        };
    },
    generate: function(processChunk, node) {
        this.each(processChunk, node.children);
    },
    walkContext: 'atruleExpression'
};
