module.exports = function Rule() {
    var start = this.scanner.tokenStart;
    var selector = this.SelectorList();
    var block = this.Block();

    return {
        type: 'Rule',
        loc: this.getLocation(start, this.scanner.tokenStart),
        selector: selector,
        block: block
    };
};
