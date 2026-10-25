import type { Locale, Order } from "@demo/core";
import { shop } from "@demo/shop";

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[char] || char;
  });
}

/**
 * Browser stand-in for a receipt printer.
 * PRINTER_HOOK: replace `window.print()` with an ESC/POS or cloud-printer call.
 */
export function printTicket(order: Order, locale: Locale, money: (cents: number) => string): boolean {
  const name = shop.name[locale];
  const lines = order.lines
    .map((line) => {
      const spec = line.specSummary[locale];
      const addon = line.addonSummary[locale];
      const detail = [spec, addon].filter(Boolean).join(" · ");
      return `<tr><td>${esc(line.name[locale])} × ${line.qty}${detail ? `<br><span class="dim">${esc(detail)}</span>` : ""}</td><td class="right">${esc(money(line.lineTotal))}</td></tr>`;
    })
    .join("");
  const receipt = order.receipt
    ? `<p>${esc(order.receipt.name)} · ${esc(order.receipt.email)}${order.receipt.taxId ? ` · ${esc(order.receipt.taxId)}` : ""}</p>`
    : "";
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(order.pickupNo)}</title>
    <style>
      body { font-family: "Iowan Old Style", Palatino, "Songti SC", serif; width: 280px; margin: 16px auto; color: #2a2118; }
      h1 { text-align: center; font-size: 42px; margin: 8px 0; letter-spacing: 2px; }
      .center, .dim { text-align: center; }
      .dim { color: #8a7664; font-size: 12px; font-family: sans-serif; }
      table { width: 100%; border-collapse: collapse; font-size: 14px; }
      td { padding: 4px 0; vertical-align: top; }
      .right { text-align: right; }
      hr { border: none; border-top: 1px dashed #c4522a; }
    </style></head><body>
    <p class="dim">${locale === "zh" ? "演示小票 · 非真实交易" : "Demo ticket · not a real payment"}</p>
    <h1>${esc(order.pickupNo)}</h1>
    <p class="center">${esc(name)}</p>
    <p class="dim">${esc(shop.address[locale])}<br>${esc(shop.phoneDisplay)}</p>
    <hr>
    <table>${lines}</table>
    <hr>
    <p class="right">${locale === "zh" ? "应付" : "Due"} ${esc(money(order.payable))}</p>
    <p class="dim">${esc(order.note || "")}</p>
    ${receipt}
    <p class="center dim">${locale === "zh" ? "欢迎再来" : "See you again"}</p>
    </body></html>`;
  const popup = window.open("", "ticket", "width=420,height=720");
  if (!popup) return false;
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
  popup.focus();
  window.setTimeout(() => popup.print(), 200);
  return true;
}
