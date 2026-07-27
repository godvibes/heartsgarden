// ─────────────────────────────────────────────────────────────
// SpiritStore — shared backend for Hearts Garden
// Used by / (quest card), /spirit/ (the book), /word/ (the living word).
// Holds: fruits & weeds (with KJV word lists), the reflection log,
// the gardening tag palette, book names, and readers for the
// Living Word annotations — one source of truth for every page.
// ─────────────────────────────────────────────────────────────
(function () {

  // ── storage keys ────────────────────────────────────────────
  const LOG_KEY       = 'heartsgarden-spirit-log-v1';    // append-only reflection log
  const OLD_NOTES_KEY = 'heartsgarden-spirit-notes-v1';  // pre-log store, migrated on first read
  const RITUAL_KEY    = 'heartsgarden-spirit-ritual-v1'; // weekly focus {fruit, weed, …}
  const WORD_KEY      = 'heartsgarden-word-v1';          // living word verse annotations
  const CTAG_KEY      = 'heartsgarden-custom-tags-v1';   // custom gardening tags {name: color}

  // ── the fruits — x/y = canopy position on /spirit/ ─────────
  // `words` are KJV-era forms used to correlate tagged verses
  const FRUITS = [
    { key:'love',          label:'love',          color:'#c8909a', x:50, y:12,
      words:['love','loved','loveth','lovest','charity','beloved'],
      prompt:'Where did love grow where it was hardest to plant?' },
    { key:'joy',           label:'joy',           color:'#c8a020', x:31, y:19,
      words:['joy','joyful','rejoice','rejoiceth','rejoicing','gladness','glad'],
      prompt:'What brought joy that did not depend on circumstance?' },
    { key:'peace',         label:'peace',         color:'#5aadcf', x:69, y:19,
      words:['peace','peaceable','peacemaker','peacemakers','stillness','be still'],
      prompt:'Where did I choose peace instead of striving?' },
    { key:'longsuffering', label:'longsuffering', color:'#c47a55', x:20, y:34,
      words:['longsuffering','patience','patient','patiently','endure','endureth','wait','waiteth'],
      prompt:'What am I being asked to wait on, patiently?' },
    { key:'gentleness',    label:'gentleness',    color:'#8a9858', x:80, y:34,
      words:['gentle','gentleness','kindness','tender','tenderhearted'],
      prompt:'Where could I have answered softer than I did?' },
    { key:'goodness',      label:'goodness',      color:'#4a7850', x:41, y:27,
      words:['goodness','well doing','upright','righteous','righteousness'],
      prompt:'What good did I do simply because it was good?' },
    { key:'faith',         label:'faith',         color:'#8090b0', x:59, y:27,
      words:['faith','faithful','faithfulness','believe','believeth','trust','trusteth'],
      prompt:'Where did I trust without seeing the outcome?' },
    { key:'meekness',      label:'meekness',      color:'#d9937a', x:33, y:42,
      words:['meek','meekness','lowly','humble','humility','humbleth'],
      prompt:'Where did I hold strength gently instead of forcing it?' },
    { key:'temperance',    label:'temperance',    color:'#c8c020', x:67, y:42,
      words:['temperance','temperate','sober','soberly','moderation'],
      prompt:'What did I say no to, so I could say yes to what matters?' },
  ];

  // ── the weeds ───────────────────────────────────────────────
  const WEEDS = [
    { key:'adultery',       label:'adultery',       words:['adultery','adulterer','adulterers','adulteress'],
      prompt:'Where have I broken trust — with another, or with what is sacred?' },
    { key:'fornication',    label:'fornication',    words:['fornication','whoredom','harlot'],
      prompt:'What boundary around my body or desires needs tending?' },
    { key:'uncleanness',    label:'uncleanness',    words:['unclean','uncleanness'],
      prompt:'What am I letting linger that does not belong in the soil?' },
    { key:'lasciviousness', label:'lasciviousness', words:['lascivious','lasciviousness','lust','lusteth','lusts'],
      prompt:'Where am I chasing appetite instead of purpose?' },
    { key:'idolatry',       label:'idolatry',       words:['idol','idols','idolatry','idolater','graven image'],
      prompt:'What have I let take God’s place at the center?' },
    { key:'witchcraft',     label:'witchcraft',     words:['witchcraft','sorcery','sorcerer','enchantment','divination'],
      prompt:'Where am I trying to control what I should surrender?' },
    { key:'hatred',         label:'hatred',         words:['hate','hated','hateth','hatred'],
      prompt:'Who is it hard for me to bless right now?' },
    { key:'variance',       label:'variance',       words:['variance','division','divisions','discord'],
      prompt:'Where am I stirring division instead of peace?' },
    { key:'emulations',     label:'emulations',     words:['emulation','emulations','jealous','jealousy'],
      prompt:'Where does comparison have a grip on me?' },
    { key:'wrath',          label:'wrath',          words:['wrath','anger','angry','fury','indignation'],
      prompt:'What keeps lighting my anger — and why?' },
    { key:'strife',         label:'strife',         words:['strife','contention','contentious','quarrel'],
      prompt:'What conflict am I feeding instead of starving?' },
    { key:'seditions',      label:'seditions',      words:['sedition','seditions'],
      prompt:'Where am I undermining instead of building?' },
    { key:'heresies',       label:'heresies',       words:['heresy','heresies'],
      prompt:'What have I let distort the truth I know?' },
    { key:'envyings',       label:'envyings',       words:['envy','envieth','envying','envyings','covet','coveteth'],
      prompt:'What does someone else have that I resent them for?' },
    { key:'murders',        label:'murders',        words:['murder','murders','murderer','slay','slayeth'],
      prompt:'What am I killing with my words or my silence?' },
    { key:'drunkenness',    label:'drunkenness',    words:['drunk','drunken','drunkenness','drunkard'],
      prompt:'What am I using to numb instead of feel?' },
    { key:'revellings',     label:'revellings',     words:['revelling','revellings','rioting','riotous'],
      prompt:'Where is indulgence crowding out devotion?' },
    { key:'such-like',      label:'…and such like', words:[], custom:true,
      prompt:'Paul ends his list with "and such like" — anything that chokes love, joy, or peace counts. Name your own below.' },
  ];

  // ── the 66 books — shared by every page that resolves verse IDs
  const BOOK_NAMES = [
    'Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth',
    '1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra',
    'Nehemiah','Esther','Job','Psalms','Proverbs','Ecclesiastes','Song of Solomon',
    'Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos',
    'Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah',
    'Malachi','Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians',
    '2 Corinthians','Galatians','Ephesians','Philippians','Colossians',
    '1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon',
    'Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation'
  ];

  // ── the 25 gardening tags — palette shared by / and /word/ ──
  const GARDEN_TAGS = {
    groups: [
      { key:'seasons',    label:'The Seasons',       tags:['sunlight','harvest','seeds','fruit','clouds'] },
      { key:'cycles',     label:'Cycles of Growth',  tags:['life','love','ideas','talk','forgiveness'] },
      { key:'elements',   label:'The Elements',      tags:['earth','water','fire','wind'] },
      { key:'heartspace', label:'The Heart Space',   tags:['heart','soul','mind','body','garden','weeds'] },
      { key:'creation',   label:'Living Things',     tags:['trees','plants','herbs','animals','birds'] },
    ],
    colors: {
      trees:'#4a7850', life:'#8a9858', love:'#c8909a', heart:'#9b6050',
      mind:'#8090b0', body:'#c47a55', soul:'#5aadcf', ideas:'#a8a818',
      talk:'#8c8a88', forgiveness:'#d9937a', sunlight:'#c8a020', plants:'#8a9828',
      herbs:'#6a8840', animals:'#9b7050', earth:'#7a4030', wind:'#7090a0',
      fire:'#c84820', water:'#4898b8', clouds:'#909890', garden:'#3a7040',
      birds:'#7080a8', harvest:'#b89010', fruit:'#b84010', weeds:'#80901a',
      seeds:'#a07040'
    }
  };

  function isFruit(key) { return FRUITS.some(f => f.key === key); }

  // ── reflection log ──────────────────────────────────────────
  // Entry: { key, kind:'fruit'|'weed', act:'water'|'pull', note, tag, at }
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

  // { love: {waters:3, watches:1, pulls:0, last:'…'}, wrath: {…} }
  function counts(log) {
    log = log || readLog();
    const c = {};
    log.forEach(e => {
      if (!c[e.key]) c[e.key] = { waters: 0, watches: 0, pulls: 0, last: null };
      if      (e.act === 'water') c[e.key].waters++;
      else if (e.act === 'watch') c[e.key].watches++;
      else                        c[e.key].pulls++;
      if (!c[e.key].last || (e.at || '') > c[e.key].last) c[e.key].last = e.at;
    });
    return c;
  }

  // ── the gardenscape — monarch metamorphosis driven by tending ──
  // Every act feeds one growth score; a full cycle raises a butterfly.
  const CYCLE = 24;   // growth points to complete one metamorphosis (~8 days of daily tending)
  const STAGES = [
    { min: 0,  key:'stem',    name:'a milkweed pod',       hint:'begin tending — seeds wait to fly' },
    { min: 3,  key:'leaves',  name:'milkweed unfurls',     hint:'green returns' },
    { min: 7,  key:'bloom',   name:'milkweed in bloom',    hint:'the blooms open' },
    { min: 12, key:'cat',     name:'a caterpillar feeds',  hint:'life arrives to be nourished' },
    { min: 17, key:'chrys',   name:'a chrysalis forms',    hint:'hidden transformation' },
    { min: 22, key:'flutter', name:'a monarch emerges',    hint:'ready to take wing' },
  ];

  function stageFor(p) {
    let s = STAGES[0];
    for (const stage of STAGES) if (p >= stage.min) s = stage;
    return s;
  }

  // Local calendar day key — days must bucket in her timezone, not UTC,
  // or an evening's tending lands on tomorrow's date and breaks the streak.
  function dayKey(date) {
    const d = (date instanceof Date) ? date : new Date(date);
    if (isNaN(d)) return null;
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  // consecutive calendar days (local) with at least one act, ending today or yesterday
  function streakOf(daySet) {
    if (!daySet.size) return 0;
    const d = new Date();
    if (!daySet.has(dayKey(d))) d.setDate(d.getDate() - 1); // grace: streak alive until tomorrow
    let s = 0;
    while (daySet.has(dayKey(d))) { s++; d.setDate(d.getDate() - 1); }
    return s;
  }

  // The whole picture of a person's tending — the /grow page renders from this
  function garden(log) {
    log = log || readLog();
    let waters = 0, watches = 0, pulls = 0;
    const days = new Set();
    log.forEach(e => {
      if      (e.act === 'water') waters++;
      else if (e.act === 'watch') watches++;
      else                        pulls++;
      const k = e.at && dayKey(e.at);
      if (k) days.add(k);   // local calendar day, matching streakOf
    });

    // watering pours the most; watching and weeding each tend a little
    const growth  = waters * 2 + watches * 1 + pulls * 1;
    const cycles  = Math.floor(growth / CYCLE);   // butterflies released
    const p       = growth % CYCLE;               // progress within the current metamorphosis
    const stage   = stageFor(p);
    const idx     = STAGES.indexOf(stage);
    const next    = STAGES[idx + 1] || null;
    const toNext  = next ? next.min - p : CYCLE - p; // points until next stage / release

    return {
      waters, watches, pulls, growth, cycles, p, stage, next, toNext,
      streak: streakOf(days),
      tendedToday: days.has(dayKey(new Date())),
      dayCount: days.size,
      CYCLE
    };
  }

  // Free-text tag → known weed key, if it names one ("wrath", "my wrath at work")
  function matchWeed(text) {
    if (!text) return null;
    const t = text.toLowerCase().trim();
    if (!t) return null;
    const w = WEEDS.find(w => w.key !== 'such-like' && (t.includes(w.key) || w.key.includes(t)));
    return w ? w.key : null;
  }

  // ── living word annotations ─────────────────────────────────
  // { "42_14_4": {tags:[…], note:'…', savedAt} } — verse IDs are 0-based b_c_v
  function readWordAnnotations() {
    try {
      const a = JSON.parse(localStorage.getItem(WORD_KEY) || '{}');
      return (a && typeof a === 'object') ? a : {};
    } catch (e) { return {}; }
  }

  // "19_2_4" → { book:'Proverbs', chapter:3, verse:5, label:'Proverbs 3:5' }
  function verseRef(id) {
    const parts = String(id).split('_').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    const [b, c, v] = parts;
    if (!BOOK_NAMES[b]) return null;
    return { book: BOOK_NAMES[b], chapter: c + 1, verse: v + 1,
             label: `${BOOK_NAMES[b]} ${c + 1}:${v + 1}` };
  }

  // Case-insensitive whole-word matcher for a fruit/weed's KJV forms
  function wordsRegex(item) {
    if (!item || !item.words || !item.words.length) return null;
    return new RegExp('\\b(' + item.words.join('|') + ')\\b', 'i');
  }

  // Does this annotated verse speak of this fruit/weed?
  // Matches if she tagged it with the same name, or the verse text uses its words.
  function verseSpeaksOf(item, annotation, verseText) {
    if (annotation && annotation.tags && annotation.tags.includes(item.key)) return true;
    const re = wordsRegex(item);
    return !!(re && verseText && re.test(verseText));
  }

  window.SpiritStore = {
    FRUITS, WEEDS, BOOK_NAMES, GARDEN_TAGS, STAGES, CYCLE,
    isFruit, readLog, addEntry, counts, matchWeed, garden,
    readWordAnnotations, verseRef, wordsRegex, verseSpeaksOf,
    RITUAL_KEY, WORD_KEY, CTAG_KEY
  };
})();
