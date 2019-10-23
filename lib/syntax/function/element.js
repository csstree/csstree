// https://drafts.csswg.org/css-images-4/#element-notation
// https://developer.mozilla.org/en-US/docs/Web/CSS/element
module.exports = function() {
    this.skipSC();

    var children = this.createSingleNodeList(
        this.IdSelector()
    );

    this.skipSC();

    return children;
};
