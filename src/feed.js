function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function generateFeed(posts, config, renderMarkdown) {
  const baseUrl = config.site.baseUrl;

  if (!baseUrl.startsWith('http')) {
    console.warn('Warning: feed.xml requires an absolute baseUrl (starting with http). Generating empty feed.');
    return `<?xml version="1.0" encoding="utf-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom">\n  <title>${escapeXml(config.site.title)}</title>\n</feed>\n`;
  }

  const limit = config.blog?.feedLimit || 20;
  const recent = posts.slice(0, limit);
  const updated = recent.length ? new Date(recent[0].frontmatter.date).toISOString() : new Date().toISOString();

  const entries = recent.map(post => {
    const url = `${baseUrl}blog/${post.slug}.html`;
    const date = new Date(post.frontmatter.date).toISOString();
    const content = renderMarkdown(post.body);
    return `  <entry>
    <title>${escapeXml(post.frontmatter.title)}</title>
    <link href="${escapeXml(url)}"/>
    <id>${escapeXml(url)}</id>
    <updated>${date}</updated>${post.frontmatter.description ? `
    <summary>${escapeXml(post.frontmatter.description)}</summary>` : ''}
    <content type="html"><![CDATA[${content}]]></content>
  </entry>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(config.site.title)}</title>
  <link href="${escapeXml(baseUrl)}"/>
  <link href="${escapeXml(baseUrl)}feed.xml" rel="self"/>
  <id>${escapeXml(baseUrl)}</id>
  <updated>${updated}</updated>
${entries}
</feed>
`;
}
