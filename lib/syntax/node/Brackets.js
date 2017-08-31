var TYPE = require('../../tokenizer').TYPE;
var LEFTSQUAREBRACKET = TYPE.LeftSquareBracket;
var RIGHTSQUAREBRACKET = TYPE.RightSquareBracket;

// currently only Grid Layout uses square brackets, but left it universal
// https://drafts.csswg.org/css-grid/#track-sizing
// [ ident* ]
module.exports = {
    name: 'Brackets',
    structure: {
        children: [[]]
    },
    parse: function(readSequence, recognizer) {
        var start = this.scanner.tokenStart;
        var children;

        this.scanner.eat(LEFTSQUAREBRACKET);
        children = this.parseChildren('Brackets', {
            readSequence: readSequence,
            recognizer: recognizer
        });
        this.scanner.eat(RIGHTSQUAREBRACKET);

        return {
            type: 'Brackets',
            loc: this.getLocation(start, this.scanner.tokenStart),
            children: children
        };
    },
    parseChildren: function(ctx) {
        return ctx.readSequence.call(this, ctx.recognizer);
    },
    generate: function(processChunk, node) {
        processChunk('[');
        this.each(processChunk, node);
        processChunk(']');
    }
};
