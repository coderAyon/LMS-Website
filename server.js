const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const BASE_DIR = __dirname;
let CURRENT_PORT = parseInt(process.env.PORT, 10) || 5500;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.htm': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf'
};

function getSafeFilePath(urlPath) {
    const cleanPath = decodeURIComponent(urlPath.split('?')[0]);
    let target = cleanPath === '/' ? '/index.html' : cleanPath;
    let fullPath = path.normalize(path.join(BASE_DIR, target));

    // Support extensionless URLs (e.g. /catalog -> /catalog.html)
    if (!fs.existsSync(fullPath) && !path.extname(fullPath)) {
        if (fs.existsSync(fullPath + '.html')) {
            fullPath = fullPath + '.html';
        }
    }

    if (!fullPath.startsWith(BASE_DIR)) {
        return null;
    }
    return fullPath;
}

function requestHandler(req, res) {
    // Add CORS headers for local API and asset requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const filePath = getSafeFilePath(req.url);

    if (!filePath || !fs.existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
            <!DOCTYPE html>
            <html lang="en">
            <head><title>404 Not Found — GBLMS</title></head>
            <body style="font-family: sans-serif; text-align: center; padding: 4rem;">
                <h1 style="color: #dc2626;">404 — Resource Not Found</h1>
                <p>The requested file does not exist in the LMS portal directory.</p>
                <a href="/" style="color: #2563eb; font-weight: bold;">Return to Home</a>
            </body>
            </html>
        `);
        return;
    }

    // If it's a directory, look for index.html
    let finalPath = filePath;
    try {
        const stats = fs.statSync(finalPath);
        if (stats.isDirectory()) {
            finalPath = path.join(finalPath, 'index.html');
            if (!fs.existsSync(finalPath)) {
                res.writeHead(403);
                res.end('Directory listing forbidden.');
                return;
            }
        }
    } catch (e) {
        res.writeHead(500);
        res.end('Server file error');
        return;
    }

    const ext = path.extname(finalPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Disable caching for active development so changes reflect immediately
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    const stream = fs.createReadStream(finalPath);
    res.writeHead(200, { 'Content-Type': contentType });
    stream.pipe(res);
    stream.on('error', () => {
        if (!res.headersSent) {
            res.writeHead(500);
            res.end('File streaming error');
        }
    });
}

function startServer(port) {
    const server = http.createServer(requestHandler);

    server.listen(port, () => {
        const url = `http://localhost:${port}`;
        console.log('');
        console.log('============================================================');
        console.log('       GBLMS - LIBRARY MANAGEMENT SYSTEM IS RUNNING         ');
        console.log('============================================================');
        console.log(` [+] Local Server URL : ${url}`);
        console.log(` [+] Directory        : ${BASE_DIR}`);
        console.log(` [+] Status           : Ready & Active`);
        console.log('============================================================');
        console.log(' [*] Opening your default web browser...');
        console.log(' [*] Press Ctrl + C in this terminal window to stop server.');
        console.log('============================================================');
        console.log('');

        // Automatically open the default browser on Windows
        exec(`start "" "${url}"`, (err) => {
            if (err) {
                console.log(` [!] Could not auto-open browser. Please visit manually: ${url}`);
            }
        });
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(` [!] Port ${port} is in use. Trying port ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error(' [!] Server error:', err.message);
        }
    });
}

startServer(CURRENT_PORT);
