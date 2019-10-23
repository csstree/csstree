const { TYPE: { WhiteSpace, Comment } } = require('../tokenizer');

module.exports = function readSequence(recognizer) {
    const children = this.createList();
    const context = {
        recognizer: recognizer,
        space: null,
        ignoreWS: false,
        ignoreWSAfter: false
    };

    this.skipSC();

    while (!this.eof) {
        switch (this.tokenType) {
            case Comment:
                this.next();
                continue;

            case WhiteSpace:
                if (context.ignoreWS) {
                    this.next();
                } else {
                    context.space = this.WhiteSpace();
                }
                continue;
        }

        let child = recognizer.getNode.call(this, context);

        if (child === undefined) {
            break;
        }

        if (context.space !== null) {
            children.push(context.space);
            context.space = null;
        }

        children.push(child);

        if (context.ignoreWSAfter) {
            context.ignoreWSAfter = false;
            context.ignoreWS = true;
        } else {
            context.ignoreWS = false;
        }
    }

    return children;
};
