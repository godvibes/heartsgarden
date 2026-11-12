// ─────────────────────────────────────────────────────────────
// SpiritStore — the heart of Hearts Garden
// Used by / (the garden). One source of truth for:
//   · the nine fruits, each with its two weeds (deficient / excess)
//   · the words of Jesus that sit beside each fruit (KJV)
//   · what has been planted — words of praise, the only thing kept
//
// Nothing is scored. Prayers of surrender are never stored:
// they are given to God and released (Psalm 103:12).
// ─────────────────────────────────────────────────────────────
(function () {

  // ── storage keys ────────────────────────────────────────────
  const PLANT_KEY     = 'heartsgarden-garden-v1';        // what is planted: [{fruit, note, at}]
  const LOG_KEY       = 'heartsgarden-spirit-log-v1';    // old reflection log (before the pruning)
  const OLD_NOTES_KEY = 'heartsgarden-spirit-notes-v1';  // older still
  const RITUAL_KEY    = 'heartsgarden-spirit-ritual-v1'; // old weekly focus
  const WORD_KEY      = 'heartsgarden-word-v1';          // living word verse annotations
  const CTAG_KEY      = 'heartsgarden-custom-tags-v1';   // custom gardening tags

  // ── the weeds — the works of the flesh, Galatians 5:19–21 ───
  // To change a weed's wording, edit its line here.
  const WEEDS = {
    'adultery':       { label:'adultery',       prompt:'Where have I broken trust — with another, or with what is sacred?' },
    'fornication':    { label:'fornication',    prompt:'What boundary around my body or desires needs tending?' },
    'uncleanness':    { label:'uncleanness',    prompt:'What am I letting linger that does not belong in the soil?' },
    'lasciviousness': { label:'lasciviousness', prompt:'Where am I chasing appetite instead of purpose?' },
    'idolatry':       { label:'idolatry',       prompt:'What have I let take God’s place at the center?' },
    'witchcraft':     { label:'witchcraft',     prompt:'Where am I trying to control what I should surrender?' },
    'hatred':         { label:'hatred',         prompt:'Who is it hard for me to bless right now?' },
    'variance':       { label:'variance',       prompt:'Where am I stirring division instead of peace?' },
    'emulations':     { label:'emulations',     prompt:'Where does comparison have a grip on me?' },
    'wrath':          { label:'wrath',          prompt:'What keeps lighting my anger — and why?' },
    'strife':         { label:'strife',         prompt:'What conflict am I feeding instead of starving?' },
    'seditions':      { label:'seditions',      prompt:'Where am I undermining instead of building?' },
    'heresies':       { label:'heresies',       prompt:'What have I let distort the truth I know?' },
    'envyings':       { label:'envyings',       prompt:'What does someone else have that I resent them for?' },
    'murders':        { label:'murders',        prompt:'What am I killing with my words or my silence?' },
    'drunkenness':    { label:'drunkenness',    prompt:'What am I using to numb instead of feel?' },
    'revellings':     { label:'revellings',     prompt:'Where is indulgence crowding out devotion?' },
    'such-like':      { label:'…and such like', open:true,
                        prompt:'Paul ends his list with “and such like.” This one is yours to name.' },
  };

  // ── the fruits — Galatians 5:22–23 ──────────────────────────
  // x/y = place in the canopy.
  // deficient = the fruit is lacking · excess = the fruit out of balance.
  // To re-pair a weed, change `deficient` / `excess` here.
  // `jesus` = his own words (KJV, checked against assets/data/kjv.json).
  const FRUITS = [
    { key:'love', label:'love', color:'#c8909a', x:50, y:12,
      deficient:'hatred', excess:'fornication',
      prompt:'Where did love grow where it was hardest to plant?',
      jesus:[
        { ref:'John 15:12', b:'John', c:15, v:12, text:'This is my commandment, That ye love one another, as I have loved you.' },
        { ref:'John 13:34', b:'John', c:13, v:34, text:'A new commandment I give unto you, That ye love one another; as I have loved you, that ye also love one another.' },
        { ref:'John 15:9',  b:'John', c:15, v:9,  text:'As the Father hath loved me, so have I loved you: continue ye in my love.' },
      ] },
    { key:'joy', label:'joy', color:'#c8a020', x:31, y:19,
      deficient:'envyings', excess:'revellings',
      prompt:'What brought joy that did not depend on circumstance?',
      jesus:[
        { ref:'John 15:11', b:'John', c:15, v:11, text:'These things have I spoken unto you, that my joy might remain in you, and that your joy might be full.' },
        { ref:'John 16:22', b:'John', c:16, v:22, text:'And ye now therefore have sorrow: but I will see you again, and your heart shall rejoice, and your joy no man taketh from you.' },
        { ref:'John 16:24', b:'John', c:16, v:24, text:'Hitherto have ye asked nothing in my name: ask, and ye shall receive, that your joy may be full.' },
      ] },
    { key:'peace', label:'peace', color:'#5aadcf', x:69, y:19,
      deficient:'variance', excess:'drunkenness',
      prompt:'Where did I choose peace instead of striving?',
      jesus:[
        { ref:'John 14:27', b:'John', c:14, v:27, text:'Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.' },
        { ref:'John 16:33', b:'John', c:16, v:33, text:'These things I have spoken unto you, that in me ye might have peace. In the world ye shall have tribulation: but be of good cheer; I have overcome the world.' },
        { ref:'Matthew 5:9', b:'Matthew', c:5, v:9, text:'Blessed are the peacemakers: for they shall be called the children of God.' },
      ] },
    { key:'longsuffering', label:'longsuffering', color:'#c47a55', x:20, y:34,
      deficient:'wrath', excess:'seditions',
      prompt:'What am I being asked to wait on, patiently?',
      jesus:[
        { ref:'Luke 21:19', b:'Luke', c:21, v:19, text:'In your patience possess ye your souls.' },
        { ref:'Matthew 24:13', b:'Matthew', c:24, v:13, text:'But he that shall endure unto the end, the same shall be saved.' },
        { ref:'Luke 8:15', b:'Luke', c:8, v:15, text:'But that on the good ground are they, which in an honest and good heart, having heard the word, keep it, and bring forth fruit with patience.' },
      ] },
    { key:'gentleness', label:'gentleness', color:'#8a9858', x:80, y:34,
      deficient:'murders', excess:'such-like',
      prompt:'Where could I have answered softer than I did?',
      jesus:[
        { ref:'Matthew 11:28', b:'Matthew', c:11, v:28, text:'Come unto me, all ye that labour and are heavy laden, and I will give you rest.' },
        { ref:'Luke 6:35', b:'Luke', c:6, v:35, text:'But love ye your enemies, and do good, and lend, hoping for nothing again; and your reward shall be great, and ye shall be the children of the Highest: for he is kind unto the unthankful and to the evil.' },
        { ref:'Matthew 5:7', b:'Matthew', c:5, v:7, text:'Blessed are the merciful: for they shall obtain mercy.' },
      ] },
    { key:'goodness', label:'goodness', color:'#4a7850', x:41, y:27,
      deficient:'uncleanness', excess:'heresies',
      prompt:'What good did I do simply because it was good?',
      jesus:[
        { ref:'Matthew 5:16', b:'Matthew', c:5, v:16, text:'Let your light so shine before men, that they may see your good works, and glorify your Father which is in heaven.' },
        { ref:'Luke 6:45', b:'Luke', c:6, v:45, text:'A good man out of the good treasure of his heart bringeth forth that which is good… for of the abundance of the heart his mouth speaketh.' },
        { ref:'Matthew 7:17', b:'Matthew', c:7, v:17, text:'Even so every good tree bringeth forth good fruit; but a corrupt tree bringeth forth evil fruit.' },
      ] },
    { key:'faith', label:'faith', color:'#8090b0', x:59, y:27,
      deficient:'adultery', excess:'idolatry',
      prompt:'Where did I trust without seeing the outcome?',
      jesus:[
        { ref:'Mark 5:36', b:'Mark', c:5, v:36, text:'Be not afraid, only believe.' },
        { ref:'Mark 11:22', b:'Mark', c:11, v:22, text:'Have faith in God.' },
        { ref:'John 20:29', b:'John', c:20, v:29, text:'…blessed are they that have not seen, and yet have believed.' },
      ] },
    { key:'meekness', label:'meekness', color:'#d9937a', x:33, y:47,
      deficient:'strife', excess:'emulations',
      prompt:'Where did I hold strength gently instead of forcing it?',
      jesus:[
        { ref:'Matthew 11:29', b:'Matthew', c:11, v:29, text:'Take my yoke upon you, and learn of me; for I am meek and lowly in heart: and ye shall find rest unto your souls.' },
        { ref:'Matthew 5:5', b:'Matthew', c:5, v:5, text:'Blessed are the meek: for they shall inherit the earth.' },
        { ref:'Luke 14:11', b:'Luke', c:14, v:11, text:'For whosoever exalteth himself shall be abased; and he that humbleth himself shall be exalted.' },
      ] },
    { key:'temperance', label:'temperance', color:'#c8c020', x:67, y:47,
      deficient:'lasciviousness', excess:'witchcraft',
      prompt:'What did I say no to, so I could say yes to what matters?',
      jesus:[
        // the site's KJV data numbers this verse 26:40, so the chapter link uses wv
        { ref:'Matthew 26:41', b:'Matthew', c:26, v:41, wv:40, text:'Watch and pray, that ye enter not into temptation: the spirit indeed is willing, but the flesh is weak.' },
        { ref:'Luke 9:23', b:'Luke', c:9, v:23, text:'If any man will come after me, let him deny himself, and take up his cross daily, and follow me.' },
        { ref:'Matthew 4:4', b:'Matthew', c:4, v:4, text:'It is written, Man shall not live by bread alone, but by every word that proceedeth out of the mouth of God.' },
      ] },
  ];

  function fruit(key) { return FRUITS.find(f => f.key === key) || null; }

  // which fruit does this weed choke, and from which side?
  function fruitOfWeed(weedKey) {
    for (const f of FRUITS) {
      if (f.deficient === weedKey) return { fruit: f, side: 'deficient' };
      if (f.excess    === weedKey) return { fruit: f, side: 'excess' };
    }
    return null;
  }

  // his words for today — a different verse each day, steady within the day
  function jesusFor(f, date) {
    const d = date || new Date();
    const start = new Date(d.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((d - start) / 86400000);
    return f.jesus[(dayOfYear + FRUITS.indexOf(f)) % f.jesus.length];
  }

  // ── what is planted ─────────────────────────────────────────
  function parse(key, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem(key) || 'null');
      return v == null ? fallback : v;
    } catch (e) { return fallback; }
  }

  function readOldLog() {
    const log = parse(LOG_KEY, []);
    return Array.isArray(log) ? log : [];
  }

  // The first time the new garden opens, carry the fruit reflections she
  // already wrote into the garden as plantings. This only copies —
  // nothing old is removed until she chooses to release it.
  function plantings() {
    let list = parse(PLANT_KEY, null);
    if (!Array.isArray(list)) {
      list = readOldLog()
        .filter(e => e && e.kind === 'fruit' && e.note && fruit(e.key))
        .map(e => ({ fruit: e.key, note: e.note, at: e.at || new Date().toISOString() }));
      localStorage.setItem(PLANT_KEY, JSON.stringify(list));
    }
    return list;
  }

  function plant(fruitKey, note) {
    const list = plantings();
    const entry = { fruit: fruitKey, note: (note || '').trim(), at: new Date().toISOString() };
    list.push(entry);
    localStorage.setItem(PLANT_KEY, JSON.stringify(list));
    return entry;
  }

  // { love: 3, peace: 1 } — drawn as leaves, never shown as a number
  function plantedCounts(list) {
    const c = {};
    (list || plantings()).forEach(p => { c[p.fruit] = (c[p.fruit] || 0) + 1; });
    return c;
  }

  // ── releasing what was kept before the pruning ──────────────
  // Old weed reflections are still in this browser until she lets them go.
  function oldWeedCount() {
    let n = readOldLog().filter(e => e && e.kind === 'weed').length;
    const oldNotes = parse(OLD_NOTES_KEY, null);
    if (oldNotes && typeof oldNotes === 'object') n += Object.keys(oldNotes).length;
    return n;
  }

  // Cannot be undone. Fruit reflections were already carried into the garden.
  function releaseOld() {
    plantings();   // make sure the fruit notes are carried over first
    localStorage.removeItem(LOG_KEY);
    localStorage.removeItem(OLD_NOTES_KEY);
    localStorage.removeItem(RITUAL_KEY);
  }

  window.SpiritStore = {
    FRUITS, WEEDS,
    fruit, fruitOfWeed, jesusFor,
    plantings, plant, plantedCounts,
    oldWeedCount, releaseOld,
    WORD_KEY, CTAG_KEY
  };
})();
