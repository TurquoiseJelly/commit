import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Handlebars from 'handlebars';

let baseTemplate;
const templates = {};

Handlebars.registerHelper('formatDate', (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
});

Handlebars.registerHelper('eq', (a, b) => a === b);

export function loadTemplates(themeName) {
  const dir = join('themes', themeName, 'templates');

  const loadAndCompile = (filePath) => {
    let source;
    try {
      source = readFileSync(filePath, 'utf-8');
    } catch (err) {
      throw new Error(`Template not found: ${filePath}`);
    }
    try {
      return Handlebars.compile(source);
    } catch (err) {
      throw new Error(`Template syntax error in ${filePath}: ${err.message}`);
    }
  };

  baseTemplate = loadAndCompile(join(dir, 'layouts', 'base.html'));

  for (const name of ['index', 'blog', 'page', 'blog-index', 'tag', '404']) {
    templates[name] = loadAndCompile(join(dir, `${name}.html`));
  }
}

export function render(templateName, data) {
  const inner = templates[templateName](data);
  return baseTemplate({ ...data, body: inner });
}
