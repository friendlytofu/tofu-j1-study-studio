import test from 'node:test';
import assert from 'node:assert/strict';
import { chaseWords, thiefSpeeds, initialChase, ninjaPace, advanceChase } from '../public/chase.js';

test('hiragana prompts are distinct and contain no romaji or katakana', () => {
  assert.equal(new Set(chaseWords).size, chaseWords.length);
  assert.ok(chaseWords.every((word) => /^[\u3040-\u309f]+$/u.test(word)));
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
