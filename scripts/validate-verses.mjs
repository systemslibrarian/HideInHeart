import fs from 'fs';

const src = fs.readFileSync('src/lib/verses-local.ts', 'utf8');
const match = src.match(/export const LOCAL_VERSES.*?=\s*(\[[\s\S]*\]);/);
if (!match) { console.log('Could not parse LOCAL_VERSES'); process.exit(1); }
const verses = eval(match[1]);

let errors = 0;
for (const v of verses) {
  if (v.parts.length !== v.answers.length + 1) {
    console.log('NIV MISMATCH:', v.id, v.reference, 'parts=' + v.parts.length, 'answers=' + v.answers.length);
    errors++;
  }
  if (v.kjv) {
    if (v.kjv.parts.length !== v.kjv.answers.length + 1) {
      console.log('KJV MISMATCH:', v.id, v.reference, 'kjv.parts=' + v.kjv.parts.length, 'kjv.answers=' + v.kjv.answers.length);
      errors++;
    }
  }
  if (!v.decoys || v.decoys.length === 0) {
    console.log('NO DECOYS:', v.id, v.reference);
    errors++;
  }
  if (v.kjv && (!v.kjv.decoys || v.kjv.decoys.length === 0)) {
    console.log('NO KJV DECOYS:', v.id, v.reference);
    errors++;
  }
}

// Also validate kids verses
const kidsSrc = fs.readFileSync('src/lib/kids-verses.ts', 'utf8');
const kidsMatch = kidsSrc.match(/export const KIDS_VERSES.*?=\s*(\[[\s\S]*?\]);/);
if (kidsMatch) {
  const kidsVerses = eval(kidsMatch[1]);
  for (const v of kidsVerses) {
    if (v.parts.length !== v.answers.length + 1) {
      console.log('KIDS NIV MISMATCH:', v.id, v.reference, 'parts=' + v.parts.length, 'answers=' + v.answers.length);
      errors++;
    }
    if (v.kjv) {
      if (v.kjv.parts.length !== v.kjv.answers.length + 1) {
        console.log('KIDS KJV MISMATCH:', v.id, v.reference, 'kjv.parts=' + v.kjv.parts.length, 'kjv.answers=' + v.kjv.answers.length);
        errors++;
      }
    }
  }
  console.log('Kids verses:', kidsVerses.length);
}

// Check for duplicate IDs
const allIds = verses.map(v => v.id);
const dupes = allIds.filter((id, i) => allIds.indexOf(id) !== i);
if (dupes.length) {
  console.log('DUPLICATE IDS:', dupes);
  errors += dupes.length;
}

console.log('Adult verses:', verses.length);
console.log('Total errors:', errors);
