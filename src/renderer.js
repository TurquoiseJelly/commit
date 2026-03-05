import markdownIt from 'markdown-it';
import highlightjs from 'markdown-it-highlightjs';
import sanitizeHtml from 'sanitize-html';

const md = markdownIt({ html: true, linkify: true, typographer: true })
  .use(highlightjs);

const sanitizeOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    'img', 'h1', 'h2', 'h3', 'span', 'pre', 'code',
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    span: ['class'],
    code: ['class'],
    pre: ['class'],
    img: ['src', 'alt', 'title'],
  },
  allowedClasses: {
    span: ['hljs-*'],
    code: ['hljs', 'language-*'],
    pre: ['hljs'],
  },
};

export function renderMarkdown(markdownString) {
  const raw = md.render(markdownString);
  return sanitizeHtml(raw, sanitizeOptions);
}
