// Guard to mitigate the risk of reading non-own properties,
// which can be a potential issue when working with dictionaries
Object.defineProperty(Object.prototype, '__proto_pollute__', {
    enumerable: true,
    get() {
        throw new Error('Attempted to read a non-own property');
    }
});
