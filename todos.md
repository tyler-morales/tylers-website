# Todo Tracker

## 2026-03-26

- [x] Added blog post `content/blog/digital-archaeology-burger-king-xmen/index.md` — Burger King X-Men Mini CD-ROM restoration (MODE1/2352 dump, bchunk → ISO, UTM/Windows XP on Apple Silicon); front matter, glossary by layer.

## 2026-02-23

- [x] Comments implementation review: confirmed comments use Isso at `comments.tylermorales.pro`; partial in `layouts/partials/comments.html` included from `single-base.html` (blog, projects, events, about). Comments only work when the page origin is whitelisted on the Isso server (CORS), so local preview shows the section but thread load/post fails unless localhost is added to Isso config. Documented in README (Local vs live) and in partial (HTML comment); added `aria-label` on comments section and thread for a11y.

## 2026-02-22

- [x] Date/lastmod front matter: removed manual `lastmod`; Hugo uses Git for “Updated” via `lastmod = ["lastmod", ":git", "date"]`. Archetype now uses date-only `date` (e.g. `2026-02-22`). Existing blog posts simplified to date-only `date`; no more editing timestamps when you update a post.
- [x] Comments section (desktop): removed gray backgrounds (dropped `#comments .isso-postbox::before` pseudo-element); aligned Preview/Submit to inputs via `@media (min-width: 721px)` — flex on the row that contains the buttons, `align-items: center`, and `margin-top: 0` on buttons (`static/css/main.css`).
- [x] Comments: removed Preview button and its functionality; only Submit is shown (`#comments input[type="button"] { display: none !important; }` in `static/css/main.css`).
- [x] Comments section (mobile): Preview/Submit buttons no longer half on/half off; gray background limited to form fields only via `#comments .isso-postbox::before` (stops 4rem above bottom) so buttons sit outside the gray; `#comments` overflow visible; button row gets flex-wrap and mobile-friendly width so they stay in view (`static/css/main.css`).
- [x] Comments textarea full-width on desktop: overrode Isso's default `display: table` layout on `.isso-postbox`, `.isso-textarea-wrapper`, and `.isso-auth-section` with `display: block !important; width: 100% !important` so the textarea spans the full available width instead of being constrained to a narrow table-cell (`static/css/main.css`).
- [x] Blog post meta section (mobile): restructured `layouts/partials/blog/post-meta.html` with `.post-meta__author` and `.post-meta__details`/`.post-meta__item` so author and date/read-time/comments are two clear lines on small screens; separators (·) live inside each item to avoid orphan bullets; added mobile CSS in `static/css/main.css` (column layout, tighter gap) for max-width 720px.
- [x] Image compression: script now resizes to `--max-width=1920` (default) before WebP encode, default quality 78; supports recompressing existing large `.webp` in place. Hugo `[imaging]` set to quality 75 and resampleFilter lanczos in `hugo.toml` so built images are smaller. README updated with `--max-width`.
- [x] Image compression and WebP tool: added `scripts/compress-images.mjs` (finds large JPG/PNG under `content/`, converts to WebP with sharp, updates refs in same-bundle Markdown/front matter, removes originals). npm script `compress-images` and devDependency `sharp` in `package.json`. Documented in README with `--min-size`, `--quality`, `--dry-run`.
- [x] Comments UI: modern/minimal style in `static/css/main.css` (comment blocks, nested replies with indent + left border, focus states, postbox and inputs); vote controls styled as heart + count; first-name initial avatars via `static/js/comments-avatars.js` (replaces Gravatar with letter circle); `data-isso-max-comments-nested="5"` in `layouts/partials/comments.html`; README Comments section added.

## 2026-02-13

- [x] Proofread `content/blog/the-right-tools/index.md` for spelling and grammar (second pass): fixed typos (somthing→something, arent'→aren't, disimilar→dissimilar, enouch→enough, differnt→different, reach→reached, simplier→simpler, potentional→potential, codeing→coding, learing→learning, myslf→myself, caveots→caveats, frustated→frustrated, professinoal→professional, monotnous→monotonous, leat friciton→least friction, enginnering→over-engineering); grammar (that can do→they can do, that too disimilar→all that dissimilar, sometime be seen→can sometimes be seen, no differnt as→no different from); punctuation (useless I thought→useless, I thought).
- [x] Editorial pass on `content/blog/the-right-tools/index.md`: clarified "Amazon river" metaphor (their competence→gap in their competence), removed placeholder text, improved phrasing ("bit better of a developer"→"somewhat better developer", "It is this idea"→"This is the idea"), smoothed hex color paragraph transition, consolidated era naming ("era of code freedom"/"era of freedom of choice"→"Era of Freedom"), clarified closing sentence ("it is learning"→"expertise is about learning").

## 2026-02-11

- [x] Update markdown content styles in `static/css/markdown.css` for inline code, fenced code blocks, and section presentation.
- [x] Proofread and revise spelling/grammar in `content/blog/the-right-tools/index.md`.
- [x] Refine markdown code styling to be more subtle and add visible backtick markers for inline code in `static/css/markdown.css`.
- [x] Add automatic inline hex color chips (e.g. `#000444`) via `static/js/markdown-inline-code.js` and include it in `layouts/_default/baseof.html`.
- [x] Fix light-mode syntax readability for highlighted HTML/code tokens in `static/css/markdown.css`.
- [x] Increase numbered list indentation and marker legibility in `static/css/markdown.css`.
- [x] Enable syntax highlighting in `content/blog/the-right-tools/index.md` by changing the code fence to `html`.
- [x] Create downloadable HTML starter file at `static/downloads/starter.html` with `download` attribute to force browser download.
- [ ] Preview the updated blog post locally and tune spacing/colors if needed after visual review.
