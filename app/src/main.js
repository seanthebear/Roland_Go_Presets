import { CATEGORIES, PRESETS } from './data/presets.js';

// ── State ────────────────────────────────────────────────────
const state = {
  midiAccess:   null,
  output:       null,
  channel:      1,       // 1-based MIDI channel
  selectedCat:  null,    // null = "All"
  search:       '',
  lastPlayed:   null,    // DOM element for .playing highlight
  activePreset: null,    // [name, cat, msb, lsb, pc]
};

// ── DOM refs ─────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const el = {
  indicator:   $('midi-indicator'),
  statusText:  $('midi-status-text'),
  outputSel:   $('output-select'),
  channelSel:  $('channel-select'),
  catGrid:     $('category-grid'),
  presetList:  $('preset-list'),
  presetCount: $('preset-count'),
  search:      $('search'),
  noResults:   $('no-results'),
  nowPlaying:  $('now-playing'),
  npName:      $('np-name'),
  npCat:       $('np-cat'),
  npAddr:      $('np-addr'),
  helpBtn:     $('help-btn'),
  helpOverlay: $('help-overlay'),
  helpClose:   $('help-close'),
  helpTriggers: document.querySelectorAll('.help-trigger'),
};

// ── MIDI ─────────────────────────────────────────────────────
async function initMIDI() {
  if (!navigator.requestMIDIAccess) {
    setMIDIState('unsupported', 'Web MIDI not supported — use Chrome or Edge');
    return;
  }
  try {
    state.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
    state.midiAccess.onstatechange = refreshOutputs;
    refreshOutputs();
  } catch {
    setMIDIState('denied', 'MIDI access denied');
  }
}

function refreshOutputs() {
  const outputs = [...state.midiAccess.outputs.values()];
  const prev = el.outputSel.value;

  el.outputSel.innerHTML = outputs.length
    ? outputs.map(o => `<option value="${escHtml(o.id)}">${escHtml(o.name)}</option>`).join('')
    : '<option value="">No MIDI outputs found</option>';

  // Restore previous selection if it still exists
  if (prev && outputs.some(o => o.id === prev)) {
    el.outputSel.value = prev;
  }

  const selected = el.outputSel.value;
  state.output = outputs.find(o => o.id === selected) ?? null;

  if (outputs.length) {
    setMIDIState('connected', `${outputs.length} output${outputs.length > 1 ? 's' : ''}`);
  } else {
    setMIDIState('no-device', 'No outputs found');
  }
}

function setMIDIState(s, msg) {
  el.indicator.dataset.state = s;
  el.statusText.textContent = msg;
}

function sendPreset(msb, lsb, pc) {
  if (!state.output) return;
  const ch = state.channel - 1; // 0-based
  state.output.send([0xB0 | ch, 0,  msb]);    // Bank Select MSB (CC0)
  state.output.send([0xB0 | ch, 32, lsb]);    // Bank Select LSB (CC32)
  state.output.send([0xC0 | ch, pc - 1]);     // Program Change (0-indexed)
}

// ── Filtering ────────────────────────────────────────────────
function getFiltered() {
  let list = PRESETS;
  if (state.selectedCat) {
    list = list.filter(p => p[1] === state.selectedCat);
  }
  if (state.search) {
    const q = state.search.toLowerCase();
    list = list.filter(p => p[0].toLowerCase().includes(q));
  }
  return list;
}

// ── Category rendering ───────────────────────────────────────
function renderCategories() {
  // Count presets per category in current unfiltered set (search-independent)
  const baseList = state.selectedCat
    ? PRESETS
    : PRESETS;

  const counts = {};
  PRESETS.forEach(p => { counts[p[1]] = (counts[p[1]] || 0) + 1; });

  const frag = document.createDocumentFragment();

  // "All" button
  const allBtn = document.createElement('button');
  allBtn.className = 'cat-btn' + (state.selectedCat === null ? ' active' : '');
  allBtn.dataset.cat = '';
  allBtn.innerHTML =
    `<span class="cat-code">ALL</span>` +
    `<span class="cat-name">All Sounds</span>` +
    `<span class="cat-count">${PRESETS.length}</span>`;
  frag.appendChild(allBtn);

  for (const [code, name] of Object.entries(CATEGORIES)) {
    const count = counts[code] ?? 0;
    if (!count) continue;
    const btn = document.createElement('button');
    btn.className = 'cat-btn' + (state.selectedCat === code ? ' active' : '');
    btn.dataset.cat = code;
    btn.innerHTML =
      `<span class="cat-code">${escHtml(code)}</span>` +
      `<span class="cat-name">${escHtml(name)}</span>` +
      `<span class="cat-count">${count}</span>`;
    frag.appendChild(btn);
  }

  el.catGrid.replaceChildren(frag);
}

// ── Preset list rendering ────────────────────────────────────
function renderPresets() {
  const filtered = getFiltered();

  el.presetCount.textContent = `${filtered.length.toLocaleString()} preset${filtered.length !== 1 ? 's' : ''}`;
  el.noResults.hidden = filtered.length > 0;

  const frag = document.createDocumentFragment();
  let prevLsb = null;

  filtered.forEach(([name, cat, msb, lsb, pc]) => {
    const row = document.createElement('button');
    row.role = 'listitem';
    row.className = 'preset-row' + (prevLsb !== null && lsb !== prevLsb ? ' group-sep' : '');
    row.dataset.msb = msb;
    row.dataset.lsb = lsb;
    row.dataset.pc  = pc;

    row.innerHTML =
      `<span class="preset-name">${escHtml(name)}</span>` +
      `<span class="preset-cat">${escHtml(cat)}</span>` +
      `<span class="preset-addr">${msb}·${lsb}·${pc}</span>`;

    row.addEventListener('click', () => {
      sendPreset(msb, lsb, pc);
      highlightRow(row);
      setActivePreset([name, cat, msb, lsb, pc]);
    });

    prevLsb = lsb;
    frag.appendChild(row);
  });

  el.presetList.replaceChildren(frag);
}

function highlightRow(row) {
  if (state.lastPlayed) state.lastPlayed.classList.remove('playing');
  row.classList.add('playing');
  state.lastPlayed = row;
  row.classList.add('send-flash');
  row.addEventListener('animationend', () => row.classList.remove('send-flash'), { once: true });
}

function setActivePreset([name, cat, msb, lsb, pc]) {
  state.activePreset = [name, cat, msb, lsb, pc];
  el.npName.textContent  = name;
  el.npCat.textContent   = cat;
  el.npAddr.textContent  = `${msb}·${lsb}·${pc}`;
  el.nowPlaying.dataset.active = 'true';
}

// ── Full render ──────────────────────────────────────────────
function render() {
  renderCategories();
  renderPresets();
}

// ── Event wiring ─────────────────────────────────────────────
el.catGrid.addEventListener('click', e => {
  const btn = e.target.closest('.cat-btn');
  if (!btn) return;
  state.selectedCat = btn.dataset.cat || null;
  state.search = '';
  el.search.value = '';
  render();
});

el.outputSel.addEventListener('change', e => {
  state.output = state.midiAccess?.outputs.get(e.target.value) ?? null;
});

el.channelSel.addEventListener('change', e => {
  state.channel = parseInt(e.target.value, 10);
});

el.search.addEventListener('input', e => {
  state.search = e.target.value;
  renderPresets();
});

// Clear search on Escape
el.search.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    state.search = '';
    el.search.value = '';
    renderPresets();
    el.search.blur();
  }
});

// ── Help panel ───────────────────────────────────────────────
function openHelp() {
  el.helpOverlay.hidden = false;
  el.helpClose.focus();
}
function closeHelp() {
  el.helpOverlay.hidden = true;
  el.helpBtn.focus();
}
el.helpTriggers.forEach(btn => btn.addEventListener('click', openHelp));
el.helpClose.addEventListener('click', closeHelp);
el.helpOverlay.addEventListener('click', e => {
  if (e.target === el.helpOverlay) closeHelp();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !el.helpOverlay.hidden) closeHelp();
});

// ── Utility ──────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Boot ─────────────────────────────────────────────────────
(async () => {
  render();
  await initMIDI();
})();
