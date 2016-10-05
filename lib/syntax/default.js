var data = require('../../data');

module.exports = require('./syntax').create({
    generic: true,
    types: data.types,
    properties: data.properties
});
