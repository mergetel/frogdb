import test from 'node:test';
import assert from 'node:assert/strict';
import {freshRecords,validateRecords,saveRecords,loadRecords} from './store.js';
test('records persist, edits survive reload, and an empty collection stays empty',()=>{let raw=null;const storage={getItem:()=>raw,setItem:(_,v)=>raw=v};const records=loadRecords(storage);records[0].name='Edited frog';saveRecords(storage,records);assert.equal(loadRecords(storage)[0].name,'Edited frog');saveRecords(storage,[]);assert.deepEqual(loadRecords(storage),[]);});
test('invalid imports cannot overwrite stored data',()=>{let raw='original';const storage={setItem:(_,v)=>raw=v};const bad=freshRecords();bad[0].size=-1;assert.throws(()=>saveRecords(storage,bad));assert.equal(raw,'original');});
test('duplicate IDs, invalid statuses and malformed records are rejected',()=>{const r=freshRecords();assert.throws(()=>validateRecords([r[0],r[0]]));assert.throws(()=>validateRecords([{...r[0],status:'secret'}]));assert.throws(()=>validateRecords([null]));});
test('loaded seed data is isolated from later edits',()=>{const a=freshRecords();a[0].name='changed';assert.notEqual(freshRecords()[0].name,'changed');});
