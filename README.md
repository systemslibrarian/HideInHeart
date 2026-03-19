# Scripture Memory

> "Thy word have I hid in mine heart, that I might not sin against thee." — Psalm 119:11

A drag-and-drop Bible verse memory game built as a Progressive Web App (PWA). Works in any browser, installs on phone home screens, and runs fully offline.

## Features

- 10 key memory verses (NIV)
- Drag word tiles into blanks to complete each verse
- Score tracking — 10 pts first try, 7 pts second, 5 pts third+
- Best scores saved across sessions (localStorage)
- Share your score with friends (Web Share API)
- Fully offline-capable (service worker)
- Installable on iPhone/Android home screen

## Verses Included

| Reference | Blanks |
|-----------|--------|
| Romans 3:23 | 3 |
| 1 John 1:9 | 5 |
| Romans 6:23 | 4 |
| John 3:16 | 4 |
| Philippians 4:13 | 2 |
| Romans 8:28 | 4 |
| Proverbs 3:5–6 | 6 |
| Jeremiah 29:11 | 3 |
| Matthew 11:28 | 2 |
| Psalm 46:10 | 3 |

## Deploy to GitHub Pages

1. Create a new GitHub repository (e.g. `scripture-memory`)
2. Upload all files from this folder to the repo root:
   - `index.html`
   - `manifest.json`
   - `sw.js`
   - `icon-192.png`
   - `icon-512.png`
3. Go to **Settings → Pages**
4. Under **Source**, select **Deploy from a branch**
5. Choose branch: `main`, folder: `/ (root)`
6. Click **Save**
7. Your app will be live at:  
   `https://YOUR-USERNAME.github.io/scripture-memory/`

## Adding More Verses

Open `index.html` and find the `VERSES` array. Add a new object following this pattern:

```js
{
  id: 'unique-id',
  ref: 'Book Chapter:Verse',
  v: 'NIV',
  parts: ['Text before blank ', ', text between blanks ', ', text after last blank.'],
  answers: ['WORD1', 'WORD2'],
  decoys: ['WRONG1', 'WRONG2', 'WRONG3', 'WRONG4']
}
```

**Tips:**
- `parts` has one more element than `answers` (text wraps around each blank)
- Keep `decoys` plausible but wrong — 3–5 decoys works well
- All words in UPPERCASE

## Install on Phone

**iPhone:** Open in Safari → tap the Share button → "Add to Home Screen"  
**Android:** Open in Chrome → tap the three-dot menu → "Add to Home Screen" or "Install app"

---

Built with plain HTML, CSS, and vanilla JavaScript — no frameworks, no build tools.  
Compatible with GitHub Pages, Netlify, or any static host.
