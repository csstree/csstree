const csstree = require('../../lib');
let setup;

csstree.fork(setup_ => setup = setup_);

const nameDecorator = {
    atrule: function(name) {
        return '@' + name;
    },
    pseudo: function(name) {
        return ':' + name + '()';
    }
};

function decorateName(type, name) {
    if (nameDecorator.hasOwnProperty(type)) {
        return nameDecorator[type](name);
    }

    return name;
}

module.exports = function(content) {
    return content.replace(/(<!-- gen:(\S+) -->)(?:.|\s)*?(<!-- \/gen:\2 -->)/g, function(m, pre, type, post) {
        const items = Object.keys(setup[type] || {}).sort().map(function(name) {
            return '- `' + decorateName(type, name) + '`';
        });

        return (
            pre + '\n\n' +
            items.join('\n') +
            '\n\n' + post
        );
    });
};
