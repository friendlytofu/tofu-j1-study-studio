// A short original pentatonic chase loop synthesized in the browser.
// No recording is downloaded or included in the repository.
const melody = [74, null, 77, 79, 81, 79, 77, null, 74, 72, 69, 72, 74, null, 69, 72];
const noteFrequency = (midi) => 440 * 2 ** ((midi - 69) / 12);

export class ChaseAudio {
  constructor() {
    this.context = null;
    this.master = null;
    this.timer = null;
    this.step = 0;
    this.level = 0;
  }

  ensureContext() {
    if (this.context) return true;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return false;
    try {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = this.level * .11;
      this.master.connect(this.context.destination);
      return true;
    } catch { return false; }
  }

  setVolume(level) {
    this.level = level;
    if (this.master) this.master.gain.setTargetAtTime(level * .11, this.context.currentTime, .035);
  }

  pluck(midi, when, duration = .42, strength = .45) {
    if (!this.context || !this.master) return;
    const voice = this.context.createOscillator();
    const envelope = this.context.createGain();
    voice.type = "triangle";
    voice.frequency.value = noteFrequency(midi);
    envelope.gain.setValueAtTime(.0001, when);
    envelope.gain.exponentialRampToValueAtTime(strength, when + .012);
    envelope.gain.exponentialRampToValueAtTime(.0001, when + duration);
    voice.connect(envelope).connect(this.master);
    voice.start(when);
    voice.stop(when + duration + .01);
  }

  drum(when) {
    const voice = this.context.createOscillator();
    const envelope = this.context.createGain();
    voice.type = "sine";
    voice.frequency.setValueAtTime(145, when);
    voice.frequency.exponentialRampToValueAtTime(58, when + .12);
    envelope.gain.setValueAtTime(.28, when);
    envelope.gain.exponentialRampToValueAtTime(.0001, when + .18);
    voice.connect(envelope).connect(this.master);
    voice.start(when);
    voice.stop(when + .19);
  }

  beat() {
    if (!this.context || !this.timer) return;
    const when = this.context.currentTime + .01;
    const note = melody[this.step % melody.length];
    if (note !== null) this.pluck(note, when);
    if (this.step % 4 === 0) this.drum(when);
    if (this.step % 8 === 0) this.pluck(50, when, .9, .23);
    this.step++;
  }

  start() {
    if (this.timer || !this.ensureContext()) return;
    this.context.resume().catch(() => {});
    this.step = 0;
    this.timer = setInterval(() => this.beat(), 310);
    this.beat();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  outcome(won) {
    if (!this.ensureContext() || !this.level) return;
    this.context.resume().catch(() => {});
    const now = this.context.currentTime + .02;
    const notes = won ? [74, 77, 81, 86] : [74, 72, 69, 62];
    notes.forEach((midi, index) => this.pluck(midi, now + index * .17, .55, .6));
  }
}
