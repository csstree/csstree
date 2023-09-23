export default {
    parse: {
        prelude() {
            return this.createSingleNodeList(
                this.Condition('supports')
            );
        },
        block(isStyleBlock = false) {
            return this.Block(isStyleBlock);
        }
    }
};
