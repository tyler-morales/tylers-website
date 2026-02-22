# test-hugo
Hugo site for experiments and content previews.

## Prerequisites
- Hugo (extended) installed on your PATH
- Node.js 18+

## Install
```
npm install
```

## Run Dev
```
hugo server
```

## Build / Start (Prod)
```
hugo --destination public
```

## Blog assets (page bundles)

Each blog post is a **folder** (e.g. `content/blog/sunday-morning/`) containing `index.md` and all assets for that post: images, audio, etc. Reference them by filename:

- **Featured image:** set `featured_image: "feature.jpg"` in front matter.
- **Images in body:** use markdown `![](photo.jpg)`; the image must be in the same folder.
- **Audio:** use `{{< audio "recording.mp3" >}}` (shortcode resolves the file from the post folder).

Nothing blog-specific needs to go in `static/`; keeping assets in the post folder keeps posts self-contained.

## Compress images

To shrink large images and convert them to WebP (only under `content/`), run:

```bash
npm run compress-images
```

This finds JPG/PNG/WebP files above 100 KB. For JPG/PNG it converts to WebP, resizes so the longest edge is at most 1920 px, updates references in the same bundle’s Markdown and front matter, and removes the originals. Existing large WebP files are recompressed in place (resize + lower quality). Optional flags:

- `--min-size=<size>` — only process files at least this large (e.g. `100kb`, `1mb`).
- `--quality=<1-100>` — WebP quality (default 78).
- `--max-width=<px>` — cap longest edge to this many pixels (default 1920).
- `--dry-run` — show what would be processed without writing or deleting.

## Env Vars
None required.

## Troubleshooting
- `hugo: command not found`: install Hugo and ensure it is on your PATH.

