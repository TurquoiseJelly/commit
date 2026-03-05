import { readFileSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import yaml from 'js-yaml';
import { loadContent } from './content.js';
import { renderMarkdown } from './renderer.js';
import { loadTemplates, render } from './templates.js';
import { copyAssets } from './assets.js';

const config = yaml.load(readFileSync('config.yaml', 'utf-8'));
const outputDir = config.build.outputDir;

// Clean and create output directory
rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

// Load content and templates
const items = loadContent(config.build.contentDir);
loadTemplates(config.theme);

// Separate and sort
const posts = items
  .filter(i => i.collection === 'blog')
  .sort((a, b) => new Date(b.frontmatter.date) - new Date(a.frontmatter.date));

const pages = items.filter(i => i.collection === 'pages');

// Render blog posts
for (const post of posts) {
  const content = renderMarkdown(post.body);
  const html = render('blog', {
    ...post.frontmatter, content, site: config.site,
  });
  const outPath = join(outputDir, 'blog', `${post.slug}.html`);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html);
}

// Render pages
for (const page of pages) {
  const content = renderMarkdown(page.body);
  const template = page.frontmatter.template || 'page';
  const data = { ...page.frontmatter, content, site: config.site };

  if (template === 'index') {
    data.posts = posts.map(p => ({
      slug: p.slug,
      title: p.frontmatter.title,
      date: p.frontmatter.date,
      description: p.frontmatter.description,
    }));
  }

  const html = render(template, data);
  const outPath = template === 'index'
    ? join(outputDir, 'index.html')
    : join(outputDir, `${page.slug}.html`);
  writeFileSync(outPath, html);
}

// Copy assets
copyAssets(config);

console.log(`Built ${posts.length} posts and ${pages.length} pages to ${outputDir}/`);
