import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../dist/pages/", import.meta.url));
const port = Number(process.env.PORT || 4173);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".map": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function inside(path) {
  return path === root || path.startsWith(root);
}

function resolvePath(urlPath) {
  const decoded = decodeURIComponent((urlPath || "/").split("?")[0]);
  const safe = normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, "");
  let full = join(root, safe);
  if (!inside(full)) return join(root, "index.html");
  if (existsSync(full) && statSync(full).isDirectory()) full = join(full, "index.html");
  if (existsSync(full) && statSync(full).isFile()) return full;
  if (decoded === "/admin" || decoded.startsWith("/admin/")) return join(root, "admin", "index.html");
  return join(root, "index.html");
}

const server = createServer((req, res) => {
  const file = resolvePath(req.url || "/");
  const type = types[extname(file)] || "application/octet-stream";
  res.setHeader("content-type", type);
  res.setHeader("cache-control", "no-cache");
  createReadStream(file)
    .on("error", () => {
      res.statusCode = 404;
      res.end("missing");
    })
    .pipe(res);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Demo site  http://127.0.0.1:${port}/`);
  console.log(`Admin      http://127.0.0.1:${port}/admin/`);
});
