# VM setup (v86 + Windows XP + X-Men ISO)

Large binaries stay **out of git** (see `.gitignore`). Use this folder to prepare BIOS, disk, and ISO files for **local v86 experiments** (e.g. `capture-state.html`). The Hugo site does not mount these into `static/`; serve them with **`npm run serve:v86-hda`** from the repo root (port **8765**, CORS) or another HTTP server.

## 1. BIOS (required)

```bash
chmod +x ./download-bios.sh
./download-bios.sh
```

Produces `images/seabios.bin` and `images/vgabios.bin`.

## 2. OS disk image (required for booting Windows in v86)

Place a bootable **raw hard drive image** at:

- `images/winxp-lite.img`

**From UTM (qcow2):** v86 needs raw `.img`, not qcow2. With [Homebrew](https://brew.sh) QEMU installed (`brew install qemu`):

```bash
qemu-img convert --force-share -f qcow2 -O raw \
  "/path/to/Windows XP.utm/Data/disk-0.qcow2" \
  ./images/winxp-lite.img
```

Use `--force-share` if UTM still has the VM open (read-only share). The raw file matches the virtual disk size (often multi‑GB sparse on disk).

**Guest OS:** v86 emulates **32‑bit x86** only. Use a **32‑bit Windows XP** (or other 32‑bit guest) disk; 64‑bit guests will not run.

**Large HDA:** Run **`npm run serve:v86-hda`** (or `python3 tools/vm-setup/serve-v86-hda.py`) so the image is available at **`http://127.0.0.1:8765/winxp-lite.img`** with range requests and CORS. Point your v86 config or `capture-state.html` at that URL when testing in the browser.

## 3. Restored CD image

Copy your peeled ISO:

- `images/magneto_fixed01.iso`

## 4. Instant boot (optional)

1. Serve assets over HTTP (so fetches work; `file://` is unreliable):

   ```bash
   npm run serve:v86-hda
   ```

   Or: `cd tools/vm-setup && python3 -m http.server 8765` (less ideal for large range reads).

2. Open `http://127.0.0.1:8765/capture-state.html`, boot to the game’s title screen, then **Download state** → save as `images/game_ready.state`.

3. Keep the **same v86 version** (e.g. **0.5.319** on jsDelivr, as in `capture-state.html`) when capturing; snapshot format can change across emulator versions.

## 5. Hugo site

The X-Men Time Machine project page (`content/projects/xmen-time-machine/`) documents the restoration story; it does **not** embed v86. Run the site with **`hugo server`** or **`npm run dev`** from the repo root.
