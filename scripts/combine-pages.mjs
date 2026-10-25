import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";

rmSync("dist/pages", { recursive: true, force: true });
mkdirSync("dist/pages", { recursive: true });
cpSync("apps/customer/dist/build/h5", "dist/pages", { recursive: true });
cpSync("apps/admin/dist", "dist/pages/admin", { recursive: true });
writeFileSync(
  "dist/pages/_redirects",
  "/admin /admin/index.html 200\n/admin/* /admin/index.html 200\n",
);
console.log("Combined static site: dist/pages");
console.log("  customer H5  -> dist/pages/");
console.log("  admin        -> dist/pages/admin/");
