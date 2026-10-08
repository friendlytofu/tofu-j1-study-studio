// Browser voices are supplied by the visitor's device. Never use an English
// voice as a fallback for Japanese study material.
export function japaneseVoices(voices) {
  return voices.filter(({ lang }) => /^ja(?:-|$)/i.test(lang || ""));
}
export function voiceKey(voice) { return JSON.stringify([voice.name, voice.lang]); }
export function chooseJapaneseVoice(voices, preferredKey = "") {
  const available = japaneseVoices(voices);
  if (preferredKey) {
    const preferred = available.find((voice) => voiceKey(voice) === preferredKey);
    if (preferred) return preferred;
  }
  const quality = (voice) => {
    const name = voice.name.toLowerCase();
    if (/kyoko|nanami|haruka|sayaka|otoha|google 日本語|google japanese/.test(name)) return 0;
    if (/japanese|日本語|ja-jp/.test(name)) return 1;
    return 2;
  };
  return available.sort((a, b) => quality(a) - quality(b))[0] || null;
}
