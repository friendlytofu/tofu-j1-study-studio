import test from 'node:test';
import assert from 'node:assert/strict';
import { buildChasePool, romanizations, thiefSpeeds, initialChase, ninjaPace, advanceChase } from '../public/chase.js';

test('romaji typing accepts common spellings and katakana readings', () => {
  assert.ok(romanizations('わたし').includes('watashi'));
  assert.ok(romanizations('わたし').includes('watasi'));
  assert.ok(romanizations('シチュー').includes('shichuu'));
  assert.ok(romanizations('がっこう').includes('gakkou'));
  assert.deepEqual(romanizations('日本語'), []);
});

test('typing prompts come only from playable lesson vocabulary', () => {
  const bank = {
    0:[{written:'私',reading:'わたし',meaning:'I'},{written:'重複',reading:'わたし',meaning:'duplicate'}],
    1:[{written:'コーヒー',reading:'コーヒー',meaning:'coffee'},{written:'skip',reading:'すきっぷ',meaning:'skip',practice:false}],
    5:[{written:'遠い',reading:'とおい',meaning:'far'}]
  };
  const pool = buildChasePool(bank);
  assert.deepEqual(pool.map((item) => item.written), ['私','コーヒー']);
  assert.equal(pool[0].romaji[0], 'watashi');
  assert.equal(pool[1].lesson, 1);
});

test('recent correct characters set ninja pace; old characters stop helping', () => {
  assert.equal(ninjaPace([], 10_000), 0.4);
  assert.ok(ninjaPace([2_000, 7_000, 9_000], 10_000) > ninjaPace([2_000], 10_000));
  assert.equal(ninjaPace([2_000], 10_000), 0.4);
  assert.equal(ninjaPace(Array(100).fill(9_000), 10_000), 6.2);
});

test('three thief speeds change difficulty and a fast typist can catch one', () => {
  assert.ok(thiefSpeeds.easy < thiefSpeeds.normal && thiefSpeeds.normal < thiefSpeeds.hard);
  const easy = advanceChase(initialChase, 5, 3, 'easy');
  const hard = advanceChase(initialChase, 5, 3, 'hard');
  assert.ok(easy.thief < hard.thief);
  assert.equal(advanceChase({ ninja: 47, thief: 49 }, 1, 4, 'hard').outcome, 'caught');
  assert.equal(advanceChase({ ninja: 10, thief: 99 }, 1, 0.4, 'hard').outcome, 'escaped');
});
