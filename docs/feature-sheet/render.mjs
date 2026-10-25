/**
 * Render docs/feature-sheet/sheet.html to:
 *   feature-sheet.png   1080px wide
 *   feature-sheet.jpg   same image, compressed under 500KB
 *
 *   node docs/feature-sheet/render.mjs
 *
 * Requires Google Chrome (or Chromium on PATH as google-chrome / chromium) and ffmpeg.
 * Install Noto Sans CJK SC and Noto Serif CJK SC for the intended Chinese type.
 */
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const htmlPath = resolve(dir, "sheet.html");
const pngPath = resolve(dir, "feature-sheet.png");
const jpgPath = resolve(dir, "feature-sheet.jpg");
const rawPath = "/tmp/feature-sheet-raw.png";
const chromeBin = process.env.CHROME || "google-chrome";

const chrome = spawn(
  chromeBin,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--hide-scrollbars",
    "--allow-file-access-from-files",
    "--remote-debugging-port=9341",
    "--user-data-dir=/tmp/chrome-feature-sheet",
    "about:blank",
  ],
  { stdio: "ignore" },
);

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let seq = 0;
function rpc(ws, method, params = {}, sessionId) {
  const messageId = ++seq;
  return new Promise((resolveRpc, reject) => {
    const onMessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id !== messageId) return;
      ws.removeEventListener("message", onMessage);
      if (data.error) reject(new Error(JSON.stringify(data.error)));
      else resolveRpc(data.result);
    };
    ws.addEventListener("message", onMessage);
    ws.send(JSON.stringify({ id: messageId, method, params, sessionId }));
  });
}

function run(cmd, args) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit" });
    child.on("exit", (code) => (code === 0 ? resolveRun() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

async function main() {
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch("http://127.0.0.1:9341/json/version")).ok) break;
    } catch {
      await wait(120);
    }
  }
  const version = await fetch("http://127.0.0.1:9341/json/version").then((r) => r.json());
  const browser = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((resolveOpen) => browser.addEventListener("open", resolveOpen));
  const { targetId } = await rpc(browser, "Target.createTarget", { url: "about:blank" });
  const { sessionId } = await rpc(browser, "Target.attachToTarget", { targetId, flatten: true });
  const send = (method, params) => rpc(browser, method, params, sessionId);
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.navigate", { url: `file://${htmlPath}` });
  await wait(700);
  const size = await send("Runtime.evaluate", {
    expression: `(() => { const sheet = document.querySelector(".sheet"); const box = sheet.getBoundingClientRect(); return { width: Math.ceil(box.width), height: Math.ceil(box.height) }; })()`,
    returnByValue: true,
  });
  const { width, height } = size.result.value;
  if (width !== 1080) throw new Error(`sheet width is ${width}, expected 1080`);
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 2,
    mobile: false,
  });
  await wait(400);
  const { data } = await send("Page.captureScreenshot", { format: "png", fromSurface: true });
  writeFileSync(rawPath, Buffer.from(data, "base64"));
  browser.close();
  chrome.kill();
  await run("ffmpeg", ["-y", "-loglevel", "error", "-i", rawPath, "-vf", "scale=1080:-1", "-update", "1", pngPath]);
  let quality = 4;
  for (; quality <= 12; quality += 1) {
    await run("ffmpeg", ["-y", "-loglevel", "error", "-i", pngPath, "-q:v", String(quality), "-update", "1", jpgPath]);
    const { size: bytes } = await import("node:fs").then((fs) => fs.statSync(jpgPath));
    console.log(`jpg q=${quality} ${(bytes / 1024).toFixed(0)}KB`);
    if (bytes < 500 * 1024) break;
  }
  const { statSync } = await import("node:fs");
  console.log(`png ${(statSync(pngPath).size / 1024).toFixed(0)}KB`);
  console.log(pngPath);
  console.log(jpgPath);
}

main().catch((error) => {
  console.error(error);
  chrome.kill();
  process.exit(1);
});
