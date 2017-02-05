var List = require('../../utils/list');

// https://drafts.csswg.org/css-images-4/#element-notation
// https://developer.mozilla.org/en-US/docs/Web/CSS/element
module.exports = function() {
    this.readSC();

    var id = this.Id();

    this.readSC();

    return new List().appendData(
        id
    );
};
