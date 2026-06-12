/* Trening 20 minut — prosta aplikacja treningowa.
   Dane: localStorage + eksport/import CSV.
   Plan: globalny obiekt PLAN z plan.js (podmienialny). */

"use strict";

const LS_HISTORY = "trening.history.v1";
const LS_ACTIVE = "trening.active.v1";

const $app = document.getElementById("app");

// ---------- storage ----------

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(LS_HISTORY)) || []; }
  catch { return []; }
}
function saveHistory(h) { localStorage.setItem(LS_HISTORY, JSON.stringify(h)); }

function loadActive() {
  try { return JSON.parse(localStorage.getItem(LS_ACTIVE)); }
  catch { return null; }
}
function saveActive(a) {
  if (a) localStorage.setItem(LS_ACTIVE, JSON.stringify(a));
  else localStorage.removeItem(LS_ACTIVE);
}

// ---------- helpers ----------

function todayISO() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function round25(x) { return Math.round(x / 2.5) * 2.5; }
function fmtW(w) { return w == null || w === "" ? "—" : String(w).replace(".", ","); }

function sessionById(id) { return PLAN.sessions.find(s => s.id === id); }

function nextSessionId() {
  const h = loadHistory();
  if (!h.length) return PLAN.sessions[0].id;
  const lastId = h[h.length - 1].session;
  const idx = PLAN.sessions.findIndex(s => s.id === lastId);
  return PLAN.sessions[(idx + 1) % PLAN.sessions.length].id;
}

let toastTimer = null;
function toast(msg) {
  document.querySelectorAll(".toast").forEach(t => t.remove());
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.remove(), 3000);
}

// ---------- progression logic (zasady z planu) ----------

function entriesFor(name) {
  const out = [];
  for (const e of loadHistory()) {
    for (const r of e.rows) {
      if (r.name === name) out.push({ date: e.date, weight: r.weight, reps: r.reps, rpe: r.rpe });
    }
  }
  return out; // historia jest chronologiczna (append-only)
}

function suggest(ex, name) {
  const hist = entriesFor(name);
  if (!hist.length) {
    return { weight: null, target: ex.repMin, last: null,
      msg: `Pierwszy raz — dobierz ciężar tak, by ${ex.repMin} powt. wyszło na RPE ~7.` };
  }
  const last = hist[hist.length - 1];
  const prev = hist.length > 1 ? hist[hist.length - 2] : null;
  const reps = (last.reps || []).filter(r => r != null);
  const best = reps.length ? Math.max(...reps) : 0;

  if (last.weight == null) {
    return { weight: null, target: ex.repMin, last, msg: "Brak zapisanego ciężaru — dobierz jak za pierwszym razem." };
  }

  const allTop = reps.length >= ex.sets && reps.every(r => r >= ex.repMax);
  const rpeOk = last.rpe == null || last.rpe <= 9;
  if (allTop && rpeOk) {
    return { weight: round25(last.weight + ex.inc), target: ex.repMin, last,
      msg: `Awans! Pełny zakres ostatnio → +${ex.inc} kg, celuj w dół zakresu.` };
  }

  const failed = reps.some(r => r < ex.repMin);
  const prevFailed = prev && prev.weight === last.weight && (prev.reps || []).some(r => r < ex.repMin);
  if (failed && prevFailed) {
    return { weight: round25(last.weight * 0.9), target: ex.repMin, last,
      msg: "Dwie sesje poniżej zakresu → −10%, budujemy od nowa." };
  }
  if (failed) {
    return { weight: last.weight, target: ex.repMin, last,
      msg: "Poniżej zakresu ostatnio — utrzymaj ciężar, celuj w dół zakresu." };
  }

  // stagnacja: 3 sesje z rzędu ten sam ciężar bez poprawy najlepszej serii
  let hint = null;
  if (hist.length >= 3) {
    const [a, b, c] = hist.slice(-3);
    const bestOf = e => Math.max(0, ...(e.reps || []).filter(r => r != null));
    if (a.weight === c.weight && b.weight === c.weight && bestOf(c) <= bestOf(a)) {
      hint = "3 sesje bez progresu — rozważ zamiennik na 3–4 tyg. albo −10%.";
    }
  }
  return { weight: last.weight, target: Math.min(best + 1, ex.repMax), last, hint,
    msg: `Spróbuj pobić ostatni wynik o 1 powt. (cel: ${Math.min(best + 1, ex.repMax)}).` };
}

// ---------- CSV ----------

function csvField(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function historyToCSV() {
  const lines = [PLAN.csvHeader];
  for (const e of loadHistory()) {
    for (const r of e.rows) {
      const reps = r.reps || [];
      lines.push([
        e.date, e.session, r.name,
        r.weight ?? "", reps[0] ?? "", reps[1] ?? "", reps[2] ?? "",
        r.rpe ?? "", csvField(r.note ?? ""),
      ].join(","));
    }
  }
  return lines.join("\n");
}

function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') inQ = false;
      else field += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some(f => f !== "")) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some(f => f !== "")) rows.push(row);
  return rows;
}

function csvToHistory(text) {
  const rows = parseCSV(text.trim());
  if (!rows.length) throw new Error("Pusty plik");
  const start = rows[0][0] === "data" ? 1 : 0; // pomiń nagłówek
  const byKey = new Map();
  for (const r of rows.slice(start)) {
    const [data, sesja, cwiczenie, ciezar, p1, p2, p3, rpe, uwagi] = r;
    if (!data || !cwiczenie) continue;
    const key = data + "|" + sesja;
    if (!byKey.has(key)) byKey.set(key, { date: data, session: sesja, rows: [] });
    const reps = [p1, p2, p3].filter(x => x !== "" && x != null).map(Number);
    byKey.get(key).rows.push({
      name: cwiczenie,
      weight: ciezar === "" ? null : Number(ciezar),
      reps, rpe: rpe === "" || rpe == null ? null : Number(rpe),
      note: uwagi || "",
    });
  }
  return [...byKey.values()].sort((a, b) => a.date < b.date ? -1 : 1);
}

async function exportCSV() {
  const csv = historyToCSV();
  const file = new File(["﻿" + csv], "trening-historia.csv", { type: "text/csv" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: "Historia treningów" }); return; }
    catch (e) { if (e.name === "AbortError") return; }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url; a.download = "trening-historia.csv";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

async function copyCSV() {
  try { await navigator.clipboard.writeText(historyToCSV()); toast("CSV skopiowane do schowka"); }
  catch { toast("Nie udało się skopiować — użyj eksportu"); }
}

function importCSV(fileInput) {
  const f = fileInput.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const hist = csvToHistory(reader.result);
      if (!confirm(`Wczytano ${hist.length} sesji. Zastąpić obecną historię (${loadHistory().length} sesji)?`)) return;
      saveHistory(hist);
      toast("Historia zaimportowana");
      renderHome();
    } catch (e) { toast("Błąd importu: " + e.message); }
  };
  reader.readAsText(f);
}

// ---------- widok: start ----------

function renderHome() {
  const hist = loadHistory();
  const active = loadActive();
  const nextId = nextSessionId();
  const next = sessionById(nextId);

  let html = `<h1>Trening 20 minut</h1>
    <div class="sub">20 min spaceru → 20 min siłowni · kolejka A→B→C</div>`;

  if (active) {
    html += `<div class="card">
      <b>Masz niedokończoną sesję ${esc(active.session)}</b>
      <div class="sub">rozpoczętą ${esc(active.date)}</div>
      <button class="btn-primary" id="resumeBtn">Wznów sesję</button>
      <button class="btn-secondary btn-danger" id="discardBtn">Odrzuć</button>
    </div>`;
  }

  html += `<div class="card hero">
      <div class="sub">następna w kolejce</div>
      <div class="session-letter">${esc(nextId)}</div>
      <div><b>${esc(next.title)}</b></div>
      <div class="sub">${esc(next.station)}</div>
      <button class="btn-primary" id="startBtn">Zacznij sesję ${esc(nextId)}</button>
      <div class="session-picker">
        ${PLAN.sessions.map(s =>
          `<button data-start="${s.id}" class="${s.id === nextId ? "" : "dim"}">${s.id}</button>`).join("")}
      </div>
    </div>`;

  html += `<div class="card"><h2>Historia (${hist.length})</h2>`;
  if (!hist.length) html += `<div class="sub">Jeszcze nic tu nie ma — zrób pierwszą sesję!</div>`;
  else {
    html += hist.slice(-8).reverse().map(e =>
      `<div class="hist-row"><span><span class="sid">${esc(e.session)}</span> · ${esc(e.date)}</span>
       <span class="muted">${e.rows.length} ćw.</span></div>`).join("");
  }
  html += `<div class="btn-row">
      <button class="btn-small" id="exportBtn">Eksportuj CSV</button>
      <button class="btn-small" id="copyBtn">Kopiuj CSV</button>
      <button class="btn-small" id="importBtn">Import CSV</button>
    </div>
    <input type="file" id="importFile" accept=".csv,text/csv" style="display:none">
  </div>
  <div class="footer-note">plan: ${esc(PLAN.version)} · dane w pamięci przeglądarki — eksportuj CSV po sesji</div>`;

  $app.innerHTML = html;

  document.getElementById("startBtn").onclick = () => startSession(nextId);
  document.querySelectorAll("[data-start]").forEach(b => b.onclick = () => {
    const id = b.dataset.start;
    if (id !== nextId && !confirm(`Następna w kolejce jest sesja ${nextId}. Na pewno zacząć ${id}?`)) return;
    startSession(id);
  });
  if (active) {
    document.getElementById("resumeBtn").onclick = () => renderSession();
    document.getElementById("discardBtn").onclick = () => {
      if (confirm("Odrzucić niedokończoną sesję?")) { saveActive(null); renderHome(); }
    };
  }
  document.getElementById("exportBtn").onclick = exportCSV;
  document.getElementById("copyBtn").onclick = copyCSV;
  const fileInput = document.getElementById("importFile");
  document.getElementById("importBtn").onclick = () => fileInput.click();
  fileInput.onchange = () => importCSV(fileInput);
}

// ---------- widok: sesja ----------

function startSession(id) {
  const plan = sessionById(id);
  const items = plan.exercises.map(ex => {
    const sug = suggest(ex, ex.name);
    return {
      slot: ex.slot, baseName: ex.name, name: ex.name,
      weight: sug.weight,
      sets: Array.from({ length: ex.sets }, () => ({ reps: sug.target, done: false })),
      rpe: null, note: "",
    };
  });
  saveActive({
    date: todayISO(), session: id, startedAt: Date.now(),
    items, mobilityDone: plan.mobility.map(() => false),
  });
  renderSession();
}

function planExFor(active, item) {
  return sessionById(active.session).exercises.find(e => e.slot === item.slot);
}

function renderSession() {
  const active = loadActive();
  if (!active) { renderHome(); return; }
  const plan = sessionById(active.session);

  let html = `<div class="top-bar">
      <button id="backBtn">← wróć</button>
      <span class="sub">${esc(active.date)}</span>
    </div>
    <h1>Sesja ${esc(active.session)} — ${esc(plan.title)}</h1>
    <div class="sub">${esc(plan.station)} · A1→A2 naprzemiennie, przerwa 60–90 s po parze</div>`;

  let lastPair = "";
  active.items.forEach((item, i) => {
    const ex = planExFor(active, item);
    const pair = item.slot[0];
    if (pair !== lastPair) {
      html += `<div class="pair-label">Superseria ${pair === "A" ? "1" : "2"}</div>`;
      lastPair = pair;
    }
    const sug = suggest(ex, item.name);
    const allDone = item.sets.every(s => s.done);
    const lastTxt = sug.last
      ? `Ostatnio: <b>${fmtW(sug.last.weight)} kg</b> → ${(sug.last.reps || []).join(", ")} powt.${sug.last.rpe ? " @RPE " + sug.last.rpe : ""}`
      : "Brak historii";
    const info = typeof EXERCISE_INFO !== "undefined" ? EXERCISE_INFO[item.name] : null;
    const howto = info ? `
      <details class="howto" data-howto="${i}" ${item.infoOpen ? "open" : ""}>
        <summary>ℹ️ Jak wykonać</summary>
        <p>${esc(info.desc)}</p>
        <div class="thumbs">
          ${[1, 2, 3].map(n =>
            `<a href="https://youtu.be/${info.yt}" target="_blank" rel="noopener">
               <img loading="lazy" src="https://i.ytimg.com/vi/${info.yt}/hq${n}.jpg" alt="technika — klatka ${n}"></a>`).join("")}
        </div>
        <a class="yt-link" href="https://youtu.be/${info.yt}" target="_blank" rel="noopener">▶ Obejrzyj film z techniką</a>
      </details>` : "";

    html += `<div class="card ex-card ${allDone ? "done-all" : ""}" data-i="${i}">
      <div class="ex-head">
        <span><span class="ex-slot">${esc(item.slot)}</span> <span class="ex-name">${esc(item.name)}</span></span>
        <span class="sub">${ex.repMin}–${ex.repMax} @RPE ${esc(ex.rpe)}</span>
      </div>
      <div class="ex-tip">${esc(ex.tip)}</div>
      ${howto}
      <div class="suggestion">${lastTxt}<br>${esc(sug.msg)}
        ${sug.hint ? `<br><span class="hint">⚠ ${esc(sug.hint)}</span>` : ""}</div>
      <div class="weight-row">
        <label>Ciężar (kg)</label>
        <input type="number" inputmode="decimal" step="0.5" min="0"
               value="${item.weight ?? ""}" data-w="${i}">
        <select data-sub="${i}" title="zamiennik">
          ${[item.baseName, ...ex.subs].map(n =>
            `<option value="${esc(n)}" ${n === item.name ? "selected" : ""}>${esc(n)}</option>`).join("")}
        </select>
      </div>
      ${item.sets.map((s, j) => `
        <div class="set-row">
          <span class="set-label">Seria ${j + 1}</span>
          <span class="stepper">
            <button data-dec="${i}:${j}">−</button>
            <span class="val">${s.reps}</span>
            <button data-inc="${i}:${j}">+</button>
          </span>
          <button class="check ${s.done ? "on" : ""}" data-done="${i}:${j}">${s.done ? "✓" : "○"}</button>
        </div>`).join("")}
      ${item.sets.length < 4 ? `<button class="add-set" data-add="${i}">+ dodaj serię</button>` : ""}
      <div class="rpe-row"><span class="lbl">RPE</span>
        ${[7, 8, 9, 10].map(r =>
          `<button class="rpe-chip ${item.rpe === r ? "on" : ""}" data-rpe="${i}:${r}">${r}</button>`).join("")}
      </div>
      <input type="text" class="note-input" placeholder="notatka (opcjonalnie)"
             value="${esc(item.note)}" data-note="${i}">
    </div>`;
  });

  html += `<div class="pair-label">Mobilność (~3 min)</div><div class="card">
    ${plan.mobility.map((m, j) => `
      <div class="mob-item ${active.mobilityDone[j] ? "on" : ""}">
        <button class="check ${active.mobilityDone[j] ? "on" : ""}" data-mob="${j}">${active.mobilityDone[j] ? "✓" : "○"}</button>
        <span>${esc(m)}</span>
      </div>`).join("")}
  </div>
  <button class="btn-primary" id="finishBtn">Zakończ i zapisz sesję</button>`;

  $app.innerHTML = html;
  window.scrollTo(0, 0);
  bindSession(active);
}

function bindSession(active) {
  const save = () => saveActive(active);
  const rerender = () => { save(); renderSession(); };

  document.getElementById("backBtn").onclick = () => { save(); renderHome(); };

  document.querySelectorAll("[data-howto]").forEach(d => d.ontoggle = () => {
    active.items[+d.dataset.howto].infoOpen = d.open;
    save();
  });
  document.querySelectorAll("[data-w]").forEach(inp => inp.onchange = () => {
    const i = +inp.dataset.w;
    active.items[i].weight = inp.value === "" ? null : Number(inp.value);
    save();
  });
  document.querySelectorAll("[data-sub]").forEach(sel => sel.onchange = () => {
    const i = +sel.dataset.sub;
    const item = active.items[i];
    item.name = sel.value;
    const ex = planExFor(active, item);
    const sug = suggest(ex, item.name);
    item.weight = sug.weight;
    item.sets = item.sets.map(() => ({ reps: sug.target, done: false }));
    rerender();
  });
  document.querySelectorAll("[data-dec]").forEach(b => b.onclick = () => {
    const [i, j] = b.dataset.dec.split(":").map(Number);
    active.items[i].sets[j].reps = Math.max(0, active.items[i].sets[j].reps - 1);
    rerender();
  });
  document.querySelectorAll("[data-inc]").forEach(b => b.onclick = () => {
    const [i, j] = b.dataset.inc.split(":").map(Number);
    active.items[i].sets[j].reps = Math.min(30, active.items[i].sets[j].reps + 1);
    rerender();
  });
  document.querySelectorAll("[data-done]").forEach(b => b.onclick = () => {
    const [i, j] = b.dataset.done.split(":").map(Number);
    const s = active.items[i].sets[j];
    s.done = !s.done;
    rerender();
  });
  document.querySelectorAll("[data-add]").forEach(b => b.onclick = () => {
    const i = +b.dataset.add;
    const sets = active.items[i].sets;
    sets.push({ reps: sets[sets.length - 1].reps, done: false });
    rerender();
  });
  document.querySelectorAll("[data-rpe]").forEach(b => b.onclick = () => {
    const [i, r] = b.dataset.rpe.split(":").map(Number);
    active.items[i].rpe = active.items[i].rpe === r ? null : r;
    rerender();
  });
  document.querySelectorAll("[data-note]").forEach(inp => inp.onchange = () => {
    active.items[+inp.dataset.note].note = inp.value;
    save();
  });
  document.querySelectorAll("[data-mob]").forEach(b => b.onclick = () => {
    const j = +b.dataset.mob;
    active.mobilityDone[j] = !active.mobilityDone[j];
    rerender();
  });

  document.getElementById("finishBtn").onclick = () => finishSession(active);
}

function finishSession(active) {
  const rows = active.items
    .filter(it => it.sets.some(s => s.done))
    .map(it => ({
      name: it.name,
      weight: it.weight,
      reps: it.sets.filter(s => s.done).map(s => s.reps),
      rpe: it.rpe,
      note: it.note,
    }));

  const skipped = active.items.length - rows.length;
  let msg = `Zapisać sesję ${active.session}? Wykonane ćwiczenia: ${rows.length}/${active.items.length}.`;
  if (skipped > 0) msg += `\n(${skipped} bez odhaczonej serii — nie zostaną zapisane)`;
  if (!rows.length) { toast("Odhacz przynajmniej jedną serię (✓)"); return; }
  if (!confirm(msg)) return;

  const hist = loadHistory();
  hist.push({ date: active.date, session: active.session, rows });
  saveHistory(hist);
  saveActive(null);
  renderHome();
  toast("Sesja zapisana 💪 — eksportuję CSV…");
  exportCSV();
}

// ---------- start ----------

renderHome();
