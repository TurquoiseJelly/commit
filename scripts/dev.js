import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { watch } from 'chokidar';
import livereload from 'livereload';
import { build } from '../src/build.js';

const PORT = process.env.PORT || 3000;
const DIST = 'dist';

const CONTENT_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const LR_SCRIPT = '<script src="http://localhost:35729/livereload.js?snipver=1"></script>';

// Initial build
build();

// Static file server
const server = createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';

  let filePath = join(DIST, urlPath);

  // Try appending .html for extension-less URLs
  if (!extname(filePath) && !existsSync(filePath)) {
    filePath += '.html';
  }

  if (!existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
    return;
  }

  const ext = extname(filePath);
  const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';
  let body = readFileSync(filePath);

  // Inject livereload script into HTML responses
  if (contentType === 'text/html') {
    body = body.toString().replace('</body>', `${LR_SCRIPT}\n</body>`);
  }

  res.writeHead(200, { 'Content-Type': contentType });
  res.end(body);
});

server.listen(PORT, () => {
  console.log(`Dev server running at http://localhost:${PORT}`);
});

// LiveReload server — watches dist/ for changes
const lr = livereload.createServer();
lr.watch(DIST);

// File watcher — rebuild on source changes
let debounceTimer;
watch(['content/', 'themes/', 'static/', 'config.yaml'], {
  ignoreInitial: true,
}).on('all', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    try {
      build();
      console.log('Rebuilt.');
    } catch (err) {
      console.error('Build error:', err.message);
    }
  }, 100);
});
