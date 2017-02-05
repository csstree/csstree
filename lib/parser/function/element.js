var List = require('../../utils/list');

module.exports = function() {
    this.readSC();

    var id = this.Id();

    this.readSC();

    return new List().appendData(
        id
    );
};
