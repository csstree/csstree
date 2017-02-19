var Generator = require('./Generator');
var generator = new Generator();

module.exports = {
    translate: generator.generate.bind(generator),
    translateWithSourceMap: require('./translateWithSourceMap')
};
