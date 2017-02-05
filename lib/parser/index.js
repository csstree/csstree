var Parser = require('./Parser');
var parser = new Parser();

module.exports = parser.parse.bind(parser);
