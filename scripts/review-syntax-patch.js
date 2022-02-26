import fs from 'fs';
import path from 'path';
import data from 'mdn-data/css/index.js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const patchFilename = path.join(__dirname, '../data/patch.json');
const currentContent = fs.readFileSync(patchFilename, 'utf8').replace(/\r\n/g, '\n');
const csstreePatch = JSON.parse(currentContent);
const checkUpdatesNeeded = process.argv[2] === '--lint';

function checkSection(section, mdnDataSection = section) {
    Object.keys(csstreePatch[section]).forEach(function(name) {
        const csstreeSyntax = csstreePatch[section][name];
        const mdnData = data[mdnDataSection][name];
        const id = `${section}/${name}`;

        if (mdnData && csstreeSyntax.syntax === mdnData.syntax.replace(/[ ]*\n[ ]*/g, ' ')) {
            delete csstreePatch[section][name];

            if (checkUpdatesNeeded) {
                console.error(id, 'is equal to mdn/data syntax (patch is redundant)');
                console.log('   ', [
                    csstreeSyntax.syntax,
                    mdnData.syntax
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
