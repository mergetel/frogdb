import {seedFrogs, habitats, portraits, activeHours, weathers, colors, companies, croakLevels} from './data.js';
export const STORAGE_KEY = 'frogdb.records.v1';
export const MET_KEY = 'frogdb.met.v1';
export const VIEW_KEY = 'frogdb.view.v1';
export const RECENT_KEY = 'frogdb.recent.v1';
export const freshRecords = () => structuredClone(seedFrogs);
export function validateRecords(value) {
  if (!Array.isArray(value) || value.length > 500) throw new Error('Choose a FrogDB JSON file containing no more than 500 records.');
  const ids = new Set();
  return value.map(record => {
    const r = {};
    for (const key of ['id','name','scientific','habitat','temperament','call','diet','rarity','status','description']) {
      if (typeof record?.[key] !== 'string') throw new Error(`A frog is missing its ${key}.`);
      r[key] = record[key].trim();
      if (!r[key] || r[key].length > (key === 'description' ? 1200 : 100)) throw new Error(`Check the frog's ${key} length.`);
    }
    if (!/^[a-zA-Z0-9-]+$/.test(r.id) || ids.has(r.id)) throw new Error('Each frog needs a unique, valid ID.');
    ids.add(r.id);
    if (!habitats.includes(r.habitat) || !['published','draft'].includes(r.status) || !['Common','Uncommon','Rare'].includes(r.rarity)) throw new Error('A frog has an invalid habitat, status or rarity.');
    r.croak = record.croak === undefined ? 5 : Number(record.croak);
    if (!Number.isInteger(r.croak) || r.croak < 1 || r.croak > 10) throw new Error('Croak volume must be a whole number from 1 to 10.');
    r.move = typeof record.move === 'string' ? record.move.trim() : '';
    if (r.move.length > 100) throw new Error('Signature move must be 100 characters or fewer.');
    r.active = record.active === undefined ? 'Dusk' : record.active;
    if (!activeHours.includes(r.active)) throw new Error('Active hours must be Dawn, Daytime, Dusk or Night.');
    r.weather = record.weather === undefined ? 'Mist' : record.weather;
    if (!weathers.includes(r.weather)) throw new Error('Favorite weather must be Drizzle, Mist, Sunshine, Thunderstorm or Breeze.');
    r.color = record.color === undefined ? 'Green' : record.color;
    if (!colors.includes(r.color)) throw new Error(`Main color must be one of: ${colors.join(', ')}.`);
    r.company = record.company === undefined ? 'Pairs' : record.company;
    if (!companies.includes(r.company)) throw new Error(`Company kept must be one of: ${companies.join(', ')}.`);
    r.leap = record.leap === undefined ? 30 : Number(record.leap);
    if (!Number.isInteger(r.leap) || r.leap < 1 || r.leap > 300) throw new Error('Best leap must be a whole number of centimeters from 1 to 300.');
    r.size = Number(record.size); r.portrait = Number(record.portrait);
    if (!Number.isFinite(r.size) || r.size < 0.1 || r.size > 40) throw new Error('Size must be between 0.1 and 40 cm.');
    if (!Number.isInteger(r.portrait) || r.portrait < 0 || r.portrait >= portraits.length) throw new Error('Choose one of the frog portraits.');
    return r;
  });
}
export function loadRecords(storage) {
  const raw = storage.getItem(STORAGE_KEY);
  return raw === null ? freshRecords() : validateRecords(JSON.parse(raw));
}
export function saveRecords(storage, records) {
  const valid = validateRecords(records);
  storage.setItem(STORAGE_KEY, JSON.stringify(valid));
  return valid;
}
// Same frog all day for everyone: the local date picks the pond resident.
export function frogOfTheDay(records, date = new Date()) {
  const pond = records.filter(r => r.status === 'published');
  if (!pond.length) return null;
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 864e5);
  return pond[day % pond.length];
}
// Plain-English description of the active catalog filters, e.g. "2 rare frogs in the wetland matching “moss”".
// Size classes for the field guide filter; boundaries are in the same (invented) units as a frog's size.
export const sizeClasses = ['Pocket-sized', 'Palm-sized', 'Hand-filling'];
export function sizeClass(size) { return size < 3.5 ? sizeClasses[0] : size < 5.5 ? sizeClasses[1] : sizeClasses[2]; }
// "Company kept" phrasing for the result count, singular and plural, e.g. "2 frogs that roam in small gangs".
const summaryCompany = {'Loner': 'that keeps to itself', 'Pairs': 'that comes in pairs', 'Small gang': 'that roams in a small gang', 'Big chorus': 'that sings in a big chorus'};
const summaryCompanies = {'Loner': 'that keep to themselves', 'Pairs': 'that come in pairs', 'Small gang': 'that roam in small gangs', 'Big chorus': 'that sing in big choruses'};
// Croak volume levels as a compound adjective, for the result count ("3 frogs with a library-whisper croak") and chips.
const volumeWords = {'Library whisper': 'library-whisper', 'Garden chat': 'garden-chat', 'Porch conversation': 'porch-conversation', 'Dinner-party voice': 'dinner-party', 'Room-filling': 'room-filling'};
export function resultSummary(count, {query = '', habitat = 'All habitats', rarity = 'Any rarity', met = 'all', active = 'Any time', size = 'Any size', weather = 'Any weather', color = 'Any color', company = 'Any company', volume = 'Any volume'} = {}) {
  const noun = count === 1 ? 'frog' : 'frogs';
  const kind = `${size === 'Any size' ? '' : `${size.toLowerCase()} `}${rarity === 'Any rarity' ? '' : `${rarity.toLowerCase()} `}${color === 'Any color' ? '' : `${color.toLowerCase()} `}`;
  const place = habitat === 'All habitats' ? '' : ` in the ${habitat.toLowerCase()}`;
  const term = query.trim() ? ` matching “${query.trim()}”` : '';
  const seen = met === 'new' ? ' you haven’t met yet' : met === 'met' ? ' you’ve already met' : '';
  const when = active === 'Any time' ? '' : ` out at ${active.toLowerCase()}`;
  const sky = weather === 'Any weather' ? '' : ` that love ${weather.toLowerCase()}`;
  const crowd = company === 'Any company' ? '' : ` ${(count === 1 ? summaryCompany : summaryCompanies)[company]}`;
  const voice = volume === 'Any volume' ? '' : ` with a ${volumeWords[volume]} croak`;
  return `${count} ${kind}${noun}${place}${when}${sky}${crowd}${voice}${term}${seen}`;
}
// Names the filters in play and suggests which to drop, so an empty result says what to change.
export function emptyHint({query = '', habitat = 'All habitats', rarity = 'Any rarity', met = 'all', active: hours = 'Any time', size = 'Any size', weather = 'Any weather', color = 'Any color', company = 'Any company', volume = 'Any volume'} = {}) {
  const active = [];
  if (query.trim()) active.push(`the search for “${query.trim()}”`);
  if (habitat !== 'All habitats') active.push(`the ${habitat.toLowerCase()} habitat`);
  if (rarity !== 'Any rarity') active.push(`the rarity filter (${rarity.toLowerCase()})`);
  if (size !== 'Any size') active.push(`the size filter (${size.toLowerCase()})`);
  if (color !== 'Any color') active.push(`the color filter (${color.toLowerCase()})`);
  if (hours !== 'Any time') active.push(`the active hours filter (${hours.toLowerCase()})`);
  if (weather !== 'Any weather') active.push(`the favorite weather filter (${weather.toLowerCase()})`);
  if (company !== 'Any company') active.push(`the company filter (${company.toLowerCase()})`);
  if (volume !== 'Any volume') active.push(`the croak volume filter (${volume.toLowerCase()})`);
  if (met !== 'all') active.push(met === 'new' ? 'the “not yet met” filter' : 'the “already met” filter');
  if (!active.length) return 'The pond is empty right now. Check back soon.';
  if (met === 'new' && active.length === 1) return 'You’ve met every frog in the pond. Pick “Any frog” to visit your favorites again.';
  return `Nothing matches ${active.join(' + ')}. Try dropping one, or clear them all.`;
}
// Side-by-side rows for two frogs; size, croak and leap rows say which frog wins, ties say so.
export function compareFrogs(a, b) {
  const edge = (x, y, word) => x === y ? 'A dead heat' : `${x > y ? a.name : b.name} is ${word}`;
  return [
    {label: 'Habitat', a: a.habitat, b: b.habitat, note: a.habitat === b.habitat ? 'Same neighborhood' : ''},
    {label: 'Rarity', a: a.rarity, b: b.rarity, note: a.rarity === b.rarity ? 'Equally easy to spot' : ''},
    {label: 'Size', a: `${a.size} cm`, b: `${b.size} cm`, note: edge(a.size, b.size, 'bigger')},
    {label: 'Croak volume', a: `${a.croak} of 10`, b: `${b.croak} of 10`, note: edge(a.croak, b.croak, 'louder')},
    {label: 'Best leap', a: `${a.leap} cm`, b: `${b.leap} cm`, note: edge(a.leap, b.leap, 'the farther jumper')},
    {label: 'Main color', a: a.color, b: b.color, note: a.color === b.color ? 'Could be cousins' : ''},
    {label: 'Company kept', a: a.company, b: b.company, note: a.company === b.company ? 'Birds of a feather (frogs, really)' : ''},
    {label: 'Active hours', a: a.active, b: b.active, note: a.active === b.active ? 'Keep the same hours' : ''},
    {label: 'Favorite weather', a: a.weather, b: b.weather, note: a.weather === b.weather ? 'Shared sky' : ''},
    {label: 'Personality', a: a.temperament, b: b.temperament, note: ''},
    {label: 'Favorite food', a: a.diet, b: b.diet, note: ''},
    {label: 'Call', a: a.call, b: b.call, note: ''},
    {label: 'Signature move', a: a.move || '—', b: b.move || '—', note: ''}
  ];
}
// Frogs this browser has visited, kept apart from the collection so a bad value can never corrupt frog records.
export function loadMet(storage) {
  try {
    const ids = JSON.parse(storage.getItem(MET_KEY) ?? '[]');
    return new Set(Array.isArray(ids) ? ids.filter(id => typeof id === 'string') : []);
  } catch { return new Set(); }
}
export function markMet(storage, met, id) {
  if (met.has(id)) return met;
  const next = new Set(met).add(id);
  try { storage.setItem(MET_KEY, JSON.stringify([...next])); } catch { /* storage is optional here; the session still remembers */ }
  return next;
}
// Orders frogs for the field guide; ties always fall back to A to Z so the order never shuffles.
const rarityRank = f => ['Common', 'Uncommon', 'Rare'].indexOf(f.rarity);
export function sortFrogs(list, key = 'name') {
  const byName = (a, b) => a.name.localeCompare(b.name);
  const rules = {
    size: (a, b) => a.size - b.size,
    big: (a, b) => b.size - a.size,
    loud: (a, b) => b.croak - a.croak,
    quiet: (a, b) => a.croak - b.croak,
    far: (a, b) => b.leap - a.leap,
    near: (a, b) => a.leap - b.leap,
    zname: (a, b) => byName(b, a),
    rare: (a, b) => rarityRank(b) - rarityRank(a),
    common: (a, b) => rarityRank(a) - rarityRank(b)
  };
  const rule = rules[key];
  return [...list].sort((a, b) => (rule ? rule(a, b) : 0) || byName(a, b));
}
// Remembers whether the field guide is a photo grid or a compact list; anything unexpected means the grid.
export function loadView(storage) {
  try { return storage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid'; } catch { return 'grid'; }
}
export function saveView(storage, view) {
  const next = view === 'list' ? 'list' : 'grid';
  try { storage.setItem(VIEW_KEY, next); } catch { /* storage is optional here; the session still remembers */ }
  return next;
}
// Friendly admin toasts that name the frog and say where it now lives (field guide or drafts).
export function savedMessage(frog, isNew) {
  const name = frog.name.trim() || 'Your frog';
  const where = frog.status === 'published' ? 'It’s live in the field guide.' : 'It’s a draft, so only you can see it for now.';
  return `${name} ${isNew ? 'has joined the pond.' : 'is freshly updated.'} ${where}`;
}
export function deletedMessage(frog) {
  return `${frog.name.trim() || 'The frog'} hopped out of your collection.`;
}
// Pond neighbors for a profile: other published frogs from the same habitat, nearest in rarity, hours and size first.
export function pondNeighbors(records, frog, limit = 3) {
  const closeness = f => (f.rarity === frog.rarity ? 0 : 10) + (f.active === frog.active ? 0 : 5) + Math.abs(f.size - frog.size);
  return records
    .filter(f => f.status === 'published' && f.id !== frog.id && f.habitat === frog.habitat)
    .sort((a, b) => closeness(a) - closeness(b) || a.name.localeCompare(b.name))
    .slice(0, limit);
}
// "How to spot one" tip for a profile: where, when and in what weather to look, what to listen for, and how lucky you'd need to be.
const tipHours = {Dawn: 'at dawn', Daytime: 'in broad daylight', Dusk: 'at dusk', Night: 'after dark'};
const tipSkies = {Drizzle: 'during a light drizzle', Mist: 'when the mist rolls in', Sunshine: 'on a sunny day', Thunderstorm: 'while a thunderstorm rumbles', Breeze: 'when there’s a breeze'};
const tipOdds = {Common: 'Common, so you’ll likely find one before your tea goes cold.', Uncommon: 'Uncommon, so pack a snack and some patience.', Rare: 'Rare, so count yourself lucky and try not to squeal.'};
export function spottingTip(frog) {
  const call = frog.call.trim().replace(/[.!?]+$/, '');
  const listen = call ? ` Listen for ${call[0].toLowerCase()}${call.slice(1)}.` : '';
  const sky = frog.active === 'Night' && frog.weather === 'Sunshine' ? 'once a sunny day has cooled off' : tipSkies[frog.weather]; // no sunshine after dark
  return `Try the ${frog.habitat.toLowerCase()} ${tipHours[frog.active]}, ${sky}.${listen} ${tipOdds[frog.rarity]}`;
}
// Recently visited frogs, newest first. A revisit hops back to the front; the shelf keeps the last few only.
export function loadRecent(storage) {
  try {
    const ids = JSON.parse(storage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(ids) ? [...new Set(ids.filter(id => typeof id === 'string'))].slice(0, 6) : [];
  } catch { return []; }
}
export function pushRecent(storage, recent, id, limit = 6) {
  const next = [id, ...recent.filter(x => x !== id)].slice(0, limit);
  try { storage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* storage is optional here; the session still remembers */ }
  return next;
}
// The frogs to show on the shelf: published ones only, in visit order, skipping any that were deleted or unpublished.
export function recentFrogs(records, recent, skip = '') {
  return recent.filter(id => id !== skip).map(id => records.find(r => r.id === id && r.status === 'published')).filter(Boolean);
}
// One removable chip per active field guide filter, in dropdown order; "key" names the filter a click should reset.
const chipCompany = {'Loner': 'Keeps to itself', 'Pairs': 'Comes in pairs', 'Small gang': 'Small gangs', 'Big chorus': 'Big choruses'};
const chipHours = {Dawn: 'Out at dawn', Daytime: 'Out by day', Dusk: 'Out at dusk', Night: 'Out at night'};
export function filterChips({query = '', habitat = 'All habitats', rarity = 'Any rarity', size = 'Any size', color = 'Any color', active = 'Any time', weather = 'Any weather', company = 'Any company', volume = 'Any volume', met = 'all'} = {}) {
  const chips = [];
  if (query.trim()) chips.push({key: 'query', label: `Search: “${query.trim()}”`});
  if (habitat !== 'All habitats') chips.push({key: 'habitat', label: habitat});
  if (rarity !== 'Any rarity') chips.push({key: 'rarity', label: rarity});
  if (size !== 'Any size') chips.push({key: 'size', label: size});
  if (color !== 'Any color') chips.push({key: 'color', label: color});
  if (active !== 'Any time') chips.push({key: 'active', label: chipHours[active] || active});
  if (weather !== 'Any weather') chips.push({key: 'weather', label: `Loves ${weather.toLowerCase()}`});
  if (company !== 'Any company') chips.push({key: 'company', label: chipCompany[company] || company});
  if (volume !== 'Any volume') chips.push({key: 'volume', label: `${volumeWords[volume][0].toUpperCase()}${volumeWords[volume].slice(1)} croak`});
  if (met !== 'all') chips.push({key: 'met', label: met === 'new' ? 'Not yet met' : 'Already met'});
  return chips;
}
// "Did you mean…?" for a search or link that found nothing: the published frog whose name (or scientific name)
// (or profile link) is a near-miss for what was typed. Compares word for word, so "fernbow" finds Fernbrow and "lavendar horn" finds Lavender horn.
const typoDistance = (a, b) => {
  let row = Array.from({length: b.length + 1}, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) next[j] = Math.min(row[j] + 1, next[j - 1] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    row = next;
  }
  return row[b.length];
};
export function suggestFrog(records, text) {
  const typed = String(text ?? '').toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (typed.length < 3) return null;
  const words = typed.split(' ').length, allowed = Math.min(3, Math.max(1, Math.floor(typed.length / 4)));
  let best = null, bestScore = Infinity;
  for (const frog of records.filter(r => r.status === 'published')) {
    for (const label of [frog.name, frog.scientific, frog.id]) {
      const parts = label.toLowerCase().split(/[\s-]+/);
      for (let i = 0; i + words <= parts.length; i++) {
        const score = typoDistance(typed, parts.slice(i, i + words).join(' '));
        if (score < bestScore || (score === bestScore && best && frog.name.localeCompare(best.name) < 0)) { best = frog; bestScore = score; }
      }
    }
  }
  return bestScore <= allowed ? best : null;
}
// "Pond records" badges for a profile: where the frog ranks by size and croak among published frogs
// (counting from whichever end is closer), plus any habitat superlative it holds. Ties are called "joint".
const ordinal = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
const rankBadge = (pond, frog, key, [high, low]) => {
  const above = pond.filter(f => f[key] > frog[key]).length, below = pond.filter(f => f[key] < frog[key]).length;
  const joint = pond.filter(f => f[key] === frog[key]).length > 1 ? 'Joint ' : '';
  const [place, word] = above <= below ? [above + 1, high] : [below + 1, low];
  return {place, word, label: place === 1 ? `${joint}${joint ? word : word[0].toUpperCase() + word.slice(1)} of all ${pond.length}` : `${joint}${ordinal(place)} ${word} of ${pond.length}`};
};
export function pondRecords(records, frog) {
  const pond = records.filter(f => f.status === 'published' || f.id === frog.id);
  if (pond.length < 2) return [];
  const badges = [], local = pond.filter(f => f.habitat === frog.habitat), where = `in the ${frog.habitat.toLowerCase()}`;
  for (const [key, words] of [['size', ['biggest', 'smallest']], ['croak', ['loudest', 'quietest']]]) {
    const overall = rankBadge(pond, frog, key, words);
    badges.push({key, label: overall.label, top: overall.place === 1});
    if (local.length < 2 || local.length === pond.length) continue;
    const near = rankBadge(local, frog, key, words);
    if (near.place === 1 && overall.place !== 1) badges.push({key, label: near.label.replace(/ of all \d+$/, ` ${where}`), top: true});
  }
  return badges;
}
// Field guide filters and sort as a shareable link, e.g. "#/?habitat=Wetland&sort=loud". Defaults stay out of the link,
// and anything a link gets wrong (unknown habitat, made-up sort) is quietly ignored so a mangled URL still opens the guide.
export const filterDefaults = {query: '', habitat: 'All habitats', rarity: 'Any rarity', size: 'Any size', color: 'Any color', active: 'Any time', weather: 'Any weather', company: 'Any company', volume: 'Any volume', met: 'all', sort: 'name'};
export const sortKeys = ['name', 'zname', 'size', 'big', 'loud', 'quiet', 'far', 'near', 'rare', 'common'];
const linkParams = {query: 'q', habitat: 'habitat', rarity: 'rarity', size: 'size', color: 'color', active: 'hours', weather: 'weather', company: 'company', volume: 'volume', met: 'met', sort: 'sort'};
const linkChoices = {habitat: habitats, rarity: ['Common', 'Uncommon', 'Rare'], size: sizeClasses, color: colors, active: activeHours, weather: weathers, company: companies, volume: croakLevels, met: ['new', 'met'], sort: sortKeys};
export function filterLink(state = {}) {
  const params = new URLSearchParams();
  for (const [key, param] of Object.entries(linkParams)) {
    const value = key === 'query' ? String(state.query ?? '').trim() : state[key];
    if (value && value !== filterDefaults[key]) params.set(param, value);
  }
  const text = params.toString();
  return text ? `#/?${text}` : '#/';
}
export function readFilterLink(hash = '') {
  const state = {...filterDefaults}, at = hash.indexOf('?');
  if (at < 0) return state;
  const params = new URLSearchParams(hash.slice(at + 1));
  for (const [key, param] of Object.entries(linkParams)) {
    const value = params.get(param);
    if (value === null) continue;
    if (key === 'query') state.query = value.trim().slice(0, 100);
    else if (linkChoices[key].includes(value)) state[key] = value;
  }
  return state;
}
// "In a nutshell" blurb for a profile: one plain sentence covering size, rarity, habitat, hours, croak and leap,
// so a visitor gets the gist before the full field notes (and has something tidy to paste to a friend).
const nutshellCroak = n => n <= 2 ? 'barely above a whisper' : n <= 4 ? 'at garden-chat volume' : n <= 6 ? 'at porch-conversation volume' : n <= 8 ? 'at dinner-party volume' : 'loud enough to fill a room';
const nutshellLeap = n => n < 20 ? 'polite shuffle' : n < 45 ? 'puddle-hopper' : n < 80 ? 'lily-pad skipper' : n < 120 ? 'brook-clearer' : 'absolute show-off';
export function nutshell(frog) {
  const leap = nutshellLeap(frog.leap);
  return `A ${sizeClass(frog.size).toLowerCase()}, ${frog.rarity.toLowerCase()} ${frog.habitat.toLowerCase()} frog that comes out ${tipHours[frog.active]}, croaks ${nutshellCroak(frog.croak)} and leaps ${frog.leap} cm, ${/^[aeiou]/.test(leap) ? 'an' : 'a'} ${leap}.`;
}
// Frog passport: how many published frogs this browser has met, overall and per habitat,
// so a visitor can see at a glance which corner of the field guide still needs exploring.
export function passport(records, met) {
  const pond = records.filter(r => r.status === 'published');
  const total = pond.length;
  if (!total) return null;
  const count = list => list.filter(f => met.has(f.id)).length;
  const seen = count(pond), left = total - seen;
  const line = !seen ? 'No stamps yet. Open any frog’s profile to collect your first.'
    : !left ? `All ${total} frogs met. You are, officially, a frog person.`
    : `${seen} of ${total} frogs met. ${left} still lurking somewhere in the reeds.`;
  const stamps = habitats.map(habitat => {
    const local = pond.filter(f => f.habitat === habitat), n = count(local);
    return {habitat, met: n, total: local.length, done: n === local.length, label: n === local.length ? `${habitat} · all ${local.length} ✓` : `${habitat} · ${n} of ${local.length}`};
  }).filter(s => s.total);
  return {met: seen, total, left, line, stamps};
}
