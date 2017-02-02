var fs = require('fs');
var path = require('path');
var parseJSON = require('json-to-ast');

function JsonLocator(filename) {
    this.filename = path.relative(__dirname + '/../..', filename);
    this.map = Object.create(null);

    var ast = parseJSON(fs.readFileSync(filename, 'utf-8'));

    if (ast && ast.type === 'object') {
        for (var i = 0; i < ast.properties.length; i++) {
            var property = ast.properties[i];

            if (hasOwnProperty.call(this.map, property.key.value)) {
                throw new Error('Duplicate key `' + property.key.value + '` in ' + this.getLocation(property.key.position.start));
            }

            // use JSON.parse to unescape chars
            this.map[JSON.parse('"' + property.key.value + '"')] = {
                loc: this.getLocation(property.key.position.start),
                value: property.value
            };
        }
    }
}

JsonLocator.prototype.getLocation = function(loc) {
    return [
        this.filename,
        loc.line,
        loc.column
    ].join(':');
};

JsonLocator.prototype.get = function(name, index) {
    var loc;

    if (hasOwnProperty.call(this.map, name) === false) {
        throw new Error('Key `' + name + '` not found in ' + this.filename);
    }

    if (typeof index === 'number' && this.map[name].value.type === 'array') {
        if (index in this.map[name].value.items === false) {
            throw new Error('Wrong index `' + index + '` for `' + name + '` in ' + this.filename);
        }
        loc = this.getLocation(this.map[name].value.items[index].position.start);
        name += ' #' + index;
    } else {
        loc = this.map[name].loc;
    }

    return loc + ' (' + name + ')';
};

module.exports = JsonLocator;
