const SOUND_KEY = "nf-admin-sound";

let ctx: AudioContext | null = null;
let unlocked = false;

export function soundRemembered(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) === "1";
  } catch {
    return false;
  }
}

export function rememberSound(on: boolean): void {
  try {
    if (on) localStorage.setItem(SOUND_KEY, "1");
    else localStorage.removeItem(SOUND_KEY);
  } catch {
    /* private mode */
  }
}

/** True after a click in this page has started the audio context. */
export function audioUnlocked(): boolean {
  return unlocked && !!ctx;
}

export function armAudio(): boolean {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return false;
  ctx = ctx ?? new Ctx();
  if (ctx.state === "suspended") void ctx.resume();
  unlocked = true;
  return true;
}

export function chime(): void {
  if (!ctx || !unlocked) return;
  if (ctx.state === "suspended") void ctx.resume();
  const start = ctx.currentTime;
  [880, 1318].forEach((freq, index) => {
    const osc = ctx!.createOscillator();
    const gain = ctx!.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx!.destination);
    const at = start + index * 0.16;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.2, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.32);
    osc.start(at);
    osc.stop(at + 0.34);
  });
}
