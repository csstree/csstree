// legacy IE function
// expression '(' raw ')'
module.exports = function() {
    return this.createSingleNodeList(
        this.Raw(this.scanner.tokenIndex, 0, 0, false, false)
    );
};
