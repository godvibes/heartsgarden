// ─────────────────────────────────────────────────────────────
// SpiritStore — shared backend for the Spirit Garden
// Used by / (quest card) and /spirit/ (the book).
// One append-only log of reflections; growth is derived from it.
// ─────────────────────────────────────────────────────────────
(function () {

  const LOG_KEY       = 'heartsgarden-spirit-log-v1';
  const OLD_NOTES_KEY = 'heartsgarden-spirit-notes-v1'; // pre-log store, migrated on first read
  const RITUAL_KEY    = 'heartsgarden-spirit-ritual-v1';

  // x/y = position of each fruit in the tree canopy on /spirit/
  const FRUITS = [
    { key:'love',          label:'love',          color:'#c8909a', x:50, y:12, prompt:'Where did love grow where it was hardest to plant?' },
    { key:'joy',           label:'joy',           color:'#c8a020', x:31, y:19, prompt:'What brought joy that did not depend on circumstance?' },
    { key:'peace',         label:'peace',         color:'#5aadcf', x:69, y:19, prompt:'Where did I choose peace instead of striving?' },
    { key:'longsuffering', label:'longsuffering', color:'#c47a55', x:20, y:34, prompt:'What am I being asked to wait on, patiently?' },
    { key:'gentleness',    label:'gentleness',    color:'#8a9858', x:80, y:34, prompt:'Where could I have answered softer than I did?' },
    { key:'goodness',      label:'goodness',      color:'#4a7850', x:41, y:27, prompt:'What good did I do simply because it was good?' },
    { key:'faith',         label:'faith',         color:'#8090b0', x:59, y:27, prompt:'Where did I trust without seeing the outcome?' },
    { key:'meekness',      label:'meekness',      color:'#d9937a', x:33, y:42, prompt:'Where did I hold strength gently instead of forcing it?' },
    { key:'temperance',    label:'temperance',    color:'#c8c020', x:67, y:42, prompt:'What did I say no to, so I could say yes to what matters?' },
  ];

  const WEEDS = [
    { key:'adultery',       label:'adultery',       prompt:'Where have I broken trust — with another, or with what is sacred?' },
    { key:'fornication',    label:'fornication',    prompt:'What boundary around my body or desires needs tending?' },
    { key:'uncleanness',    label:'uncleanness',    prompt:'What am I letting linger that does not belong in the soil?' },
    { key:'lasciviousness', label:'lasciviousness', prompt:'Where am I chasing appetite instead of purpose?' },
    { key:'idolatry',       label:'idolatry',       prompt:'What have I let take God’s place at the center?' },
    { key:'witchcraft',     label:'witchcraft',     prompt:'Where am I trying to control what I should surrender?' },
    { key:'hatred',         label:'hatred',         prompt:'Who is it hard for me to bless right now?' },
    { key:'variance',       label:'variance',       prompt:'Where am I stirring division instead of peace?' },
    { key:'emulations',     label:'emulations',     prompt:'Where does comparison have a grip on me?' },
    { key:'wrath',          label:'wrath',          prompt:'What keeps lighting my anger — and why?' },
    { key:'strife',         label:'strife',         prompt:'What conflict am I feeding instead of starving?' },
    { key:'seditions',      label:'seditions',      prompt:'Where am I undermining instead of building?' },
    { key:'heresies',       label:'heresies',       prompt:'What have I let distort the truth I know?' },
    { key:'envyings',       label:'envyings',       prompt:'What does someone else have that I resent them for?' },
    { key:'murders',        label:'murders',        prompt:'What am I killing with my words or my silence?' },
    { key:'drunkenness',    label:'drunkenness',    prompt:'What am I using to numb instead of feel?' },
    { key:'revellings',     label:'revellings',     prompt:'Where is indulgence crowding out devotion?' },
    { key:'such-like',      label:'…and such like', prompt:'Paul ends his list with "and such like" — anything that chokes love, joy, or peace counts. Name your own below.', custom:true },
  ];

  function isFruit(key) { return FRUITS.some(f => f.key === key); }

  // Log entry shape: { key, kind:'fruit'|'weed', act:'water'|'pull', note, tag, at }
  function readLog() {
    let log;
    try { log = JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); }
    catch (e) { log = []; }
    if (!Array.isArray(log)) log = [];

    // One-time migration from the old one-note-per-item store
    const oldRaw = localStorage.getItem(OLD_NOTES_KEY);
    if (oldRaw) {
      try {
        const notes = JSON.parse(oldRaw);
        Object.entries(notes).forEach(([key, n]) => {
          if (!n || (!n.note && !n.customLabel)) return;
          log.push({
            key,
            kind: isFruit(key) ? 'fruit' : 'weed',
            act:  isFruit(key) ? 'water' : 'pull',
            note: n.note || '',
            tag:  n.customLabel || null,
            at:   n.savedAt || new Date().toISOString()
          });
        });
        log.sort((a, b) => (a.at || '').localeCompare(b.at || ''));
        localStorage.setItem(LOG_KEY, JSON.stringify(log));
      } catch (e) { /* old data unreadable — leave it behind */ }
      localStorage.removeItem(OLD_NOTES_KEY);
    }
    return log;
  }

  function addEntry({ key, kind, act, note, tag }) {
    const log = readLog();
    const entry = {
      key, kind, act,
      note: (note || '').trim(),
      tag:  (tag  || '').trim() || null,
      at:   new Date().toISOString()
    };
    log.push(entry);
    localStorage.setItem(LOG_KEY, JSON.stringify(log));
    return entry;
  }

  // { love: {waters:3, pulls:0, last:'…'}, wrath: {waters:0, pulls:2, last:'…'} }
  function counts(log) {
    log = log || readLog();
    const c = {};
    log.forEach(e => {
      if (!c[e.key]) c[e.key] = { waters: 0, pulls: 0, last: null };
      if (e.act === 'water') c[e.key].waters++;
      else c[e.key].pulls++;
      if (!c[e.key].last || (e.at || '') > c[e.key].last) c[e.key].last = e.at;
    });
    return c;
  }

  // Free-text tag → known weed key, if it names one ("wrath", "my wrath at work")
  function matchWeed(text) {
    if (!text) return null;
    const t = text.toLowerCase().trim();
    if (!t) return null;
    const w = WEEDS.find(w => w.key !== 'such-like' && (t.includes(w.key) || w.key.includes(t)));
    return w ? w.key : null;
  }

  window.SpiritStore = { FRUITS, WEEDS, isFruit, readLog, addEntry, counts, matchWeed, RITUAL_KEY };
})();
