"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type FeedbackKind = "tap" | "selection" | "success" | "blocked" | "paymentReceived";

type FeedbackContextType = {
  isReducedMotion: boolean;
  triggerFeedback: (kind: FeedbackKind) => void;
  tap: () => void;
  selection: () => void;
  success: () => void;
  blocked: () => void;
  paymentReceived: () => void;
};

type ToneStep = {
  delayMs: number;
  durationMs: number;
  frequency: number;
  endFrequency?: number;
  gain: number;
  type: OscillatorType;
};

type FeedbackPattern = {
  vibration: number | number[];
  minIntervalMs: number;
  tones: ToneStep[];
};

type ExtendedWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

const FEEDBACK_PATTERNS: Record<FeedbackKind, FeedbackPattern> = {
  tap: {
    vibration: 8,
    minIntervalMs: 48,
    tones: [
      {
        delayMs: 0,
        durationMs: 34,
        frequency: 420,
        endFrequency: 360,
        gain: 0.012,
        type: "triangle",
      },
    ],
  },
  selection: {
    vibration: 10,
    minIntervalMs: 72,
    tones: [
      {
        delayMs: 0,
        durationMs: 44,
        frequency: 520,
        endFrequency: 620,
        gain: 0.014,
        type: "sine",
      },
    ],
  },
  success: {
    vibration: [14, 18, 24],
    minIntervalMs: 120,
    tones: [
      {
        delayMs: 0,
        durationMs: 56,
        frequency: 560,
        endFrequency: 680,
        gain: 0.016,
        type: "sine",
      },
      {
        delayMs: 78,
        durationMs: 78,
        frequency: 760,
        endFrequency: 920,
        gain: 0.018,
        type: "sine",
      },
    ],
  },
  blocked: {
    vibration: [18, 26, 18],
    minIntervalMs: 120,
    tones: [
      {
        delayMs: 0,
        durationMs: 70,
        frequency: 280,
        endFrequency: 220,
        gain: 0.016,
        type: "triangle",
      },
      {
        delayMs: 84,
        durationMs: 82,
        frequency: 220,
        endFrequency: 180,
        gain: 0.018,
        type: "triangle",
      },
    ],
  },
  paymentReceived: {
    vibration: [14, 100, 24],
    minIntervalMs: 500,
    tones: [
      {
        delayMs: 0,
        durationMs: 80,
        frequency: 440,
        endFrequency: 440,
        gain: 0.015,
        type: "sine",
      },
      {
        delayMs: 150,
        durationMs: 80,
        frequency: 660,
        endFrequency: 660,
        gain: 0.015,
        type: "sine",
      },
      {
        delayMs: 300,
        durationMs: 120,
        frequency: 880,
        endFrequency: 1100,
        gain: 0.02,
        type: "sine",
      },
    ],
  },
};

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

function scheduleTone(
  context: AudioContext,
  startAt: number,
  step: ToneStep
) {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = step.type;
  oscillator.frequency.setValueAtTime(step.frequency, startAt);

  if (step.endFrequency && step.endFrequency !== step.frequency) {
    oscillator.frequency.exponentialRampToValueAtTime(
      step.endFrequency,
      startAt + step.durationMs / 1000
    );
  }

  gainNode.gain.setValueAtTime(0.0001, startAt);
  gainNode.gain.linearRampToValueAtTime(step.gain, startAt + 0.012);
  gainNode.gain.exponentialRampToValueAtTime(
    0.0001,
    startAt + step.durationMs / 1000
  );

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + step.durationMs / 1000 + 0.02);
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const reducedMotionRef = useRef(false);
  const lastTriggerRef = useRef<Record<FeedbackKind, number>>({
    tap: 0,
    selection: 0,
    success: 0,
    blocked: 0,
    paymentReceived: 0,
  });

  const ensureAudioContext = useCallback(async () => {
    if (typeof window === "undefined") {
      return null;
    }

    const AudioContextConstructor =
      window.AudioContext ?? (window as ExtendedWindow).webkitAudioContext;

    if (!AudioContextConstructor) {
      return null;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextConstructor();
    }

    if (audioContextRef.current.state === "suspended") {
      try {
        await audioContextRef.current.resume();
      } catch {
        return null;
      }
    }

    return audioContextRef.current;
  }, []);

  const primeAudio = useCallback(() => {
    void ensureAudioContext();
  }, [ensureAudioContext]);

  const triggerFeedback = useCallback((kind: FeedbackKind) => {
    if (typeof window === "undefined" || document.visibilityState !== "visible") {
      return;
    }

    const pattern = FEEDBACK_PATTERNS[kind];
    const now = performance.now();

    if (now - lastTriggerRef.current[kind] < pattern.minIntervalMs) {
      return;
    }

    lastTriggerRef.current[kind] = now;

    if (!reducedMotionRef.current && "vibrate" in navigator) {
      navigator.vibrate(pattern.vibration);
    }

    void ensureAudioContext().then((context) => {
      if (!context) {
        return;
      }

      const startAt = context.currentTime + 0.008;

      for (const tone of pattern.tones) {
        scheduleTone(context, startAt + tone.delayMs / 1000, tone);
      }
    });
  }, [ensureAudioContext]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncReducedMotion = () => {
      reducedMotionRef.current = mediaQuery.matches;
      setIsReducedMotion(mediaQuery.matches);
    };

    syncReducedMotion();
    mediaQuery.addEventListener("change", syncReducedMotion);
    window.addEventListener("pointerdown", primeAudio, { passive: true });
    window.addEventListener("keydown", primeAudio);

    return () => {
      mediaQuery.removeEventListener("change", syncReducedMotion);
      window.removeEventListener("pointerdown", primeAudio);
      window.removeEventListener("keydown", primeAudio);
      void audioContextRef.current?.close();
      audioContextRef.current = null;
    };
  }, [primeAudio]);

  const value = useMemo<FeedbackContextType>(
    () => ({
      isReducedMotion,
      triggerFeedback,
      tap: () => triggerFeedback("tap"),
      selection: () => triggerFeedback("selection"),
      success: () => triggerFeedback("success"),
      blocked: () => triggerFeedback("blocked"),
      paymentReceived: () => triggerFeedback("paymentReceived"),
    }),
    [isReducedMotion, triggerFeedback]
  );

  return (
    <FeedbackContext.Provider value={value}>
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);

  if (!context) {
    throw new Error("useFeedback must be used within a FeedbackProvider");
  }

  return context;
}
