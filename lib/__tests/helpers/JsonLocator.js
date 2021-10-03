import fs from 'fs';
import path from 'path';
import parseJSON from 'json-to-ast';

export class JsonLocator {
    constructor(filename) {
        let ast = null;

        this.filename = path.relative(process.cwd(), filename);
        this.map = new Map();

        try {
            ast = parseJSON(fs.readFileSync(filename, 'utf-8'), {
                source: this.filename
            });
        } catch (e) {
            console.error(String(e));
            process.exit(1);
        }

        if (ast !== null && ast.type === 'Object') {
            this.checkForDuplicateKeys(ast, filename);

            for (const property of ast.children) {
                this.map.set(property.key.value, property);
            }
        }
    }

    checkForDuplicateKeys(node) {
        if (!node) {
            return;
        }

        if (node.type === 'Object') {
            const keys = new Set();

            for (const { key, value } of node.children) {
                if (keys.has(key.value)) {
                    throw new Error('Duplicate key `' + key.value + '` at ' + this.getLocation(key.loc.start));
                }

                keys.add(key.value);
                this.checkForDuplicateKeys(value);
            }
        }

        if (node.type === 'Array') {
            node.children.forEach(this.checkForDuplicateKeys, this);
        }
    }

    getLocation(loc) {
        return `${this.filename}:${loc.line}:${loc.column}`;
    }

    get(name, index) {
        const property = this.map.get(name);
        let loc;

        if (!property) {
            throw new Error('Key `' + name + '` not found in ' + this.filename);
        }

        if (typeof index === 'number' && property.value.type === 'Array') {
            if (index in property.value.children === false) {
                throw new Error('Wrong index `' + index + '` for `' + name + '` in ' + this.filename);
            }
            loc = this.getLocation(property.value.children[index].loc.start);
            name += ' #' + index;
        } else {
            loc = this.getLocation(property.key.loc.start);
        }

        return loc + ' (' + name + ')';
    }
};
