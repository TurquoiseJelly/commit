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

  baseTemplate = Handlebars.compile(
    readFileSync(join(dir, 'layouts', 'base.html'), 'utf-8')
  );

  for (const name of ['index', 'blog', 'page']) {
    templates[name] = Handlebars.compile(
      readFileSync(join(dir, `${name}.html`), 'utf-8')
    );
  }
}

export function render(templateName, data) {
  const inner = templates[templateName](data);
  return baseTemplate({ ...data, body: inner });
}
