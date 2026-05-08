# Proof — Builder Handoff

Everything the next Claude instance needs to ship changes to **readproof.art** without re-learning. Read top to bottom once; skim after.

---

## What Proof Is

Weekly AI-generated literary publication. Three voices:

- **Vel.** (the poet, rotating pseudonym — currently "Vel.")
- **Rowann Hadaya** — enthusiast critic. Note: **two n's**. Anagram of Donna Haraway. The `Rowan → Rowann` rename happened during Edition 001; if you see any single-N "Rowan" in code or content, that's a bug.
- **Ossian Gantu** — skeptic critic. Anagram of Susan Sontag.

Weekly cycle (additive): Monday → poem. Wednesday → Rowann's essay. Friday → Ossian's essay. Weekend → optional correspondence. Each piece accretes onto the front page; nothing is replaced until the next edition drops.

---

## Repo Layout

```
/Users/ls/Documents/Proof/
├── site/                         # Hugo project (the public site)
│   ├── config.yaml
│   ├── content/
│   │   ├── editions/
│   │   │   ├── _index.md         # archive page (url: /archive)
│   │   │   └── 001/              # leaf bundle — one per edition
│   │   │       ├── index.md      # edition metadata (title, slug, edition#, date, draft)
│   │   │       ├── poem.md       # page resource
│   │   │       ├── rowann.md     # page resource (two n's)
│   │   │       ├── ossian.md     # page resource
│   │   │       └── correspondence-*.md  # optional page resources
│   │   ├── about.md              # colophon page
│   │   └── colophon.md           # duplicate of about? check — /about redirects to /colophon
│   ├── layouts/
│   │   ├── _default/
│   │   │   ├── baseof.html       # shell
│   │   │   └── single.html       # about/colophon layout
│   │   ├── editions/
│   │   │   ├── single.html       # /edition/NNN
│   │   │   └── list.html         # /archive
│   │   ├── index.html            # home — renders latest edition via edition-body partial
│   │   ├── 404.html
│   │   └── partials/
│   │       ├── head.html         # meta, OG tags, fonts, css
│   │       ├── header.html       # SVG wordmark + nav
│   │       ├── footer.html       # Proof · Repository · Colophon + credit
│   │       ├── toc-bar.html      # sticky TOC w/ scroll-spy, wordmark home link
│   │       ├── edition-body.html # THE ORCHESTRATOR — state detection, composition
│   │       ├── poem.html         # Monday vs compressed variants
│   │       ├── essay.html        # Rowann/Ossian essays
│   │       └── correspondence.html
│   ├── static/
│   │   ├── css/main.css          # ~1000 lines, hand-written, no Tailwind in prod
│   │   ├── js/expand.js          # essay unroll + TOC scroll-spy + TOC visibility
│   │   ├── favicon.svg / .ico
│   │   ├── wordmark.svg
│   │   └── social-preview.png    # 1280x640 for OG
│   └── public/                   # Hugo build output (gitignored)
│
├── identities/                   # Published character bios (markdown)
│   ├── ossian_gantu.md
│   └── rowann_hadaya.md          # two n's!
├── prompts/                      # Published system prompts
│   ├── poet_system_prompt.md
│   ├── ossian_system_prompt.md
│   └── rowann_system_prompt.md
│
├── archive.json                  # Public publication archive (tracked)
├── current_edition.json          # Operational state — GITIGNORED
├── editions/                     # Working drafts — GITIGNORED (note: root-only, /editions/)
├── poet/ rowann/ ossian/ editor/ # Working folders — GITIGNORED
├── editor_log/                   # Session summaries — GITIGNORED
│
├── vercel.json                   # Deploy config
├── .gitignore
├── social-preview.svg            # Editable source for the OG image
└── BUILDER_HANDOFF.md            # this file
```

The OG image lives in two places: `social-preview.svg` at the repo root is the editable source; `site/static/social-preview.png` is the rasterized export that Hugo serves. When the design changes, edit the SVG and re-export to `site/static/`. There is no PNG copy at the repo root.

## Hugo draft suppression — known gotcha

Vercel's pinned Hugo (currently 0.147) does not reliably honor `draft: true` for leaf-bundle drafts. Always pair the draft flag with an explicit `build` directive when staging future editions:

```yaml
---
title: "Edition NNN"
slug: "NNN"
edition: N
date: YYYY-MM-DD
draft: true
description: "..."
build:
  list: never
  render: never
  publishResources: false
---
```

When flipping the edition live on publication day, BOTH must be removed:
1. The `draft: true` line
2. The entire `build:` block (all four lines)

Removing only the draft flag will leave the edition hidden because the build directive still suppresses it.

```
```

**Working dir matters.** The Hugo root is `site/`. Always `cd site` before `hugo` commands. The repo root is where you push from and where `vercel.json` lives.

---

## Deployment

### The golden commands

```bash
cd /Users/ls/Documents/Proof
git add <files>
git commit -m "$(cat <<'EOF'
...
EOF
)"
git push origin main
vercel --prod --yes     # MUST run this — Vercel does NOT auto-deploy
```

**Vercel does NOT auto-deploy on push.** The GitHub integration is disconnected. Every deploy requires running `vercel --prod --yes` manually from the repo root. If the user says "deploy" and you forget this step, the live site stays stale.

### Vercel config (`vercel.json`)

```json
{
  "buildCommand": "curl --retry 3 --retry-delay 2 -fsSL https://github.com/gohugoio/hugo/releases/download/v0.147.0/hugo_extended_0.147.0_linux-amd64.tar.gz -o hugo.tar.gz && tar xzf hugo.tar.gz && ./hugo --minify --buildDrafts --buildFuture -s site",
  "outputDirectory": "site/public",
  "installCommand": "",
  "framework": null,
  "redirects": [
    { "source": "/about", "destination": "/colophon", "permanent": true }
  ]
}
```

**Why the curl-and-tar song and dance:** Vercel's Hugo framework preset ran `hugo --gc` from the repo root, which failed because Hugo lives in `site/`. Going manual with `-s site` was simpler than fighting Vercel's framework detection.

**Hugo version pinning:** We use **0.147.0** because 0.160.1 (what's installed locally) wasn't available as a GitHub release when we tried to deploy. Local dev sometimes diverges in subtle ways — always do a full `hugo --buildFuture` locally and eyeball output before pushing.

**`--buildDrafts` is on.** This was enabled for the pre-launch state (Edition 001 was `draft: true` so the landing could show "Publishes April 20, 2026"). Edition 001 has since had its draft flag flipped. You may want to remove `--buildDrafts` from the build command once no edition needs the pre-launch treatment, but it's harmless to leave — just means any markdown with `draft: true` will render in production.

**`--buildFuture` is on** so editions with future `date:` values still render.

### Vercel CLI quirks

- Sometimes `vercel` will re-link to a new project called "site" if you run it from `site/`. If this happens:
  ```bash
  rm -rf .vercel site/.vercel
  cd /Users/ls/Documents/Proof
  vercel link --yes --project proof-journal
  ```
  Always run `vercel --prod --yes` from the **repo root**.

- The Vercel project is `lukas-projects-279c922c/proof-journal`. Aliased to **readproof.art**.

- `.vercel/` is gitignored.

### Domain

`readproof.art` via Porkbun. DNS is an ALIAS record pointing to `cname.vercel-dns.com`. Porkbun requires an A record at `76.76.21.21` if ALIAS/CNAME-flattening isn't set up. SSL is managed by Vercel automatically.

---

## The Content Model

### Each edition is a Hugo leaf bundle

```
site/content/editions/001/
├── index.md                      # edition metadata (routable)
├── poem.md                       # page resource (NOT routable as /edition/001/poem)
├── rowann.md                     # page resource
├── ossian.md                     # page resource
└── correspondence-*.md           # page resources
```

The `index.md` is the edition's routable page. Everything else in the directory is a **page resource** (not a standalone page). The templates read them via `.Resources.GetMatch "poem.md"`, etc.

### `index.md` frontmatter

```yaml
---
title: "Edition 001"
slug: "001"                # permalink becomes /edition/001
edition: 1                 # integer — used for sort and display
date: 2026-04-20           # publish date
draft: true                # pre-launch shell; flip to false on Monday morning
description: "Thirty Milliseconds — a poem by Vel."
---
```

### Piece frontmatter (poem.md)

```yaml
---
title: "Thirty Milliseconds"
pseudonym: "Vel."
date: 2026-04-20
---
```

### Piece frontmatter (rowann.md / ossian.md)

```yaml
---
title: "What Carry Carries"
author: "Ossian Gantu"
date: 2026-04-24
---
```

### Piece frontmatter (correspondence-*.md)

```yaml
---
title: "Letter from Rowann"
from: "Rowann Hadaya"
to: "Ossian Gantu"
date: 2026-04-26
location: "Beirut"
---
```

Correspondence files are sorted by `.Date` ascending.

---

## How the Edition Page Works

### State detection (in `edition-body.html`)

```go
{{ $poem := .Resources.GetMatch "poem.md" }}
{{ $rowann := .Resources.GetMatch "rowann.md" }}
{{ $ossian := .Resources.GetMatch "ossian.md" }}
{{ $correspondence := .Resources.Match "correspondence-*.md" }}
```

Sections render **only if the file exists.** Never render placeholders. Never render a numbered section "III. TBD." The additive model is the whole conceit — empty state = no state.

### The five rendering states

| State | Files present | What renders |
|---|---|---|
| **Pre-launch** | `index.md` only | Centered `No. NNN — Publishes {date}.` |
| **Monday** | `+ poem.md` | Broadside poem with left metadata column, CTA "Explore the Archive" |
| **Wednesday** | `+ rowann.md` | Compressed poem (vertical title aside on desktop) + Rowann essay |
| **Friday** | `+ ossian.md` | Same layout + Ossian essay |
| **Weekend** | `+ correspondence-*.md` | + correspondence section |

The "poem compresses" transition triggers on `$hasCompanions` (any Rowann/Ossian/correspondence present).

### TOC bar

Only renders when ≥ 2 sections exist (so Monday state hides it). Uses piece titles on desktop, short labels on mobile (CSS swap at 768px). Hidden at page top, fades in once the reader scrolls past the poem (IntersectionObserver). Includes a left-side Proof wordmark that links home — compact "P" on mobile, full wordmark on desktop.

Scroll-spy: `expand.js` listens to scroll and toggles `.toc-link--active` on whichever section's top has crossed below the TOC bar.

### Home page

`layouts/index.html` fetches the `editions` section, sorts by `edition` desc, and passes the first result into the `edition-body` partial. Same partial renders both `/` and `/edition/NNN`, so the layout stays consistent.

---

## Design System

### Colors

```css
--color-bg: #fbf9f4;              /* warm off-white */
--color-ink: #000000;             /* pure black, headlines */
--color-body: #1b1c19;            /* body text */
--color-surface-low: #f5f3ee;     /* toc bar, footer */
--color-outline-variant: #c6c6c6; /* 10% ghost borders */
```

No dark mode. No color used for emphasis — only italics and bold.

### Typography

- **Newsreader** (serif) for all content
- **Inter** (sans) for labels and UI

Type scale (from `:root`):

```css
--text-display: 3.5rem;         /* poem/about titles */
--text-headline: 1.75rem;       /* essay titles */
--text-body-lg: 1.15rem;        /* poem body */
--text-body-essay: 1.125rem;    /* essay body */
--text-label-md: 0.75rem;       /* UI labels, tracking +0.12em, uppercase */
--text-label-sm: 0.68rem;       /* metadata, tracking +0.15em, 60% opacity */
```

**`text-wrap: pretty` is set on body** to prevent orphaned words. Applies globally to all prose — essays, colophon, correspondence. Poems unaffected (they use explicit line breaks).

### Arrows & CTAs (recent convention)

- Arrow character: **`→`** (U+2192, via `&rarr;`). Never em-dash-plus-gt `—>`.
- Arrow sizing: `font-size: inherit` so it scales with the text.
- Gap between text and arrow: `0.5em` (relative to text).
- Vertical centering: `display: inline-flex; align-items: center;`.
- Hover: `transform: translateX(4px)` on the arrow via 300ms transition.
- "Continue Reading" on essays has **no arrow** — the underline suffices.

### Essay expand animation

Uses **`grid-template-rows`** animation (not `max-height`, which can't animate to `none` and snaps open). Collapsed = `24rem`, expanded = `1fr`. 700ms ease-out. Paper-reveal gradient fades in 500ms. The button collapses to 0 height smoothly when expanded.

### Layout grid

12-column CSS Grid on `.edition-grid`. Asymmetric: content typically occupies cols 2–9 or 4–10. Marginalia cols 10–12 if used. Mobile: single column.

No rounded corners anywhere (`border-radius: 0`). No horizontal dividers — tonal shifts + whitespace only.

---

## Shortcodes

Hugo shortcodes available to writers and the editor. Goes in markdown body; renders inline.

### `pullquote`

```
{{< pullquote >}}A line worth lifting.{{< /pullquote >}}
```

Renders a styled pull quote — large Newsreader italic, set off from body text by hairline rules above and below, generous vertical margin. Inner content is run through `markdownify`, so emphasis and links inside the quote work.

Convention: the editor instance may suggest up to two pull quotes per essay; the writer chooses whether to use them. Not for poems.

Template lives at `site/layouts/shortcodes/pullquote.html`. CSS lives in `main.css` under the `.pullquote` selector.

---

## JavaScript

Single file: `site/static/js/expand.js`. Three responsibilities:

1. **Essay expand/collapse.** Click handler on `[data-expand-btn]` toggles `.expanded` on the preceding `[data-expandable]`.
2. **TOC visibility.** IntersectionObserver watches the poem section; TOC bar gets `.visible` class when poem scrolls out of view.
3. **TOC scroll-spy.** On scroll, finds the last section whose top has crossed below the TOC bar, sets `.toc-link--active` on the corresponding link.

Uses `requestAnimationFrame` throttling. Passive scroll listener. No dependencies.

If you change section IDs, update `sectionIds` array in `expand.js`.

---

## Operational Layer

### Private working layout (gitignored)

```
poet/
rowann/
ossian/
editor/
editor_log/
/editions/           # root-level only — NOT site/content/editions/
current_edition.json
human_copy*.md
proof_complete_setup.md
```

**Watch the leading slash on `/editions/`.** Without it, the pattern would also match `site/content/editions/` and `site/layouts/editions/`. This was a bug once. Keep it scoped.

### Published layout (tracked)

- `archive.json` — canonical public record, grows with each edition
- `identities/` — critic bios, published
- `prompts/` — system prompts for all three voices, published (part of the "no secrets" commitment)
- `site/` — entire Hugo project

### State files

- `current_edition.json` — in-flight edition state (poet_submitted, rowann_published, etc.). Gitignored. Read by the editor agent.
- `archive.json` — public archive, one entry per edition.

### Git identity

Global email is `64620972+lamentierschweinchen@users.noreply.github.com`. If commits show `ls@MacBook-Pro-3.local`, check `git config --global user.email`.

Commit messages use HEREDOCs for multiline:
```bash
git commit -m "$(cat <<'EOF'
Subject line

Body paragraph explaining why.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Current State (as of Edition 001, Ossian installment)

**Edition 001 is live**: poem ("Thirty Milliseconds" by Vel.) + Rowann's essay ("The Last Thing to Arrive") + Ossian's essay ("What Carry Carries"). Correspondence window is open. The `current_edition.json` has `ossian_published` as its status and `correspondence_window_open: true`.

There are two files staged for commit when this handoff was written:
```
archive.json
site/content/editions/001/ossian.md
```

Plus an **untracked file `Proof Teaser.png`** at the repo root that is explicitly NOT part of any commit. Leave it alone.

The next task at time of handoff: commit and deploy the Ossian essay with this message:

```
Edition 001: add Ossian Gantu essay

"What Carry Carries" — the skeptic's response to Vel.'s
"Thirty Milliseconds" and to Rowann Hadaya's reading of it.
Closes the poem/essay/essay triad for Edition 001.
```

Then `git push && vercel --prod --yes`.

---

## Pitfalls Seen & Solved

1. **Hugo 0.147 on Vercel behaves differently from 0.160 locally.** In particular, `buildFuture` was needed at first because dates were in the future. Leaf bundle resource detection has been consistent across versions, but watch for `Non-page files: 0` in build output — that's the normal state for leaf bundles.

2. **Chrome extension screenshots sometimes return blank images** even when content is rendered. Use `computer-use` `screenshot` as a fallback, or verify via `curl | grep` or `get_page_text`.

3. **Vercel re-linking to the wrong project.** If you run `vercel` from `site/`, it may create a new project called "site". Always cd to repo root and use `vercel link --project proof-journal` if `.vercel/` is missing.

4. **`text-wrap: pretty`** is the fix for orphaned words. Don't try `orphans:` or `widows:` — those are paged-media only and do nothing on screen.

5. **max-height can't animate to `none`.** If you see a snap-open instead of a smooth unroll, the fix is to use `grid-template-rows: 0fr → 1fr` with `overflow: hidden` on the inner element.

6. **Paper-reveal gradient** fades to `#fbf9f4` — hardcoded. If you change the bg color var, update the gradient in CSS too.

7. **"Rowan" vs "Rowann".** If you see a single-N anywhere in code, content, URLs, or the archive, it's a bug. Everything should be two N's.

8. **The SVG wordmark** appears inlined in three places: `header.html`, `toc-bar.html` (desktop + mobile-P-only variants), and referenced by path in social metadata. If you change the wordmark, update all of them. The standalone `site/static/wordmark.svg` is the source of truth.

---

## Testing Locally

```bash
cd /Users/ls/Documents/Proof/site
hugo --buildFuture                # production build to ./public
hugo server --buildFuture         # dev server at localhost:1313
hugo server -D --buildFuture      # dev server INCLUDING drafts (for pre-launch state testing)
```

The dev server live-reloads on file changes. Check all three edition states by temporarily adding/removing files from `site/content/editions/001/`.

---

## What to Check Before Every Deploy

- `cd site && hugo --buildFuture` succeeds with no errors
- `git status` — no untracked files you didn't mean to commit (especially `Proof Teaser.png`)
- `git diff --cached` — reviewed
- Commit message follows the HEREDOC style with Co-Authored-By line
- `vercel --prod --yes` runs — **do not skip this step**
- Verify on live site: `curl -s https://readproof.art | grep -o 'something-distinctive'`
- If making changes to arrows/typography/layout, eyeball desktop AND mobile widths

---

## Voice / Editorial

When writing commit messages, handoffs, or any user-facing copy: low-ceremony, specific, no ornament. The site itself is typographically rigorous but editorially plain — no "welcome to" language, no celebratory phrasing, no scare quotes around AI. The publication is not a tech demo. It's a literary journal that happens to have no human contributors, and the design lets that fact be discovered rather than announced.
