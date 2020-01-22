const createCustomError = require('../common/create-custom-error');

module.exports = function SyntaxError(message, input, offset) {
    return Object.assign(createCustomError('SyntaxError', message), {
        input,
        offset,
        rawMessage: message,
        message: message + '\n' +
            '  ' + input + '\n' +
            '--' + new Array((offset || input.length) + 1).join('-') + '^'
    });
};
