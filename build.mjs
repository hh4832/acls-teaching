// Build the public "display" version into dist/ (deployed by Vercel).
// - copies index.html, chNN-*/ and shared/ only (no README, build scripts or git history)
// - strips speaker notes and HTML comments, minifies inline + shared JS/CSS
// - disables printing and adds a copyright line
import { transform } from "esbuild";
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(ROOT, "dist");
const COPYRIGHT = "© 懷顥 · 台北市立聯合醫院陽明院區 · 僅供線上觀看，未經授權請勿轉載或改作";

const DISPLAY_CSS = `
#notes,#mnotes,.notes{display:none!important}
.dsp-c{position:fixed;left:12px;bottom:10px;z-index:20;font:500 12px system-ui,sans-serif;color:rgba(128,144,173,.85);pointer-events:none;user-select:none}
body.m .dsp-c{bottom:calc(58px + env(safe-area-inset-bottom))}
@media print{#stage,#bar,#help,#mnav{display:none!important}body::before{content:"展示版不提供列印。${COPYRIGHT}";display:block;padding:40px;font:20px sans-serif;color:#333}}
`;

async function minJS(code) { return (await transform(code, { loader: "js", minify: true, legalComments: "none" })).code; }
async function minCSS(code) { return (await transform(code, { loader: "css", minify: true, legalComments: "none" })).code; }

async function html(src) {
  let h = await fs.readFile(src, "utf8");
  h = h.replace(/<!--[\s\S]*?-->/g, "");
  h = h.replace(/<div class="notes">[\s\S]*?<\/div>/g, "");
  h = h.replace(/(<div id="help">)[^<]*(<\/div>)/, "$1← → 翻頁 · F 全螢幕 · E 播放心電圖$2");
  h = h.replace(/(操作：)[^<]*/g, "$1← → 翻頁 · F 全螢幕 · E 播放 / 暫停心電圖");
  // minify inline <style> and <script> (but not <script src>)
  const parts = [];
  let last = 0;
  for (const m of h.matchAll(/<(style|script)>([\s\S]*?)<\/\1>/g)) {
    parts.push(h.slice(last, m.index));
    const body = m[1] === "style" ? await minCSS(m[2]) : await minJS(m[2]);
    parts.push(`<${m[1]}>${body}</${m[1]}>`);
    last = m.index + m[0].length;
  }
  parts.push(h.slice(last));
  h = parts.join("");
  h = h.replace(/<\/head>/, `<style>${await minCSS(DISPLAY_CSS)}</style><meta name="author" content="懷顥"></head>`);
  h = h.replace(/<\/body>/, `<div class="dsp-c">${COPYRIGHT}</div></body>`);
  h = h.replace(/\n\s+/g, "\n");
  return h;
}

async function walk(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p)); else out.push(p);
  }
  return out;
}

await fs.rm(OUT, { recursive: true, force: true });
const entries = (await fs.readdir(ROOT, { withFileTypes: true }))
  .filter(e => (e.isDirectory() && (/^ch\d\d-/.test(e.name) || e.name === "shared")) || e.name === "index.html");
let n = 0;
for (const e of entries) {
  const files = e.isDirectory() ? await walk(path.join(ROOT, e.name)) : [path.join(ROOT, e.name)];
  for (const f of files) {
    const rel = path.relative(ROOT, f), dst = path.join(OUT, rel), ext = path.extname(f).toLowerCase();
    if ([".md", ".py", ".mjs"].includes(ext)) continue;
    await fs.mkdir(path.dirname(dst), { recursive: true });
    if (ext === ".html") await fs.writeFile(dst, await html(f));
    else if (ext === ".js") await fs.writeFile(dst, await minJS(await fs.readFile(f, "utf8")));
    else if (ext === ".css") await fs.writeFile(dst, await minCSS(await fs.readFile(f, "utf8")));
    else await fs.copyFile(f, dst);
    n++;
  }
}
console.log(`display build: ${n} files → dist/`);
