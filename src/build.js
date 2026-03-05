/**
 * @module build
 * @description Main build pipeline for FlatPress.
 * Orchestrates content parsing, template rendering, and asset copying.
 */

import { mkdirSync } from 'fs';

// TODO: implement full build pipeline
mkdirSync('dist', { recursive: true });
