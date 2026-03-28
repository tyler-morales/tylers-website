# Todo Tracker

## 2026-03-28

- [x] **Stale DMG in Hugo output:** Deleted `public/blog/sunday-morning/Rave-1.17.12-universal.dmg` (~317 MB). It was not in `content/` (leftover from older builds). `public/` is gitignored; `*.dmg` ignored repo-wide. `hugo --minify` does not recreate it.

## 2026-03-26

- [x] **Merged feature branch into `main`:** `blog/digital-archaeology-burger-king-xmen` was already up to date with `origin/main`; fast-forwarded local `main` (`git merge --ff-only`) and pushed `main` → `origin/main` (`f15e95b..d8fc34c`).
- [x] **Removed ~302 MB DMG from repo + history:** `git rm` the file; `git filter-branch` index-filter stripped `content/blog/sunday-morning/Rave-1.17.12-universal.dmg` from all commits on affected branch(es), `rm .git/refs/original`, `git gc --prune=now --aggressive` so the blob is gone locally. `.gitignore` has `*.dmg`. Push with `git push --force-with-lease origin blog/digital-archaeology-burger-king-xmen` (rewritten history).
- [x] **Deleted/consolidated — X-Men v86 player:** Removed in-browser v86 embed from `content/projects/xmen-time-machine/index.md`; deleted `layouts/shortcodes/v86.html`, `static/js/v86-launcher.js`, `scripts/v86-launcher.test.mjs`, `.v86-*` CSS in `static/css/main.css`; `npm run dev` is `hugo server` only; dropped `concurrently` and `test:v86` from `package.json`; removed `tools/vm-setup/images` → `static/v86` mount from `hugo.toml`; README + blog cross-link updated; kept `npm run serve:v86-hda` for optional offline v86 tooling under `tools/vm-setup/`.
- [x] **v86 OOM (Aw Snap / error 5):** Shortcode `disable_jit="true"` + data attr; launcher passes `disable_jit` to `V86`. X-Men project: `memory="128"` `vga_memory="4"` `disable_jit="true"` + user-facing note (Chromium tab RAM / state snapshot).
- [x] **serve-v86-hda BrokenPipe:** `copyfile` swallows `BrokenPipeError` / `ConnectionResetError` when the browser closes the socket mid-transfer (range/large HDA); avoids noisy traceback from stdlib `http.server`.
- [x] **v86 CORS + favicon typo:** `serve-v86-hda.py` — `Access-Control-Allow-Headers` includes `X-Accept-Encoding` (libv86 XHR preflight from `localhost:1313` → `127.0.0.1:8765`). `baseof.html` — removed stray space in `favicon.svg` href (was `/%20favicon.svg` 404).
- [x] **v86 + favicon:** `npm run dev` (concurrently: `serve:v86-hda` + `hugo server`); launcher HEAD-probes port 8765 with clear error; `static/favicon.svg` + `baseof` link (fixes favicon 404).
- [x] **v86 dev UX:** `winxp-lite.img` excluded from Hugo mount; `serve-v86-hda.py` (8765, CORS); shortcode uses `hugo.IsDevelopment` → `http://127.0.0.1:8765/winxp-lite.img`, else `/v86/winxp-lite.img`. Removed stale `public/v86/winxp-lite.img` (was causing ~30s “hang”). README + project page + `npm run serve:v86-hda`.
- [x] **v86 Windows XP + Magneto:** `brew install qemu`; `qemu-img convert --force-share` from `xmen-cd-restoration` UTM `disk-0.qcow2` → `tools/vm-setup/images/winxp-lite.img` (~20 GiB raw, sparse). Project shortcode: `hda` + `cdrom`. Docs: README, `tools/vm-setup/README.md` (32-bit guest note, qcow2 recipe).
- [x] **v86 CD-ROM SeaBIOS read error (code 0004):** `static/js/v86-launcher.js` — load CD-ROM with `async: false` so the ISO is fully fetched before `V86.init` (lazy async sectors were unreadable at boot).
- [x] **v86 fix + Magneto ISO default:** Ran `download-bios.sh`; copied `magneto_fixed01.iso` into `tools/vm-setup/images/` (gitignored). Project page shortcode now only `cdrom="/v86/magneto_fixed01.iso"` (no missing `hda`/`state`). Updated project copy, `README.md` v86 steps, `tools/vm-setup/README.md` (optional HDA/state).
- [x] **X-Men featured image:** Blog `digital-archaeology-burger-king-xmen` and project `xmen-time-machine` use bundle-local `xmen-cds.jpg` (Burger King mini CDs); removed unused `content/projects/xmen-time-machine/featured.png`.
- [x] **X-Men blog:** Added `xmen_d_drive.png` (Windows XP My Computer — X-MEN on D:) in The Time Capsule section after ISO mount / before desktop screenshot.
- [x] **X-Men blog:** Added `xmen_program_magneto.png` — finale shot of the Burger King X-Men Evolution program running in UTM (after desktop screenshot, before Results & Learnings).
- [x] **v86 local emulation setup:** `tools/vm-setup/` — `README.md`, `download-bios.sh`, `images/.gitkeep`; `.gitignore` patterns for large binaries under `tools/vm-setup/images/`; `hugo.toml` `[module]` mounts (`static`, `assets`, `tools/vm-setup/images` → `static/v86`); `assets/.gitkeep`; `capture-state.html` for offline state snapshot capture; shortcode defaults pinned to **v86@0.5.319**, BIOS defaults `/v86/seabios.bin` + `/v86/vgabios.bin`; project page uses `/v86/` paths for hda/cdrom/state; `v86-launcher.js` — `download-progress` UI, fullscreen (**F**), pause/resume toolbar; `.v86-*` progress + toolbar + `:fullscreen` CSS; `v86-launcher.test.mjs` adds `progressPercentFromEvent` cases; README v86 section updated.
- [x] **v86 X-Men Time Machine (project page):** `layouts/shortcodes/v86.html` — deferred Play overlay, data attrs for engine/BIOS/disk/state URLs; `static/js/v86-launcher.js` — loads `libv86.js`, `new V86({...})`, `initial_state` / async `hda`+`cdrom`, `window.__v86` save/restore helpers, a11y focus to screen; `.v86-*` styles in `static/css/main.css` (CRT-ish play button, spinner, mobile note ≤640px); `content/projects/xmen-time-machine/index.md` + `xmen-cds.jpg` (bundle-local featured image); blog cross-link in `digital-archaeology-burger-king-xmen/index.md`; README v86 section; `scripts/v86-launcher.test.mjs` + `npm run test:v86` for `mbToBytes` success/failure cases.
- [x] v86 launcher: strip `cdn.example.com` / `example.com` disk URLs (no infinite retry hang); 90s load timeout fallback; project page shortcode no longer passes fake `hda`/`cdrom`; tests extended for placeholder URL detection.
- [x] Removed stray `pubilc/` directory (typo duplicate of Hugo output `public/`; no repo references).
- [x] Added blog post `content/blog/digital-archaeology-burger-king-xmen/index.md` — Burger King X-Men Mini CD-ROM restoration (MODE1/2352 dump, bchunk → ISO, UTM/Windows XP on Apple Silicon); front matter, glossary by layer.
- [x] Gatekeeper section: inline screenshot `macOS_error.png` (bundle-local) in `digital-archaeology-burger-king-xmen`.
- [x] Time Capsule section: inline screenshot `windows_xp.png` (UTM / Windows XP desktop) with caption in same post.
- [x] Collapsible "Digital Forensics: Under the Hood" (`<details class="forensic-details">`) in same post—hexdump Toast 4.1 / Apple_HFS, sync header, `bchunk` output, `diskutil list`; CSS at end of `static/css/main.css` (`.forensic-details*`, `.post-content` mirrors).

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
