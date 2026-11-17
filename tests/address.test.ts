import test from 'node:test';
import assert from 'node:assert/strict';
import { EXAMPLES, redactPersonalData, resolveAddress } from '../src/lib/addressResolver';
import { csvExport, dispatchPayload, normalizeSavedRecords, parsePostcode, processBatch } from '../src/lib/workspace';

test('all concept-note examples yield distinct address context without invented postcodes', () => {
  const expected = ['Lokogoma','Benin City','Ikeja'];
  EXAMPLES.forEach((example,index) => {
    const result = resolveAddress(example.text);
    assert.equal(result.location?.name,expected[index]);
    assert.ok(result.landmarks.length > 0);
    assert.equal(result.json.verified,false);
    assert.equal(result.json.nipost_digital_postcode,null);
    assert.ok(result.elapsedMs >= 0);
    assert.equal(result.json.mode,'local_rule_based_demo');
  });
});
test('changed text in a known locality does not replay preset directions', () => {
  const result = resolveAddress('Flat 8, beside the church, blue gate, Lokogoma, Abuja');
  assert.deepEqual(result.units,['Flat 8']);
  assert.ok(result.identifiers.includes('blue gate'));
  assert.ok(!JSON.stringify(result).includes('yellow water tank'));
});
test('contact details are removed before normalization and every export field', () => {
  const result = resolveAddress('House 12, behind hospital, Ikeja, Lagos, recipient: Test Person, 08012345678, +234 801 234 5678, demo@example.com');
  const output = JSON.stringify(dispatchPayload(result));
  for (const privateValue of ['Test Person','08012345678','234 801','demo@example.com']) assert.ok(!output.includes(privateValue));
  assert.equal(result.redactedCount,4);
  assert.ok(result.units.includes('House 12'));
});
test('explicit call-name redaction preserves named commercial landmarks', () => {
  const output = redactPersonalData('After Mama Ngozi shop, call Tunde on 08012345678');
  assert.ok(output.text.includes('Mama Ngozi shop'));
  assert.ok(!output.text.includes('Tunde'));
  assert.ok(!output.text.includes('08012345678'));
});
test('specific localities take precedence over city-level centres', () => {
  assert.equal(resolveAddress('Green gate, beside transformer, Wuse, Abuja').location?.name,'Wuse');
  assert.equal(resolveAddress('Shop 12, beside market, Yaba, Lagos').location?.name,'Yaba');
});
test('unknown or conflicting geography cannot be presented as a ready delivery', () => {
  assert.equal(resolveAddress('Behind the school, unknown settlement').location,null);
  const conflict = resolveAddress('Green gate, Ikeja, Abuja');
  assert.equal(conflict.status,'Needs more detail');
  assert.ok(conflict.warnings.some(warning => warning.includes('different states')));
});
test('address and batch limits reject empty and oversized inputs', () => {
  assert.throws(() => resolveAddress('  '));
  assert.throws(() => resolveAddress('a'.repeat(2001)));
  assert.throws(() => processBatch(''));
  assert.throws(() => processBatch(Array(101).fill('Ikeja').join('\n')));
  assert.equal(processBatch(EXAMPLES.map(e => e.text).join('\n')).length,3);
});
test('postcode syntax supports normalized segments but does not claim existence', () => {
  assert.equal(parsePostcode('fc 01 a01 kp 27')?.canonical,'FC-01-A01-KP-27');
  assert.equal(parsePostcode('FC01A01KP27')?.canonical,'FC-01-A01-KP-27');
  for (const value of ['FC-00-A01-KP-27','FC-01-A01-KP-00','123456','FC01A01KP271']) assert.equal(parsePostcode(value),null);
});
test('CSV export quotes values and neutralizes spreadsheet formulas', () => {
  const result = resolveAddress('=HYPERLINK("malicious"), Ikeja');
  const csv = csvExport([result]);
  assert.ok(csv.includes('"\'=HYPERLINK(""Malicious"")'));
});
test('malformed saved records cannot crash rendering or preserve raw contact fields', () => {
  assert.deepEqual(normalizeSavedRecords({ invalid:true }),[]);
  assert.deepEqual(normalizeSavedRecords([{id:'x',savedAt:'invalid',result:{input:'Ikeja'}}]),[]);
  const output = normalizeSavedRecords([{ id:'x',savedAt:new Date().toISOString(),result:{input:'Ikeja, demo@example.com',landlord:'Secret'},point:{latitude:999,longitude:3,source:'dispatcher_confirmed'} }]);
  assert.equal(output.length,1);
  assert.equal(output[0].point,null);
  assert.ok(!JSON.stringify(output).includes('demo@example.com'));
  assert.ok(!JSON.stringify(output).includes('Secret'));
});

test('restoring a sanitized record preserves its redaction count and allowlists point fields', () => {
  const result = resolveAddress('Shop 14, Ikeja, recipient: Test Person, 08012345678');
  const records = normalizeSavedRecords([{ id: result.id, savedAt: result.createdAt, result, point: { latitude: 6.6, longitude: 3.35, source: 'dispatcher_confirmed', contact: 'Private Person' } }]);
  assert.equal(records[0].result.redactedCount, 2);
  assert.equal((records[0].result.json.privacy as { redacted_items: number }).redacted_items, 2);
  assert.deepEqual(records[0].point, { latitude: 6.6, longitude: 3.35, source: 'dispatcher_confirmed' });
  assert.ok(!JSON.stringify(records).includes('Private Person'));
});
