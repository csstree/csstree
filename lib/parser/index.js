var Parser = require('./Parser');
var parser = new Parser();

// warm up parse to elimitate code branches that never execute
// fix soft deoptimizations (insufficient type feedback)
parser.parse(
    'a.b#c:e:Not(a/**/):AFTER:Nth-child(2n+1)::g::slotted(a/**/),* b >c+d~e/deep/f,100%{' +
    'v:U+123 1 2em t a(2%, var(--a)) -b() url(..) -foo-bar !important}'
);

module.exports = parser.parse.bind(parser);
