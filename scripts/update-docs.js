import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const checkUpdatesNeeded = process.argv[2] === '--lint';

fs.readdirSync(path.join(__dirname, 'docs')).forEach(async (filename) => {
    const name = path.basename(filename);
    const docsFilename = path.join(__dirname, '../docs', name.replace(/\.js$/, '.md'));
    const { default: updateFn } = await import('./docs/' + filename);

    if (!checkUpdatesNeeded) {
        console.log('Synchronizing ' + docsFilename);
    }

    const currentContent = fs.readFileSync(docsFilename, 'utf8').replace(/\r\n/g, '\n');
    const newContent = updateFn(currentContent);

    if (typeof newContent === 'string' && newContent !== currentContent) {
        if (checkUpdatesNeeded) {
            console.error('File ' + docsFilename + ' requires to be up to date.\nRun `npm run update:docs` to fix the problem');
            process.exit(2);
        }

        fs.writeFileSync(docsFilename, newContent, 'utf8');
        console.log('  Updated');
    } else {
        if (!checkUpdatesNeeded) {
            console.log('  No updates');
        }
    }
});
