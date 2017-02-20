var Generator = require('./Generator');
var generator = new Generator();

module.exports = generator.generate.bind(generator);
