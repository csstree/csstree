var List = require('../../utils/list');

var TYPE = require('../../tokenizer').TYPE;
var SEMICOLON = TYPE.Semicolon;
var LEFTCURLYBRACKET = TYPE.LeftCurlyBracket;

function consumeRaw(startToken) {
    return new List().appendData(
        this.Raw(startToken, SEMICOLON, LEFTCURLYBRACKET, false, true)
    );
}

function consumeDefaultSequence() {
    return this.readSequence(this.scope.AtrulePrelude);
}

module.exports = {
    name: 'AtrulePrelude',
    structure: {
        children: [[]]
    },
    parse: function(name) {
        var children = null;
        var startToken = this.scanner.currentToken;

        if (name !== null) {
            name = name.toLowerCase();
        }

        if (this.parseAtrulePrelude) {
            // custom consumer
            if (this.atrule.hasOwnProperty(name)) {
                if (typeof this.atrule[name].prelude === 'function') {
                    children = this.tolerantParse(this.atrule[name].prelude, consumeRaw);
                }
            } else {
                // default consumer
                this.scanner.skipSC();
                children = this.tolerantParse(consumeDefaultSequence, consumeRaw);
            }

            if (this.tolerant) {
                if (this.scanner.eof || (this.scanner.tokenType !== SEMICOLON && this.scanner.tokenType !== LEFTCURLYBRACKET)) {
                    children = consumeRaw.call(this, startToken);
                }
            }
        } else {
            children = consumeRaw.call(this, startToken);
        }

        if (children === null) {
            children = new List();
        }

        return {
            type: 'AtrulePrelude',
            loc: this.getLocationFromList(children),
            children: children
        };
    },
    generate: function(processChunk, node) {
        this.each(processChunk, node);
    },
    walkContext: 'atrulePrelude'
};
