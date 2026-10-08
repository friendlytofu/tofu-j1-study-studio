// Original practice content. These are not transcriptions or a reproduction of
// the textbook's vocabulary lists. The audio catalog only records supplied IDs.
export const trackCounts = [14, 18, 28, 14, 22];

export const readings = [
  { title: "はじめまして", text: "A：はじめまして。わたしはエマです。\nB：はじめまして。わたしはたけしです。\nA：どうぞよろしくおねがいします。", translations: { en:"A: Nice to meet you. I'm Emma. B: Nice to meet you. I'm Takeshi. A: I look forward to getting to know you.", zh:"A：初次见面，我是艾玛。B：初次见面，我是武。A：请多关照。", es:"A: Mucho gusto. Soy Emma. B: Mucho gusto. Soy Takeshi. A: Encantada de conocerte.", fr:"A : Enchantée, je suis Emma. B : Enchanté, je suis Takeshi. A : Ravie de faire ta connaissance.", de:"A: Freut mich. Ich bin Emma. B: Freut mich. Ich bin Takeshi. A: Schön, dich kennenzulernen." } },
  { title: "わたしのこと", text: "わたしは大学生です。日本語をべんきょうしています。しゅみは音楽です。友だちとよく話します。", translations: { en:"I am a university student. I study Japanese. My hobby is music. I often talk with friends.", zh:"我是大学生。我在学习日语。我的爱好是音乐。我经常和朋友聊天。", es:"Soy estudiante universitaria. Estudio japonés. Mi pasatiempo es la música. Hablo a menudo con mis amigos.", fr:"Je suis étudiante à l'université. J'étudie le japonais. J'aime la musique. Je parle souvent avec mes amis.", de:"Ich studiere an der Universität und lerne Japanisch. Mein Hobby ist Musik. Ich spreche oft mit Freunden." } },
  { title: "週末のよてい", text: "土曜日に友だちと映画を見ます。日曜日は家で本を読みます。とても楽しみです。", translations: { en:"On Saturday I will watch a movie with a friend. On Sunday I will read a book at home. I'm looking forward to it.", zh:"星期六我和朋友看电影。星期天我在家读书。我很期待。", es:"El sábado veré una película con un amigo. El domingo leeré un libro en casa. Tengo muchas ganas.", fr:"Samedi, je regarderai un film avec un ami. Dimanche, je lirai un livre chez moi. J'ai hâte.", de:"Am Samstag sehe ich mit einem Freund einen Film. Am Sonntag lese ich zu Hause ein Buch. Ich freue mich darauf." } },
  { title: "きのうのこと", text: "きのう、図書館で日本語をべんきょうしました。そのあと、友だちとごはんを食べました。", translations: { en:"Yesterday I studied Japanese at the library. After that, I ate with a friend.", zh:"昨天我在图书馆学日语。之后和朋友一起吃了饭。", es:"Ayer estudié japonés en la biblioteca. Después comí con un amigo.", fr:"Hier, j'ai étudié le japonais à la bibliothèque. Ensuite, j'ai mangé avec un ami.", de:"Gestern habe ich in der Bibliothek Japanisch gelernt. Danach habe ich mit einem Freund gegessen." } },
  { title: "町へ行きましょう", text: "今日はいい天気です。駅の近くに小さい店があります。いっしょに行きませんか。", translations: { en:"The weather is nice today. There is a small shop near the station. Shall we go together?", zh:"今天天气很好。车站附近有一家小店。我们一起去好吗？", es:"Hoy hace buen tiempo. Hay una tienda pequeña cerca de la estación. ¿Vamos juntos?", fr:"Il fait beau aujourd'hui. Il y a une petite boutique près de la gare. On y va ensemble ?", de:"Heute ist das Wetter schön. In der Nähe des Bahnhofs gibt es ein kleines Geschäft. Wollen wir zusammen hingehen?" } }
];

const raw = [
  [
    ["こんにちは","こんにちは","hello"],["おはようございます","おはようございます","good morning"],["こんばんは","こんばんは","good evening"],["さようなら","さようなら","goodbye"],["ありがとう","ありがとう","thank you"],["すみません","すみません","excuse me"],["はい","はい","yes"],["いいえ","いいえ","no"],["日本","にほん","Japan"],["日本語","にほんご","Japanese language"],["本","ほん","book"],["水","みず","water"],["名前","なまえ","name"],["先生","せんせい","teacher"],["学生","がくせい","student"],["友だち","ともだち","friend"],["一","いち","one"],["二","に","two"],["三","さん","three"]
  ],
  [
    ["私","わたし","I"],["大学生","だいがくせい","university student"],["留学生","りゅうがくせい","international student"],["会社員","かいしゃいん","office worker"],["大学","だいがく","university"],["宿題","しゅくだい","homework"],["電話","でんわ","telephone"],["出身","しゅっしん","hometown"],["専攻","せんこう","major; field of study"],["趣味","しゅみ","hobby"],["仕事","しごと","work; job"],["映画","えいが","movie"],["勉強","べんきょう","study"],["英語","えいご","English language"],["音楽","おんがく","music"],["数学","すうがく","math"],["美術","びじゅつ","art"],["番号","ばんごう","number"],["漫画","まんが","manga"],["ゲーム","げーむ","game"]
  ],
  [
    ["おきる","おきる","to wake up"],["ねる","ねる","to sleep"],["たべる","たべる","to eat"],["みる","みる","to watch; to see"],["いく","いく","to go"],["かえる","かえる","to return home"],["かう","かう","to buy"],["きく","きく","to listen; to ask"],["のむ","のむ","to drink"],["よむ","よむ","to read"],["くる","くる","to come"],["する","する","to do"],["べんきょうする","べんきょうする","to study"],["ごはん","ごはん","meal; cooked rice"],["あさごはん","あさごはん","breakfast"],["ひるごはん","ひるごはん","lunch"],["ばんごはん","ばんごはん","dinner"],["おちゃ","おちゃ","green tea"],["みず","みず","water"],["がっこう","がっこう","school"],["としょかん","としょかん","library"]
  ],
  [
    ["シャワーをあびる","しゃわーをあびる","to take a shower"],["あう","あう","to meet"],["あそぶ","あそぶ","to play"],["およぐ","およぐ","to swim"],["かく","かく","to write"],["つくる","つくる","to make"],["のる","のる","to ride"],["はなす","はなす","to speak"],["はいる","はいる","to enter"],["しゃしんをとる","しゃしんをとる","to take a picture"],["せんたくする","せんたくする","to do laundry"],["そうじする","そうじする","to clean"],["りょうりする","りょうりする","to cook"],["うんどうする","うんどうする","to exercise"],["りょこうする","りょこうする","to travel"],["デートする","でーとする","to go on a date"],["かぞく","かぞく","family"],["おじいさん","おじいさん","grandfather"],["おばあさん","おばあさん","grandmother"],["ひと","ひと","person"],["たべもの","たべもの","food"],["さかな","さかな","fish"],["やさい","やさい","vegetable"],["かんじ","かんじ","kanji character"]
  ],
  [
    ["歌う","うたう","to sing"],["かかる","かかる","to cost; to take time"],["新しい","あたらしい","new"],["古い","ふるい","old"],["大きい","おおきい","big"],["小さい","ちいさい","small"],["高い","たかい","high; expensive"],["安い","やすい","cheap"],["暑い","あつい","hot weather"],["寒い","さむい","cold weather"],["おいしい","おいしい","delicious"],["いい","いい","good"],["かっこいい","かっこいい","cool"],["かわいい","かわいい","cute"],["おもしろい","おもしろい","interesting; funny"],["楽しい","たのしい","fun"],["つまらない","つまらない","boring"],["忙しい","いそがしい","busy"],["やさしい","やさしい","kind; easy"],["難しい","むずかしい","difficult"],["きれい","きれい","pretty; clean"],["静か","しずか","quiet"],["元気","げんき","well; energetic"],["大変","たいへん","tough"],["有名","ゆうめい","famous"],["好き","すき","to like"],["大好き","だいすき","to love"],["お金","おかね","money"],["車","くるま","car"],["電車","でんしゃ","train"],["飛行機","ひこうき","airplane"],["時計","とけい","clock; watch"],["町","まち","town; city"]
  ]
];

export const vocab = raw.map((lesson, index) => lesson.map(([written, reading, meaning], item) => ({ id: `${index}-${item}`, lesson: index, written, reading, meaning })));

export const hiragana = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん".split("");
export const katakana = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン".split("");
// Cross-checked against the supplied lesson 3 and lesson 4 kanji slides.
export const kanji = ["一","二","三","四","五","六","七","八","九","十","月","私","子","人","百","千","万","円","曜","日","火","水","木","金","土","学","生","先","年","大","小"];
export const kanjiLessons = Object.fromEntries(kanji.map((character, index) => [character, index < 14 ? 3 : 4]));

export const trackId = (lesson, number) => `L${String(lesson).padStart(2,"0")}-${String(number).padStart(2,"0")}`;
export function trackCategory(lesson, number) {
  if (lesson === 0 || (lesson === 2 && number >= 16)) return "greetingsKana";
  if (number <= (lesson === 1 || lesson === 3 ? 5 : 4)) return "conversation";
  if (number === (lesson === 1 || lesson === 3 ? 6 : 5)) return "vocabularyAudio";
  if (lesson === 4 && number >= 20) return "languageNote";
  if ((lesson === 1 && number >= 17) || (lesson === 2 && number === 15) || (lesson === 3 && number === 14) || (lesson === 4 && number >= 18)) return "listeningAudio";
  return "activityAudio";
}
export const tracks = trackCounts.flatMap((count, lesson) => Array.from({ length: count }, (_, i) => ({ id: trackId(lesson, i + 1), lesson, category: trackCategory(lesson, i + 1) })));
