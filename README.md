# Commit

A lightweight, Git-backed, Markdown-driven static site generator. No database, no admin panel — just Markdown files, Handlebars templates, and a single `npm run build`.

## Features

- **Markdown content** with YAML frontmatter (`gray-matter`)
- **Handlebars templates** with a theming system (3 built-in themes)
- **Blog engine** — paginated index, tag pages, draft support
- **Atom feed** and **sitemap.xml** generation (with absolute URLs)
- **robots.txt** generation
- **Syntax highlighting** via highlight.js
- **HTML sanitization** via sanitize-html
- **SEO** — canonical URLs, Open Graph meta tags
- **Validation** — checks config, frontmatter, templates, and slug collisions before building
- **Dev server** with live reload (chokidar + livereload)
- **Deploys** to GitHub Pages and GitLab Pages — CI/CD pipelines included

## Requirements

Node.js >= 20

## Getting Started

```bash
npm install
npm run build     # Build the site to dist/
npm run dev       # Start dev server with live reload
```

## Scripts

| Command | Description |
|---|---|
| `npm run build` | Build the site to `dist/` |
| `npm run dev` | Start dev server with live reload |
| `npm run validate` | Validate config, content, and templates |
| `npm run new-post` | Create a new blog post from template |

## Project Structure

```
config.yaml          # Site configuration
content/
  blog/              # Blog posts (Markdown)
  pages/             # Static pages (Markdown)
themes/
  default/           # Clean, light theme
  midnight/          # Dark theme with teal accents
  hacker/            # Terminal-inspired monospace theme
    templates/
      layouts/
        base.html    # Root HTML layout (shared shell)
      index.html     # Homepage
      blog.html      # Single blog post
      blog-index.html# Paginated blog listing
      tag.html       # Posts filtered by tag
      page.html      # Generic static page
      404.html       # Not-found page
    assets/
      css/
        style.css    # Theme stylesheet
static/              # Global static files (copied to dist/ as-is)
src/                 # Build pipeline
scripts/             # Dev server and utilities
dist/                # Build output (gitignored)
```

## Creating Content

Content files are Markdown with YAML frontmatter. Place blog posts in `content/blog/` and pages in `content/pages/`.

```markdown
---
title: "My Post"
date: 2026-03-06
template: blog
description: "A short description for feeds and meta tags."
tags:
  - example
  - guide
author: "Your Name"
draft: false
---

Your content here. Supports full Markdown: headings, lists, tables,
blockquotes, images, code blocks with syntax highlighting, and more.
```

### Frontmatter Fields

| Field | Required | Description |
|---|---|---|
| `title` | Yes | Page or post title |
| `date` | Yes | Publication date (`YYYY-MM-DD`) |
| `template` | Yes | Template to use (`blog`, `page`, `index`) |
| `description` | No | Used in feeds, sitemap, and `<meta>` tags |
| `tags` | No | List of tags (blog posts only) |
| `author` | No | Author name |
| `draft` | No | Set `true` to exclude from build |

## Configuration

All settings live in `config.yaml`:

```yaml
site:
  title: "Commit"
  description: "A lightweight, Git-backed, Markdown-driven static site."
  # Set to an absolute URL for deployment (e.g. "https://example.com/")
  # Required for feed, sitemap, canonical URLs, and Open Graph tags
  baseUrl: "/"
  language: "en"
theme: "default"       # "default", "midnight", or "hacker"
blog:
  postsPerPage: 5       # Posts per paginated index page
  feedLimit: 20         # Max posts in Atom feed
build:
  contentDir: "content"
  outputDir: "dist"
  staticDir: "static"
```

> **Note:** When `baseUrl` is relative (`"/"`), the build still succeeds but feed.xml and sitemap.xml will be generated as empty shells. Set an absolute URL before deploying.

## Themes

Commit ships with three themes:

| Theme | Description |
|---|---|
| `default` | Clean, light design with system fonts |
| `midnight` | Dark background with teal accent colors |
| `hacker` | Terminal-inspired monospace look with green-on-black |

Switch themes by changing the `theme` value in `config.yaml`. Run `npm run build` to rebuild.

## Creating a Custom Theme

To create your own theme, duplicate an existing one and modify it:

```bash
cp -r themes/default themes/my-theme
```

Then set `theme: "my-theme"` in `config.yaml`.

### Theme Directory Structure

A theme must contain the following:

```
themes/my-theme/
  templates/
    layouts/
      base.html        # Required — root HTML shell
    index.html         # Required — homepage
    blog.html          # Required — single blog post
    blog-index.html    # Required — paginated blog listing
    tag.html           # Required — tag archive page
    page.html          # Required — generic page
    404.html           # Required — not-found page
  assets/
    css/
      style.css        # Your theme's stylesheet
```

All seven templates and the base layout are required. The build will fail if any are missing.

### Templates

Templates use [Handlebars](https://handlebarsjs.com/) syntax. Every page template is rendered inside `base.html` via the `{{{body}}}` placeholder.

Available Handlebars helpers:

| Helper | Usage | Description |
|---|---|---|
| `formatDate` | `{{formatDate date}}` | Formats a date as "March 6, 2026" |
| `eq` | `{{#if (eq a b)}}` | Equality comparison |
| `slugify` | `{{slugify tag}}` | Lowercases and replaces spaces with hyphens |

Template data includes `site` (from config), `title`, `description`, `content`, `canonicalUrl`, and `ogType`. Blog templates also receive `date`, `author`, `tags`, and `posts` (for listings).

### Stylesheet Guidelines

Your `style.css` should cover the following areas to ensure all Markdown-generated content renders correctly:

**Layout and typography** — `body`, headings (`h1`–`h3`), `p`, `a` styles, and a max-width container.

**Markdown content elements** — These are generated from post/page Markdown and must be styled or they'll fall back to browser defaults:

| Element | What generates it |
|---|---|
| `blockquote` | `> quoted text` |
| `ul`, `ol`, `li` | Lists (`-` or `1.`) |
| `table`, `th`, `td` | Markdown tables |
| `img` | `![alt](url)` — use `max-width: 100%; height: auto;` to prevent overflow |
| `pre`, `code` | Fenced code blocks and inline code |
| `p code` | Inline code — typically needs a background color to stand out |

**Theme-specific components** — Each theme uses CSS class prefixes to avoid collisions (e.g., `default` uses bare classes, `midnight` uses `mn-`, `hacker` uses `hk-`). Your templates and stylesheet should use a consistent prefix. The key component classes to define:

- **Post list / cards** — the blog index listing (`.post-list` / `.mn-card` / `.hk-entry`)
- **Post header and meta** — title area, date, author (`.post-header` / `.mn-post-header`)
- **Tags** — tag labels on posts (`.tag` / `.mn-tag` / `.hk-tag`)
- **Pagination** — prev/next navigation (`.pagination` / `.mn-pagination`)
- **Error page** — 404 layout (`.error-page` / `.mn-error` / `.hk-error`)
- **Header nav** and **footer**

**Tip:** Start by copying the `default` theme's stylesheet and adjust colors, fonts, and spacing. The existing themes are good references for which selectors matter — if you miss a Markdown element, it will render with unstyled browser defaults.

## Deployment

Both CI/CD pipelines automatically inject the correct absolute `baseUrl` before building, so you can keep `baseUrl: "/"` in your repository for local development.

### GitHub Pages

Configured via `.github/workflows/deploy.yml`. Push to `main` and the workflow will:

1. Install dependencies and run audit
2. Validate content and config
3. Inject the GitHub Pages URL as `baseUrl`
4. Build and deploy to GitHub Pages

### GitLab Pages

Configured via `.gitlab-ci.yml`. Push to your default branch and the pipeline will:

1. Install dependencies and run audit
2. Validate content and config
3. Inject `CI_PAGES_URL` as `baseUrl`
4. Build and deploy to GitLab Pages

## Build Output

A build produces:

```
dist/
  index.html              # Homepage
  about.html              # Static pages
  blog/
    hello-world.html      # Individual posts
    index.html            # Blog listing (page 1)
    page/2/index.html     # Blog listing (page 2+)
    tags/
      example/index.html  # Tag archive pages
  assets/css/style.css    # Theme assets
  feed.xml                # Atom feed
  sitemap.xml             # XML sitemap
  robots.txt              # Robots directive with sitemap link
  404.html                # Not-found page
```