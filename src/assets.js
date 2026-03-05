import { cpSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export function copyAssets(config) {
  const outputDir = config.build.outputDir;
  const staticDir = config.build.staticDir;
  const themeAssets = join('themes', config.theme, 'assets');

  if (existsSync(staticDir)) {
    cpSync(staticDir, outputDir, { recursive: true });
  }
  if (existsSync(themeAssets)) {
    cpSync(themeAssets, join(outputDir, 'assets'), { recursive: true });
  }
}
