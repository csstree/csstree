var List = require('../../utils/list');
var COMMA = require('../../tokenizer').TYPE.Comma;

module.exports = {
    name: 'MediaQueryList',
    structure: {
        children: [['MediaQuery']]
    },
    parse: function() {
        var children = this.parseChildren('MediaQueryList');

        return {
            type: 'MediaQueryList',
            loc: this.getLocationFromList(children),
            children: children
        };
    },
    parseChildren: function() {
        var children = new List();

        this.scanner.skipSC();

        while (!this.scanner.eof) {
            children.appendData(this.MediaQuery());

            if (this.scanner.tokenType !== COMMA) {
                break;
            }

            this.scanner.next();
        }

        return children;        
    },
    generate: function(processChunk, node) {
        this.eachComma(processChunk, node);
    }
};
