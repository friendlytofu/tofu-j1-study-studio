// Original practice examples, written for lessons 0–4. These are not textbook passages.
// English cues are part of the exercise, like the English meanings in Vocabulary.
export const sentencePuzzles = [
  { lesson:0, cue:"Greet someone you are meeting for the first time.", tiles:["はじめまして。","どうぞよろしくお願いします。"], anchors:["はじめまして","どうぞよろしくお願いします"] },
  { lesson:1, cue:"I am a university student.", tiles:["私は","大学生","です。"], anchors:["私","大学生"] },
  { lesson:1, cue:"My hobby is music.", tiles:["趣味は","音楽","です。"], anchors:["趣味","音楽"] },
  { lesson:2, cue:"I eat breakfast.", tiles:["朝ご飯を","食べます。"], anchors:["朝ご飯","食べる"] },
  { lesson:2, cue:"I read a book at the library.", tiles:["図書館で","本を","読みます。"], anchors:["図書館","本","読む"] },
  { lesson:3, cue:"Yesterday I played in the park with my family.", tiles:["昨日、","家族と","公園で","遊びました。"], anchors:["昨日","家族","公園","遊ぶ"] },
  { lesson:3, cue:"My mother makes a salad.", tiles:["母は","サラダを","作ります。"], anchors:["母","サラダ","作る"] },
  { lesson:4, cue:"This bag is new.", tiles:["このかばんは","新しいです。"], anchors:["かばん","新しい"] },
  { lesson:4, cue:"How much is that watch?", tiles:["その時計は","いくらですか。"], anchors:["時計","いくら"] }
].map((puzzle, index) => ({ ...puzzle, id:`sentence-${index}`, target:puzzle.tiles.join("") }));

export const dialogueScenes = [
  { lesson:0, titleKey:"sceneMeeting", opening:"はじめまして。", branches:[
    { reply:"はじめまして。", npc:"どうぞよろしくお願いします。", followups:[
      { reply:"こちらこそ、よろしくお願いします。", npc:"ありがとうございます。" },
      { reply:"よろしくお願いします。", npc:"はい、よろしくお願いします。" }
    ] },
    { reply:"こんにちは。はじめまして。", npc:"こんにちは。どうぞよろしくお願いします。", followups:[
      { reply:"よろしくお願いします。", npc:"よろしくお願いします。" },
      { reply:"こちらこそ、よろしくお願いします。", npc:"ありがとうございます。" }
    ] }
  ] },
  { lesson:1, titleKey:"sceneClassmate", opening:"私は大学生です。", branches:[
    { reply:"私も大学生です。", npc:"そうですか。専攻は何ですか。", followups:[
      { reply:"専攻は数学です。", npc:"私は工学です。" },
      { reply:"専攻は日本語です。", npc:"いいですね。私は工学です。" }
    ] },
    { reply:"私は留学生です。", npc:"そうですか。出身はどこですか。", followups:[
      { reply:"アメリカです。", npc:"私は日本出身です。" },
      { reply:"中国です。", npc:"そうですか。私は日本出身です。" }
    ] }
  ] },
  { lesson:2, titleKey:"sceneCafe", opening:"今日、カフェに行きますか。", branches:[
    { reply:"はい、行きます。", npc:"何時に行きますか。", followups:[
      { reply:"一時に行きます。", npc:"いいですね。一時ですね。" },
      { reply:"午後に行きます。", npc:"わかりました。午後ですね。" }
    ] },
    { reply:"いいえ、今日は家で勉強します。", npc:"そうですか。明日はどうですか。", followups:[
      { reply:"明日は行きます。", npc:"いいですね。明日、行きましょう。" },
      { reply:"明日も勉強します。", npc:"そうですか。また今度。" }
    ] }
  ] },
  { lesson:3, titleKey:"sceneWeekend", opening:"週末、家族と何をしますか。", branches:[
    { reply:"公園で遊びます。", npc:"いいですね。写真をとりますか。", followups:[
      { reply:"はい、写真をとります。", npc:"楽しみですね。" },
      { reply:"いいえ、写真はとりません。", npc:"そうですか。公園はいいですね。" }
    ] },
    { reply:"家で料理します。", npc:"何を作りますか。", followups:[
      { reply:"ピザを作ります。", npc:"いいですね。私もピザが好きです。" },
      { reply:"サラダを作ります。", npc:"野菜はいいですね。" }
    ] }
  ] },
  { lesson:4, titleKey:"sceneShop", opening:"このかばんは二千円です。", branches:[
    { reply:"安いですね。", npc:"はい。新しいかばんです。", followups:[
      { reply:"これにします。", npc:"ありがとうございます。" },
      { reply:"そのかばんも見ます。", npc:"どうぞ。こちらも新しいです。" }
    ] },
    { reply:"高いですね。", npc:"あのかばんは千円です。", followups:[
      { reply:"それにします。", npc:"ありがとうございます。" },
      { reply:"古いですか。", npc:"いいえ、新しいです。" }
    ] }
  ] }
];
