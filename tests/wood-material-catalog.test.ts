import test from 'node:test';import assert from 'node:assert/strict';
import {WOOD_RECORDS,woodRecord,applyWoodRecord} from '../lib/wood-material-catalog.ts';
test('Canadian source GPa converts to MPa and updated Hem-Fir values remain distinct',()=>{
 const spf=woodRecord('CA-SPF-N12-2025','CA');assert.equal(spf.properties.e_mpa,9500);assert.equal(spf.properties.fb_mpa,11.8);assert.equal(spf.properties.fcp_mpa,5.3);
 const hf=woodRecord('CA-HF-N-N12-2025','CA');assert.equal(hf.properties.fb_mpa,12);assert.equal(hf.properties.e_mpa,10000);
 assert.throws(()=>woodRecord(spf.id,'US'));
});
test('server ignores tampered selected material numbers and preserves source identity',()=>{
 const ca=applyWoodRecord({country:'CA',material_record_id:'CA-SPF-N12-2025',fb_mpa:999,e_mpa:999,grade_category:'light_framing'});
 assert.equal(ca.body.fb_mpa,11.8);assert.equal(ca.body.e_mpa,9500);assert.equal(ca.body.grade_category,'visual_structural');assert.ok(String(ca.body.material_source).includes('para851'));
 const us=applyWoodRecord({country:'US',material_record_id:'US-HF-N-2-NDS2024',width_in:3.5,depth_in:11.25,material:{Fb_x:{reference_psi:999,adjustments:{CF:.8}}}});
 const m=us.body.material as {Fb_x:{reference_psi:number;adjustments:object}};assert.equal(m.Fb_x.reference_psi,1000);assert.deepEqual(m.Fb_x.adjustments,{CF:.8});
});
test('unknown records, wrong country and unsupported US catalog geometry reject',()=>{
 for(const p of [{country:'CA',material_record_id:'missing'},{country:'CA',material_record_id:'US-HF-N-2-NDS2024'},{country:'US',material_record_id:'US-HF-N-2-NDS2024',width_in:5.5,depth_in:14}])assert.throws(()=>applyWoodRecord(p));
 assert.equal(new Set(WOOD_RECORDS.map(x=>x.id)).size,WOOD_RECORDS.length);
 assert.equal(applyWoodRecord({country:'CA',material_record_id:'manual',fb_mpa:8}).body.fb_mpa,8);
});
