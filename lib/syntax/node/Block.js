var List = require('../../utils/list');
var TYPE = require('../../tokenizer').TYPE;

var WHITESPACE = TYPE.WhiteSpace;
var COMMENT = TYPE.Comment;
var SEMICOLON = TYPE.Semicolon;
var ATRULE = TYPE.Atrule;
var LEFTCURLYBRACKET = TYPE.LeftCurlyBracket;
var RIGHTCURLYBRACKET = TYPE.RightCurlyBracket;

function consumeRaw(startToken) {
    return this.Raw(startToken, 0, 0, false, true);
}
function consumeRule() {
    return this.parseWithFallback(this.Rule, consumeRaw);
}
function consumeRawDeclaration(startToken) {
    return this.Raw(startToken, 0, SEMICOLON, true, true);
}
function consumeDeclaration() {
    if (this.scanner.tokenType === SEMICOLON) {
        return consumeRawDeclaration.call(this, this.scanner.currentToken);
    }

    var node = this.parseWithFallback(this.Declaration, consumeRawDeclaration);

    if (this.scanner.tokenType === SEMICOLON) {
        this.scanner.next();
    }

    return node;
}

module.exports = {
    name: 'Block',
    structure: {
        children: [[
            'Atrule',
            'Rule',
            'Declaration'
        ]]
    },
    parse: function(isDeclaration) {
        var consumer = isDeclaration ? consumeDeclaration : consumeRule;

        var start = this.scanner.tokenStart;
        var children = new List();

        this.scanner.eat(LEFTCURLYBRACKET);

        scan:
        while (!this.scanner.eof) {
            switch (this.scanner.tokenType) {
                case RIGHTCURLYBRACKET:
                    break scan;

                case WHITESPACE:
                case COMMENT:
                    this.scanner.next();
                    break;

                case ATRULE:
                    children.appendData(this.parseWithFallback(this.Atrule, consumeRaw));
                    break;

                default:
                    children.appendData(consumer.call(this));
            }
        }

        if (!this.scanner.eof) {
            this.scanner.eat(RIGHTCURLYBRACKET);
        }

        return {
            type: 'Block',
            loc: this.getLocation(start, this.scanner.tokenStart),
            children: children
        };
    },
    generate: function(processChunk, node) {
        // Bugfix: Chrome supports sourceMappingURL in <style> tags but each selector needs to be on a new line.
        // Otherwise, the dev tools only show the last mapping line/column
        processChunk('{\n');
        this.each(processChunk, node, function(prev) {
            if (prev.type === 'Declaration') {
                processChunk(';\n');
            }
        });
        processChunk('}\n');
    },
    walkContext: 'block'
};
