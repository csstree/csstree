var List = require('../../utils/list');
var TYPE = require('../../tokenizer').TYPE;

var WHITESPACE = TYPE.WhiteSpace;
var COMMENT = TYPE.Comment;
var EXCLAMATIONMARK = TYPE.ExclamationMark;
var ATRULE = TYPE.Atrule;
var CDO = TYPE.CDO;
var CDC = TYPE.CDC;

function consumeRaw(startToken) {
    return this.Raw(startToken, 0, 0, false, false);
}

module.exports = {
    name: 'StyleSheet',
    structure: {
        children: [['Comment', 'Atrule', 'Rule', 'Raw']]
    },
    parse: function() {
        var start = this.scanner.tokenStart;
        var children = this.parseChildren('StyleSheet');

        return {
            type: 'StyleSheet',
            loc: this.getLocation(start, this.scanner.tokenStart),
            children: children
        };
    },
    parseChildren: function() {
        var children = new List();
        var child = null;

        scan:
        while (!this.scanner.eof) {
            switch (this.scanner.tokenType) {
                case WHITESPACE:
                    this.scanner.next();
                    continue;

                case COMMENT:
                    // ignore comments except exclamation comments (i.e. /*! .. */) on top level
                    if (this.scanner.source.charCodeAt(this.scanner.tokenStart + 2) !== EXCLAMATIONMARK) {
                        this.scanner.next();
                        continue;
                    }

                    child = this.Comment();
                    break;

                default:
                    child = this.recognizeChild('StyleSheet');
            }

            children.appendData(child);
        }

        return children;
    },
    recognizeChild: function() {
        switch (this.scanner.tokenType) {
            case CDO: // <!--
                return this.CDO();

            case CDC: // -->
                return this.CDC();

            // CSS Syntax Module Level 3
            // §2.2 Error handling
            // At the "top level" of a stylesheet, an <at-keyword-token> starts an at-rule.
            case ATRULE:
                return this.Atrule();

            // Anything else starts a qualified rule ...
            default:
                return this.tolerantParse(this.Rule, consumeRaw);
        }
    },
    generate: function(processChunk, node) {
        this.each(processChunk, node);
    },
    walkContext: 'stylesheet'
};
