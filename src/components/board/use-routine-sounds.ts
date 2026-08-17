"use client";

type RoutineSoundApi = {
  playTap: () => void;
  playTaskComplete: () => void;
  playRoutineComplete: () => void;
  playDayComplete: () => void;
  playSuccess: () => void;
  playError: () => void;
};

type ToneStep = {
  frequency: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  delay?: number;
};

type NoiseBurst = {
  duration: number;
  gain?: number;
  delay?: number;
  frequency?: number;
  q?: number;
};

let sharedAudioContext: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") {
    return null;
  }

  const AudioContextCtor =
    window.AudioContext ??
    // @ts-expect-error - Safari fallback.
    window.webkitAudioContext;

  if (!AudioContextCtor) {
    return null;
  }

  if (!sharedAudioContext) {
    sharedAudioContext = new AudioContextCtor();
  }

  return sharedAudioContext;
}

function scheduleSteps(context: AudioContext, steps: ToneStep[]) {
  const now = context.currentTime;

  for (const step of steps) {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const startAt = now + (step.delay ?? 0);
    const stopAt = startAt + step.duration;

    oscillator.type = step.type ?? "sine";
    oscillator.frequency.setValueAtTime(step.frequency, startAt);
    gainNode.gain.setValueAtTime(0.0001, startAt);
    gainNode.gain.exponentialRampToValueAtTime(step.gain ?? 0.08, startAt + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, stopAt);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(stopAt);
  }
}

function scheduleNoiseBursts(context: AudioContext, bursts: NoiseBurst[]) {
  const now = context.currentTime;

  for (const burst of bursts) {
    const frameCount = Math.ceil(context.sampleRate * burst.duration);
    const buffer = context.createBuffer(1, frameCount, context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let index = 0; index < frameCount; index += 1) {
      data[index] = Math.random() * 2 - 1;
    }

    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gainNode = context.createGain();
    const startAt = now + (burst.delay ?? 0);
    const stopAt = startAt + burst.duration;

    source.buffer = buffer;
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(burst.frequency ?? 1800, startAt);
    filter.Q.setValueAtTime(burst.q ?? 0.8, startAt);
    gainNode.gain.setValueAtTime(0.0001, startAt);
    gainNode.gain.exponentialRampToValueAtTime(burst.gain ?? 0.03, startAt + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, stopAt);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(context.destination);
    source.start(startAt);
    source.stop(stopAt);
  }
}

export function useRoutineSounds(enabled: boolean): RoutineSoundApi {
  const play = (steps: ToneStep[], bursts?: NoiseBurst[]) => {
    if (!enabled) {
      return;
    }

    const context = getAudioContext();

    if (!context) {
      return;
    }

    if (context.state === "suspended") {
      void context.resume();
    }

    scheduleSteps(context, steps);
    if (bursts && bursts.length > 0) {
      scheduleNoiseBursts(context, bursts);
    }
  };

  return {
    playTap: () =>
      play([
        { frequency: 520, duration: 0.08, type: "triangle", gain: 0.05 },
      ]),
    playTaskComplete: () =>
      play([
        { frequency: 660, duration: 0.08, type: "triangle", gain: 0.05 },
        { frequency: 820, duration: 0.11, type: "triangle", gain: 0.06, delay: 0.08 },
      ]),
    playRoutineComplete: () =>
      play([
        { frequency: 523.25, duration: 0.12, type: "triangle", gain: 0.06 },
        { frequency: 659.25, duration: 0.12, type: "triangle", gain: 0.07, delay: 0.09 },
        { frequency: 783.99, duration: 0.14, type: "triangle", gain: 0.07, delay: 0.18 },
        { frequency: 1046.5, duration: 0.2, type: "sine", gain: 0.08, delay: 0.29 },
      ]),
    playDayComplete: () =>
      play(
        [
          { frequency: 523.25, duration: 0.16, type: "triangle", gain: 0.05 },
          { frequency: 659.25, duration: 0.18, type: "triangle", gain: 0.055, delay: 0.08 },
          { frequency: 783.99, duration: 0.2, type: "triangle", gain: 0.06, delay: 0.16 },
          { frequency: 1046.5, duration: 0.26, type: "sine", gain: 0.07, delay: 0.26 },
          { frequency: 1318.51, duration: 0.3, type: "sine", gain: 0.065, delay: 0.42 },
          { frequency: 1567.98, duration: 0.34, type: "triangle", gain: 0.055, delay: 0.54 },
        ],
        [
          { duration: 0.16, delay: 0.14, gain: 0.025, frequency: 2000 },
          { duration: 0.18, delay: 0.38, gain: 0.028, frequency: 1700 },
          { duration: 0.2, delay: 0.64, gain: 0.03, frequency: 2100 },
        ],
      ),
    playSuccess: () =>
      play([
        { frequency: 587.33, duration: 0.08, type: "triangle", gain: 0.05 },
        { frequency: 783.99, duration: 0.1, type: "triangle", gain: 0.06, delay: 0.08 },
        { frequency: 987.77, duration: 0.13, type: "sine", gain: 0.07, delay: 0.18 },
      ]),
    playError: () =>
      play([
        { frequency: 392, duration: 0.08, type: "sawtooth", gain: 0.035 },
        { frequency: 329.63, duration: 0.12, type: "sawtooth", gain: 0.03, delay: 0.07 },
      ]),
  };
}
