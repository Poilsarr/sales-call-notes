import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Part 6A — extension packaging checks.
 *
 * Pure static checks against the real extension/manifest.json on disk.
 * No chrome APIs, no network, no mocks: JSON parse + allowlists + file
 * existence. Mirrors the validation in scripts/package-extension.mjs so
 * `node scripts/package-extension.mjs` and this suite agree.
 */

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const EXT_DIR = path.resolve(TEST_DIR, "../../extension");
const MANIFEST_PATH = path.join(EXT_DIR, "manifest.json");

const ALLOWED_PERMISSIONS = new Set([
  "storage",
  "tabCapture",
  "offscreen",
  "sidePanel",
  "alarms",
]);

const ALLOWED_HOST_PERMISSIONS = new Set([
  "https://meet.google.com/*",
  "https://teams.microsoft.com/*",
  "https://*.zoom.us/*",
  "https://usegauge.vercel.app/*",
]);

const SEMVER_RE =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

function loadManifest(): Record<string, any> {
  return JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
}

/** Every file path referenced by the manifest, relative to extension/. */
function collectReferencedFiles(manifest: Record<string, any>): string[] {
  const refs: string[] = [];
  const push = (v: unknown) => {
    if (typeof v === "string" && v.length > 0) refs.push(v);
  };
  for (const v of Object.values((manifest.icons ?? {}) as Record<string, unknown>)) push(v);
  const action = (manifest.action ?? {}) as Record<string, any>;
  push(action.default_popup);
  for (const v of Object.values((action.default_icon ?? {}) as Record<string, unknown>)) push(v);
  push(manifest.side_panel?.default_path);
  push(manifest.background?.service_worker);
  for (const cs of (manifest.content_scripts ?? []) as Array<{ js?: string[]; css?: string[] }>) {
    for (const f of cs.js ?? []) push(f);
    for (const f of cs.css ?? []) push(f);
  }
  return [...new Set(refs)];
}

describe("extension package manifest", () => {
  it("parses as valid JSON with a manifest_version field", () => {
    const manifest = loadManifest();
    expect(typeof manifest).toBe("object");
    expect(manifest.manifest_version).toBeDefined();
  });

  it("targets Manifest V3", () => {
    expect(loadManifest().manifest_version).toBe(3);
  });

  it("has a non-empty name", () => {
    const { name } = loadManifest();
    expect(typeof name).toBe("string");
    expect(name.length).toBeGreaterThan(0);
  });

  it("has a semver version", () => {
    const { version } = loadManifest();
    expect(typeof version).toBe("string");
    expect(version).toMatch(SEMVER_RE);
  });

  it("requests only allowlisted permissions", () => {
    const permissions = loadManifest().permissions as string[];
    expect(Array.isArray(permissions)).toBe(true);
    for (const p of permissions) {
      expect(ALLOWED_PERMISSIONS.has(p), `unexpected permission: ${p}`).toBe(true);
    }
  });

  it("requests only meeting-provider + app-origin host permissions", () => {
    const hosts = loadManifest().host_permissions as string[];
    expect(Array.isArray(hosts)).toBe(true);
    for (const h of hosts) {
      expect(ALLOWED_HOST_PERMISSIONS.has(h), `unexpected host_permission: ${h}`).toBe(true);
    }
  });

  it("declares 16/48/128 icons", () => {
    const icons = loadManifest().icons as Record<string, string>;
    expect(icons?.["16"]).toMatch(/\.png$/);
    expect(icons?.["48"]).toMatch(/\.png$/);
    expect(icons?.["128"]).toMatch(/\.png$/);
  });

  it("declares a sidepanel entry point", () => {
    expect(loadManifest().side_panel?.default_path).toBe("sidepanel.html");
  });

  it("declares a service-worker background entry point", () => {
    expect(loadManifest().background?.service_worker).toMatch(/\.js$/);
  });

  it("every manifest-referenced file exists on disk", () => {
    const manifest = loadManifest();
    const refs = collectReferencedFiles(manifest);
    expect(refs.length).toBeGreaterThan(0);
    for (const rel of refs) {
      expect(existsSync(path.join(EXT_DIR, rel)), `missing referenced file: ${rel}`).toBe(true);
    }
  });

  it("icon files exist on disk", () => {
    for (const f of ["icon16.png", "icon48.png", "icon128.png"]) {
      expect(existsSync(path.join(EXT_DIR, f)), `missing icon: ${f}`).toBe(true);
    }
  });

  it("offscreen document exists while the offscreen permission is requested", () => {
    const permissions = loadManifest().permissions as string[];
    if (permissions.includes("offscreen")) {
      expect(existsSync(path.join(EXT_DIR, "offscreen.html"))).toBe(true);
      expect(existsSync(path.join(EXT_DIR, "offscreen.js"))).toBe(true);
    }
  });
});
