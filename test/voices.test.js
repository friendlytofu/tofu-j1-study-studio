import test from "node:test";
import assert from "node:assert/strict";
import { japaneseVoices, chooseJapaneseVoice, voiceKey } from "../public/voices.js";

test("Japanese practice never selects an English voice", () => {
  const english = { name:"English robot", lang:"en-US" };
  const japanese = { name:"Kyoko", lang:"ja-JP" };
  assert.deepEqual(japaneseVoices([english, japanese]), [japanese]);
  assert.equal(chooseJapaneseVoice([english]), null);
  assert.equal(chooseJapaneseVoice([english, japanese]), japanese);
});

test("a selected Japanese device voice overrides the automatic preference", () => {
  const voices = [{name:"Kyoko",lang:"ja-JP"},{name:"Other Japanese",lang:"ja-JP"}];
  assert.equal(chooseJapaneseVoice(voices, voiceKey(voices[1])), voices[1]);
});
