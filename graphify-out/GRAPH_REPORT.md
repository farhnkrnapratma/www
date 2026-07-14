# Graph Report - .  (2026-07-14)

## Corpus Check
- Corpus is ~28,290 words - fits in a single context window. You may not need a graph.

## Summary
- 172 nodes · 160 edges · 30 communities (27 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- ESLint Formatting Rules
- Package JSON & Dependencies
- TypeScript Compiler Config
- Blog Server Routing & Helpers
- Svelte Components & Styling
- Supabase Client & Auth
- Project Build & Scripts
- Frontend Libraries & Assets
- Documentation & Cloudflare
- VSCode Settings & MCP
- Svelte MCP Integrations
- Global TypeScript Types
- ESLint Config File
- Prettier Config File

## God Nodes (most connected - your core abstractions)
1. `scripts` - 10 edges
2. `compilerOptions` - 10 edges
3. `$lib/supabase` - 7 edges
4. `$lib/nameValidator` - 5 edges
5. `files` - 4 edges
6. `isNameReserved()` - 4 edges
7. `supabase` - 4 edges
8. `POST()` - 4 edges
9. `svelte` - 3 edges
10. `args` - 3 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `isNameReserved()`  [EXTRACTED]
  src/routes/api/comments/+server.ts → src/lib/nameValidator.ts

## Import Cycles
- None detected.

## Communities (30 total, 3 thin omitted)

### Community 0 - "ESLint Formatting Rules"
Cohesion: 0.05
Nodes (43): eslint, eslint-config-prettier, @eslint/js, eslint-plugin-svelte, globals, devDependencies, eslint, eslint-config-prettier (+35 more)

### Community 1 - "Package JSON & Dependencies"
Cohesion: 0.12
Nodes (18): svelte, exports, files, svelte, keywords, name, peerDependencies, svelte (+10 more)

### Community 2 - "TypeScript Compiler Config"
Cohesion: 0.14
Nodes (13): node, ./.svelte-kit/tsconfig.json, compilerOptions, allowJs, checkJs, forceConsistentCasingInFileNames, resolveJsonModule, rewriteRelativeImportExtensions (+5 more)

### Community 3 - "Blog Server Routing & Helpers"
Cohesion: 0.24
Nodes (10): ./+page.server, $lib/LinkListSection.svelte, $lib/nameValidator, isNameReserved(), normalizeName(), $lib/ShinyText.svelte, FORBIDDEN_WORDS, getCommentDepth() (+2 more)

### Community 4 - "Svelte Components & Styling"
Cohesion: 0.18
Nodes (5): ./$types, ./layout.css, svelte/reactivity, $app/state, svelte/transition

### Community 5 - "Supabase Client & Auth"
Cohesion: 0.22
Nodes (5): $lib/supabase, supabase, BlogPost, GitHubRepo, Project

### Community 6 - "Project Build & Scripts"
Cohesion: 0.20
Nodes (10): scripts, build, check, check:watch, dev, format, lint, prepack (+2 more)

### Community 7 - "Frontend Libraries & Assets"
Cohesion: 0.22
Nodes (9): bootstrap-icons, dependencies, bootstrap-icons, highlight.js, marked, @supabase/supabase-js, highlight.js, marked (+1 more)

### Community 8 - "Documentation & Cloudflare"
Cohesion: 0.25
Nodes (4): Cloudflare Pages, Supabase Database, Svelte 5, Tailwind CSS v4

### Community 9 - "VSCode Settings & MCP"
Cohesion: 0.25
Nodes (7): mcpServers, svelte, $schema, args, command, @sveltejs/mcp, -y

### Community 10 - "Svelte MCP Integrations"
Cohesion: 0.50
Nodes (3): npx, svelte, @sveltejs/mcp

## Knowledge Gaps
- **74 isolated node(s):** `$schema`, `command`, `-y`, `@sveltejs/mcp`, `npx` (+69 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `ESLint Formatting Rules` to `Package JSON & Dependencies`?**
  _High betweenness centrality (0.171) - this node is a cross-community bridge._
- **Why does `scripts` connect `Project Build & Scripts` to `Package JSON & Dependencies`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Frontend Libraries & Assets` to `Package JSON & Dependencies`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **What connects `$schema`, `command`, `-y` to the rest of the system?**
  _74 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ESLint Formatting Rules` be split into smaller, more focused modules?**
  _Cohesion score 0.046511627906976744 - nodes in this community are weakly interconnected._
- **Should `Package JSON & Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.11695906432748537 - nodes in this community are weakly interconnected._
- **Should `TypeScript Compiler Config` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._