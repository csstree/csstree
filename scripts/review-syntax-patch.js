var fs = require('fs');
var data = require('mdn-data/css');
var patchFilename = 'data/patch.json';
var currentContent = fs.readFileSync(patchFilename, 'utf8').replace(/\r\n/g, '\n');
var csstreePatch = JSON.parse(currentContent);
var checkUpdatesNeeded = process.argv[2] === '--lint';

function checkSection(section) {
    Object.keys(csstreePatch[section]).forEach(function(name) {
        var csstreeSyntax = csstreePatch[section][name];
        var mdnData = data[section][name];
        var id = section + '/' + name;

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
checkSection('syntaxes');

var newContent = JSON.stringify(csstreePatch, null, 4) + '\n';

if (newContent !== currentContent) {
    if (checkUpdatesNeeded) {
        console.error('File ' + patchFilename + ' requires to be up to date.\nRun `node review:syntax-patch` to fix the problem');
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
