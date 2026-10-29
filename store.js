import {seedFrogs, habitats, portraits} from './data.js';
export const STORAGE_KEY = 'frogdb.records.v1';
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
