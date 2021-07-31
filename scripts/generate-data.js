const fs = require('fs');
const data = require('../data/index.js');

const content = `module.exports = ${JSON.stringify(data, null, 2)}`;
fs.mkdirSync('./generated', { recursive: true });
fs.writeFileSync('./generated/data.js', content);
