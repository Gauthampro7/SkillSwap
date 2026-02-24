import { useEffect, useRef, useState } from 'react';

/** Ambient pad via Web Audio API - starts only after user gesture (easter egg click) */
function useAmbientAudio(enabled) {
  const nodesRef = useRef([]);

  useEffect(() => {
    if (!enabled) {
      nodesRef.current.forEach((n) => {
        try {
          if (n.gain) n.gain.exponentialRampToValueAtTime(0.001, (n.context?.currentTime ?? 0) + 0.5);
          if (n.osc) n.osc.stop?.();
        } catch {}
      });
      nodesRef.current = [];
      return;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.055, ctx.currentTime + 1.5);
    gainNode.connect(ctx.destination);

    const freqs = [110, 164.81, 220];
    const oscillators = freqs.map((freq) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.connect(gainNode);
      osc.start(ctx.currentTime);
      return osc;
    });

    nodesRef.current = [{ context: ctx, gain: gainNode, osc: oscillators[0] }, ...oscillators.slice(1).map((o) => ({ osc: o }))];

    return () => {
      try {
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        setTimeout(() => {
          oscillators.forEach((o) => o.stop?.());
          ctx.close?.();
        }, 500);
      } catch {}
      nodesRef.current = [];
    };
  }, [enabled]);
}

const SPARKLES = ['✨', '🌟', '💫', '⭐', '✦', '✧', '•'];
const NUM_FLOATING = 12;

export function UltraModeEffects({ enabled }) {
  useAmbientAudio(enabled);
  const [floats, setFloats] = useState([]);
  const idRef = useRef(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setFloats((prev) => {
        const next = [
          ...prev.slice(-(NUM_FLOATING - 1)),
          {
            id: idRef.current++,
            x: Math.random() * 100,
            emoji: SPARKLES[Math.floor(Math.random() * SPARKLES.length)],
            delay: Math.random() * 0.5,
          },
        ];
        return next;
      });
    }, 800);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      {/* Aurora rainbow overlay */}
      <div className="ultra-aurora" aria-hidden="true" />
      {/* Original gradient */}
      <div className="ultra-gradient-overlay" aria-hidden="true" />
      {/* Scanlines */}
      <div className="ultra-scanlines" aria-hidden="true" />

      {/* Dots + stars particles */}
      <div className="ultra-particles" aria-hidden="true">
        {Array.from({ length: 32 }).map((_, i) => (
          <div
            key={`p-${i}`}
            className={i % 4 === 0 ? 'ultra-particle ultra-particle-star' : 'ultra-particle'}
            style={{
              '--x': 2 + (i * 3) % 96,
              '--y': 5 + (i * 5) % 90,
              '--delay': (i * 0.12) % 2.5,
              '--duration': 3 + (i % 4),
            }}
          />
        ))}
      </div>

      {/* Floating sparkles */}
      {floats.map((f) => (
        <div
          key={f.id}
          className="ultra-sparkle"
          style={{
            left: `${f.x}vw`,
            bottom: '10%',
            animationDelay: `${f.delay}s`,
          }}
        >
          {f.emoji}
        </div>
      ))}
    </>
  );
}
