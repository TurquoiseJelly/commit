function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateSitemap(pages, posts, config, tagMap, totalPages) {
  const baseUrl = config.site.baseUrl;

  if (!baseUrl.startsWith('http')) {
    console.warn('Warning: sitemap.xml requires an absolute baseUrl (starting with http). Generating empty sitemap.');
    return `<?xml version="1.0" encoding="utf-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>\n`;
  }

  const urls = [];

  const addUrl = (loc, lastmod) => {
    urls.push(`  <url>\n    <loc>${escapeXml(baseUrl + loc)}</loc>${lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : ''}\n  </url>`);
  };

  // Homepage
  addUrl('');

  // Pages
  for (const page of pages) {
    const slug = page.frontmatter.template === 'index' ? '' : `${page.slug}.html`;
    if (slug) {
      const date = page.frontmatter.date ? new Date(page.frontmatter.date).toISOString().slice(0, 10) : undefined;
      addUrl(slug, date);
    }
  }

  // Blog posts
  for (const post of posts) {
    const date = new Date(post.frontmatter.date).toISOString().slice(0, 10);
    addUrl(`blog/${post.slug}.html`, date);
  }

  // Blog index pages
  for (let i = 1; i <= totalPages; i++) {
    addUrl(i === 1 ? 'blog/' : `blog/page/${i}/`);
  }

  // Tag pages
  for (const slug of Object.keys(tagMap)) {
    addUrl(`blog/tags/${slug}/`);
  }

  return `<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;
}
