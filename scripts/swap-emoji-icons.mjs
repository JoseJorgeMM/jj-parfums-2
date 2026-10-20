/**
 * swap-emoji-icons.mjs
 * J.J PARFUMS — Migra emojis decorativos a iconos SVG del sprite (#lc-*).
 * Reemplazos literales con normalize FE0F; idempotente.
 * Uso: node scripts/swap-emoji-icons.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const files = ["index.html", "catalogo.html"].map((f) => join(root, f));

const icon = (n) => `<svg class="lade" aria-hidden="true"><use href="#lc-${n}"/></svg>`;

const rules = [];
const map = (pat, rep) => rules.push([pat, rep]);
const VS = "\uFE0F";

// ---------- LANDING (index.html) ----------
map(`${icon("placeholder")}`.replace("#lc-placeholder", "#lc-KEEP") === "" ? "" : "✨ <strong>", `${icon("sparkle")} <strong>`);
map(
  `<span aria-hidden="true">👑</span>
          <span>Extractos Concentrados de Alta Gama</span>`,
  `<span aria-hidden="true">${icon("crown")}</span>
          <span>Extractos Concentrados de Alta Gama</span>`
);
map(`<span class="pill-icon" aria-hidden="true">💧</span>`, `<span class="pill-icon" aria-hidden="true">${icon("droplet")}</span>`);
map(`<span class="pill-icon" aria-hidden="true">⏳</span>`, `<span class="pill-icon" aria-hidden="true">${icon("hourglass")}</span>`);
map(`<span class="pill-icon" aria-hidden="true">✨</span>`, `<span class="pill-icon" aria-hidden="true">${icon("sparkle")}</span>`);
map(`<span class="pill-icon" aria-hidden="true">💎</span>`, `<span class="pill-icon" aria-hidden="true">${icon("gem")}</span>`);
map(`<span class="diff-badge-icon" aria-hidden="true">💧</span>`, `<span class="diff-badge-icon" aria-hidden="true">${icon("droplet")}</span>`);
map(`<span class="section-badge">🔥 Los Favoritos`, `<span class="section-badge">${icon("flame")} Los Favoritos`);
map(`<span>🌟 Todos`, `<span>${icon("star")} Todos`);
map(`<span>🎩 Para Él`, `<span>${icon("user")} Para Él`);
map(`<span>✨ Para Ella`, `<span>${icon("flower")} Para Ella`);

for (const [e, n] of [
  ["🔥", "flame"], ["💎", "gem"], ["⚡", "bolt"], ["🏆", "trophy"], ["🌙", "moon"],
  ["❄", "snow"], ["✨", "sparkle"], ["👑", "crown"], ["💥", "globe"], ["🍓", "fruit"],
]) {
  map(`<span class="badge-tag-rank">${e} `, `<span class="badge-tag-rank">${icon(n)} `);
}

for (const [e, n] of [
  ["💧", "droplet"], ["👑", "crown"], ["⚡", "bolt"], ["🌟", "star"], ["💎", "gem"], ["🎒", "backpack"],
]) {
  map(
    `<span aria-hidden="true">${e}</span>
              <span>`,
    `<span aria-hidden="true">${icon(n)}</span>
              <span>`
  );
}

for (const [e, n] of [["🌙", "moon"], ["💎", "gem"], ["👑", "crown"]]) {
  map(`<div class="universe-icon-emblem" aria-hidden="true">${e}</div>`, `<div class="universe-icon-emblem" aria-hidden="true">${icon(n)}</div>`);
}

map(`Pedir por WhatsApp 💬`, `Pedir por WhatsApp`);

// ---------- CATÁLOGO (catalogo.html) ----------
for (const [e, n] of [["💧", "droplet"], ["⏳", "hourglass"], ["✨", "sparkle"], ["💬", "chat"]]) {
  map(`<span class="strip-icon">${e}</span>`, `<span class="strip-icon">${icon(n)}</span>`);
}
for (const [e, n] of [["💧", "droplet"], ["⏳", "hourglass"], ["🚫", "banned"]]) {
  map(`<span class="prop-icon">${e}</span>`, `<span class="prop-icon">${icon(n)}</span>`);
}
for (const [e, n] of [
  ["🔥", "flame"], ["🌊", "droplet"], ["💼", "briefcase"], ["🌹", "flower"],
]) {
  map(`${e} `, `${icon(n)} `);
}

// ---------- Ejecución ----------
let total = 0;
for (const file of files) {
  let html = readFileSync(file, "utf8");
  // Normaliza: quita VS16 de los emojis de la página para permitir match literal
  html = html.split(VS).join("");
  let changed = 0;
  for (const [pat, rep] of rules) {
    const parts = html.split(pat);
    if (parts.length > 1) {
      changed += parts.length - 1;
      html = parts.join(rep);
    }
  }
  // Restaura VS16 en los corazones de favoritos (se mantienen como estado)
  html = html.split("❤").join(`❤${VS}`);
  html = html.split("🤍").join(`🤍${VS}`);
  writeFileSync(file, html, "utf8");
  console.log(file.split(/[/\\]/).pop(), "->", changed, "reemplazos");
  total += changed;
}
console.log("TOTAL:", total);

const left = files.map((f) => readFileSync(f, "utf8").match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu)).flat().filter(Boolean);
const freq = {};
for (const e of left) freq[e] = (freq[e] || 0) + 1;
console.log("Emojis restantes:", freq);
