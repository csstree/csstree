import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const webrefCss = require('@webref/css/css.json');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const patchFilename = path.join(__dirname, '../data/patch.json');
const currentContent = fs.readFileSync(patchFilename, 'utf8').replace(/\r\n/g, '\n');
const csstreePatch = JSON.parse(currentContent);
const checkUpdatesNeeded = process.argv[2] === '--lint';

// Convert @webref/css arrays to indexed objects
const data = {
    properties: {},
    syntaxes: {}
};

for (const property of webrefCss.properties) {
    // Only include properties that have syntax
    if (property.syntax) {
        data.properties[property.name] = {
            syntax: property.syntax
        };
    }
}

// Only include types that have syntax definitions
// Types without syntax in @webref/css can be provided by patch.json
for (const type of webrefCss.types) {
    if (type.syntax) {
        data.syntaxes[type.name] = {
            syntax: type.syntax
        };
    }
}

// Also include functions from @webref/css
// In mdn-data, functions were stored in syntaxes, but @webref/css separates them
// Only include functions that have syntax definitions
for (const func of webrefCss.functions) {
    if (func.syntax) {
        // Function names in @webref/css include parentheses (e.g., "abs()")
        data.syntaxes[func.name] = {
            syntax: func.syntax
        };
    }
}

function checkSection(section, webrefDataSection = section) {
    Object.keys(csstreePatch[section]).forEach(function(name) {
        const csstreeSyntax = csstreePatch[section][name];
        const webrefData = data[webrefDataSection][name];
        const id = `${section}/${name}`;

        if (webrefData && csstreeSyntax.syntax === webrefData.syntax.replace(/[ ]*\n[ ]*/g, ' ')) {
            delete csstreePatch[section][name];

            if (checkUpdatesNeeded) {
                console.error(id, 'is equal to @webref/css syntax (patch is redundant)');
                console.log('   ', [
                    csstreeSyntax.syntax,
                    webrefData.syntax
                ].join('\n    '));
                console.log();
            } else {
                console.log('Remove redundant syntax:', id);
            }
        }
    });
}

checkSection('properties');
checkSection('types', 'syntaxes');

const newContent = JSON.stringify(csstreePatch, null, 4) + '\n';

if (newContent !== currentContent) {
    if (checkUpdatesNeeded) {
        console.error('File ' + patchFilename + ' requires to be up to date.\nRun `npm run review:syntax-patch` to fix the problem');
        process.exit(2);
    }

    fs.writeFileSync(patchFilename, newContent, 'utf8');
    console.log();
    console.log(patchFilename + ' updated');
} else {
    if (!checkUpdatesNeeded) {
        console.log('No changes');
    }
}
