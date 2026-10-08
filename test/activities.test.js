import test from "node:test";
import assert from "node:assert/strict";
import { sentencePuzzles, dialogueScenes } from "../public/activities.js";
import { messages, t } from "../public/i18n.js";

test("sentence prompts cover lessons 0–4 with complete model sentences", () => {
  assert.deepEqual([...new Set(sentencePuzzles.map(({ lesson }) => lesson))], [0, 1, 2, 3, 4]);
  assert.equal(new Set(sentencePuzzles.map(({ id }) => id)).size, sentencePuzzles.length);
  for (const puzzle of sentencePuzzles) {
    assert.ok(puzzle.cue && puzzle.tiles.length >= 2 && puzzle.anchors.length);
    assert.equal(puzzle.target, puzzle.tiles.join(""));
    assert.match(puzzle.target, /[。！]/);
  }
});

test("every lesson has a complete two-choice conversation path", () => {
  assert.deepEqual(dialogueScenes.map(({ lesson }) => lesson), [0, 1, 2, 3, 4]);
  for (const scene of dialogueScenes) {
    assert.ok(scene.opening && scene.titleKey);
    assert.equal(scene.branches.length, 2);
    for (const branch of scene.branches) {
      assert.ok(branch.reply && branch.npc);
      assert.equal(branch.followups.length, 2);
      for (const ending of branch.followups) assert.ok(ending.reply && ending.npc);
    }
    for (const language of ["en", "ja", "zh", "ko", "es", "fr", "de"]) {
      assert.notEqual(t(language, scene.titleKey), scene.titleKey);
    }
  }
});

test("all seven interface languages cover every system message", () => {
  const englishKeys = Object.keys(messages.en).sort();
  for (const language of ["ja", "zh", "ko", "es", "fr", "de"]) {
    assert.deepEqual(Object.keys(messages[language]).sort(), englishKeys, `${language} message coverage`);
    for (const key of englishKeys) assert.ok(messages[language][key].trim(), `${language}.${key}`);
  }
});
