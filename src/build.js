import { readFileSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { loadContent } from './content.js';
import { renderMarkdown } from './renderer.js';
import { loadTemplates, render, slugifyTag } from './templates.js';
import { copyAssets } from './assets.js';
import { generateFeed } from './feed.js';
import { generateSitemap } from './sitemap.js';

export function build() {
const startTime = performance.now();

let config;
try {
  config = yaml.load(readFileSync('config.yaml', 'utf-8'));
} catch (err) {
  console.error(`Error: Could not load config.yaml — ${err.message}`);
  process.exit(1);
}

const outputDir = config.build.outputDir;

const absUrl = (path) => {
  const base = config.site.baseUrl;
  if (base.startsWith('http')) return `${base.replace(/\/$/, '')}/${path}`;
  return null;
};

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
  .sort((a, b) => { const d = new Date(b.frontmatter.date) - new Date(a.frontmatter.date); return d !== 0 ? d : a.slug.localeCompare(b.slug); });

const pages = items.filter(i => i.collection === 'pages');

// Render blog posts
for (const post of posts) {
  const content = renderMarkdown(post.body);
  const html = render('blog', {
    ...post.frontmatter, content, site: config.site,
    canonicalUrl: absUrl(`blog/${post.slug}.html`),
    ogType: 'article',
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

  const indexPath = page === 1 ? 'blog/' : `blog/page/${page}/`;
  const html = render('blog-index', {
    title: 'Blog',
    posts: pagePosts.map(postData),
    pagination: { current: page, total: totalPages, prevUrl, nextUrl },
    site: config.site,
    canonicalUrl: absUrl(indexPath),
    ogType: 'website',
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
    const slug = slugifyTag(tag);
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
    canonicalUrl: absUrl(`blog/tags/${slug}/`),
    ogType: 'website',
  });
  const outPath = join(outputDir, 'blog', 'tags', slug, 'index.html');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html);
}

// Render pages
for (const page of pages) {
  const content = renderMarkdown(page.body);
  const template = page.frontmatter.template || 'page';
  const pagePath = template === 'index' ? '' : `${page.slug}.html`;
  const data = {
    ...page.frontmatter, content, site: config.site,
    canonicalUrl: absUrl(pagePath),
    ogType: 'website',
  };

  if (template === 'index') {
    data.posts = posts.slice(0, postsPerPage).map(postData);
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

// 404 page
const notFoundHtml = render('404', {
  title: '404 — Not Found',
  description: 'Page not found',
  site: config.site,
  canonicalUrl: null,
  ogType: 'website',
});
writeFileSync(join(outputDir, '404.html'), notFoundHtml);

// Generate robots.txt
const robotsLines = ['User-agent: *', 'Allow: /'];
const sitemapUrl = absUrl('sitemap.xml');
if (sitemapUrl) robotsLines.push(`Sitemap: ${sitemapUrl}`);
writeFileSync(join(outputDir, 'robots.txt'), robotsLines.join('\n') + '\n');

// Copy assets
copyAssets(config);

const tagCount = Object.keys(tagMap).length;
const elapsed = (performance.now() - startTime).toFixed(0);
const totalFiles = posts.length + pages.length + totalPages + tagCount + 4; // +4 for feed, sitemap, 404, robots.txt
console.log(`Built ${totalFiles} files (${posts.length} posts, ${pages.length} pages, ${totalPages} blog index, ${tagCount} tag pages, feed, sitemap, robots.txt, 404) in ${elapsed}ms`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    build();
  } catch (err) {
    console.error(`Build failed: ${err.message}`);
    process.exit(1);
  }
}
