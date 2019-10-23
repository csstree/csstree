// legacy IE function
// expression( <any-value> )
module.exports = function() {
    return this.createSingleNodeList(
        this.Raw(this.tokenIndex, null, false)
    );
};
