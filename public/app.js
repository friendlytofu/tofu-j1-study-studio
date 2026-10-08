import { trackCounts, tracks, readings, vocab, hiragana, katakana, kanji, kanjiLessons } from "./data.js";
import { t } from "./i18n.js";
import { buildChasePool, initialChase, ninjaPace, advanceChase } from "./chase.js";
import { ChaseAudio } from "./chase-audio.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const knownTracks = new Set(tracks.map(({ id }) => id));
const state = {
  language: safeGet("jss-language") || "en", theme: safeGet("jss-theme") || "day", volume: Math.min(3, Math.max(0, Number(safeGet("jss-volume-level") ?? 2) || 0)),
  view: "read", readLesson: 0, vocabLesson: 0, script: "hiragana", character: "あ",
  track: "L00-01", audioFiles: new Map(), transcripts: {}, publicAudio: {}, segmentA: null, segmentB: null,
  dictLessons: new Set([0]), matchLessons: new Set([0]), promptMode: "ja", answerScript: "written", question: null, answered: false,
  matchItems: [], matchSelected: null, matchDone: new Set(), strokeSvg: null,
  role: "reader", sharedMaterials: [], libraryError: false
};
const audio = $("#track-audio");
let toastTimer;
let strokeRequest = 0;
const chase = { active: false, finished: false, level: "normal", ninja: initialChase.ninja, thief: initialChase.thief, pool: [], word: null, prefix: "", furthest: 0, strokes: [], frame: 0, lastTime: 0, outcome: "", showHint: true, musicEnabled: true };
const chaseAudio = new ChaseAudio();
const volumeValues = [0, .2, .5, 1];
let clickContext;
const tourSteps = [
  { target:"#volume-levels", key:"tourSound" }, { target:"#theme-toggle", key:"tourTheme" },
  { target:"#language", key:"tourLanguage" }, { target:"#fullscreen-toggle", key:"tourFullscreen" },
  { target:'.nav-tab[data-view="read"]', key:"tourRead", view:"read" },
  { target:'.nav-tab[data-view="write"]', key:"tourWrite", view:"write" },
  { target:'.nav-tab[data-view="vocab"]', key:"tourVocab", view:"vocab" },
  { target:'.nav-tab[data-view="dictation"]', key:"tourDictation", view:"dictation" },
  { target:'.nav-tab[data-view="match"]', key:"tourMatch", view:"match" },
  { target:'.nav-tab[data-view="chase"]', key:"tourChase", view:"chase" },
  { target:"#chase-hint-toggle", key:"tourChaseHint", view:"chase" },
  { target:"#chase-music-toggle", key:"tourChaseMusic", view:"chase" },
  { target:'.nav-tab[data-view="library"]', key:"tourLibrary", view:"library" }
];
let tourIndex = -1;

function safeGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
function safeSet(key, value) { try { localStorage.setItem(key, value); } catch { /* session-only */ } }
function translate(key) { return t(state.language, key); }
function setVolume(level) {
  state.volume = level;
  safeSet("jss-volume-level", String(level));
  audio.volume = volumeValues[level];
  chaseAudio.setVolume(volumeValues[level]);
  $$("#volume-levels button").forEach((button) => {
    const active = Number(button.dataset.volume) === level;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
    button.setAttribute("aria-label", translate(["soundMute","soundLow","soundMedium","soundHigh"][Number(button.dataset.volume)]));
    button.title = button.getAttribute("aria-label");
  });
}
function clickSound() {
  if (!state.volume) return;
  try {
    clickContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = clickContext.createOscillator();
    const gain = clickContext.createGain();
    const now = clickContext.currentTime;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(720, now);
    oscillator.frequency.exponentialRampToValueAtTime(480, now + .035);
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(.018 * volumeValues[state.volume], now + .005);
    gain.gain.exponentialRampToValueAtTime(.0001, now + .045);
    oscillator.connect(gain).connect(clickContext.destination);
    oscillator.start(now); oscillator.stop(now + .05);
  } catch { /* Audio feedback is optional when unavailable. */ }
}
function placeTourSpotlight() {
  if (tourIndex < 0) return;
  const target = $(tourSteps[tourIndex].target);
  const rect = target.getBoundingClientRect();
  const spot = $("#tour-spotlight");
  Object.assign(spot.style, {left:`${Math.max(0,rect.left-7)}px`,top:`${Math.max(0,rect.top-7)}px`,width:`${rect.width+14}px`,height:`${rect.height+14}px`});
}
function showTourStep(index) {
  tourIndex = index;
  const step = tourSteps[index];
  if (step.view) showView(step.view);
  const target = $(step.target);
  target.scrollIntoView({block:"center",inline:"nearest",behavior:"instant"});
  $("#tour-count").textContent = `${index+1} / ${tourSteps.length}`;
  $("#tour-title").textContent = translate("tourTitle");
  $("#tour-body").textContent = translate(step.key);
  $("#tour-back").hidden = index === 0;
  $("#tour-next").textContent = translate(index === tourSteps.length-1 ? "tourFinish" : "tourNext");
  requestAnimationFrame(placeTourSpotlight);
  $("#tour-next").focus();
}
function endTour() {
  tourIndex = -1;
  $("#tour-layer").hidden = true;
  safeSet("jss-tour-seen-v2", "yes");
  $("#tour-open").focus();
}
function startTour() {
  $("#tour-layer").hidden = false;
  showTourStep(0);
}
function lessonLabel(index) {
  if (state.language === "ja") return `第${index}課`;
  if (state.language === "zh") return `第${index}课`;
  return `${translate("lesson")} ${index}`;
}
function toast(message) {
  const box = $("#toast"); box.textContent = message; box.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => box.classList.remove("show"), 2800);
}
function shuffle(items) { const result = [...items]; for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; } return result; }
function setTheme(theme) {
  state.theme = theme; document.documentElement.dataset.theme = theme;
  $("#theme-symbol").textContent = theme === "night" ? "☀" : "☾";
  safeSet("jss-theme", theme);
  $("meta[name='theme-color']").content = theme === "night" ? "#111b22" : "#f5f0e7";
}
function applyLanguage() {
  document.documentElement.lang = state.language;
  document.title = translate("siteTitle");
  $$("[data-i18n]").forEach((element) => { element.textContent = translate(element.dataset.i18n); });
  $(".brand").setAttribute("aria-label", translate("siteTitle"));
  for (const [selector, key] of [[".control-dock","controls"],["#language","interfaceLanguage"],[".section-nav","sections"],["#read-lessons","chooseLessonLabel"],["#vocab-lessons","chooseLessonLabel"],["#script-tabs","chooseScript"],["#draw-canvas","drawingCanvas"],["#seek","audioPosition"]]) {
    $(selector).setAttribute("aria-label", translate(key));
  }
  $("#vocab-search").placeholder = translate("search");
  $("#vocab-search").setAttribute("aria-label", translate("search"));
  $("#theme-toggle").setAttribute("aria-label", translate("theme"));
  $("#theme-toggle").title = translate("theme");
  $("#fullscreen-toggle").setAttribute("aria-label", document.fullscreenElement ? translate("exitFullscreen") : translate("fullscreen"));
  $("#fullscreen-toggle").title = document.fullscreenElement ? translate("exitFullscreen") : translate("fullscreen");
  $("#track-play").setAttribute("aria-label", translate("trackPlay"));
  $("#dict-replay").setAttribute("aria-label", translate("replay"));
  setVolume(state.volume);
  $("#tour-open").setAttribute("aria-label", translate("tourOpen"));
  $("#tour-open").title = translate("tourOpen");
  if (tourIndex >= 0) showTourStep(tourIndex);
  renderLessonPills(); renderReading(); renderTrackList(); renderPlayer(); renderCharacterGrid(); renderVocab();
  renderLessonChecks(); renderQuestion(false); renderMatchBoard(false); renderChase(); renderUploadTracks(); renderLibrary();
}
function showView(view) {
  if (!["read","write","vocab","dictation","match","chase","library"].includes(view)) return;
  if (state.view === "chase" && view !== "chase" && chase.active) stopChase("chasePaused");
  state.view = view;
  $$(".nav-tab").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  $(`.nav-tab[data-view="${view}"]`).scrollIntoView({ block: "nearest", inline: "nearest" });
  $$(".view").forEach((element) => element.classList.toggle("active", element.id === `${view}-view`));
  history.replaceState(null, "", `#${view}`);
  if (view === "write") { resizeCanvas(); loadStrokeArt(); }
}
function renderLessonPills() {
  for (const [containerId, active, action] of [["read-lessons", state.readLesson, (index) => { state.readLesson = index; renderReading(); selectTrack(tracks.find((track) => track.lesson === index).id); }], ["vocab-lessons", state.vocabLesson, (index) => { state.vocabLesson = index; renderVocab(); }]]) {
    const container = $(`#${containerId}`); container.replaceChildren();
    trackCounts.forEach((_, index) => {
      const button = document.createElement("button"); button.type = "button"; button.textContent = lessonLabel(index);
      button.classList.toggle("active", index === active); button.setAttribute("aria-pressed", String(index === active));
      button.addEventListener("click", () => { action(index); renderLessonPills(); }); container.append(button);
    });
  }
}
function renderReading() {
  const item = readings[state.readLesson];
  $("#reading-title").textContent = item.title;
  $("#reading-text").textContent = item.text;
  $("#reading-translation").textContent = state.language === "ja" ? "" : item.translations[state.language] || item.translations.en;
  $("#reading-translation").lang = state.language;
}
function formatTime(value) { if (!Number.isFinite(value)) return "0:00"; const n = Math.max(0, Math.floor(value)); return `${Math.floor(n / 60)}:${String(n % 60).padStart(2,"0")}`; }
function renderTrackList() {
  const list = $("#track-list"); list.replaceChildren();
  const lessonTracks = tracks.filter(({ lesson }) => lesson === state.readLesson);
  const loaded = lessonTracks.filter(({ id }) => state.audioFiles.has(id) || state.publicAudio[id]).length;
  $("#track-count").textContent = `${lessonTracks.length} ${translate("tracks")} · ${loaded} ${translate("loaded")}`;
  for (const { id } of lessonTracks) {
    const button = document.createElement("button"); button.type = "button"; button.className = "track-item";
    button.classList.toggle("active", id === state.track);
    button.classList.toggle("available", state.audioFiles.has(id) || Boolean(state.publicAudio[id]));
    button.setAttribute("aria-pressed", String(id === state.track));
    const label = document.createElement("span"); label.textContent = id;
    const dot = document.createElement("span"); dot.className = "availability"; dot.setAttribute("aria-hidden", "true");
    button.append(label,dot); button.addEventListener("click", () => selectTrack(id)); list.append(button);
  }
}
function selectTrack(id) {
  if (!knownTracks.has(id)) return;
  audio.pause(); state.track = id; state.segmentA = null; state.segmentB = null;
  const localUrl = state.audioFiles.get(id);
  const publicUrl = state.publicAudio[id];
  if (localUrl || publicUrl) { audio.src = localUrl || publicUrl; audio.load(); }
  else { audio.removeAttribute("src"); audio.load(); }
  renderTrackList(); renderPlayer();
}
function renderPlayer() {
  const id = state.track;
  $("#selected-track-title").textContent = id;
  const category = tracks.find((track) => track.id === id)?.category;
  $("#selected-track-note").textContent = `${translate(category)} · ${state.audioFiles.has(id) || state.publicAudio[id] ? translate("trackReady") : translate("noTrackData")}`;
  $("#transcript-text").textContent = state.transcripts[id]?.text || translate("noTranscript");
  $("#transcript-text").lang = state.transcripts[id] ? "ja" : state.language;
  $("#track-play").textContent = audio.paused ? "▶" : "Ⅱ";
  $("#current-time").textContent = formatTime(audio.currentTime);
  $("#duration").textContent = formatTime(audio.duration);
  $("#seek").value = Number.isFinite(audio.duration) && audio.duration > 0 ? Math.round(audio.currentTime / audio.duration * 1000) : 0;
  $("#segment-label").textContent = state.segmentA === null && state.segmentB === null ? "" : `${translate("segment")}: ${state.segmentA === null ? "—" : formatTime(state.segmentA)}–${state.segmentB === null ? "—" : formatTime(state.segmentB)}`;
}
function toggleTrackAudio() {
  if (!audio.src) { toast(translate("noAudio")); return; }
  if (audio.paused) {
    if (state.segmentA !== null && (audio.currentTime < state.segmentA || (state.segmentB !== null && audio.currentTime >= state.segmentB))) audio.currentTime = state.segmentA;
    audio.play().catch(() => toast(translate("noAudio")));
  } else audio.pause();
}
async function importAudio(files) {
  let count = 0;
  for (const file of files) {
    const id = file.name.replace(/\.mp3$/i, "").toUpperCase();
    if (!knownTracks.has(id) || !/\.mp3$/i.test(file.name)) continue;
    if (state.audioFiles.has(id)) URL.revokeObjectURL(state.audioFiles.get(id));
    state.audioFiles.set(id, URL.createObjectURL(file)); count++;
  }
  if (!count) { toast(translate("invalidAudio")); return; }
  selectTrack(state.track); toast(`${count} ${translate("audioAdded")}`);
}
async function importTranscripts(file) {
  try {
    const parsed = JSON.parse(await file.text());
    const count = mergeContent(parsed);
    if (!count) throw new Error("empty");
    renderPlayer(); renderVocab(); newQuestion(false); newMatchBoard(); toast(`${count} ${translate("textAdded")}`);
  } catch { toast(translate("invalidText")); }
}
function mergeContent(parsed) {
  if (!parsed || typeof parsed !== "object") return 0;
  let count = 0;
  if (parsed.transcripts && typeof parsed.transcripts === "object") {
    for (const [id, value] of Object.entries(parsed.transcripts)) {
      if (!knownTracks.has(id) || typeof value?.text !== "string" || !value.text.trim()) continue;
      state.transcripts[id] = { text: value.text.trim(), bookPage: value.bookPage ?? null }; count++;
    }
  }
  if (parsed.vocabulary && typeof parsed.vocabulary === "object") {
    for (let lesson = 0; lesson <= 4; lesson++) {
      const incoming = parsed.vocabulary[String(lesson)]; if (!Array.isArray(incoming)) continue;
      const clean = incoming.filter((item) => [item?.written,item?.reading,item?.meaning].every((part) => typeof part === "string" && part.trim())).map((item, index) => ({ id:`${lesson}-${index}`, lesson, written:item.written.trim(), reading:item.reading.trim(), meaning:item.meaning.trim(), practice:item.practice !== false }));
      if (clean.length) { vocab[lesson] = clean; count += clean.length; }
    }
  }
  if (parsed.audio && typeof parsed.audio === "object") {
    for (const [id, path] of Object.entries(parsed.audio)) {
      if (knownTracks.has(id) && typeof path === "string" && /^media\/[A-Za-z0-9_-]+\.mp3$/i.test(path)) { state.publicAudio[id] = path; count++; }
    }
  }
  return count;
}
async function loadPublicContent() {
  try {
    const response = await fetch("./content.json"); if (!response.ok) return;
    const parsed = await response.json();
    mergeContent(parsed); selectTrack(state.track); renderVocab(); newQuestion(false); newMatchBoard();
  } catch { /* A missing optional content pack leaves the study tools usable. */ }
}
function speech(text, lang) {
  if (!("speechSynthesis" in window)) { toast(translate("noVoice")); return; }
  speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = lang;
  utterance.rate = lang === "ja-JP" ? .84 : .93; utterance.volume = volumeValues[state.volume];
  const voice = speechSynthesis.getVoices().find((candidate) => candidate.lang.toLowerCase().startsWith(lang.slice(0,2).toLowerCase()));
  if (voice) utterance.voice = voice;
  speechSynthesis.speak(utterance);
}
function toKatakana(text) { return [...text].map((char) => { const n = char.codePointAt(0); return n >= 0x3041 && n <= 0x3096 ? String.fromCodePoint(n + 0x60) : char; }).join(""); }
function answerText(item) { return state.answerScript === "hiragana" ? item.reading : state.answerScript === "katakana" ? toKatakana(item.reading) : item.written; }
function characterSet() { return state.script === "hiragana" ? hiragana : state.script === "katakana" ? katakana : kanji; }
function renderCharacterGrid() {
  const items = characterSet(); $("#script-count").textContent = state.script === "kanji" ? `${items.length} ${translate("characterCount")} · ${translate("kanjiScope")}` : `${items.length} ${translate("characterCount")}`;
  const grid = $("#character-grid"); grid.replaceChildren();
  for (const character of items) {
    const button = document.createElement("button"); button.type = "button"; button.textContent = character; button.classList.toggle("active", state.character === character); button.setAttribute("aria-pressed", String(state.character === character));
    button.addEventListener("click", () => { state.character = character; renderCharacterGrid(); renderPractice(); }); grid.append(button);
  }
  $("#selected-character").textContent = state.character;
  $("#selected-character-info").textContent = state.script === "kanji" ? lessonLabel(kanjiLessons[state.character]) : "";
}
function renderPractice() {
  $("#trace-ghost").textContent = state.character; clearDrawing(); loadStrokeArt();
}
function resizeCanvas() {
  const canvas = $("#draw-canvas"); const rect = canvas.getBoundingClientRect(); if (!rect.width) return;
  const ratio = window.devicePixelRatio || 1; canvas.width = Math.round(rect.width * ratio); canvas.height = Math.round(rect.height * ratio);
  const context = canvas.getContext("2d"); context.scale(ratio,ratio); context.lineWidth = 4; context.lineCap = "round"; context.lineJoin = "round";
}
function clearDrawing() { const canvas = $("#draw-canvas"); canvas.getContext("2d").clearRect(0,0,canvas.width,canvas.height); }
function initDrawing() {
  const canvas = $("#draw-canvas"); let drawing = false;
  const point = (event) => { const r = canvas.getBoundingClientRect(); return [event.clientX-r.left,event.clientY-r.top]; };
  canvas.addEventListener("pointerdown", (event) => { drawing = true; canvas.setPointerCapture(event.pointerId); const [x,y] = point(event); const ctx = canvas.getContext("2d"); ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+.01,y+.01); ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--red").trim(); ctx.stroke(); });
  canvas.addEventListener("pointermove", (event) => { if (!drawing) return; const [x,y] = point(event); const ctx = canvas.getContext("2d"); ctx.lineTo(x,y); ctx.stroke(); });
  for (const name of ["pointerup","pointercancel","lostpointercapture"]) canvas.addEventListener(name, () => { drawing = false; });
}
async function loadStrokeArt() {
  if (state.view !== "write") return;
  const requestNumber = ++strokeRequest; const character = state.character; const script = state.script;
  const target = $("#stroke-art"); target.textContent = character;
  $("#stroke-status").textContent = translate("strokeLoading");
  try {
    const url = script === "kanji" ? `https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg@master/kanji/${character.codePointAt(0).toString(16).padStart(5,"0")}.svg` : `https://cdn.jsdelivr.net/gh/zhengkyl/strokesvg@main/dist/${script}/${encodeURIComponent(character)}.svg`;
    const response = await fetch(url); if (!response.ok) throw new Error("fetch");
    const doc = new DOMParser().parseFromString(await response.text(), "image/svg+xml");
    if (doc.querySelector("parsererror")) throw new Error("svg");
    if (requestNumber !== strokeRequest) return;
    if (script === "kanji") {
      const paths = [...doc.querySelectorAll('g[id^="kvg:StrokePaths_"] path')].map((element) => element.getAttribute("d")).filter(Boolean);
      if (!paths.length) throw new Error("paths");
      const svg = document.createElementNS("http://www.w3.org/2000/svg","svg"); svg.setAttribute("viewBox","0 0 109 109"); svg.setAttribute("aria-hidden","true");
      for (const d of paths) { const ghost = document.createElementNS(svg.namespaceURI,"path"); ghost.setAttribute("d",d); ghost.setAttribute("fill","none"); ghost.setAttribute("stroke","var(--line)"); ghost.setAttribute("stroke-width","3"); ghost.setAttribute("stroke-linecap","round"); ghost.setAttribute("stroke-linejoin","round"); svg.append(ghost); }
      for (const d of paths) { const ink = document.createElementNS(svg.namespaceURI,"path"); ink.setAttribute("d",d); ink.setAttribute("fill","none"); ink.setAttribute("stroke","var(--red)"); ink.setAttribute("stroke-width","3"); ink.setAttribute("stroke-linecap","round"); ink.setAttribute("stroke-linejoin","round"); ink.classList.add("animated-stroke"); svg.append(ink); }
      target.replaceChildren(svg);
    } else {
      const svg = doc.documentElement;
      for (const bad of [...svg.querySelectorAll("script,foreignObject,iframe")]) bad.remove();
      if (!svg.querySelector('g[data-strokesvg="strokes"]')) throw new Error("kana strokes");
      const copy = document.importNode(svg,true); copy.removeAttribute("onload"); copy.setAttribute("aria-hidden","true");
      target.replaceChildren(copy);
    }
    state.strokeSvg = target.querySelector("svg"); $("#stroke-status").textContent = translate("strokeReady");
  } catch { if (requestNumber === strokeRequest) { state.strokeSvg = null; target.textContent = character; $("#stroke-status").textContent = translate("strokeUnavailable"); } }
}
function animateStrokes() {
  if (!state.strokeSvg) { loadStrokeArt(); return; }
  const paths = state.script === "kanji" ? [...state.strokeSvg.querySelectorAll(".animated-stroke")] : [...state.strokeSvg.querySelectorAll('g[data-strokesvg="strokes"] path')];
  paths.forEach((path, index) => {
    try {
      const length = path.getTotalLength() + 2;
      path.style.animation = "none";
      path.style.strokeDasharray = String(length);
      path.style.strokeDashoffset = String(length);
      void path.getBoundingClientRect();
      path.style.animation = `trace-stroke 650ms ease-in-out ${index * 620}ms forwards`;
    } catch { /* leave the static guide visible */ }
  });
}
function renderVocab() {
  const search = $("#vocab-search").value.trim().toLocaleLowerCase();
  const items = vocab[state.vocabLesson].filter((item) => `${item.written} ${item.reading} ${item.meaning}`.toLocaleLowerCase().includes(search));
  $("#vocab-count").textContent = `${lessonLabel(state.vocabLesson)} · ${vocab[state.vocabLesson].length} ${translate("words")}`;
  const list = $("#vocab-list"); list.replaceChildren();
  if (!items.length) { const p = document.createElement("p"); p.className="empty-message"; p.textContent=translate("noWords"); list.append(p); return; }
  for (const item of items) {
    const card = document.createElement("article"); card.className = "vocab-entry";
    const word = document.createElement("strong"); word.lang="ja"; word.textContent=item.written;
    const reading = document.createElement("span"); reading.className="reading"; reading.lang="ja"; reading.textContent=item.reading;
    const meaning = document.createElement("span"); meaning.className="meaning"; meaning.lang="en"; meaning.textContent=item.meaning;
    const play = document.createElement("button"); play.type="button"; play.textContent="◖))"; play.setAttribute("aria-label",`${translate("replay")}: ${item.reading}`); play.addEventListener("click",()=>speech(item.reading,"ja-JP"));
    card.append(word,reading,meaning,play); list.append(card);
  }
}
function renderLessonChecks() {
  for (const [id, selected, onChange] of [["dict-lessons",state.dictLessons,()=>newQuestion()],["match-lessons",state.matchLessons,()=>newMatchBoard()]]) {
    const container = $(`#${id}`); container.replaceChildren();
    trackCounts.forEach((_,index)=>{const label=document.createElement("label");const check=document.createElement("input");check.type="checkbox";check.checked=selected.has(index);check.addEventListener("change",()=>{if(check.checked)selected.add(index);else selected.delete(index);onChange();});label.append(check,document.createTextNode(lessonLabel(index)));container.append(label);});
  }
}
function selectedWords(lessons) {
  const keys = new Set(); return [...lessons].flatMap((lesson)=>vocab[lesson]).filter((item)=>{if (item.practice === false) return false; const key=`${item.reading}|${item.meaning}`;if(keys.has(key))return false;keys.add(key);return true;});
}
function newQuestion(play = true) {
  const pool = selectedWords(state.dictLessons); state.answered=false;
  if (pool.length < 4) {state.question=null;renderQuestion(false);toast(translate("chooseLesson"));return;}
  const last = state.question?.correct?.id;
  const candidates = pool.filter((item)=>item.id!==last);
  const correct = candidates[Math.floor(Math.random()*candidates.length)];
  const usedText = new Set([answerText(correct)]); const usedMeaning = new Set([correct.meaning]);
  const distractors = shuffle(pool).filter((item)=>{if(item.id===correct.id||usedText.has(answerText(item))||(state.promptMode==="en"&&usedMeaning.has(item.meaning)))return false;usedText.add(answerText(item));usedMeaning.add(item.meaning);return true;}).slice(0,3);
  state.question={correct,choices:shuffle([correct,...distractors])}; renderQuestion(true); if (play) playPrompt();
}
function playPrompt() {if(!state.question)return;const item=state.question.correct;speech(state.promptMode==="ja"?item.reading:item.meaning,state.promptMode==="ja"?"ja-JP":"en-US");}
function renderQuestion(resetFeedback) {
  const question = state.question; $("#dict-lesson-badge").textContent = question ? lessonLabel(question.correct.lesson) : "";
  const choices = $("#dict-choices"); choices.replaceChildren();
  if (!question) { if(resetFeedback)$("#dict-feedback").textContent=translate("chooseLesson"); return; }
  for (const item of question.choices) {
    const button=document.createElement("button");button.type="button";button.lang="ja";button.textContent=answerText(item);button.disabled=state.answered;
    if(state.answered&&item.id===question.correct.id)button.classList.add("correct");
    button.addEventListener("click",()=>{if(state.answered)return;if(item.id===question.correct.id){state.answered=true;$("#dict-feedback").textContent=translate("correct");renderQuestion(false);}else{button.classList.add("wrong");$("#dict-feedback").textContent=translate("tryAgain");setTimeout(()=>button.classList.remove("wrong"),650);}});
    choices.append(button);
  }
  if(resetFeedback)$("#dict-feedback").textContent="";
}
function newMatchBoard() {
  const pool=selectedWords(state.matchLessons);state.matchSelected=null;state.matchDone=new Set();
  if(pool.length<5){state.matchItems=[];renderMatchBoard(true);toast(translate("chooseLesson"));return;}
  const used=new Set();state.matchItems=shuffle(pool).filter((item)=>{if(used.has(item.meaning))return false;used.add(item.meaning);return true;}).slice(0,5);
  renderMatchBoard(true);
}
function renderMatchBoard(clearFeedback) {
  const left=$("#match-japanese"),right=$("#match-english");left.replaceChildren();right.replaceChildren();
  for(const item of state.matchItems){const button=document.createElement("button");button.type="button";button.className="jp";button.lang="ja";button.textContent=item.written;button.classList.toggle("selected",state.matchSelected===item.id);button.classList.toggle("matched",state.matchDone.has(item.id));button.disabled=state.matchDone.has(item.id);button.addEventListener("click",()=>{state.matchSelected=item.id;renderMatchBoard(false);});left.append(button);}
  const meanings=shuffleStable(state.matchItems);
  for(const item of meanings){const button=document.createElement("button");button.type="button";button.lang="en";button.textContent=item.meaning;button.classList.toggle("matched",state.matchDone.has(item.id));button.disabled=state.matchDone.has(item.id);button.addEventListener("click",()=>{if(!state.matchSelected){$("#match-feedback").textContent=translate("pickJapanese");return;}if(state.matchSelected===item.id){state.matchDone.add(item.id);state.matchSelected=null;$("#match-feedback").textContent=state.matchDone.size===state.matchItems.length?translate("allMatched"):translate("matched");renderMatchBoard(false);}else{$("#match-feedback").textContent=translate("tryAgain");button.classList.add("wrong");setTimeout(()=>button.classList.remove("wrong"),650);}});right.append(button);}
  if(clearFeedback)$("#match-feedback").textContent="";
}
let matchOrder=[];
function shuffleStable(items){const ids=items.map(({id})=>id).sort().join("|");if(matchOrder.key!==ids){matchOrder=shuffle(items);matchOrder.key=ids;}return matchOrder;}

function renderChase() {
  const scene = $("#chase-scene");
  scene.dataset.running = String(chase.active);
  scene.dataset.outcome = chase.outcome;
  scene.setAttribute("aria-label", translate("chaseSceneLabel"));
  $("#chase-ninja").style.left = `${chase.ninja}%`;
  $("#chase-thief").style.left = `${chase.thief}%`;
  $("#chase-pace").textContent = `${translate("chasePace")}: ${ninjaPace(chase.strokes, performance.now()).toFixed(1)}`;
  $("#chase-word").textContent = chase.word?.written || "—";
  $("#chase-reading").textContent = chase.word?.hiragana || "";
  $("#chase-meaning").textContent = chase.word ? `${lessonLabel(chase.word.lesson)} · ${chase.word.meaning}` : "";
  $("#chase-romaji").textContent = chase.word?.romaji[0] || "";
  $("#chase-hint").hidden = !chase.showHint;
  $("#chase-hint-toggle").textContent = translate(chase.showHint ? "chaseHintHide" : "chaseHintShow");
  $("#chase-hint-toggle").setAttribute("aria-expanded", String(chase.showHint));
  $("#chase-music-toggle").textContent = `♫ ${translate(chase.musicEnabled ? "chaseMusicOn" : "chaseMusicOff")}`;
  $("#chase-music-toggle").setAttribute("aria-pressed", String(chase.musicEnabled));
  $("#chase-result").hidden = !chase.outcome;
  $("#chase-result-title").textContent = chase.outcome === "caught" ? "おめでとう！" : chase.outcome === "escaped" ? "ざんねん！" : "";
  $("#chase-result-detail").textContent = chase.outcome === "caught" ? translate("chaseWinNote") : chase.outcome === "escaped" ? translate("chaseLoseNote") : "";
  $("#chase-typed").textContent = chase.prefix || "—";
  $("#chase-input").disabled = !chase.active;
  $("#chase-start").textContent = translate(chase.active || chase.finished ? "chaseRestart" : "chaseStart");
  for (const button of $$("#chase-levels button")) {
    button.classList.toggle("active", button.dataset.level === chase.level);
    button.setAttribute("aria-pressed", String(button.dataset.level === chase.level));
    button.disabled = chase.active;
  }
  if (!$("#chase-feedback").textContent) $("#chase-feedback").textContent = translate("chaseReady");
}
function stopChase(message) {
  chase.active = false;
  chase.finished = message !== "chasePaused";
  chase.outcome = message === "chaseCaught" ? "caught" : message === "chaseEscaped" ? "escaped" : "";
  cancelAnimationFrame(chase.frame);
  chaseAudio.stop();
  if (chase.outcome) chaseAudio.outcome(chase.outcome === "caught");
  $("#chase-feedback").textContent = translate(message);
  renderChase();
}
function tickChase(now) {
  if (!chase.active) return;
  const seconds = chase.lastTime ? Math.min(0.1, Math.max(0, (now - chase.lastTime) / 1000)) : 0;
  chase.lastTime = now;
  chase.strokes = chase.strokes.filter((time) => time >= now - 4000);
  const pace = ninjaPace(chase.strokes, now);
  const next = advanceChase(chase, seconds, pace, chase.level);
  chase.ninja = next.ninja;
  chase.thief = next.thief;
  $("#chase-ninja").style.left = `${chase.ninja}%`;
  $("#chase-thief").style.left = `${chase.thief}%`;
  $("#chase-pace").textContent = `${translate("chasePace")}: ${pace.toFixed(1)}`;
  if (next.outcome) stopChase(next.outcome === "caught" ? "chaseCaught" : "chaseEscaped");
  else chase.frame = requestAnimationFrame(tickChase);
}
function startChase() {
  cancelAnimationFrame(chase.frame);
  chaseAudio.stop();
  chase.pool = buildChasePool(vocab);
  if (!chase.pool.length) { toast(translate("chaseNoWords")); return; }
  chase.active = true;
  chase.finished = false;
  chase.ninja = initialChase.ninja;
  chase.thief = initialChase.thief;
  chase.word = chase.pool[Math.floor(Math.random() * chase.pool.length)];
  chase.prefix = "";
  chase.furthest = 0;
  chase.strokes = [];
  chase.lastTime = 0;
  chase.outcome = "";
  $("#chase-input").value = "";
  $("#chase-input").classList.remove("invalid");
  $("#chase-feedback").textContent = translate("chaseRunning");
  renderChase();
  $("#chase-input").focus();
  if (chase.musicEnabled) chaseAudio.start();
  chase.frame = requestAnimationFrame(tickChase);
}
function handleChaseInput(event) {
  if (!chase.active || event?.isComposing) return;
  const input = $("#chase-input");
  const value = input.value.normalize("NFKC").toLowerCase();
  input.value = value;
  $("#chase-typed").textContent = value || "—";
  if (!/^[a-z]*$/.test(value) || !chase.word.romaji.some((variant) => variant.startsWith(value))) {
    input.classList.add("invalid");
    $("#chase-feedback").textContent = translate("chaseMistake");
    return;
  }
  input.classList.remove("invalid");
  $("#chase-feedback").textContent = translate("chaseRunning");
  if (value.length > chase.furthest) {
    const now = performance.now();
    for (let index = chase.furthest; index < value.length; index++) chase.strokes.push(now);
    chase.furthest = value.length;
  }
  chase.prefix = value;
  if (chase.word.romaji.includes(value)) {
    const choices = chase.pool.filter((word) => word !== chase.word);
    if (!choices.length) { stopChase("chaseNoWords"); return; }
    chase.word = choices[Math.floor(Math.random() * choices.length)];
    chase.prefix = "";
    chase.furthest = 0;
    input.value = "";
    $("#chase-typed").textContent = "—";
  }
  renderChase();
}

function renderUploadTracks() {
  const lesson = Number($("#upload-lesson").value);
  const select = $("#upload-track");
  const previous = select.value;
  select.replaceChildren();
  const none = document.createElement("option"); none.value = ""; none.textContent = translate("noTrack"); select.append(none);
  for (const track of tracks.filter((item) => item.lesson === lesson)) {
    const option = document.createElement("option"); option.value = track.id; option.textContent = track.id; select.append(option);
  }
  if ([...select.options].some((option) => option.value === previous)) select.value = previous;
}
function renderLibrary() {
  const list = $("#library-list"); list.replaceChildren();
  if (state.libraryError) { const p = document.createElement("p"); p.className = "empty-message"; p.textContent = translate("libraryUnavailable"); list.append(p); return; }
  const lesson = $("#library-lesson").value;
  const items = state.sharedMaterials.filter((item) => lesson === "all" || item.lesson === Number(lesson));
  if (!items.length) { const p = document.createElement("p"); p.className = "empty-message"; p.textContent = translate("libraryEmpty"); list.append(p); return; }
  for (const item of items) {
    const card = document.createElement("article"); card.className = "library-item";
    const title = document.createElement("strong"); title.textContent = item.title;
    const meta = document.createElement("small"); meta.textContent = `${lessonLabel(item.lesson)} · ${item.trackId || item.type.toUpperCase()}`;
    const actions = document.createElement("div"); actions.className = "library-actions";
    if (item.type === "mp3" && item.trackId && knownTracks.has(item.trackId)) {
      const button = document.createElement("button"); button.type = "button"; button.textContent = translate("libraryPlay");
      button.addEventListener("click", () => { state.readLesson = item.lesson; renderLessonPills(); selectTrack(item.trackId); showView("read"); toggleTrackAudio(); });
      actions.append(button);
    } else {
      const link = document.createElement("a"); link.href = `/api/materials/file?id=${encodeURIComponent(item.id)}`; link.target = "_blank"; link.rel = "noopener noreferrer"; link.textContent = translate("libraryOpen"); actions.append(link);
    }
    card.append(title, meta, actions); list.append(card);
  }
}
async function loadSharedMaterials() {
  try {
    const response = await fetch("/api/materials");
    if (!response.ok) throw new Error("materials");
    const data = await response.json();
    const rawItems = Array.isArray(data.items) ? data.items : [];
    const newest = new Map();
    for (const item of rawItems) {
      const key = (item.type === "txt" || item.type === "md") && item.trackId ? `${item.type}:${item.trackId}:${item.name}` : item.id;
      if (!newest.has(key) || item.uploaded > newest.get(key).uploaded) newest.set(key, item);
    }
    state.sharedMaterials = [...newest.values()];
    state.libraryError = false;
    let vocabularyChanged = false;
    for (const item of [...state.sharedMaterials].sort((a, b) => a.uploaded.localeCompare(b.uploaded))) {
      const url = `/api/materials/file?id=${encodeURIComponent(item.id)}`;
      if (item.type === "txt" && !item.trackId && item.name === "tofu-vocabulary-lessons-0-4.txt") {
        try {
          const packResponse = await fetch(url);
          if (packResponse.ok) {
            const parsed = JSON.parse((await packResponse.text()).slice(0, 500000));
            vocabularyChanged = mergeContent({ vocabulary: parsed.vocabulary }) > 0 || vocabularyChanged;
          }
        } catch { /* Keep the library usable if a private vocabulary pack is malformed. */ }
      }
      if (!knownTracks.has(item.trackId)) continue;
      if (item.type === "mp3") state.publicAudio[item.trackId] = url;
      if (item.type === "txt" || item.type === "md") {
        try {
          const textResponse = await fetch(url);
          if (textResponse.ok) state.transcripts[item.trackId] = { text: (await textResponse.text()).slice(0, 100000) };
        } catch { /* The file remains available in the library. */ }
      }
    }
    selectTrack(state.track); renderLibrary();
    if (vocabularyChanged) { renderVocab(); newQuestion(false); newMatchBoard(); }
  } catch { state.libraryError = true; renderLibrary(); }
}
async function loadSession() {
  try {
    const response = await fetch("/api/session");
    if (!response.ok) { location.replace("/"); return; }
    const data = await response.json();
    state.role = data.role;
    $("#admin-upload").hidden = data.role !== "admin";
    $("#admin-bulk-upload").hidden = data.role !== "admin";
  } catch { /* Leave owner controls hidden if the session cannot be read. */ }
}
async function uploadSharedMaterial(event) {
  event.preventDefault();
  const form = $("#admin-upload");
  const button = form.querySelector("button[type='submit']");
  const status = $("#upload-status");
  button.disabled = true; status.textContent = translate("uploading");
  try {
    const response = await fetch("/api/materials", { method: "POST", body: new FormData(form) });
    if (!response.ok) throw new Error((await response.json()).error);
    status.textContent = translate("uploadDone"); form.reset(); renderUploadTracks(); await loadSharedMaterials();
  } catch { status.textContent = translate("uploadFailed"); }
  finally { button.disabled = false; }
}

async function uploadNumberedAudio(event) {
  event.preventDefault();
  const form = $("#admin-bulk-upload");
  const files = [...form.querySelector("input[name='files']").files];
  const status = $("#bulk-status");
  const button = form.querySelector("button[type='submit']");
  const selected = new Set();
  const items = [];
  for (const file of files) {
    const match = /^(L0[0-4]-\d{2})\.mp3$/i.exec(file.name);
    const id = match?.[1].toUpperCase();
    if (!id || !knownTracks.has(id) || selected.has(id) || !file.size || file.size > 50 * 1024 * 1024) {
      status.textContent = `${translate("bulkInvalid")} ${file.name}`;
      return;
    }
    selected.add(id);
    items.push({ id, file, lesson: Number(id.slice(1, 3)) });
  }
  if (!items.length) return;
  button.disabled = true;
  try {
    const response = await fetch("/api/materials");
    if (!response.ok) throw new Error("Could not inspect existing files");
    const data = await response.json();
    const existing = new Set((data.items || []).filter((item) => item.type === "mp3").map((item) => item.trackId));
    const pending = items.filter((item) => !existing.has(item.id));
    let uploaded = 0;
    for (const item of pending) {
      status.textContent = `${translate("bulkUploading")} ${uploaded + 1}/${pending.length} · ${item.id}`;
      const body = new FormData();
      body.set("title", item.id);
      body.set("lesson", String(item.lesson));
      body.set("trackId", item.id);
      body.set("file", item.file);
      const result = await fetch("/api/materials", { method: "POST", body });
      if (!result.ok) throw new Error(item.id);
      uploaded++;
    }
    status.textContent = `${translate("bulkDone")} ${uploaded} · ${translate("bulkSkipped")} ${items.length - uploaded}`;
    form.reset();
    await loadSharedMaterials();
  } catch (error) {
    status.textContent = `${translate("bulkFailed")} ${error.message || ""}`;
  } finally { button.disabled = false; }
}

function bindEvents(){
  $$(".nav-tab").forEach((button)=>button.addEventListener("click",()=>showView(button.dataset.view)));
  $$("#volume-levels button").forEach((button) => button.addEventListener("click", () => setVolume(Number(button.dataset.volume))));
  document.addEventListener("click", (event) => {
    if (event.target.closest("button, a, select, input[type=checkbox]")) clickSound();
  });
  $("#tour-open").addEventListener("click", startTour);
  $("#tour-skip").addEventListener("click", endTour);
  $("#tour-back").addEventListener("click", () => showTourStep(Math.max(0, tourIndex - 1)));
  $("#tour-next").addEventListener("click", () => tourIndex === tourSteps.length - 1 ? endTour() : showTourStep(tourIndex + 1));
  document.addEventListener("keydown", (event) => {
    if (tourIndex < 0) return;
    if (event.key === "Escape") { endTour(); return; }
    if (event.key !== "Tab") return;
    const controls = $$("#tour-layer button:not([hidden])");
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  window.addEventListener("scroll", placeTourSpotlight, {passive:true});
  window.addEventListener("resize", placeTourSpotlight);
  $("#theme-toggle").addEventListener("click",()=>setTheme(state.theme==="day"?"night":"day"));
  $("#language").addEventListener("change",(event)=>{state.language=event.target.value;safeSet("jss-language",state.language);applyLanguage();});
  $("#fullscreen-toggle").addEventListener("click",async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast(translate("fullscreen"));}});
  document.addEventListener("fullscreenchange",()=>{const label=document.fullscreenElement?translate("exitFullscreen"):translate("fullscreen");$("#fullscreen-toggle").setAttribute("aria-label",label);$("#fullscreen-toggle").title=label;});
  $("#speak-reading").addEventListener("click",()=>speech(readings[state.readLesson].text,"ja-JP"));
  $("#stop-reading").addEventListener("click",()=>window.speechSynthesis?.cancel());
  $("#audio-files").addEventListener("change",async(event)=>{await importAudio(event.target.files);event.target.value="";});
  $("#transcript-file").addEventListener("change",async(event)=>{if(event.target.files[0])await importTranscripts(event.target.files[0]);event.target.value="";});
  $("#track-play").addEventListener("click",toggleTrackAudio);
  audio.addEventListener("loadedmetadata",renderPlayer);audio.addEventListener("timeupdate",()=>{if(state.segmentB!==null&&audio.currentTime>=state.segmentB){if($("#loop-segment").checked){audio.currentTime=state.segmentA??0;audio.play().catch(()=>{});}else audio.pause();}renderPlayer();});
  audio.addEventListener("play",renderPlayer);audio.addEventListener("pause",renderPlayer);
  audio.addEventListener("ended",()=>{if($("#loop-segment").checked){audio.currentTime=state.segmentA??0;audio.play().catch(()=>{});}renderPlayer();});
  $("#seek").addEventListener("input",(event)=>{if(Number.isFinite(audio.duration))audio.currentTime=Number(event.target.value)/1000*audio.duration;});
  $("#set-a").addEventListener("click",()=>{state.segmentA=audio.currentTime;if(state.segmentB!==null&&state.segmentB<=state.segmentA)state.segmentB=null;renderPlayer();});
  $("#set-b").addEventListener("click",()=>{if(audio.currentTime>(state.segmentA??0))state.segmentB=audio.currentTime;renderPlayer();});
  $("#clear-segment").addEventListener("click",()=>{state.segmentA=null;state.segmentB=null;$("#loop-segment").checked=false;renderPlayer();});
  $$("#script-tabs button").forEach((button)=>button.addEventListener("click",()=>{state.script=button.dataset.script;state.character=characterSet()[0];$$("#script-tabs button").forEach((b)=>b.classList.toggle("active",b===button));renderCharacterGrid();renderPractice();}));
  $("#animate-strokes").addEventListener("click",animateStrokes);$("#clear-drawing").addEventListener("click",clearDrawing);
  $("#vocab-search").addEventListener("input",renderVocab);
  $$("#prompt-modes button").forEach((button)=>button.addEventListener("click",()=>{state.promptMode=button.dataset.mode;$$("#prompt-modes button").forEach((b)=>b.classList.toggle("active",b===button));newQuestion();}));
  $$("#answer-scripts button").forEach((button)=>button.addEventListener("click",()=>{state.answerScript=button.dataset.answer;$$("#answer-scripts button").forEach((b)=>b.classList.toggle("active",b===button));renderQuestion(false);}));
  $("#dict-replay").addEventListener("click",playPrompt);$("#dict-next").addEventListener("click",newQuestion);$("#new-match").addEventListener("click",newMatchBoard);
  $$("#chase-levels button").forEach((button) => button.addEventListener("click", () => { if (chase.active) return; chase.level = button.dataset.level; renderChase(); }));
  $("#chase-hint-toggle").addEventListener("click", () => { chase.showHint = !chase.showHint; renderChase(); });
  $("#chase-music-toggle").addEventListener("click", () => { chase.musicEnabled = !chase.musicEnabled; if (chase.active && chase.musicEnabled) chaseAudio.start(); else chaseAudio.stop(); renderChase(); });
  $("#chase-start").addEventListener("click", startChase);
  $("#chase-input").addEventListener("input", handleChaseInput);
  $("#chase-input").addEventListener("compositionend", handleChaseInput);
  $("#chase-input").addEventListener("paste", (event) => event.preventDefault());
  $("#chase-input").addEventListener("drop", (event) => event.preventDefault());
  document.addEventListener("visibilitychange", () => { if (document.hidden && chase.active) stopChase("chasePaused"); });
  $("#library-lesson").addEventListener("change", renderLibrary);
  $("#library-refresh").addEventListener("click", loadSharedMaterials);
  $("#upload-lesson").addEventListener("change", renderUploadTracks);
  $("#admin-upload").addEventListener("submit", uploadSharedMaterial);
  $("#admin-bulk-upload").addEventListener("submit", uploadNumberedAudio);
  $("#admin-upload input[name='file']").addEventListener("change", (event) => {
    const file = event.target.files[0]; if (!file) return;
    const title = $("#admin-upload input[name='title']");
    if (!title.value) title.value = file.name.replace(/\.[^.]+$/, "");
    const id = file.name.replace(/\.[^.]+$/, "").toUpperCase();
    if (knownTracks.has(id)) { $("#upload-lesson").value = String(tracks.find((track) => track.id === id).lesson); renderUploadTracks(); $("#upload-track").value = id; }
  });
  $("#sign-out").addEventListener("click", async () => { await fetch("/api/logout", { method: "POST" }); location.replace("/"); });
  window.addEventListener("resize",()=>{if(state.view==="write")resizeCanvas();});
  window.addEventListener("beforeunload",()=>{for(const url of state.audioFiles.values())URL.revokeObjectURL(url);});
  initDrawing();
}
async function init(){if(!["en","ja","zh","es","fr","de"].includes(state.language))state.language="en";setTheme(state.theme==="night"?"night":"day");$("#language").value=state.language;bindEvents();applyLanguage();selectTrack(state.track);newQuestion(false);newMatchBoard();showView(location.hash.slice(1)||"read");await loadSession();await loadPublicContent();await loadSharedMaterials();if(!safeGet("jss-tour-seen-v2"))startTour();}
init();
