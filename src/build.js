/**
 * @module build
 * @description Main build pipeline for FlatPress.
 * Orchestrates content parsing, template rendering, and asset copying.
 */

import { mkdirSync, writeFileSync } from 'fs';

// TODO: implement full build pipeline
mkdirSync('dist', { recursive: true });
writeFileSync('dist/index.html', '<!doctype html><html><head><title>FlatPress</title></head><body><h1>FlatPress</h1><p>Site coming soon.</p></body></html>\n');
