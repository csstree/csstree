export default {
    parse: {
        prelude: null,
        block(nested) {
            return this.Block(nested);
        }
    }
};
