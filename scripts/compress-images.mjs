/**
 * Finds large images under content/, converts them to WebP (with optional resize),
 * updates references in same-bundle Markdown/front matter, and removes originals.
 * Also recompresses existing .webp above the size threshold (resize + re-encode).
 *
 * Usage: node scripts/compress-images.mjs [--min-size=100kb] [--quality=78] [--max-width=1920] [--dry-run]
 */

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const CONTENT_DIR = path.join(projectRoot, "content");
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const DEFAULT_MIN_BYTES = 100 * 1024; // 100 KB
const DEFAULT_QUALITY = 78;
const DEFAULT_MAX_WIDTH = 1920;

function parseSize(value) {
  if (!value || typeof value !== "string") return DEFAULT_MIN_BYTES;
  const match = value.trim().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(kb|mb|bytes?)?$/);
  if (!match) return DEFAULT_MIN_BYTES;
  const num = Number(match[1]);
  const unit = (match[2] || "bytes").replace(/s$/, "");
  if (unit === "kb") return Math.round(num * 1024);
  if (unit === "mb") return Math.round(num * 1024 * 1024);
  return Math.round(num);
}

function getArgValue(flagPrefix) {
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith(flagPrefix)) {
      const eq = arg.indexOf("=");
      return eq !== -1 ? arg.slice(eq + 1) : null;
    }
  }
  return null;
}

const args = new Set(process.argv.slice(2).filter((a) => !a.includes("=")));
const dryRun = args.has("--dry-run");
const minBytes = parseSize(getArgValue("--min-size"));
const quality = Math.min(100, Math.max(1, Number(getArgValue("--quality")) || DEFAULT_QUALITY));
const maxWidth = Math.min(4096, Math.max(320, Number(getArgValue("--max-width")) || DEFAULT_MAX_WIDTH));

async function* walkDir(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (err) {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      yield* walkDir(full);
    } else if (e.isFile()) {
      yield full;
    }
  }
}

function isCandidateImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
}

async function findLargeImages() {
  const candidates = [];
  for await (const filePath of walkDir(CONTENT_DIR)) {
    if (!isCandidateImage(filePath)) continue;
    const stat = await fs.stat(filePath);
    if (stat.size >= minBytes) {
      candidates.push({ filePath, size: stat.size });
    }
  }
  return candidates;
}

function baseNameWithoutExt(filePath) {
  const base = path.basename(filePath);
  const dot = base.lastIndexOf(".");
  return dot === -1 ? base : base.slice(0, dot);
}

function newWebpPath(originalPath) {
  const dir = path.dirname(originalPath);
  const base = baseNameWithoutExt(originalPath);
  return path.join(dir, `${base}.webp`);
}

function isWebp(pathName) {
  return path.extname(pathName).toLowerCase() === ".webp";
}

/**
 * Replace references to original filename (any case) with base.webp in content.
 * Handles featured_image: "x.jpg" / 'x.jpg' and ](x.jpg) / ](x.jpg "title").
 */
function replaceReferencesInText(text, originalPath, webpBaseName) {
  const originalBase = path.basename(originalPath);
  const escapedBase = originalBase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let out = text;
  // Front matter: featured_image: "filename.jpg" or 'filename.jpg'
  const featuredRe = new RegExp(
    "(featured_image\\s*:\\s*[\"'])(" + escapedBase + ")([\"'])",
    "gi"
  );
  out = out.replace(featuredRe, (_, before, _fn, after) => `${before}${webpBaseName}${after}`);

  // Markdown: ](filename.jpg) or ](filename.jpg "title")
  const markdownRe = new RegExp(
    "(\\]\\(\\s*)(" + escapedBase + ")(\\s*(?:\"[^\"]*\")?\\s*\\))",
    "gi"
  );
  out = out.replace(markdownRe, (_, before, _fn, after) => `${before}${webpBaseName}${after}`);

  return out;
}

async function updateReferencesInBundle(imagePath, webpBaseName) {
  const dir = path.dirname(imagePath);
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const updated = [];
  for (const e of entries) {
    if (!e.isFile() || !e.name.toLowerCase().endsWith(".md")) continue;
    const mdPath = path.join(dir, e.name);
    let content = await fs.readFile(mdPath, "utf8");
    const newContent = replaceReferencesInText(content, imagePath, webpBaseName);
    if (newContent !== content) {
      if (!dryRun) await fs.writeFile(mdPath, newContent, "utf8");
      updated.push(mdPath);
    }
  }
  return updated;
}

/**
 * Resize to fit within maxWidth on the longest edge, then encode as WebP.
 * Writes to outputPath; if outputPath === inputPath (e.g. recompressing .webp), writes to temp then replaces.
 */
async function convertToWebP(inputPath, outputPath) {
  let pipeline = sharp(inputPath);
  const meta = await pipeline.metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  const longest = Math.max(w, h);
  if (longest > maxWidth) {
    pipeline = pipeline.resize(maxWidth, maxWidth, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }
  const sameFile = path.resolve(inputPath) === path.resolve(outputPath);
  const dest = sameFile ? path.join(os.tmpdir(), `compress-images-${Date.now()}-${path.basename(outputPath)}`) : outputPath;
  await pipeline.webp({ quality }).toFile(dest);
  if (sameFile) {
    await fs.copyFile(dest, outputPath);
    await fs.unlink(dest);
  }
}

async function run() {
  console.log(
    "Scanning content/ for large images (min size: %s bytes, quality: %d, max width: %d)%s\n",
    minBytes,
    quality,
    maxWidth,
    dryRun ? " [DRY RUN]" : ""
  );

  const candidates = await findLargeImages();
  if (candidates.length === 0) {
    console.log("No images at or above the size threshold.");
    return;
  }

  for (const { filePath, size } of candidates) {
    const alreadyWebp = isWebp(filePath);
    const webpPath = alreadyWebp ? filePath : newWebpPath(filePath);
    const webpBaseName = path.basename(webpPath);

    if (dryRun) {
      console.log(
        "Would process: %s (%d bytes) -> %s",
        path.relative(projectRoot, filePath),
        size,
        path.relative(projectRoot, webpPath)
      );
      if (!alreadyWebp) {
        const mdUpdated = await updateReferencesInBundle(filePath, webpBaseName);
        if (mdUpdated.length) {
          mdUpdated.forEach((p) => console.log("  Would update refs in: %s", path.relative(projectRoot, p)));
        }
      }
      continue;
    }

    try {
      await convertToWebP(filePath, webpPath);
      const stat = await fs.stat(webpPath);
      console.log(
        "Processed: %s -> %s (%d -> %d bytes)",
        path.relative(projectRoot, filePath),
        path.relative(projectRoot, webpPath),
        size,
        stat.size
      );

      if (!alreadyWebp) {
        const mdUpdated = await updateReferencesInBundle(filePath, webpBaseName);
        mdUpdated.forEach((p) => console.log("  Updated refs in: %s", path.relative(projectRoot, p)));
        await fs.unlink(filePath);
        console.log("  Removed original.");
      }
    } catch (err) {
      console.error("Error processing %s: %s", filePath, err.message);
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
