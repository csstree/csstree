import { createServer } from 'http';
import { readFile, readFileSync } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const asyncExec = promisify(exec);

const port = process.env.PORT || 8125;
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json'
};

async function buildScript() {
    const script = readFileSync('scripts/generate-safe/script.js', 'utf8');
    const { stdout } = await asyncExec(
        'node -e "' +
        'import(\'./scripts/generate-safe/fixture.js\').then(({fixture})=>' +
        'console.log(JSON.stringify(fixture))' +
        ')"'
    );

    return script.replace('[]', stdout);
}

createServer(function (request, response) {
    console.log('Request', request.url);

    let filePath = request.url;

    switch (filePath) {
        case '/':
            filePath = 'scripts/generate-safe/index.html';
            break;

        case '/script.js':
            buildScript().then(res => {
                // console.log(Object.keys(res.outputFiles[0]));
                response.writeHead(200, { 'Content-Type': 'text/javascript' });
                response.end(res, 'utf-8');
            });

            return;

        default:
            response.writeHead(400, { 'Content-Type': 'text/html' });
            response.end('Bad request', 'utf-8');
    }

    const extname = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    readFile(filePath, function(error, content) {
        if (error) {
            if (error.code == 'ENOENT') {
                readFile('./404.html', function(error, content) {
                    response.writeHead(404, { 'Content-Type': 'text/html' });
                    response.end(content, 'utf-8');
                });
            } else {
                response.writeHead(500);
                response.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
            }
        } else {
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
    });

}).listen(port, function() {
    console.log('Server running at http://127.0.0.1:8125/');
});
