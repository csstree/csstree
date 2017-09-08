var TYPE = require('../../tokenizer').TYPE;

var ATRULE = TYPE.Atrule;
var SEMICOLON = TYPE.Semicolon;
var LEFTCURLYBRACKET = TYPE.LeftCurlyBracket;
var RIGHTCURLYBRACKET = TYPE.RightCurlyBracket;

function isBlockAtrule() {
    for (var offset = 1, type; type = this.scanner.lookupType(offset); offset++) {
        if (type === RIGHTCURLYBRACKET) {
            return true;
        }

        if (type === LEFTCURLYBRACKET ||
            type === ATRULE) {
            return false;
        }
    }

    this.scanner.skip(offset);
    this.scanner.eat(RIGHTCURLYBRACKET);
}

module.exports = {
    name: 'Atrule',
    structure: {
        name: String,
        prelude: ['AtrulePrelude', null],
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

        prelude = this.AtrulePrelude(name);

        // turn empty AtrulePrelude into null
        if (prelude.children.head === null) {
            prelude = null;
        }

        this.scanner.skipSC();

        if (this.atrule.hasOwnProperty(nameLowerCase)) {
            if (typeof this.atrule[nameLowerCase].block === 'function') {
                if (this.scanner.tokenType !== LEFTCURLYBRACKET) {
                    // FIXME: make tolerant
                    this.scanner.error('Curly bracket is expected');
                }

                block = this.atrule[nameLowerCase].block.call(this);
            } else {
                if (!this.tolerant || !this.scanner.eof) {
                    this.scanner.eat(SEMICOLON);
                }
            }
        } else {
            switch (this.scanner.tokenType) {
                case SEMICOLON:
                    this.scanner.next();
                    break;

                case LEFTCURLYBRACKET:
                    // TODO: should consume block content as Raw?
                    block = this.Block(isBlockAtrule.call(this) ? this.Declaration : this.Rule);
                    break;

                default:
                    if (!this.tolerant) {
                        this.scanner.error('Semicolon or block is expected');
                    }
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
