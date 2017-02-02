var List = require('../../utils/list');

module.exports = {
    expression: function() {
        return new List().appendData(
            this.String()
        );
    },
    block: false
};
