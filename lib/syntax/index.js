module.exports = require('./create').create({
    ...require('./config/lexer'),
    ...require('./config/parser'),
    ...require('./config/walker')
});
module.exports.version = require('../../package.json').version;
