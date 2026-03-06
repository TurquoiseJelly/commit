import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
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

  // Try index.html for directory URLs (e.g., /blog/ -> /blog/index.html)
  if (urlPath.endsWith('/')) {
    filePath = join(DIST, urlPath, 'index.html');
  }

  // Try appending .html for extension-less URLs
  if (!extname(filePath) && !existsSync(filePath)) {
    filePath += '.html';
  }

  // Path traversal guard
  const resolvedDist = resolve(DIST);
  if (!resolve(filePath).startsWith(resolvedDist + '/') && resolve(filePath) !== resolvedDist) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  if (!existsSync(filePath)) {
    const notFoundPage = join(DIST, '404.html');
    if (existsSync(notFoundPage)) {
      let body404 = readFileSync(notFoundPage, 'utf-8');
      body404 = body404.replace('</body>', `${LR_SCRIPT}\n</body>`);
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(body404);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
    }
    return;
  }

  const ext = extname(filePath);
  const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';
  const charset = contentType.startsWith('text/') ? '; charset=utf-8' : '';
  let body = readFileSync(filePath);

  // Inject livereload script into HTML responses
  if (contentType === 'text/html') {
    body = body.toString().replace('</body>', `${LR_SCRIPT}\n</body>`);
  }

  res.writeHead(200, { 'Content-Type': contentType + charset });
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
