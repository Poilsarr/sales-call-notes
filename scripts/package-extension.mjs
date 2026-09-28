#!/usr/bin/env node
/**
 * scripts/package-extension.mjs
 *
 * Zero-dependency packager for the Gauge Chrome extension (MV3).
 *
 * 1. Reads + validates extension/manifest.json:
 *    - valid JSON, required MV3 keys, manifest_version === 3
 *    - version is semver
 *    - permissions ⊆ {storage, tabCapture, offscreen, sidePanel, alarms}
 *    - host_permissions ⊆ meeting providers + app origin
 *    - every manifest-referenced file exists on disk
 *    - sidepanel/offscreen entries valid
 * 2. Zips extension/ (excluding *.test.*, node_modules, .DS_Store) into
 *    dist/gauge-extension-<version>.zip via the system `zip` binary,
 *    with a built-in list-files fallback (pure-node stored .zip writer)
 *    when `zip` is unavailable.
 *
 * Exit 0 on success, exit 1 on any validation/packaging failure.
 */

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXT_DIR = path.join(ROOT, "extension");
const DIST_DIR = path.join(ROOT, "dist");
const MANIFEST_PATH = path.join(EXT_DIR, "manifest.json");

const ALLOWED_PERMISSIONS = new Set([
  "storage",
  "tabCapture",
  "offscreen",
  "sidePanel",
  "alarms",
]);

// Meeting providers + Gauge app origin. Keep in sync with manifest.json.
const ALLOWED_HOST_PERMISSIONS = new Set([
  "https://meet.google.com/*",
  "https://teams.microsoft.com/*",
  "https://*.zoom.us/*",
  "https://usegauge.vercel.app/*",
]);

const SEMVER_RE =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

const failures = [];

function check(name, ok, detail = "") {
  if (ok) {
    console.log(`  PASS  ${name}`);
  } else {
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
    failures.push(name);
  }
}

/** Collect every file path referenced by the manifest (relative to extension/). */
function collectReferencedFiles(manifest) {
  const refs = [];
  const push = (v) => {
    if (typeof v === "string" && v.length > 0) refs.push(v);
  };

  for (const v of Object.values(manifest.icons ?? {})) push(v);

  const action = manifest.action ?? {};
  push(action.default_popup);
  for (const v of Object.values(action.default_icon ?? {})) push(v);

  push(manifest.side_panel?.default_path);
  push(manifest.background?.service_worker);

  for (const cs of manifest.content_scripts ?? []) {
    for (const f of cs.js ?? []) push(f);
    for (const f of cs.css ?? []) push(f);
  }

  for (const war of manifest.web_accessible_resources ?? []) {
    for (const f of war.resources ?? []) push(f);
  }

  push(manifest.options_page);
  push(manifest.options_ui?.page);
  push(manifest.devtools_page);
  for (const p of manifest.sandbox?.pages ?? []) push(p);

  return [...new Set(refs)];
}

/** Recursively list files under dir, excluding packaging noise. */
function listPackagedFiles(dir, base = dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      out.push(...listPackagedFiles(abs, base));
    } else if (entry.isFile()) {
      if (entry.name === ".DS_Store") continue;
      if (/\.test\.[^.]+$/.test(entry.name)) continue; // *.test.*
      out.push(path.relative(base, abs).split(path.sep).join("/"));
    }
  }
  return out.sort();
}

// ---------------------------------------------------------------------------
// Pure-node stored (uncompressed) .zip writer — fallback when `zip` is missing.
// ---------------------------------------------------------------------------
let _crcTable = null;
function crc32(buf) {
  if (!_crcTable) {
    _crcTable = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      _crcTable[n] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++)
    crc = _crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}

function writeStoredZip(absFiles, baseDir, outPath) {
  const chunks = [];
  const central = [];
  let offset = 0;
  for (const rel of absFiles) {
    const data = readFileSync(path.join(baseDir, rel));
    const name = Buffer.from(rel, "utf8");
    const crc = crc32(data);
    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0); // local file header signature
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0x0800, 6); // UTF-8 flag
    local.writeUInt16LE(0, 8); // method: stored
    local.writeUInt16LE(0, 10); // mod time
    local.writeUInt16LE(0, 12); // mod date
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18); // compressed size
    local.writeUInt32LE(data.length, 22); // uncompressed size
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28); // extra length
    name.copy(local, 30);
    chunks.push(local, data);
    central.push({ rel, name, crc, size: data.length, offset });
    offset += local.length + data.length;
  }
  const centralStart = offset;
  let centralSize = 0;
  for (const e of central) {
    const c = Buffer.alloc(46 + e.name.length);
    c.writeUInt32LE(0x02014b50, 0); // central directory signature
    c.writeUInt16LE(20, 4); // version made by
    c.writeUInt16LE(20, 6); // version needed
    c.writeUInt16LE(0x0800, 8); // UTF-8 flag
    c.writeUInt16LE(0, 10); // method: stored
    c.writeUInt16LE(0, 12);
    c.writeUInt16LE(0, 14);
    c.writeUInt32LE(e.crc, 16);
    c.writeUInt32LE(e.size, 24);
    c.writeUInt32LE(e.size, 28);
    c.writeUInt16LE(e.name.length, 32);
    c.writeUInt16LE(0, 34); // extra
    c.writeUInt16LE(0, 36); // comment
    c.writeUInt16LE(0, 38); // disk number
    c.writeUInt16LE(0, 40); // internal attrs
    c.writeUInt32LE(0x20 << 16, 42); // external attrs (archive bit)
    c.writeUInt32LE(e.offset, 44); // local header offset
    e.name.copy(c, 46);
    chunks.push(c);
    centralSize += c.length;
  }
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); // EOCD signature
  end.writeUInt16LE(0, 8); // entries this disk
  end.writeUInt16LE(central.length, 10); // total entries
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(centralStart, 16);
  end.writeUInt16LE(0, 20); // comment length
  chunks.push(end);
  writeFileSync(outPath, Buffer.concat(chunks));
}

function main() {
  console.log("gauge: packaging extension…");

  // --- 1. Parse manifest ---------------------------------------------------
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
    console.log("  PASS  manifest is valid JSON");
  } catch (err) {
    console.log(`  FAIL  manifest is valid JSON — ${err.message}`);
    process.exit(1);
  }

  // --- 2. Required MV3 keys -------------------------------------------------
  check("manifest_version === 3", manifest.manifest_version === 3, `got ${manifest.manifest_version}`);
  check("name is a non-empty string", typeof manifest.name === "string" && manifest.name.length > 0);
  check("version is present", typeof manifest.version === "string" && manifest.version.length > 0);
  check(
    "version is semver",
    typeof manifest.version === "string" && SEMVER_RE.test(manifest.version),
    `got ${JSON.stringify(manifest.version)}`,
  );

  // --- 3. Permission allowlists ---------------------------------------------
  const permissions = manifest.permissions ?? [];
  const badPerms = permissions.filter((p) => !ALLOWED_PERMISSIONS.has(p));
  check(
    "permissions ⊆ {storage, tabCapture, offscreen, sidePanel, alarms}",
    Array.isArray(permissions) && badPerms.length === 0,
    badPerms.length ? `unexpected: ${badPerms.join(", ")}` : "",
  );

  const hostPermissions = manifest.host_permissions ?? [];
  const badHosts = hostPermissions.filter((h) => !ALLOWED_HOST_PERMISSIONS.has(h));
  check(
    "host_permissions ⊆ meeting providers + app origin",
    Array.isArray(hostPermissions) && badHosts.length === 0,
    badHosts.length ? `unexpected: ${badHosts.join(", ")}` : "",
  );

  // --- 4. sidepanel / offscreen entries valid --------------------------------
  const sidePanelPath = manifest.side_panel?.default_path;
  check("side_panel.default_path is set", typeof sidePanelPath === "string" && sidePanelPath.length > 0);
  if (typeof sidePanelPath === "string" && sidePanelPath.length > 0) {
    check("sidepanel file exists", existsSync(path.join(EXT_DIR, sidePanelPath)), sidePanelPath);
  }
  if (permissions.includes("offscreen")) {
    check("offscreen.html exists (offscreen permission)", existsSync(path.join(EXT_DIR, "offscreen.html")));
    check("offscreen.js exists (offscreen permission)", existsSync(path.join(EXT_DIR, "offscreen.js")));
  }

  // --- 5. Icons ---------------------------------------------------------------
  const icons = manifest.icons ?? {};
  for (const size of ["16", "48", "128"]) {
    check(`icons[${size}] declared`, typeof icons[size] === "string" && icons[size].length > 0);
  }

  // --- 6. Every manifest-referenced file exists --------------------------------
  const refs = collectReferencedFiles(manifest);
  check("manifest references ≥1 file", refs.length > 0);
  const missing = refs.filter((r) => !existsSync(path.join(EXT_DIR, r)));
  check("every manifest-referenced file exists", missing.length === 0, missing.length ? `missing: ${missing.join(", ")}` : `${refs.length} files ok`);

  if (failures.length > 0) {
    console.error(`\ngauge: validation failed (${failures.length} check${failures.length === 1 ? "" : "s"}). Aborting.`);
    process.exit(1);
  }

  // --- 7. Zip -------------------------------------------------------------------
  const files = listPackagedFiles(EXT_DIR);
  if (files.length === 0) {
    console.error("\ngauge: no files to package. Aborting.");
    process.exit(1);
  }
  mkdirSync(DIST_DIR, { recursive: true });
  const outName = `gauge-extension-${manifest.version}.zip`;
  const outPath = path.join(DIST_DIR, outName);

  let zipped = false;
  try {
    execFileSync(
      "zip",
      ["-r", "-X", outPath, ".", "-x", "*.test.*", "node_modules/*", ".DS_Store", "*/.DS_Store"],
      { cwd: EXT_DIR, stdio: "pipe" },
    );
    zipped = existsSync(outPath);
    check("system `zip` produced archive", zipped);
  } catch {
    check("system `zip` produced archive", false, "`zip` binary unavailable — using list-files fallback");
  }

  if (!zipped) {
    // List-files fallback: log every packaged file, then write a real .zip
    // with the pure-node stored writer so dist/ always gets an artifact.
    console.log("gauge: fallback file list:");
    for (const f of files) console.log(`    ${f}`);
    try {
      writeStoredZip(files, EXT_DIR, outPath);
      zipped = existsSync(outPath);
    } catch (err) {
      console.log(`  FAIL  fallback zip write — ${err.message}`);
    }
    check("fallback stored .zip written", zipped);
  }

  if (!zipped || failures.length > 0) {
    console.error("\ngauge: packaging failed. Aborting.");
    process.exit(1);
  }

  const bytes = statSync(outPath).size;
  const sha = createHash("sha256").update(readFileSync(outPath)).digest("hex").slice(0, 16);
  console.log(`\ngauge: ok → ${path.relative(ROOT, outPath)} (${files.length} files, ${bytes} bytes, sha256:${sha}…)`);
}

main();
