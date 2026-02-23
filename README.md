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

## Comments

Comments use [Isso](https://isso-comments.de/) (self-hosted at `comments.tylermorales.pro`). The UI is customized: minimal style, first-name initial avatars, heart-style likes, and threaded replies. Enable per post with `comments: true` in front matter (default). Styling and avatar script: `static/css/main.css` (under `#comments`) and `static/js/comments-avatars.js`.

**Local vs live:** The embed loads from the same Isso server in both cases. Isso only accepts requests from whitelisted origins (CORS). If your Isso config lists only the production domain (e.g. `tylermorales.pro`), the Comments section will render locally but the thread will not load and you cannot post. That is expected. To test comments locally, add your dev URL to Isso’s `host` config (e.g. `host = "http://localhost:1313/"`). On the live site, comments work as long as the site’s origin is allowed.

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

