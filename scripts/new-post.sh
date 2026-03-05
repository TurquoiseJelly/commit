#!/usr/bin/env bash
set -euo pipefail

read -rp "Post title: " title

# Generate slug from title
slug=$(echo "$title" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')

date=$(date +%Y-%m-%d)
filepath="content/blog/${slug}.md"

if [ -f "$filepath" ]; then
  echo "Error: $filepath already exists."
  exit 1
fi

cat > "$filepath" <<EOF
---
title: "${title}"
date: ${date}
template: blog
description: ""
tags: []
author: ""
---

# ${title}
EOF

echo "Created $filepath"
