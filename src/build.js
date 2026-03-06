import { readFileSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { loadContent } from './content.js';
import { renderMarkdown } from './renderer.js';
import { loadTemplates, render } from './templates.js';
import { copyAssets } from './assets.js';
import { generateFeed } from './feed.js';
import { generateSitemap } from './sitemap.js';

export function build() {
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
  .filter(i => !i.frontmatter.draft)
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

// Blog index pagination
const postsPerPage = config.blog?.postsPerPage || 5;
const totalPages = Math.max(1, Math.ceil(posts.length / postsPerPage));
const postData = (p) => ({
  slug: p.slug,
  title: p.frontmatter.title,
  date: p.frontmatter.date,
  description: p.frontmatter.description,
});

for (let page = 1; page <= totalPages; page++) {
  const start = (page - 1) * postsPerPage;
  const pagePosts = posts.slice(start, start + postsPerPage);
  const prevUrl = page > 1 ? (page === 2 ? `${config.site.baseUrl}blog/` : `${config.site.baseUrl}blog/page/${page - 1}/`) : null;
  const nextUrl = page < totalPages ? `${config.site.baseUrl}blog/page/${page + 1}/` : null;

  const html = render('blog-index', {
    title: 'Blog',
    posts: pagePosts.map(postData),
    pagination: { current: page, total: totalPages, prevUrl, nextUrl },
    site: config.site,
  });

  const outPath = page === 1
    ? join(outputDir, 'blog', 'index.html')
    : join(outputDir, 'blog', 'page', String(page), 'index.html');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html);
}

// Tag pages
const tagMap = {};
for (const post of posts) {
  for (const tag of post.frontmatter.tags || []) {
    const slug = tag.toLowerCase().replace(/\s+/g, '-');
    if (!tagMap[slug]) tagMap[slug] = { name: tag, posts: [] };
    tagMap[slug].posts.push(post);
  }
}

for (const [slug, { name, posts: tagPosts }] of Object.entries(tagMap)) {
  const html = render('tag', {
    tag: name,
    title: `Posts tagged "${name}"`,
    posts: tagPosts.map(postData),
    site: config.site,
  });
  const outPath = join(outputDir, 'blog', 'tags', slug, 'index.html');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html);
}

// Render pages
for (const page of pages) {
  const content = renderMarkdown(page.body);
  const template = page.frontmatter.template || 'page';
  const data = { ...page.frontmatter, content, site: config.site };

  if (template === 'index') {
    data.posts = posts.slice(0, 5).map(postData);
  }

  const html = render(template, data);
  const outPath = template === 'index'
    ? join(outputDir, 'index.html')
    : join(outputDir, `${page.slug}.html`);
  writeFileSync(outPath, html);
}

// Generate feed and sitemap
writeFileSync(join(outputDir, 'feed.xml'), generateFeed(posts, config, renderMarkdown));
writeFileSync(join(outputDir, 'sitemap.xml'), generateSitemap(pages, posts, config, tagMap, totalPages));

// Copy assets
copyAssets(config);

const tagCount = Object.keys(tagMap).length;
console.log(`Built ${posts.length} posts, ${pages.length} pages, ${totalPages} blog index pages, ${tagCount} tag pages, feed.xml, and sitemap.xml to ${outputDir}/`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  build();
}
