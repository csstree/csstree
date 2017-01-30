var List = require('../../utils/list');
var TYPE = require('../../scanner').TYPE;

var WHITESPACE = TYPE.Whitespace;
var COMMENT = TYPE.Comment;
var EXCLAMATIONMARK = TYPE.ExclamationMark;
var COMMERCIALAT = TYPE.CommercialAt;
var RIGHTCURLYBRACKET = TYPE.RightCurlyBracket;

module.exports = function StyleSheet(nested) {
    var start = this.scanner.tokenStart;
    var children = new List();
    var child;

    scan:
    while (!this.scanner.eof) {
        switch (this.scanner.tokenType) {
            case WHITESPACE:
                this.scanner.next();
                continue;

            case RIGHTCURLYBRACKET:
                if (!nested) {
                    this.scanner.error('Unexpected right curly brace');
                }

                break scan;

            case COMMENT:
                // ignore comments except exclamation comments (i.e. /*! .. */) on top level
                if (nested || this.scanner.source.charCodeAt(this.scanner.tokenStart + 2) !== EXCLAMATIONMARK) {
                    this.scanner.next();
                    continue;
                }

                child = this.Comment();
                break;

            case COMMERCIALAT:
                child = this.Atrule();
                break;

            default:
                child = this.Rule();
        }

        children.appendData(child);
    }

    return {
        type: 'StyleSheet',
        loc: this.getLocation(start, this.scanner.tokenStart),
        children: children
    };
};
