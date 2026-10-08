import test from "node:test";
import assert from "node:assert/strict";
import { sentencePuzzles, dialogueScenes } from "../public/activities.js";
import { messages, t } from "../public/i18n.js";

test("sentence builder has at least 18 distinct prompts per lesson", () => {
  assert.deepEqual([...new Set(sentencePuzzles.map(({ lesson }) => lesson))], [0, 1, 2, 3, 4]);
  for (let lesson = 0; lesson <= 4; lesson++) assert.ok(sentencePuzzles.filter((item) => item.lesson === lesson).length >= 18);
  assert.equal(new Set(sentencePuzzles.map(({ id }) => id)).size, sentencePuzzles.length);
  assert.equal(new Set(sentencePuzzles.map(({ target }) => target)).size, sentencePuzzles.length);
  for (const puzzle of sentencePuzzles) {
    assert.ok(puzzle.cue && puzzle.tiles.length >= 2 && puzzle.anchors.length);
    assert.equal(puzzle.target, puzzle.tiles.join(""));
    assert.match(puzzle.target, /[。！]/);
  }
});

test("every lesson has ten accessible two-choice conversation scenes", () => {
  for (let lesson = 0; lesson <= 4; lesson++) assert.equal(dialogueScenes.filter((item) => item.lesson === lesson).length, 10);
  for (const scene of dialogueScenes) {
    assert.ok(scene.opening && scene.title);
    assert.equal(scene.branches.length, 2);
    for (const branch of scene.branches) {
      assert.ok(branch.reply && branch.npc);
      assert.equal(branch.followups.length, 2);
      for (const ending of branch.followups) assert.ok(ending.reply && ending.npc);
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
