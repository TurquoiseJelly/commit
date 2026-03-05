# FlatPress

A lightweight, Git-backed, Markdown-driven static site CMS.

## Features

- Markdown content with YAML frontmatter
- Handlebars templates with theme support
- Syntax highlighting via highlight.js
- HTML sanitization
- Dev server with live reload
- Deploys to GitHub Pages and GitLab Pages

## Project Structure

```
content/
  blog/          # Blog posts (Markdown)
  pages/         # Static pages (Markdown)
themes/
  default/
    templates/   # Handlebars templates
    assets/      # Theme CSS and static assets
static/          # Global static files (copied to dist as-is)
src/             # Build pipeline source
scripts/         # Dev server and utilities
dist/            # Build output (gitignored)
```

## Getting Started

```bash
npm install
npm run build
```

## Scripts

| Command | Description |
|---|---|
| `npm run build` | Build the site to `dist/` |
| `npm run dev` | Start dev server with live reload |
| `npm run validate` | Validate content and config |
| `npm run new-post` | Create a new blog post from template |

## Creating Content

Content files are Markdown with YAML frontmatter:

```markdown
---
title: "My Post"
date: 2026-03-06
template: blog
description: "A short description."
tags:
  - example
author: "Your Name"
---

# My Post

Your content here.
```

Place blog posts in `content/blog/` and pages in `content/pages/`.

## Configuration

Site settings are defined in `config.yaml`:

```yaml
site:
  title: "FlatPress"
  description: "A lightweight, Git-backed, Markdown-driven static site."
  baseUrl: "/"
  language: "en"
theme: "default"
build:
  contentDir: "content"
  outputDir: "dist"
  staticDir: "static"
```

## Deployment

- **GitLab Pages** — configured via `.gitlab-ci.yml`
- **GitHub Pages** — configured via `.github/workflows/deploy.yml`

Both pipelines run: install, audit, validate, build, deploy.

## License

ISC
