import { useEffect, useRef } from 'react';

/** Ambient pad via Web Audio API - starts only after user gesture (easter egg click) */
function useAmbientAudio(enabled) {
  const ctxRef = useRef(null);
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
    ctxRef.current = ctx;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.055, ctx.currentTime + 1.5);
    gainNode.connect(ctx.destination);

    // Soft ambient chord: A2, E3, A3 (sine, very low volume)
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

export function UltraModeEffects({ enabled }) {
  useAmbientAudio(enabled);

  if (!enabled) return null;

  return (
    <>
      <div className="ultra-gradient-overlay" aria-hidden="true" />
      <div className="ultra-particles" aria-hidden="true">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="ultra-particle"
            style={{
              '--i': i,
              '--x': 5 + (i * 4) % 90,
              '--y': 10 + (i * 7) % 80,
              '--delay': (i * 0.15) % 3,
              '--duration': 4 + (i % 3),
            }}
          />
        ))}
      </div>
    </>
  );
}
