// Typing prompts come from the same lesson 0–4 vocabulary shown on the site.
const base = {
  あ:['a'],い:['i'],う:['u'],え:['e'],お:['o'],か:['ka'],き:['ki'],く:['ku'],け:['ke'],こ:['ko'],
  さ:['sa'],し:['shi','si'],す:['su'],せ:['se'],そ:['so'],た:['ta'],ち:['chi','ti'],つ:['tsu','tu'],て:['te'],と:['to'],
  な:['na'],に:['ni'],ぬ:['nu'],ね:['ne'],の:['no'],は:['ha'],ひ:['hi'],ふ:['fu','hu'],へ:['he'],ほ:['ho'],
  ま:['ma'],み:['mi'],む:['mu'],め:['me'],も:['mo'],や:['ya'],ゆ:['yu'],よ:['yo'],ら:['ra'],り:['ri'],る:['ru'],れ:['re'],ろ:['ro'],
  わ:['wa'],を:['wo','o'],ん:['n','nn'],が:['ga'],ぎ:['gi'],ぐ:['gu'],げ:['ge'],ご:['go'],ざ:['za'],じ:['ji','zi'],ず:['zu'],ぜ:['ze'],ぞ:['zo'],
  だ:['da'],ぢ:['ji','di'],づ:['zu','du'],で:['de'],ど:['do'],ば:['ba'],び:['bi'],ぶ:['bu'],べ:['be'],ぼ:['bo'],ぱ:['pa'],ぴ:['pi'],ぷ:['pu'],ぺ:['pe'],ぽ:['po'],
  ゔ:['vu'],ぁ:['a'],ぃ:['i'],ぅ:['u'],ぇ:['e'],ぉ:['o'],ゃ:['ya'],ゅ:['yu'],ょ:['yo']
};
const pairs = {
  きゃ:['kya'],きゅ:['kyu'],きょ:['kyo'],しゃ:['sha','sya'],しゅ:['shu','syu'],しょ:['sho','syo'],
  ちゃ:['cha','tya'],ちゅ:['chu','tyu'],ちょ:['cho','tyo'],にゃ:['nya'],にゅ:['nyu'],にょ:['nyo'],
  ひゃ:['hya'],ひゅ:['hyu'],ひょ:['hyo'],みゃ:['mya'],みゅ:['myu'],みょ:['myo'],りゃ:['rya'],りゅ:['ryu'],りょ:['ryo'],
  ぎゃ:['gya'],ぎゅ:['gyu'],ぎょ:['gyo'],じゃ:['ja','jya','zya'],じゅ:['ju','jyu','zyu'],じょ:['jo','jyo','zyo'],
  びゃ:['bya'],びゅ:['byu'],びょ:['byo'],ぴゃ:['pya'],ぴゅ:['pyu'],ぴょ:['pyo'],
  てぃ:['ti'],でぃ:['di'],ふぁ:['fa'],ふぃ:['fi'],ふぇ:['fe'],ふぉ:['fo'],うぃ:['wi'],うぇ:['we'],とぅ:['tu'],どぅ:['du']
};

export function hiraganaReading(reading) {
  return [...reading.normalize('NFC')].map((char) => {
    const code = char.codePointAt(0);
    return code >= 0x30a1 && code <= 0x30f6 ? String.fromCodePoint(code - 0x60) : char;
  }).join('');
}

export function romanizations(reading) {
  const kana = hiraganaReading(reading);
  if (!/^[\u3041-\u3096ー]+$/u.test(kana)) return [];
  let variants = [''];
  for (let i = 0; i < kana.length; i++) {
    const char = kana[i];
    let parts;
    if (char === 'っ') {
      const next = pairs[kana.slice(i + 1, i + 3)] || base[kana[i + 1]];
      if (!next) return [];
      parts = [...new Set(next.map((part) => part[0]).filter((letter) => !'aeioun'.includes(letter)))];
      if (!parts.length) return [];
    } else if (char === 'ー') {
      variants = variants.map((prefix) => prefix + (prefix.match(/[aeiou](?!.*[aeiou])/)?.[0] || '-'));
      continue;
    } else {
      const pair = pairs[kana.slice(i, i + 2)];
      parts = pair || base[char];
      if (!parts) return [];
      if (pair) i++;
    }
    variants = variants.flatMap((prefix) => parts.map((part) => prefix + part)).slice(0, 128);
  }
  return [...new Set(variants)];
}

export function buildChasePool(bank) {
  const seen = new Set();
  return [0,1,2,3,4].flatMap((lesson) => (bank[lesson] || []).flatMap((item) => {
    if (item.practice === false || !item.reading || !item.written || !item.meaning) return [];
    const hiragana = hiraganaReading(item.reading);
    const romaji = romanizations(hiragana);
    if (!romaji.length || seen.has(hiragana)) return [];
    seen.add(hiragana);
    return [{ lesson, written: item.written, reading: item.reading, hiragana, meaning: item.meaning, romaji }];
  }));
}

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
