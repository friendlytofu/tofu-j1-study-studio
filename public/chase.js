// Original hiragana typing game. All progress stays in this browser tab.
export const chaseWords = [
  "こんにちは", "おはよう", "ありがとう", "せんせい", "がくせい", "ともだち",
  "にほんご", "えいが", "おんがく", "べんきょう", "ごはん", "としょかん",
  "きょう", "あした", "きのう", "おかね", "でんしゃ", "たべもの",
  "やさい", "しずか", "おもしろい", "ちいさい", "あたらしい", "むずかしい"
];

export const thiefSpeeds = Object.freeze({ easy: 1.3, normal: 1.8, hard: 2.4 });
export const initialChase = Object.freeze({ ninja: 8, thief: 37 });

export function ninjaPace(strokeTimes, now) {
  const recent = strokeTimes.filter((time) => time >= now - 4000 && time <= now).length;
  return Math.min(6.2, 0.4 + recent * 0.28);
}

export function advanceChase(position, seconds, pace, level) {
  if (!Object.hasOwn(thiefSpeeds, level)) throw new Error("Invalid chase level");
  const delta = Math.max(0, seconds);
  const thief = Math.min(100, position.thief + thiefSpeeds[level] * delta);
  const ninja = Math.min(100, position.ninja + Math.max(0, pace) * delta);
  const outcome = ninja >= thief - 3 ? "caught" : thief >= 100 ? "escaped" : null;
  return { ninja, thief, outcome };
}
