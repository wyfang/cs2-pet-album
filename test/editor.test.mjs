import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const script = html.match(/<script id="app-script">([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'The current page contains the application script');
const context = vm.createContext({});
vm.runInContext(script + '\nthis.album = Album;', context);
const album = context.album;
const plain = value => JSON.parse(JSON.stringify(value));
const timestamp = '1793000000001';
const choose = id => album.rules.find(rule => rule.id === id);
const custom = (edits = {}, extra = {}) => album.generate({ mode: 'custom', edits, timestamp, ...extra });

test('free editing has complete defaults and does not apply an album preset', () => {
  const result = custom();
  assert.equal(result.filename, 'pet_1793000000001_p0_f0_s0_g1_a3_z12.jpg');
  assert.deepEqual(plain(result.tags), { p: 0, f: 0, s: 0, g: 1, a: 3, z: 12 });
  const free = custom({ g: 0, v: 1, e: 3 }, { selected: choose('teen-party') });
  assert.equal(free.filename, 'pet_1793000000001_p0_f0_s0_g0_a3_z12_v1_e3.jpg');
});

test('every supported value in all eight filename fields is editable', () => {
  const span = max => Array.from({ length: max + 1 }, (_, value) => value);
  const supported = {
    p: span(10), f: span(8), s: span(10), g: span(3),
    a: span(6), z: span(25), v: [0, 1, 2, 4, 5, 6, 7], e: span(9)
  };
  for (const [key, values] of Object.entries(supported)) {
    for (const value of values) {
      const result = custom({ [key]: value });
      assert.equal(result.tags[key], value, `${key}${value}`);
      const parsed = album.parse(result.filename);
      assert.equal(parsed.tags[key], value, `round trip ${key}${value}`);
      assert.equal(Object.keys(result.tags).filter(letter => letter === key).length, 1);
    }
  }
  assert.equal(custom({ p: 10, f: 8, s: 10, g: 3, a: 6, z: 25, v: 7, e: 9 }).filename,
    'pet_1793000000001_p10_f8_s10_g3_a6_z25_v7_e9.jpg');
});

test('no action or headwear removes the optional tag without confusing zero with none', () => {
  const source = album.parse('pet_1793000000000_e6_v5_z12_a3_g2_s4_f0_p0.jpg');
  const removed = album.generate({ mode: 'custom', source, edits: { v: null, e: null } });
  assert.equal(removed.filename, 'pet_1793000000000_z12_a3_g2_s4_f0_p0.jpg');
  assert.equal(Object.hasOwn(removed.tags, 'v'), false);
  assert.equal(Object.hasOwn(removed.tags, 'e'), false);
  assert.doesNotMatch(removed.filename, /undefined|null/);
  assert.equal(custom({ v: 0, e: 0 }).filename,
    'pet_1793000000001_p0_f0_s0_g1_a3_z12_v0_e0.jpg');
  const absent = custom({ v: null, e: null });
  assert.equal(absent.filename, 'pet_1793000000001_p0_f0_s0_g1_a3_z12.jpg');
});

test('free edits preserve the source timestamp, unrelated fields and original tag order', () => {
  const original = 'pet_1793000000000_e9_v4_z23_a6_g3_s10_f8_p10.jpg';
  const source = album.parse(original);
  const before = plain(source);
  assert.equal(album.generate({ mode: 'custom', source }).filename, original);
  const edited = album.generate({ mode: 'custom', source, edits: { s: 2, f: 1 } });
  assert.equal(edited.filename, 'pet_1793000000000_e9_v4_z23_a6_g3_s2_f1_p10.jpg');
  assert.deepEqual(plain(source), before, 'Editing must not mutate the parsed source');
  const sparse = album.parse('pet_1793000000000_a5.jpg');
  assert.equal(album.generate({ mode: 'custom', source: sparse, edits: { e: 3 } }).filename,
    'pet_1793000000000_a5_e3.jpg');
});

test('album requirements override conflicting free edits and optional removals', () => {
  const party = album.generate({
    selected: choose('teen-party'), timestamp,
    edits: { g: 0, v: null, e: null, s: 8, f: 7, p: 10, a: 0, z: 25 }
  });
  assert.deepEqual(plain(party.tags), { p: 10, f: 7, s: 8, g: 2, a: 0, z: 25, v: 5, e: 6 });
  const sepia = album.generate({ mode: 'album', selected: choose('adult-sepia'), timestamp, edits: { g: 1, f: 8, p: 7 } });
  assert.equal(sepia.tags.g, 3);
  assert.equal(sepia.tags.f, 2);
  assert.equal(sepia.tags.p, 7);
});

test('album alternatives accept legal edits, preserve valid originals and otherwise use the first choice', () => {
  const source = album.parse('pet_1793000000000_p9_f0_s6_g2_a3_z23.jpg');
  assert.equal(album.generate({ source, selected: choose('chick-close') }).tags.z, 23);
  assert.equal(album.generate({ source, selected: choose('chick-close'), edits: { z: 25 } }).tags.z, 25);
  assert.equal(album.generate({ source, selected: choose('chick-close'), edits: { z: 12 } }).tags.z, 20);
  assert.equal(album.generate({ source, selected: choose('chick-interact') }).tags.p, 9);
  assert.equal(album.generate({ source, selected: choose('chick-interact'), edits: { p: 10 } }).tags.p, 10);
  assert.equal(album.generate({ source, selected: choose('chick-interact'), edits: { p: 4 } }).tags.p, 8);
  assert.equal(album.generate({ source, selected: choose('teen-trip-one') }).tags.s, 6);
  assert.equal(album.generate({ source, selected: choose('teen-trip-one'), edits: { s: 7 } }).tags.s, 2);
});

test('invalid edits fail instead of creating guessed or malformed filenames', () => {
  const invalid = [
    { p: 11 }, { f: 9 }, { s: 11 }, { g: 4 }, { a: 7 }, { z: 26 }, { v: 3 }, { e: 10 },
    { x: 50 }, { p: -1 }, { f: 1.5 }, { s: NaN }, { g: Infinity }, { a: '1' }, { z: true },
    { p: null }, { f: null }, { s: null }, { g: null }, { a: null }, { z: null }
  ];
  for (const edits of invalid) {
    assert.throws(() => custom(edits), undefined, JSON.stringify(edits));
    assert.throws(() => album.generate({ selected: choose('teen-party'), edits, timestamp }), undefined, JSON.stringify(edits));
  }
});

test('the current single page exposes each of the eight controls exactly once', () => {
  for (const key of ['p', 'f', 's', 'g', 'a', 'z', 'v', 'e']) {
    const id = `setting-${key}`;
    assert.equal((html.match(new RegExp(`<\\w+\\b[^>]*\\bid="${id}"`, 'g')) || []).length, 1, id);
    assert.match(html, new RegExp(`<label\\b[^>]*\\bfor="${id}"`));
  }
  assert.equal((html.match(/<script\b[^>]*\bid="app-script"/g) || []).length, 1);
  assert.doesNotMatch(html, /<script\b[^>]*\bsrc=/i);
  assert.doesNotMatch(html, /<(?:link|img)\b[^>]*(?:src|href)=["']https?:/i);
  assert.doesNotMatch(script, /\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/);
});
