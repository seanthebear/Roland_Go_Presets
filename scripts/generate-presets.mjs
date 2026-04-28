#!/usr/bin/env node
/**
 * generate-presets.mjs
 * Fetches the GO-sounds.md from the goplus repository and regenerates
 * app/src/data/presets.js with the full, current preset list.
 *
 * Usage:  node scripts/generate-presets.mjs
 *   or:   npm run generate-presets  (from app/)
 *
 * Source: https://github.com/waldt/goplus  (Apache 2.0)
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT   = resolve(__dir, '../app/src/data/presets.js');

const SOURCE_URL = 'https://raw.githubusercontent.com/waldt/goplus/main/GO-sounds.md';

/** Category code → human label */
const CATEGORIES = {
  PNO: 'Piano',        EP:  'E. Piano',     ORG: 'Organ',
  KEY: 'Keyboard',     BEL: 'Bells',        MLT: 'Mallet',
  ACD: 'Accordion',    HRM: 'Harmonica',
  AGT: 'Ac. Guitar',   EGT: 'E. Guitar',    DGT: 'Dist. Guitar',
  BS:  'Bass',         SBS: 'Syn. Bass',
  STR: 'Strings',      ORC: 'Orchestra',    HIT: 'Hit/Stab',
  BRS: 'Brass',        SBR: 'Syn. Brass',
  SAX: 'Saxophone',    FLT: 'Flute',        WND: 'Woodwind',
  HLD: 'Hard Lead',    SLD: 'Soft Lead',
  SYN: 'Synth',        TEK: 'Tekno',        PLS: 'Pulse/Arp',
  FX:  'FX',           VOX: 'Voice',
  BPD: 'Bright Pad',   SPD: 'Soft Pad',
  PLK: 'Plucked',      FRT: 'Fretted',      ETH: 'Ethnic',
  PRC: 'Percussion',   SFX: 'Sound FX',
  BTS: 'Beat',         DRM: 'Drums',        CMB: 'Combo',
  SMP: 'Sample',
};

async function main() {
  console.log(`Fetching ${SOURCE_URL} …`);
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const md = await res.text();

  const presets = parseTable(md);
  console.log(`Parsed ${presets.length} presets`);

  const js = buildJS(presets);
  writeFileSync(OUT, js, 'utf8');
  console.log(`Written → ${OUT}`);
}

/**
 * Parse the markdown table in GO-sounds.md.
 * Table format: | Name | Cat | MSB | LSB | PC |
 * Handles names split across two lines (OCR artifact in source).
 */
function parseTable(md) {
  const presets = [];
  const lines   = md.split('\n');
  let pending   = null;   // partial row being accumulated

  const ROW = /^\|\s*([^|]+?)\s*\|\s*([A-Z]+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|/;

  for (const raw of lines) {
    const line = raw.trim();

    // Skip header / separator
    if (line.startsWith('| Name') || line.startsWith('| ---') || line.startsWith('|---')) continue;
    if (!line.startsWith('|')) {
      pending = null;
      continue;
    }

    const m = ROW.exec(line);
    if (m) {
      const [, name, cat, msb, lsb, pc] = m;
      if (CATEGORIES[cat]) {
        presets.push([cleanName(name), cat, +msb, +lsb, +pc]);
      }
      pending = null;
    } else {
      // Might be the first half of a split name row; collect the raw pipe-fields
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length >= 4 && /^\d+$/.test(cells[cells.length - 1]) && /^\d+$/.test(cells[cells.length - 2])) {
        // Will be resolved on next line — not a common pattern in this file, so skip
      }
      // Partial line: could be a name continuation like "| 2 |" after "88StgGrand"
      if (pending && /^\|\s*\S+\s*\|/.test(line)) {
        // Try to join with pending
        const joined = '| ' + pending + ' ' + cells[0] + ' |' + line.slice(line.indexOf('|', 1));
        const mj = ROW.exec(joined);
        if (mj) {
          const [, name, cat, msb, lsb, pc] = mj;
          if (CATEGORIES[cat]) {
            presets.push([cleanName(name), cat, +msb, +lsb, +pc]);
          }
          pending = null;
          continue;
        }
      }
      // Store first cell as potential partial name
      if (cells.length === 1) pending = cells[0];
    }
  }

  return presets;
}

function cleanName(s) {
  return s.replace(/\s+/g, ' ').trim();
}

function buildJS(presets) {
  const catEntries = Object.entries(CATEGORIES)
    .map(([k, v]) => `  ${k.padEnd(4)}: '${v}',`)
    .join('\n');

  const rows = presets
    .map(([n, c, msb, lsb, pc]) => {
      const name = JSON.stringify(n).padEnd(20);
      const cat  = `'${c}'`.padEnd(6);
      return `  [${name}, ${cat}, ${String(msb).padStart(3)}, ${String(lsb).padStart(2)}, ${String(pc).padStart(3)}],`;
    })
    .join('\n');

  return `// Auto-generated — run npm run generate-presets to refresh.
// Source: https://github.com/waldt/goplus/blob/main/GO-sounds.md (Apache 2.0)
// Generated: ${new Date().toISOString()}

export const CATEGORIES = {
${catEntries}
};

// [name, category, msb, lsb, pc]
// MIDI: send CC0=msb, CC32=lsb, then PC=pc-1 (0-indexed)
export const PRESETS = [
${rows}
];
`;
}

main().catch(err => { console.error(err); process.exit(1); });
