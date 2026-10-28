import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const script = html.match(/<script id="app-script">([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'The single-file page contains its application script');
const context = vm.createContext({});
vm.runInContext(script + '\nthis.album = Album;', context);
const album = context.album;
const plain = object => JSON.parse(JSON.stringify(object));
const sourceName = 'pet_1793000000000_p0_f0_s0_g2_a3_z12.jpg';
const choose = id => album.rules.find(rule => rule.id === id);
const generate = (id, extra = {}) => album.generate({ selected: choose(id), timestamp: '1793000000001', ...extra });

test('matches the requested original-name conversion exactly', () => {
  const source = album.parse(sourceName);
  const result = album.generate({ source, selected: choose('chick-close') });
  assert.equal(result.filename, 'pet_1793000000000_p0_f0_s0_g1_a3_z20.jpg');
  assert.deepEqual(plain(result.changes), [{ key: 'g', before: 2, after: 1 }, { key: 'z', before: 12, after: 20 }]);
});

test('all fourteen requirements have the independently specified defaults', () => {
  const expected = {
    'chick-close': { g: 1, z: 20 }, 'chick-far': { g: 1, z: 0 },
    'chick-interact': { g: 1, p: 8 }, 'chick-picnic': { g: 1, s: 1 }, 'chick-free': { g: 1 },
    'teen-warehouse': { g: 2, s: 4 }, 'teen-trip-one': { g: 2, s: 2 }, 'teen-trip-two': { g: 2, s: 5 },
    'teen-party': { g: 2, v: 5, e: 6 }, 'teen-free': { g: 2 },
    'adult-sepia': { g: 3, f: 2, p: 1 }, 'adult-action': { g: 3, v: 7 },
    'adult-gaze': { g: 3, p: 4 }, 'adult-free': { g: 3 }
  };
  assert.equal(album.rules.length, 14);
  for (const [id, required] of Object.entries(expected)) {
    const result = generate(id);
    assert.deepEqual(plain(result.tags), { p: 0, f: 0, s: 0, a: 3, z: 12, ...required });
    assert.match(result.filename, /^pet_1793000000001_p\d+_f\d+_s\d+_g[123]_a\d_z\d+(?:_v\d+)?(?:_e\d+)?\.jpg$/);
  }
});

test('every alternative uses the intended numeric mapping', () => {
  const expected = {
    'chick-close': ['z', [20,21,22,23,24,25]], 'chick-far': ['z', [0,1,2,3,4,5,6,7,8,9]],
    'chick-interact': ['p', [8,9,10]], 'teen-trip-one': ['s', [2,3,6,9]],
    'teen-trip-two': ['s', [5,7,8,10]], 'adult-sepia': ['p', [1,3,6,7]],
    'adult-action': ['v', [7,1]], 'adult-gaze': ['p', [4,5]]
  };
  for (const [id, [key, options]] of Object.entries(expected)) {
    assert.deepEqual(plain(choose(id).options.map(option => option.value)), options);
    for (const detail of options) {
      assert.equal(generate(id, { detail }).tags[key], detail);
    }
  }
});

test('preserves unrelated tags, timestamp, ratio, tag order and valid range choices', () => {
  const source = album.parse('pet_1793000000000_e9_v4_z23_a6_g3_s10_f8_p10.jpg');
  const result = album.generate({ source, selected: choose('chick-close') });
  assert.equal(result.filename, 'pet_1793000000000_e9_v4_z23_a6_g1_s10_f8_p10.jpg');
  assert.deepEqual(plain(result.changes), [{ key: 'g', before: 3, after: 1 }]);
  assert.equal(album.generate({ source, selected: choose('chick-close'), detail: 25 }).tags.z, 25);
  const free = album.generate({ source, selected: choose('adult-free') });
  assert.equal(free.filename, 'pet_1793000000000_e9_v4_z23_a6_g3_s10_f8_p10.jpg');
});

test('adds missing requirements without inventing unrelated source tags or duplicating keys', () => {
  const source = album.parse('pet_1793000000000_a5.jpg');
  const result = album.generate({ source, selected: choose('teen-party') });
  assert.equal(result.filename, 'pet_1793000000000_a5_g2_v5_e6.jpg');
  const existing = album.parse('pet_1793000000000_v1_g1_e2.jpg');
  assert.equal(album.generate({ source: existing, selected: choose('teen-party') }).filename, 'pet_1793000000000_v5_g2_e6.jpg');
});

test('all ratios are explicit overrides; preserve inherits the source or square default', () => {
  assert.deepEqual(plain(album.ratios), ['16:9','4:3','5:4','1:1','4:5','3:4','9:16']);
  const source = album.parse(sourceName.replace('_a3_', '_a6_'));
  assert.equal(generate('chick-close', { source, aspect: 'preserve' }).tags.a, 6);
  assert.equal(generate('chick-close').tags.a, 3);
  for (let i = 0; i <= 6; i++) assert.equal(generate('chick-close', { source, aspect: String(i) }).tags.a, i);
  assert.throws(() => generate('chick-close', { aspect: '7' }));
});

test('rejects album names, malformed input, duplicate tags and unsupported values', () => {
  assert.equal(album.parse('   '), null);
  assert.throws(() => album.parse('book_1793000000000_p0.jpg'), /移回图库/);
  const invalid = [
    'photo.jpg', '/tmp/' + sourceName, sourceName.toUpperCase(), sourceName.replace('.jpg', '.png'),
    sourceName + '\n' + sourceName, sourceName.replace('_p0', '_p0_p1'),
    sourceName.replace('_p0', '_p11'), sourceName.replace('_f0', '_f9'), sourceName.replace('_s0', '_s11'),
    sourceName.replace('_g2', '_g4'), sourceName.replace('_a3', '_a7'), sourceName.replace('_z12', '_z26'),
    sourceName.replace('_p0', '_p-1'), sourceName.replace('_p0', '_p1.5'), sourceName.replace('_p0', '_p00'),
    sourceName.replace('_p0', '_q0'), sourceName.replace('.jpg', '_v3.jpg'), sourceName.replace('.jpg', '_e10.jpg'),
    sourceName.replace('1793000000000', '9007199254740992'), 'pet_1793000000000.jpg'
  ];
  for (const input of invalid) assert.throws(() => album.parse(input), undefined, input);
  assert.equal(album.parse('  ' + sourceName + '  ').timestamp, '1793000000000');
  assert.equal(album.parse(sourceName.replace('_g2', '_g0')).tags.g, 0);
  for (const action of [0,1,2,4,5,6,7]) assert.equal(album.parse(sourceName.replace('.jpg', `_v${action}.jpg`)).tags.v, action);
});

test('regenerating the timestamp preserves every other field', () => {
  const source = album.parse(sourceName);
  const result = album.generate({ source, selected: choose('teen-free'), timestamp: '1793000000005' });
  assert.equal(result.filename, sourceName.replace('1793000000000', '1793000000005'));
});

test('the offline deliverable has no external assets or network calls', () => {
  assert.doesNotMatch(html, /<(?:script|link|img)\b[^>]*(?:src|href)=["']https?:/i);
  assert.doesNotMatch(script, /\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/);
});
