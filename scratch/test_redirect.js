const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const WORKSPACE_DIR = 'c:\\Users\\Shuvo Debnath\\VsCode\\Varsity Projects\\Ayon';

const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
    let filePath = path.join(WORKSPACE_DIR, req.url.split('?')[0]);
    if (filePath === WORKSPACE_DIR || req.url === '/' || req.url.startsWith('/?')) {
        filePath = path.join(WORKSPACE_DIR, 'index.html');
    }

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end(`File not found: ${req.url}`);
            return;
        }
        const ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
        res.end(content);
    });
});

server.listen(5500, async () => {
    console.log('Test server running at http://127.0.0.1:5500/');

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

    try {
        console.log('Navigating to index.html...');
        await page.goto('http://127.0.0.1:5500/index.html');

        // Click login button
        console.log('Opening Login/Register modal...');
        await page.click('#loginBtn');
        await page.waitForTimeout(500);

        // Click "Register" link in modal to switch view
        console.log('Switching to Register view...');
        await page.click('a:has-text("Register here")');
        await page.waitForTimeout(500);

        // Fill registration fields
        console.log('Entering registration info...');
        await page.fill('#registerName', 'Test Student');
        await page.fill('#registerEmail', 'student@gmail.com');
        await page.fill('#registerPassword', 'student1234');

        // Submit registration form
        console.log('Submitting registration...');
        await page.evaluate(() => {
            const form = document.querySelector('#registerFormView form');
            if (form) {
                const event = new Event('submit', { bubbles: true, cancelable: true });
                form.dispatchEvent(event);
            }
        });
        await page.waitForTimeout(1000);

        // Fill login fields
        console.log('Entering login credentials for student...');
        await page.fill('#loginEmail', 'student@gmail.com');
        await page.fill('#loginPassword', 'student1234');

        // Submit login form
        console.log('Submitting login...');
        await page.evaluate(() => {
            const form = document.querySelector('#loginFormView form');
            if (form) {
                const event = new Event('submit', { bubbles: true, cancelable: true });
                form.dispatchEvent(event);
            }
        });
        await page.waitForTimeout(1000);

        console.log('Page URL after login:', page.url());

        // Check local storage contents
        const storage = await page.evaluate(() => {
            return {
                currentRole: localStorage.getItem('currentRole'),
                currentUser: localStorage.getItem('currentUser'),
                currentUserEmail: localStorage.getItem('currentUserEmail')
            };
        });
        console.log('LocalStorage after login:', storage);

        // Navigate to profile.html via direct navigation
        console.log('Navigating directly to profile.html (typing URL)...');
        await page.goto('http://127.0.0.1:5500/profile.html');
        await page.waitForTimeout(1000);
        console.log('Page URL after direct navigation:', page.url());

        const storageOnProfile = await page.evaluate(() => {
            return {
                currentRole: localStorage.getItem('currentRole'),
                currentUser: localStorage.getItem('currentUser'),
                currentUserEmail: localStorage.getItem('currentUserEmail'),
                windowName: window.name
            };
        });
        console.log('LocalStorage on profile.html:', storageOnProfile);

        // Try navigating via navigateTo('profile')
        console.log('Going back to index.html...');
        await page.goto('http://127.0.0.1:5500/index.html');
        await page.waitForTimeout(500);
        console.log('Triggering navigateTo("profile")...');
        await page.evaluate(() => {
            navigateTo('profile');
        });
        await page.waitForTimeout(1000);
        console.log('Page URL after navigateTo("profile"):', page.url());

    } catch (err) {
        console.error('Test error:', err);
    } finally {
        await browser.close();
        server.close(() => {
            console.log('Test server stopped.');
        });
    }
});
