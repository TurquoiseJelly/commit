import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, basename, dirname } from 'node:path';
import matter from 'gray-matter';

export function loadContent(contentDir) {
  const entries = readdirSync(contentDir, { recursive: true });
  return entries
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const filePath = join(contentDir, f);
      const raw = readFileSync(filePath, 'utf-8');
      const { data, content } = matter(raw);
      const rel = relative(contentDir, filePath);
      const collection = rel.split('/')[0];
      const slug = basename(f, '.md');
      return { slug, frontmatter: data, body: content, collection };
    });
}
