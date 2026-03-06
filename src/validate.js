import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { loadContent } from './content.js';

export function validateAll() {
  const errors = [];
  const warnings = [];

  // Config validation
  let config;
  try {
    config = yaml.load(readFileSync('config.yaml', 'utf-8'));
  } catch {
    return { errors: ['config.yaml: could not parse YAML'], warnings: [] };
  }

  for (const key of ['site', 'theme', 'build']) {
    if (!config[key]) errors.push(`config.yaml: missing required key "${key}"`);
  }
  if (config.site) {
    for (const key of ['title', 'baseUrl']) {
      if (!config.site[key]) errors.push(`config.yaml: missing required key "site.${key}"`);
    }
  }
  if (config.build) {
    for (const key of ['contentDir', 'outputDir']) {
      if (!config.build[key]) errors.push(`config.yaml: missing required key "build.${key}"`);
    }
  }

  // Warn on relative baseUrl
  if (config.site?.baseUrl && !config.site.baseUrl.startsWith('http')) {
    warnings.push(`config.yaml: baseUrl "${config.site.baseUrl}" is relative — feed, sitemap, and canonical URLs require an absolute URL for deployment`);
  }

  // Validate theme directory
  if (config.theme) {
    const themeDir = join('themes', config.theme, 'templates');
    if (!existsSync(themeDir)) {
      errors.push(`config.yaml: theme "${config.theme}" not found — directory "${themeDir}" does not exist`);
      return { errors, warnings };
    }
  }

  if (!config.build?.contentDir || !config.theme) return { errors, warnings };

  // Content validation
  const items = loadContent(config.build.contentDir);
  for (const item of items) {
    const fp = join(config.build.contentDir, item.filePath);
    for (const field of ['title', 'date', 'template']) {
      if (!item.frontmatter[field]) {
        errors.push(`${fp}: missing required field "${field}"`);
      }
    }
    if (item.frontmatter.template) {
      const tplPath = join('themes', config.theme, 'templates', `${item.frontmatter.template}.html`);
      if (!existsSync(tplPath)) {
        errors.push(`${fp}: template "${item.frontmatter.template}" not found in theme "${config.theme}"`);
      }
    }
  }

  // Slug collision detection
  const slugMap = {};
  for (const item of items) {
    const key = `${item.collection}/${item.slug}`;
    if (slugMap[key]) {
      const fp = join(config.build.contentDir, item.filePath);
      errors.push(`${fp}: slug collision — "${key}" already used by ${slugMap[key]}`);
    } else {
      slugMap[key] = join(config.build.contentDir, item.filePath);
    }
  }

  return { errors, warnings };
}

// Standalone runner
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { errors, warnings } = validateAll();
  warnings.forEach(w => console.warn(`Warning: ${w}`));
  if (errors.length) {
    errors.forEach(e => console.error(e));
    process.exit(1);
  } else {
    console.log('Validation passed.');
  }
}
