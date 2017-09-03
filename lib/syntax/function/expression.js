var List = require('../../utils/list');

// legacy IE function
// expression '(' raw ')'
module.exports = function() {
    return new List().appendData(
        this.Raw(this.scanner.getRawLength(0, 0, false))
    );
};
