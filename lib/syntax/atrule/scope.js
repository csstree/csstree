export default {
    parse: {
        prelude() {
            return this.createSingleNodeList(
                this.Scope()
            );
        },
        block(nested) {
            return this.Block(nested);
        }
    }
};
