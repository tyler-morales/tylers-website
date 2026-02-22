---
title: "How to Build a Special and Performant Hugo Site"
date: 2026-01-17
comments: true
author: "Tyler Morales"
description: "A practical guide to the custom Hugo features powering this site."
featured_image: "feature.webp"
featured_image_alt: "A high-performance workspace"
featured_image_caption: "This site uses Hugo-native features to deliver maximum speed and accessibility."
draft: true
---

Welcome to your new Hugo site! This post is a living guide to the custom features
we have built so you can write posts quickly, stay consistent, and keep the site
fast and accessible.

## 1. Page Bundles & Featured Images

Every post is a **Page Bundle**. Keep images next to your Markdown in
`content/blog/your-post/index.md`.

### How to use

Set the featured image in front matter. Hugo will generate responsive sizes.

```yaml
featured_image: "feature.webp"
featured_image_alt: "Describe your image for screen readers"
featured_image_caption: "Optional caption shown below the image"
```

## 2. Responsive Markdown Images

Use standard Markdown for inline images. The render hook provides:

- **Responsive widths** at build time.
- **Lazy loading** for performance.
- **Async decoding** to reduce jank.
- **Semantic markup** with `<figure>` and `<figcaption>`.

![Optimized Markdown Image](feature.webp "Even inline images get the full responsive treatment!")

## 3. Smart External Links

External links are enhanced automatically:

- **Security** with `rel="noopener noreferrer"`.
- **New tabs** for off-site navigation.
- **Visual cue** via a subtle external-link icon.

Internal links, like the [About page](/about), stay in the same tab.

## 4. Shareable Heading Anchors

Hover over any H2–H4 heading to reveal a **# anchor link** that can be shared.

- **Stable IDs** from your heading text.
- **CSS-only** behavior.
- **Accessible** and keyboard-focusable.

## 5. Table of Contents (Auto-Collapsing)

The left TOC follows your reading position:

- All top-level H2 sections are visible.
- Only the currently active section shows its nested H3/H4 items.

### How to write for the TOC

Use H2 for major sections (Day 1, Day 2), and H3/H4 for subsections. Keep heading
text short and descriptive to improve scanability.

## 6. Global Site Search

Search uses a Hugo-built JSON index and matches across **title**, **description**,
and **content**. Use these fields to improve results:

```yaml
title: "Local Coffee Notes"
description: "Tasting notes and a quick brewing checklist."
summary: "Optional short excerpt for lists and search."
```

Type a query in the header search box. Results show a highlighted snippet so
readers can jump to the right section quickly.

## 7. Comments (Per-Post)

Enable comments on a post with:

```yaml
comments: true
```

Comments are stored locally in the browser. This keeps the site static and fast
while still letting readers leave notes.

## 8. Dates (Published vs Updated)

Set `date` in front matter for the publish date (e.g. `2026-01-17` or full ISO).
The site’s “Updated” date is taken from Git’s last commit for that file, so you
don’t maintain `lastmod` manually. Do not hardcode “Last updated” in the body.

```yaml
date: 2026-01-17
```

## 9. Color Modes (Light, Dark, System)

The header toggle lets readers switch themes. You do not need to do anything
when writing content. The site respects system theme by default.

## 10. Performance by Default

This site is optimized for speed and clarity:

1. **Minimal JavaScript** loaded only when needed.
2. **No frameworks** for a tiny footprint.
3. **Layout stability** to prevent CLS.
4. **Modern defaults** like lazy loading and async decoding.

### Pro Tip: Sharing a Section

Click the `#` next to any heading to update the URL, then share that link.

---

By following these patterns, you will keep the site consistent, accessible, and
fast for every visitor. Happy writing!
