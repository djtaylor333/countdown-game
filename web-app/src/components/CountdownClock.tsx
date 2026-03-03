'use client';

import { useEffect, useRef } from 'react';

interface Props {
  totalSeconds: number;
  remaining: number;
  size?: number;
}

export default function CountdownClock({ totalSeconds, remaining, size = 120 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const fraction = totalSeconds > 0 ? remaining / totalSeconds : 0;
  const isUrgent = remaining <= 10 && remaining > 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const r = (size / 2) - 8;
    const lineW = Math.max(4, size / 18);

    ctx.clearRect(0, 0, size, size);

    // Background ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = lineW;
    ctx.stroke();

    // Progress arc
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + Math.PI * 2 * fraction;
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.strokeStyle = isUrgent ? '#ef4444' : '#f6c90e';
    ctx.lineWidth = lineW;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Centre text
    ctx.fillStyle = isUrgent ? '#ef4444' : '#ffffff';
    ctx.font = `700 ${size * 0.32}px Orbitron, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(remaining), cx, cy);
  }, [remaining, fraction, isUrgent, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      aria-label={`${remaining} seconds remaining`}
    />
  );
}
