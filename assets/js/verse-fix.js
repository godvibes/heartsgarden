// ─────────────────────────────────────────────────────────────
// verse-fix — a one-time correction for saved verse notes
//
// Six verses were missing from the Bible text until Nov 2026
// (Matthew 2:16, 22:1, 26:38 · Mark 4:40, 7:11, 8:8). They are
// restored now, which moves every later verse in those chapters
// down by one. Notes and tags are saved by a verse's position,
// so any saved in those chapters are moved with their verse here.
// Runs once per browser, before the pages read the notes.
// ─────────────────────────────────────────────────────────────
(function () {
  const WORD_KEY = 'heartsgarden-word-v1';
  const DONE_KEY = 'heartsgarden-versefix-v1';

  // [book, chapter, position where a verse was restored] — all counted from 0
  const RESTORED = [
    [39, 1, 15], [39, 21, 0], [39, 25, 37],   // Matthew
    [40, 3, 39], [40, 6, 10], [40, 7, 7],     // Mark
  ];

  try {
    if (localStorage.getItem(DONE_KEY)) return;

    const saved = JSON.parse(localStorage.getItem(WORD_KEY) || '{}');
    if (saved && typeof saved === 'object') {
      const moved = {};
      let changed = false;
      Object.keys(saved).forEach(id => {
        const [b, c, v] = id.split('_').map(Number);
        const hit = RESTORED.find(r => r[0] === b && r[1] === c && v >= r[2]);
        if (hit) { moved[`${b}_${c}_${v + 1}`] = saved[id]; changed = true; }
        else moved[id] = saved[id];
      });
      if (changed) localStorage.setItem(WORD_KEY, JSON.stringify(moved));
    }
    localStorage.setItem(DONE_KEY, '1');
  } catch (e) { /* storage unavailable — nothing to correct */ }
})();
