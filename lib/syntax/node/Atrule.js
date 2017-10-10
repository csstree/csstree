var TYPE = require('../../tokenizer').TYPE;

var ATRULE = TYPE.Atrule;
var SEMICOLON = TYPE.Semicolon;
var LEFTCURLYBRACKET = TYPE.LeftCurlyBracket;
var RIGHTCURLYBRACKET = TYPE.RightCurlyBracket;
var EOF = 0;

function consumeRaw(startToken) {
    return this.Raw(startToken, SEMICOLON, LEFTCURLYBRACKET, false, true);
}

function isDeclarationBlockAtrule() {
    for (var offset = 1, type; type = this.scanner.lookupType(offset); offset++) {
        if (type === RIGHTCURLYBRACKET) {
            return true;
        }

        if (type === LEFTCURLYBRACKET ||
            type === ATRULE) {
            return false;
        }
    }

    if (this.tolerant) {
        return false;
    }

    this.scanner.skip(offset);
    this.scanner.eat(RIGHTCURLYBRACKET);
}

module.exports = {
    name: 'Atrule',
    structure: {
        name: String,
        prelude: ['AtrulePrelude', 'Raw', null],
        block: ['Block', null]
    },
    parse: function() {
        var start = this.scanner.tokenStart;
        var name;
        var nameLowerCase;
        var prelude = null;
        var block = null;

        this.scanner.eat(ATRULE);

        name = this.scanner.substrToCursor(start + 1);
        nameLowerCase = name.toLowerCase();
        this.scanner.skipSC();

        // parse prelude
        if (this.scanner.eof === false &&
            this.scanner.tokenType !== LEFTCURLYBRACKET &&
            this.scanner.tokenType !== SEMICOLON) {
            if (this.parseAtrulePrelude) {
                var preludeStartToken = this.scanner.currentToken;

                prelude = this.tolerantParse(this.AtrulePrelude.bind(this, name), consumeRaw);

                if (this.tolerant && !this.scanner.eof) {
                    if (prelude.type !== 'Raw' &&
                        this.scanner.tokenType !== LEFTCURLYBRACKET &&
                        this.scanner.tokenType !== SEMICOLON) {
                        prelude = consumeRaw.call(this, preludeStartToken);
                    }
                }

                // turn empty AtrulePrelude into null
                if (prelude.type === 'AtrulePrelude' && prelude.children.head === null) {
                    prelude = null;
                }
            } else {
                prelude = consumeRaw.call(this, this.scanner.currentToken);
            }

            this.scanner.skipSC();
        }

        switch (this.scanner.tokenType) {
            case SEMICOLON:
                this.scanner.next();
                break;

            case LEFTCURLYBRACKET:
                if (this.atrule.hasOwnProperty(nameLowerCase) &&
                    typeof this.atrule[nameLowerCase].block === 'function') {
                    block = this.atrule[nameLowerCase].block.call(this);
                } else {
                    // TODO: should consume block content as Raw?
                    block = this.Block(isDeclarationBlockAtrule.call(this));
                }

                break;

            case EOF:
                break;

            default:
                if (!this.tolerant) {
                    this.scanner.error('Semicolon or block is expected');
                }
        }

        return {
            type: 'Atrule',
            loc: this.getLocation(start, this.scanner.tokenStart),
            name: name,
            prelude: prelude,
            block: block
        };
    },
    generate: function(processChunk, node) {
        processChunk('@');
        processChunk(node.name);

        if (node.prelude !== null) {
            processChunk(' ');
            this.generate(processChunk, node.prelude);
        }

        if (node.block) {
            this.generate(processChunk, node.block);
        } else {
            processChunk(';');
        }
    },
    walkContext: 'atrule'
};
