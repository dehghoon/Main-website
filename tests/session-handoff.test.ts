import test from 'node:test';
import assert from 'node:assert/strict';
import {validHandoff,safeAccountReturn} from '../lib/tool-access/session-handoff.ts';
const nonce='a'.repeat(64);
test('tool audience and exact caller origins are bound to a nonce',()=>{
 assert.equal(validHandoff('wind_load','https://wind.linkoteq.com',nonce),true);
 assert.equal(validHandoff('earthquake','https://linkoteq-seismic-preview.vercel.app',nonce),true);
 for(const x of [['wind_load','https://seismic.linkoteq.com',nonce],['wood_design','https://wind.linkoteq.com',nonce],['wind_load','https://wind.linkoteq.com.evil.test',nonce],['wind_load','https://wind.linkoteq.com','guess']])assert.equal(validHandoff(...x as [string,string,string]),false);
});
test('client login return accepts only a validated internal session callback',()=>{
 const path=`/account/tool-session?tool=wind_load&origin=https%3A%2F%2Fwind.linkoteq.com&state=${nonce}`;
 assert.equal(safeAccountReturn(path),path);
 for(const x of ['https://evil.test','//evil.test','/\\evil.test',path+'#access_token=oops',path.replace('wind.linkoteq.com','evil.test'),'/blog/dashboard'])assert.equal(safeAccountReturn(x),null);
});
