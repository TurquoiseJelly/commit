import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, basename, dirname } from 'node:path';
import matter from 'gray-matter';

export function loadContent(contentDir) {
  let entries;
  try {
    entries = readdirSync(contentDir, { recursive: true });
  } catch (err) {
    throw new Error(`Could not read content directory "${contentDir}": ${err.message}`);
  }
  return entries
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const filePath = join(contentDir, f);
      let raw;
      try {
        raw = readFileSync(filePath, 'utf-8');
      } catch (err) {
        throw new Error(`Could not read ${filePath}: ${err.message}`);
      }
      let data, content;
      try {
        ({ data, content } = matter(raw));
      } catch (err) {
        throw new Error(`Invalid frontmatter in ${filePath}: ${err.message}`);
      }
      const rel = relative(contentDir, filePath);
      const collection = rel.split('/')[0];
      const slug = basename(f, '.md');
      return { slug, frontmatter: data, body: content, collection, filePath: rel };
    });
}
