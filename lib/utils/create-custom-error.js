export function createCustomError(name, message) {
    // use Object.create(), because some VMs prevent setting line/column otherwise
    // (iOS Safari 10 even throws an exception)
    const error = Object.create(SyntaxError.prototype);
    const errorStack = new Error();

    error.name = name;
    error.message = message;

    // use Object.defineProperty() instead of Object.assign() to attach the getter
    // itself, otherwise Object.assign() invokes [[Get]] and evaluates error.stack
    // eagerly, defeating the intended laziness
    Object.defineProperty(error, 'stack', {
        configurable: true,
        get() {
            return (errorStack.stack || '').replace(/^(.+\n){1,3}/, `${name}: ${message}\n`);
        }
    });

    return error;
};
