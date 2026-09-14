import test from 'node:test';
import assert from 'node:assert/strict';
import {freshRecords,validateRecords,saveRecords,loadRecords} from './store.js';
test('records persist, edits survive reload, and an empty collection stays empty',()=>{let raw=null;const storage={getItem:()=>raw,setItem:(_,v)=>raw=v};const records=loadRecords(storage);records[0].name='Edited frog';saveRecords(storage,records);assert.equal(loadRecords(storage)[0].name,'Edited frog');saveRecords(storage,[]);assert.deepEqual(loadRecords(storage),[]);});
test('invalid imports cannot overwrite stored data',()=>{let raw='original';const storage={setItem:(_,v)=>raw=v};const bad=freshRecords();bad[0].size=-1;assert.throws(()=>saveRecords(storage,bad));assert.equal(raw,'original');});
test('duplicate IDs, invalid statuses and malformed records are rejected',()=>{const r=freshRecords();assert.throws(()=>validateRecords([r[0],r[0]]));assert.throws(()=>validateRecords([{...r[0],status:'secret'}]));assert.throws(()=>validateRecords([null]));});
test('loaded seed data is isolated from later edits',()=>{const a=freshRecords();a[0].name='changed';assert.notEqual(freshRecords()[0].name,'changed');});

test('all 35 seed frogs have fictional locations',()=>{
  const records=freshRecords();
  assert.equal(records.length,35);
  assert.ok(records.every(r=>typeof r.location==='string'&&r.location.trim().length>0));
  assert.equal(validateRecords(records).length,35);
});
test('location edits and explicit clearing survive storage and JSON round trips',()=>{
  let raw=null;const storage={getItem:()=>raw,setItem:(_,v)=>raw=v};
  const records=freshRecords();records[0].location='  North & South <Wetlands>  ';
  saveRecords(storage,records);
  assert.equal(loadRecords(storage)[0].location,'North & South <Wetlands>');
  assert.equal(validateRecords(JSON.parse(raw))[0].location,'North & South <Wetlands>');
  records[0].location='';saveRecords(storage,records);
  assert.equal(loadRecords(storage)[0].location,'');
});
test('legacy records gain only location defaults without losing edits',()=>{
  const seeded={...freshRecords()[0],name:'My edited frog'};delete seeded.location;
  const custom={...seeded,id:'custom-frog'};
  const raw=JSON.stringify([seeded,custom]);
  const loaded=loadRecords({getItem:()=>raw});
  assert.equal(loaded[0].name,'My edited frog');
  assert.equal(loaded[0].location,freshRecords()[0].location);
  assert.equal(loaded[1].location,'');
  assert.deepEqual(validateRecords(JSON.parse(raw)),loaded);
});
test('malformed locations cannot overwrite saved data',()=>{
  let raw='original';const storage={setItem:(_,v)=>raw=v};
  for(const location of [null,42,{},[], 'x'.repeat(101)]) {
    assert.throws(()=>saveRecords(storage,[{...freshRecords()[0],location}]),/Location/);
    assert.equal(raw,'original');
  }
});
