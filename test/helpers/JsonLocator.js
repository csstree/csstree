var fs = require('fs');
var path = require('path');
var parseJSON = require('json-to-ast');

// TODO: remove when nodejs < 4.0 support dropped
if (typeof Object.assign !== 'function') {
    Object.assign = function(res) {
        for (var i = 1; i < arguments.length; i++) {
            var source = arguments[i];
            for (var key in source) {
                res[key] = source[key];
            }
        }

        return res;
    };
}

function checkForDuplicateKeys(ast, filename) {
    if (!ast) {
        return;
    }

    if (ast.type === 'Object') {
        var map = Object.create(null);

        for (var i = 0; i < ast.children.length; i++) {
            var property = ast.children[i];

            if (hasOwnProperty.call(map, property.key.value)) {
                throw new Error('Duplicate key `' + property.key.value + '` at ' + getLocation(filename, property.key.loc.start));
            }

            map[property.key.value] = true;
            checkForDuplicateKeys(property.value, filename);
        }
    }

    if (ast.type === 'Array') {
        ast.children.forEach(function(item) {
            checkForDuplicateKeys(item, filename);
        });
    }
}

function getLocation(filename, loc) {
    return [
        filename,
        loc.line,
        loc.column
    ].join(':');
}

function JsonLocator(filename) {
    this.filename = path.relative(__dirname + '/../..', filename);
    this.map = Object.create(null);

    try {
        var ast = parseJSON(fs.readFileSync(filename, 'utf-8'), {
            source: this.filename
        });
    } catch (e) {
        console.error(String(e));
        process.exit(1);
    }

    if (ast && ast.type === 'Object') {
        checkForDuplicateKeys(ast, filename);

        for (var i = 0; i < ast.children.length; i++) {
            var property = ast.children[i];

            this.map[property.key.value] = {
                loc: this.getLocation(property.key.loc.start),
                value: property.value
            };
        }
    }
}

JsonLocator.prototype.getLocation = function(loc) {
    return getLocation(this.filename, loc);
};

JsonLocator.prototype.get = function(name, index) {
    var loc;

    if (hasOwnProperty.call(this.map, name) === false) {
        throw new Error('Key `' + name + '` not found in ' + this.filename);
    }

    if (typeof index === 'number' && this.map[name].value.type === 'Array') {
        if (index in this.map[name].value.children === false) {
            throw new Error('Wrong index `' + index + '` for `' + name + '` in ' + this.filename);
        }
        loc = this.getLocation(this.map[name].value.children[index].loc.start);
        name += ' #' + index;
    } else {
        loc = this.map[name].loc;
    }

    return loc + ' (' + name + ')';
};

module.exports = JsonLocator;
