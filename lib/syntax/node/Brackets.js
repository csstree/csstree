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
    parse: function(recognizer, parseChildren) {
        var start = this.scanner.tokenStart;
        var children;

        this.scanner.eat(LEFTSQUAREBRACKET);
        children = typeof parseChildren === 'function'
            ? parseChildren.call(this, recognizer)
            : this.parseChildren('Brackets', recognizer);
        this.scanner.eat(RIGHTSQUAREBRACKET);

        return {
            type: 'Brackets',
            loc: this.getLocation(start, this.scanner.tokenStart),
            children: children
        };
    },
    parseChildren: function(recognizer) {
        return this.readSequence(recognizer);
    },
    generate: function(processChunk, node) {
        processChunk('[');
        this.each(processChunk, node);
        processChunk(']');
    }
};
