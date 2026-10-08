// Original practice material. English cues are exercise content and stay in English.
// Content words come from the cumulative lesson 0–4 vocabulary bank; these are not textbook passages.
const puzzleRows = [
  // Lesson 0: useful two-part exchanges and expressions.
  [0,"Greet a new person politely.","はじめまして。|どうぞよろしくお願いします。","はじめまして"],
  [0,"Greet someone in the morning, then excuse yourself.","おはようございます。|しつれいします。","おはようございます"],
  [0,"Greet someone in the daytime, then introduce yourself.","こんにちは。|はじめまして。","こんにちは"],
  [0,"Greet someone in the evening, then introduce yourself.","こんばんは。|はじめまして。","こんばんは"],
  [0,"Thank someone politely, then say goodbye.","ありがとうございます。|さようなら。","ありがとうございます"],
  [0,"Apologize politely, then say goodbye.","ごめんなさい。|さようなら。","ごめんなさい"],
  [0,"Excuse yourself, then thank someone.","しつれいします。|ありがとうございます。","しつれいします"],
  [0,"Say you are leaving home; hear the send-off.","いってきます。|いってらっしゃい。","いってきます"],
  [0,"Say you are home; hear the welcome.","ただいま。|おかえりなさい。","ただいま"],
  [0,"Say you are about to eat, then thank your host afterward.","いただきます。|ごちそうさまでした。","いただきます"],
  [0,"Say good night politely, then say goodbye.","おやすみなさい。|さようなら。","おやすみなさい"],
  [0,"Thank a friend, then say see you again.","ありがとう。|じゃ、また。","ありがとう"],
  [0,"Apologize to a friend, then thank them.","ごめん。|ありがとう。","ごめん"],
  [0,"Get someone's attention, then excuse yourself.","あのう、|すみません。","あのう"],
  [0,"Offer something, then hear thanks.","どうぞ。|ありがとうございます。","どうぞ"],
  [0,"Thank someone, then hear 'you're welcome.'","ありがとうございます。|どういたしまして。","どういたしまして"],
  [0,"Congratulate someone politely, then say goodbye.","おめでとうございます。|じゃ、また。","おめでとうございます"],
  [0,"Say see you tomorrow, then say good night.","じゃ、またあした。|おやすみなさい。","じゃ、またあした"],
  // Lesson 1: identity, origin, study, and likes.
  [1,"I am a university student.","私は|大学生|です。","だいがくせい"],
  [1,"My hobby is music.","趣味は|音楽|です。","しゅみ"],
  [1,"I am an international student.","私は|留学生|です。","りゅうがくせい"],
  [1,"My major is engineering.","専攻は|工学|です。","せんこう"],
  [1,"My major is politics.","専攻は|政治|です。","せいじ"],
  [1,"My major is mathematics.","専攻は|数学|です。","すうがく"],
  [1,"I am a first-year student.","私は|一年生|です。","いちねんせい"],
  [1,"My friend is a graduate student.","友達は|大学院生|です。","だいがくいんせい"],
  [1,"I am from America.","私は|アメリカ|出身です。","アメリカ"],
  [1,"My friend is a teacher.","友達は|先生|です。","せんせい"],
  [1,"My hobby is anime.","趣味は|アニメ|です。","アニメ"],
  [1,"I like sports.","私は|スポーツが|好きです。","スポーツ"],
  [1,"I like Japanese.","私は|日本語が|好きです。","にほんご"],
  [1,"My friend likes movies.","友達は|映画が|好きです。","えいが"],
  [1,"My friend is a company employee.","友達は|会社員|です。","かいしゃいん"],
  [1,"I am a second-year student.","私は|二年生|です。","にねんせい"],
  [1,"My hobby is games.","趣味は|ゲーム|です。","ゲーム"],
  [1,"My friend’s major is art.","友達の専攻は|美術|です。","びじゅつ"],
  // Lesson 2: routines, places, and time.
  [2,"I eat breakfast.","朝ご飯を|食べます。","あさごはん"],
  [2,"I read a book at the library.","図書館で|本を|読みます。","としょかん"],
  [2,"I drink coffee in the morning.","朝、|コーヒーを|飲みます。","コーヒー"],
  [2,"I go to school every day.","毎日、|学校に|行きます。","がっこう"],
  [2,"I watch the news at night.","夜、|ニュースを|見ます。","ニュース"],
  [2,"I study in my room.","部屋で|勉強します。","へや"],
  [2,"I eat lunch at the dining hall.","食堂で|昼ご飯を|食べます。","しょくどう"],
  [2,"I drink water after lunch.","昼ご飯のあとで、|水を|飲みます。","みず"],
  [2,"I go to the café on Friday.","金曜日に|カフェに|行きます。","カフェ"],
  [2,"I read a book on the weekend.","週末に|本を|読みます。","しゅうまつ"],
  [2,"I get up at seven o’clock.","七時に|起きます。","おきる"],
  [2,"I go home in the afternoon.","午後に|家に|帰ります。","かえる"],
  [2,"I listen to music every day.","毎日、|音楽を|聞きます。","きく"],
  [2,"I watch television at home.","家で|テレビを|見ます。","テレビ"],
  [2,"Tomorrow I will go to a concert.","明日、|コンサートに|行きます。","コンサート"],
  [2,"I drink tea at the café.","カフェで|お茶を|飲みます。","おちゃ"],
  [2,"I go shopping on Saturday.","土曜日に|買い物に|行きます。","かいもの"],
  [2,"I sleep at night.","夜、|寝ます。","ねる"],
  // Lesson 3: family, past time, food, and activities.
  [3,"Yesterday I played in the park with my family.","昨日、|家族と|公園で|遊びました。","かぞく"],
  [3,"My mother makes a salad.","母は|サラダを|作ります。","サラダ"],
  [3,"My older brother swims in the sea.","兄は|海で|泳ぎます。","うみ"],
  [3,"I met my friend last week.","先週、|友達に|会いました。","せんしゅう"],
  [3,"My younger sister likes cake.","妹は|ケーキが|好きです。","いもうと"],
  [3,"I took a photo in the park.","公園で|写真を|とりました。","しゃしんをとる"],
  [3,"My father cooks fish.","父は|魚を|料理します。","さかな"],
  [3,"I wrote a letter to my grandmother.","祖母に|手紙を|書きました。","てがみ"],
  [3,"My younger brother likes cats.","弟は|猫が|好きです。","ネコ"],
  [3,"We went to the beach together.","一緒に|海に|行きました。","いっしょに"],
  [3,"I ate pizza with my family.","家族と|ピザを|食べました。","ピザ"],
  [3,"My older sister does the laundry.","姉は|洗濯します。","せんたくする"],
  [3,"I cleaned my room yesterday.","昨日、|部屋を|掃除しました。","そうじする"],
  [3,"My parents traveled last month.","両親は|先月、|旅行しました。","りょうしん"],
  [3,"I rode my bicycle to school.","自転車に|乗って|学校に行きました。","じてんしゃ"],
  [3,"I drank cola this morning.","今朝、|コーラを|飲みました。","けさ"],
  [3,"My friend made a cake.","友達は|ケーキを|作りました。","つくる"],
  [3,"I studied kanji alone.","一人で|漢字を|勉強しました。","ひとりで"],
  // Lesson 4: descriptions, prices, and travel.
  [4,"This bag is new.","このかばんは|新しいです。","かばん"],
  [4,"How much is that watch?","その時計は|いくらですか。","とけい"],
  [4,"That hat is cute.","その帽子は|かわいいです。","ぼうし"],
  [4,"This dictionary is old.","この辞書は|古いです。","じしょ"],
  [4,"That T-shirt is cheap.","そのTシャツは|安いです。","Tシャツ／ティーシャツ"],
  [4,"This pencil is small.","この鉛筆は|小さいです。","えんぴつ"],
  [4,"Trains are fun.","電車は|楽しいです。","でんしゃ"],
  [4,"The café is quiet.","そのカフェは|静かです。","しずか（な）"],
  [4,"This city is lively.","この町は|にぎやかです。","にぎやか（な）"],
  [4,"The food is very delicious.","食べ物は|とても|おいしいです。","おいしい"],
  [4,"That ticket is expensive.","そのチケットは|高いです。","チケット"],
  [4,"This book is interesting.","この本は|おもしろいです。","おもしろい"],
  [4,"That game is difficult.","そのゲームは|難しいです。","むずかしい"],
  [4,"I go by bus.","バスで|行きます。","バス"],
  [4,"I go by subway.","地下鉄で|行きます。","ちかてつ"],
  [4,"I walk to school.","学校まで|歩いて|行きます。","あるいて"],
  [4,"This notebook is one hundred yen.","このノートは|百円です。","ノート"],
  [4,"I choose the taxi.","タクシーに|します。","タクシー"]
];
export const sentencePuzzles = puzzleRows.map(([lesson, cue, parts, anchor], index) => {
  const tiles = parts.split("|");
  return { id:`sentence-${index}`, lesson, cue, tiles, anchors:[anchor], target:tiles.join("") };
});

// Each configuration makes one original two-step scene with four possible endings.
// Keep scene titles and spoken lines in Japanese: both are learning content.
function scene(lesson, title, opening, answers) {
  return { lesson, title, opening, branches:answers.map(([reply, npc, a, b]) => ({
    reply, npc, followups:[{reply:a[0],npc:a[1]},{reply:b[0],npc:b[1]}]
  })) };
}
const greet = (title, opening, a, b) => scene(0,title,opening,[
  [a[0],a[1],[a[2],a[3]],[a[4],a[5]]],
  [b[0],b[1],[b[2],b[3]],[b[4],b[5]]]
]);
const intro = (title, opening, answerA, answerB, partnerA, partnerB) => scene(1,title,opening,[
  [answerA,partnerA,["そうですか。","はい、そうです。"],["よろしくお願いします。","こちらこそ、よろしくお願いします。"]],
  [answerB,partnerB,["そうですか。","はい、そうです。"],["よろしくお願いします。","こちらこそ、よろしくお願いします。"]]
]);
const plan = (title, place, time, alternative) => scene(2,title,`明日、${place}に行きますか。`,[
  ["はい、行きます。",`何時に${place}に行きますか。`,[`${time}に行きます。`,`いいですね。${time}ですね。`],["午後に行きます。","わかりました。午後ですね。"]],
  [`いいえ、明日は${alternative}。`,`そうですか。週末はどうですか。`,["週末に行きます。","いいですね。週末に行きましょう。"],["週末も行きません。","そうですか。また今度。"]]
]);
const family = (title, person, activity, other) => scene(3,title,`昨日、${person}は何をしましたか。`,[
  [`${activity}。`,`そうですか。何をしましたか。`,["私は本を読みました。","そうですか。"],["私は友達に会いました。","いいですね。"]],
  [`${other}。`,`そうですか。何をしましたか。`,["私は本を読みました。","そうですか。"],["私は友達に会いました。","いいですね。"]]
]);
const shop = (title, item, price, other, otherPrice) => scene(4,title,`この${item}は${price}円です。`,[
  ["安いですね。",`はい。${other}もあります。`,["これにします。","ありがとうございます。"],[`${other}も見ます。`,`どうぞ。${other}は${otherPrice}円です。`]],
  ["ちょっと高いですね。",`あの${other}は${otherPrice}円です。`,["それにします。","ありがとうございます。"],[`${item}も見ます。`,`どうぞ。${item}は${price}円です。`]]
]);
export const dialogueScenes = [
  greet("朝のあいさつ","おはようございます。",["おはようございます。","今日もよろしくお願いします。","よろしくお願いします。","ありがとうございます。","じゃ、また。","じゃ、また。"],["おはよう。","おはよう。","じゃ、また。","じゃ、また。","いってきます。","いってらっしゃい。"]),
  greet("昼のあいさつ","こんにちは。",["こんにちは。","お元気ですか。","はい、元気です。","よかったです。","じゃ、また。","じゃ、また。"],["こんにちは。はじめまして。","はじめまして。","よろしくお願いします。","こちらこそ。","ありがとうございます。","どういたしまして。"]),
  greet("夜のあいさつ","こんばんは。",["こんばんは。","お元気ですか。","はい、元気です。","よかったです。","おやすみなさい。","おやすみなさい。"],["こんばんは。はじめまして。","はじめまして。","よろしくお願いします。","こちらこそ。","おやすみなさい。","おやすみなさい。"]),
  greet("はじめまして","はじめまして。",["はじめまして。","どうぞよろしくお願いします。","こちらこそ、よろしくお願いします。","ありがとうございます。","よろしくお願いします。","こちらこそ。"],["こんにちは。はじめまして。","こんにちは。よろしくお願いします。","こちらこそ。","ありがとうございます。","じゃ、また。","じゃ、また。"]),
  greet("お礼","ありがとうございます。",["どういたしまして。","じゃ、また。","ありがとうございます。","どういたしまして。","じゃ、また。","じゃ、また。"],["こちらこそ、ありがとうございます。","どういたしまして。","じゃ、また。","じゃ、また。","さようなら。","さようなら。"]),
  greet("帰りのあいさつ","ただいま。",["おかえりなさい。","お元気ですか。","はい、元気です。","よかったです。","ありがとうございます。","どういたしまして。"],["おかえり。","こんばんは。","こんばんは。","お元気ですか。","はい、元気です。","よかったです。"]),
  greet("出かけるとき","いってきます。",["いってらっしゃい。","じゃ、また。","じゃ、また。","さようなら。","ありがとうございます。","どういたしまして。"],["いってらっしゃい。じゃ、また。","じゃ、また。","ありがとうございます。","どういたしまして。","さようなら。","さようなら。"]),
  greet("食事の前","いただきます。",["どうぞ。","おねがいします。","ありがとうございます。","どういたしまして。","ごちそうさまでした。","どういたしまして。"],["いただきます。","どうぞ。","ありがとうございます。","どういたしまして。","ごちそうさまでした。","どういたしまして。"]),
  greet("食事の後","ごちそうさまでした。",["どういたしまして。","お元気ですか。","はい、元気です。","よかったです。","ありがとうございます。","どういたしまして。"],["ありがとうございます。","どういたしまして。","じゃ、また。","じゃ、また。","さようなら。","さようなら。"]),
  greet("お別れ","じゃ、またあした。",["じゃ、またあした。","おやすみなさい。","おやすみなさい。","さようなら。","さようなら。","さようなら。"],["さようなら。","さようなら。","じゃ、また。","じゃ、また。","おやすみなさい。","おやすみなさい。"]),
  intro("専攻について","専攻は何ですか。","工学です。","数学です。","そうですか。私は数学専攻です。","そうですか。私は工学専攻です。"),
  intro("音楽と美術","趣味は何ですか。","音楽です。","美術です。","いいですね。私の趣味は美術です。","いいですね。私の趣味は音楽です。"),
  intro("映画とアニメ","趣味は何ですか。","映画です。","アニメです。","いいですね。私はアニメが好きです。","いいですね。私は映画が好きです。"),
  intro("ゲームとスポーツ","趣味は何ですか。","ゲームです。","スポーツです。","そうですか。私はスポーツが好きです。","そうですか。私はゲームが好きです。"),
  intro("日本語と英語","専攻は何ですか。","日本語です。","英語です。","そうですか。私は英語専攻です。","そうですか。私は日本語専攻です。"),
  intro("仕事について","仕事は何ですか。","会社員です。","先生です。","そうですか。私は先生です。","そうですか。私は会社員です。"),
  intro("出身について","出身はどこですか。","アメリカです。","中国です。","そうですか。私は中国出身です。","そうですか。私はアメリカ出身です。"),
  intro("一年生と二年生","何年生ですか。","一年生です。","二年生です。","そうですか。私は二年生です。","そうですか。私は一年生です。"),
  intro("大学生と大学院生","学生ですか。","はい、大学生です。","はい、大学院生です。","そうですか。私は大学院生です。","そうですか。私は大学生です。"),
  intro("日本と韓国","出身はどこですか。","日本です。","韓国です。","そうですか。私は韓国出身です。","そうですか。私は日本出身です。"),
  plan("カフェへ","カフェ","一時","家で勉強します"),
  plan("図書館へ","図書館","一時","家で本を読みます"),
  plan("学校へ","学校","午前","家で勉強します"),
  plan("食堂へ","食堂","午後","家で昼ご飯を食べます"),
  plan("ジムへ","ジム","午後","家でテレビを見ます"),
  plan("レストランへ","レストラン","午後","家で晩ご飯を食べます"),
  plan("コンサートへ","コンサート","午後","家で音楽を聞きます"),
  plan("パーティーへ","パーティー","午後","家で勉強します"),
  plan("買い物へ","買い物","午前","家で本を読みます"),
  plan("大学へ","大学","午前","家で勉強します"),
  family("母の一日","母","サラダを作りました","ピザを作りました"),
  family("父の一日","父","魚を料理しました","肉を料理しました"),
  family("兄の一日","兄","公園で遊びました","海で泳ぎました"),
  family("姉の一日","姉","写真をとりました","手紙を書きました"),
  family("弟の一日","弟","ピザを食べました","ケーキを食べました"),
  family("妹の一日","妹","公園で遊びました","海で泳ぎました"),
  family("友達の一日","友達","旅行しました","公園で遊びました"),
  family("両親の一日","両親","料理しました","旅行しました"),
  family("家族の一日","家族","公園で遊びました","旅行しました"),
  family("祖母の一日","祖母","手紙を書きました","写真をとりました"),
  shop("かばんを選ぶ","かばん","二千","バッグ","千"),
  shop("時計を選ぶ","時計","三千","かばん","千"),
  shop("辞書を選ぶ","辞書","二千","ノート","百"),
  shop("帽子を選ぶ","帽子","千","Tシャツ","二千"),
  shop("ノートを選ぶ","ノート","百","鉛筆","百"),
  shop("鉛筆を選ぶ","鉛筆","百","ノート","百"),
  shop("Tシャツを選ぶ","Tシャツ","二千","帽子","千"),
  shop("チケットを選ぶ","チケット","三千","きっぷ","千"),
  shop("バッグを選ぶ","バッグ","二千","かばん","千"),
  shop("きっぷを選ぶ","きっぷ","千","チケット","三千")
];
