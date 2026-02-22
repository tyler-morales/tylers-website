import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { load as loadHtml } from "cheerio";
import { parse as parseToml } from "@iarna/toml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const args = new Set(process.argv.slice(2));
const skipBuild = args.has("--skip-build");
const skipExternal = args.has("--skip-external");
const strictExternal = args.has("--strict-external");
const timeoutMs = Number(getArgValue("--timeout-ms") || 8000);
const concurrency = Number(getArgValue("--external-concurrency") || 8);

const publicDir = path.join(projectRoot, "public");

const config = await readSiteConfig();
const baseUrl = config.baseURL || "";
const baseOrigin = getBaseOrigin(baseUrl);

if (!skipBuild) {
  runHugoBuild();
}

const htmlFiles = await collectHtmlFiles(publicDir);
const pageIndex = await buildPageIndex(htmlFiles, publicDir);

const { internalLinks, externalLinks, anchorLinks } = collectLinks(htmlFiles, pageIndex, baseOrigin);

const internalFailures = await checkInternalLinks(internalLinks, pageIndex, publicDir);
const anchorFailures = checkAnchorLinks(anchorLinks, pageIndex);

let externalFailures = [];
if (!skipExternal && externalLinks.length > 0) {
  externalFailures = await checkExternalLinks(externalLinks, { timeoutMs, concurrency });
}

const hasExternalErrors = strictExternal && externalFailures.length > 0;
const hasFailures =
  internalFailures.length > 0 ||
  anchorFailures.length > 0 ||
  hasExternalErrors;

printSummary({
  internalFailures,
  anchorFailures,
  externalFailures,
  skipExternal,
  strictExternal
});

if (hasFailures) {
  process.exit(1);
}

function getArgValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return null;
  }
  return process.argv[index + 1] || null;
}

function runHugoBuild() {
  const result = spawnSync("hugo", ["--destination", "public", "--buildDrafts", "--buildFuture", "--cleanDestinationDir"], {
    cwd: projectRoot,
    stdio: "inherit"
  });
  if (result.status !== 0) {
    throw new Error("Hugo build failed.");
  }
}

async function readSiteConfig() {
  try {
    const configPath = path.join(projectRoot, "hugo.toml");
    const raw = await fs.readFile(configPath, "utf8");
    return parseToml(raw);
  } catch (error) {
    return {};
  }
}

function getBaseOrigin(value) {
  try {
    const url = new URL(value);
    return url.origin;
  } catch (error) {
    return "";
  }
}

async function collectHtmlFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectHtmlFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(fullPath);
    }
  }

  return files;
}

async function buildPageIndex(htmlFiles, rootDir) {
  const index = new Map();
  for (const filePath of htmlFiles) {
    const html = await fs.readFile(filePath, "utf8");
    const $ = loadHtml(html);
    const ids = new Set();
    $("[id]").each((_, el) => {
      const id = $(el).attr("id");
      if (id) {
        ids.add(id);
      }
    });
    const urlPath = htmlFileToUrlPath(filePath, rootDir);
    index.set(urlPath, { filePath, ids, html });
  }
  return index;
}

function collectLinks(htmlFiles, pageIndex, siteOrigin) {
  const internalLinks = [];
  const anchorLinks = [];
  const externalMap = new Map();

  for (const filePath of htmlFiles) {
    const urlPath = htmlFileToUrlPath(filePath, publicDir);
    const page = pageIndex.get(urlPath);
    if (!page) {
      continue;
    }
    const doc = loadHtml(page.html);
    doc("a[href]").each((_, element) => {
      const hrefRaw = doc(element).attr("href") || "";
      const normalized = normalizeLink(hrefRaw, urlPath, siteOrigin);
      if (!normalized) {
        return;
      }
      if (normalized.type === "internal") {
        internalLinks.push({ ...normalized, sourcePath: urlPath });
      } else if (normalized.type === "anchor") {
        anchorLinks.push({ ...normalized, sourcePath: urlPath });
      } else {
        if (!externalMap.has(normalized.key)) {
          externalMap.set(normalized.key, normalized);
        }
      }
    });
  }

  return {
    internalLinks,
    anchorLinks,
    externalLinks: Array.from(externalMap.values())
  };
}

function normalizeLink(href, currentPath, siteOrigin) {
  if (!href) {
    return null;
  }

  const trimmed = href.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.startsWith("#")) {
    const hash = trimmed.slice(1);
    return hash ? { type: "anchor", key: hash, sourceUrl: trimmed } : null;
  }
  if (isDangerousProtocol(trimmed)) {
    return null;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    if (siteOrigin && trimmed.startsWith(siteOrigin)) {
      const url = new URL(trimmed);
      const key = normalizeInternalPath(url.pathname);
      if (!key) {
        return null;
      }
      return { type: "internal", key, hash: url.hash ? url.hash.slice(1) : "" };
    }
    const normalizedExternal = normalizeExternalUrl(trimmed);
    if (!normalizedExternal) {
      return null;
    }
    return { type: "external", key: normalizedExternal, sourceUrl: normalizedExternal };
  }

  const basePath = currentPath === "/" || currentPath.endsWith("/") || currentPath.endsWith(".html")
    ? currentPath
    : `${currentPath}/`;
  const resolved = new URL(trimmed, `https://example.invalid${basePath}`);
  const key = normalizeInternalPath(resolved.pathname);
  if (!key) {
    return null;
  }
  return { type: "internal", key, hash: resolved.hash ? resolved.hash.slice(1) : "" };
}

function normalizeInternalPath(value) {
  if (!value) {
    return null;
  }
  try {
    const url = new URL(value, "https://example.invalid");
    let pathname = url.pathname || "/";
    if (!pathname.startsWith("/")) {
      pathname = `/${pathname}`;
    }
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }
    return pathname;
  } catch (error) {
    return null;
  }
}

function normalizeExternalUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    url.hash = "";
    url.search = normalizeSearchParams(url.searchParams);
    if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
      url.pathname = url.pathname.slice(0, -1);
    }
    return url.toString();
  } catch (error) {
    return null;
  }
}

function normalizeSearchParams(params) {
  const entries = [];
  params.forEach((value, key) => {
    if (key.toLowerCase().startsWith("utm_")) {
      return;
    }
    entries.push([key, value]);
  });
  entries.sort((a, b) => {
    if (a[0] === b[0]) {
      return a[1].localeCompare(b[1]);
    }
    return a[0].localeCompare(b[0]);
  });
  const normalized = new URLSearchParams(entries);
  const query = normalized.toString();
  return query ? `?${query}` : "";
}

function isDangerousProtocol(value) {
  return /^(mailto|tel|javascript|data|file):/i.test(value);
}

async function checkInternalLinks(links, pageIndexMap, rootDir) {
  const failures = [];
  for (const link of links) {
    const targetFile = resolvePublicPath(link.key, rootDir);
    const page = pageIndexMap.get(link.key);
    const exists = await fileExists(targetFile);
    if (!exists || !page) {
      failures.push({ type: "missing-page", link });
      continue;
    }
    if (link.hash) {
      if (!page.ids.has(link.hash)) {
        failures.push({ type: "missing-anchor", link });
      }
    }
  }
  return failures;
}

function checkAnchorLinks(links, pageIndexMap) {
  const failures = [];
  for (const link of links) {
    const page = pageIndexMap.get(link.sourcePath);
    if (!page) {
      failures.push({ type: "missing-page", link });
      continue;
    }
    if (!page.ids.has(link.key)) {
      failures.push({ type: "missing-anchor", link });
    }
  }
  return failures;
}

async function checkExternalLinks(links, { timeoutMs, concurrency }) {
  const failures = [];
  await asyncPool(concurrency, links, async (link) => {
    const ok = await fetchWithRetry(link.key, timeoutMs);
    if (!ok) {
      failures.push(link);
    }
  });
  return failures;
}

async function fetchWithRetry(url, timeoutMs) {
  const headOk = await fetchWithTimeout(url, { method: "HEAD" }, timeoutMs);
  if (headOk === true) {
    return true;
  }
  if (headOk === "retry") {
    return await fetchWithTimeout(url, { method: "GET" }, timeoutMs);
  }
  return false;
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      redirect: "follow",
      signal: controller.signal
    });
    if (response.status >= 200 && response.status < 400) {
      return true;
    }
    if (response.status === 405 || response.status === 403) {
      return "retry";
    }
    return false;
  } catch (error) {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function asyncPool(limit, items, iterator) {
  const executing = new Set();
  for (const item of items) {
    const promise = Promise.resolve().then(() => iterator(item));
    executing.add(promise);
    const cleanup = () => executing.delete(promise);
    promise.then(cleanup).catch(cleanup);
    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }
  await Promise.all(executing);
}

function resolvePublicPath(urlPath, rootDir) {
  const clean = urlPath === "/" ? "/index.html" : urlPath;
  const hasExt = path.extname(clean);
  if (hasExt) {
    return path.join(rootDir, clean);
  }
  return path.join(rootDir, clean, "index.html");
}

function htmlFileToUrlPath(filePath, rootDir) {
  const rel = path.relative(rootDir, filePath);
  const normalized = `/${rel.replace(/\\/g, "/")}`;
  if (normalized.endsWith("/index.html")) {
    const base = normalized.slice(0, -"/index.html".length);
    return base || "/";
  }
  if (normalized.endsWith(".html")) {
    return normalized;
  }
  return "/";
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

function printSummary({
  internalFailures,
  anchorFailures,
  externalFailures,
  skipExternal,
  strictExternal
}) {
  if (internalFailures.length > 0) {
    console.log(`Internal link failures: ${internalFailures.length}`);
  } else {
    console.log("Internal links: OK");
  }
  if (anchorFailures.length > 0) {
    console.log(`Anchor failures: ${anchorFailures.length}`);
  } else {
    console.log("Anchors: OK");
  }
  if (skipExternal) {
    console.log("External links: skipped");
  } else if (externalFailures.length > 0) {
    console.log(`External link failures: ${externalFailures.length}${strictExternal ? "" : " (non-fatal)"}`);
  } else {
    console.log("External links: OK");
  }
  const show = (label, items) => {
    if (items.length === 0) {
      return;
    }
    console.log(`\n${label}`);
    for (const item of items.slice(0, 50)) {
      console.log(`- ${JSON.stringify(item)}`);
    }
    if (items.length > 50) {
      console.log(`- ...and ${items.length - 50} more`);
    }
  };

  show("Internal link failures", internalFailures);
  show("Anchor failures", anchorFailures);
  show("External link failures", externalFailures);
}
