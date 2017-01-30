var DISALLOW_VAR = true;

// https://drafts.csswg.org/css-syntax-3/#the-anb-type
module.exports = function Nth(allowOfClause) {
    this.readSC();

    var start = this.scanner.tokenStart;
    var end;
    var selector = null;
    var query;

    if (this.scanner.lookupValue(0, 'odd') || this.scanner.lookupValue(0, 'even')) {
        query = this.Identifier(DISALLOW_VAR);
        end = this.scanner.tokenStart;
    } else {
        query = this.AnPlusB();
    }

    this.readSC();

    if (allowOfClause && this.scanner.lookupValue(0, 'of')) {
        this.scanner.next();

        selector = this.SelectorList();

        if (this.needPositions) {
            end = selector.children.last().children.last().loc.end.offset;
        }
    } else {
        if (this.needPositions) {
            end = query.loc.end.offset;
        }
    }

    return {
        type: 'Nth',
        loc: this.getLocation(start, end),
        nth: query,
        selector: selector
    };
};
