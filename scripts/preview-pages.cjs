const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const buildPages = require('./build-pages.cjs');

const output = buildPages();
const prefix = '/port-portfolio/';
const types = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'};
const server = http.createServer((req, res) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
    catch { res.writeHead(400).end(); return; }
    if (pathname === '/') { res.writeHead(302,{Location:prefix}).end(); return; }
    const file = path.resolve(output, pathname.slice(prefix.length) || 'index.html');
    if (!pathname.startsWith(prefix) || !file.startsWith(output + path.sep) || !fs.statSync(file,{throwIfNoEntry:false})?.isFile()) {
        res.writeHead(404).end(); return;
    }
    res.writeHead(200,{'Content-Type':types[path.extname(file)] || 'application/octet-stream'});
    fs.createReadStream(file).pipe(res);
});
server.listen(Number(process.env.PREVIEW_PORT || 4173),'127.0.0.1',()=>console.log(`Port: http://127.0.0.1:${server.address().port}${prefix}`));
