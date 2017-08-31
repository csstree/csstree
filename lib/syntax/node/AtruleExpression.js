var List = require('../../utils/list');

var TYPE = require('../../tokenizer').TYPE;
var SEMICOLON = TYPE.Semicolon;
var LEFTCURLYBRACKET = TYPE.LeftCurlyBracket;
var EOF = 0;

// TODO: move to Raw
// FIXME: should be balanced
function consumeRaw(start) {
    var type = 0;
    var end;

    scan:
    for (var i = 0; type = this.scanner.lookupType(i); i++) {
        switch (type) {
            case SEMICOLON:
            case LEFTCURLYBRACKET:
            case EOF:
                break scan;
        }
    }

    this.scanner.skip(i);
    if (this.scanner.tokenStart > start) {
        end = this.scanner.getOffsetExcludeWS();
    } else {
        end = this.scanner.tokenStart;
    }

    return new List().appendData({
        type: 'Raw',
        loc: this.getLocation(start, end),
        value: this.scanner.source.substring(start, end)
    });
}

function consumeDefaultSequence() {
    return this.readSequence(this.scope.AtruleExpression);
}

module.exports = {
    name: 'AtruleExpression',
    structure: {
        children: [[]]
    },
    parse: function(name) {
        var children;

        if (name !== null) {
            name = name.toLowerCase();
        }

        children = this.parseChildren('AtruleExpression', name);

        return {
            type: 'AtruleExpression',
            loc: this.getLocationFromList(children),
            children: children
        };
    },
    parseChildren: function(name) {
        var start = this.scanner.tokenStart;        
        var children = null;

        if (this.parseAtruleExpression) {
            // custom consumer
            if (this.atrule.hasOwnProperty(name)) {
                if (typeof this.atrule[name].expression === 'function') {
                    children = this.tolerantParse(this.atrule[name].expression, consumeRaw);
                }
            } else {
                // default consumer
                this.scanner.skipSC();
                children = this.tolerantParse(consumeDefaultSequence, consumeRaw);
            }

            if (this.tolerant) {
                if (this.scanner.eof || (this.scanner.tokenType !== SEMICOLON && this.scanner.tokenType !== LEFTCURLYBRACKET)) {
                    children = consumeRaw.call(this, start);
                }
            }
        } else {
            children = consumeRaw.call(this, start);
        }

        if (children === null) {
            children = new List();
        }

        return children;
    },
    generate: function(processChunk, node) {
        this.each(processChunk, node);
    },
    walkContext: 'atruleExpression'
};
