import React, { useMemo, useRef, useState } from 'react';
import { PaintSide } from '../types/crm';
import { Point2D, dist } from '../utils/flashingDrawingEngine';

interface Props {
  points: Point2D[];
  paintSide: PaintSide;
  onPaintSideChange: (side: PaintSide) => void;
  rotation: { yaw: number; pitch: number };
  onRotationChange: (rotation: { yaw: number; pitch: number }) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

/** Read-only solid folded-metal preview. Geometry is extruded from the saved 2D profile. */
export const FlashingProfile3D: React.FC<Props> = ({
  points, paintSide, onPaintSideChange, rotation, onRotationChange, zoom, onZoomChange
}) => {
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  const scene = useMemo(() => {
    if (points.length < 2) return null;
    const yaw = rotation.yaw;
    const pitch = rotation.pitch;
    const depth = Math.max(20, Math.min(70, points.reduce((sum, p, i) => i ? sum + dist(points[i - 1], p) : sum, 0) * 0.09));
    const project = (p: { x: number; y: number; z: number }) => ({
      x: (p.x * Math.cos(yaw) - p.z * Math.sin(yaw)),
      y: (p.x * Math.sin(yaw) * Math.sin(pitch) + p.y * Math.cos(pitch) - p.z * Math.cos(yaw) * Math.sin(pitch))
    });
    const origin = points[0];
    const base = points.map(p => ({ x: p.x - origin.x, y: p.y - origin.y, z: 0 }));
    const back = base.map(p => ({ ...p, z: depth }));
    const projectedBase = base.map(project);
    const projectedBack = back.map(project);
    const all = [...projectedBase, ...projectedBack];
    const minX = Math.min(...all.map(p => p.x)), maxX = Math.max(...all.map(p => p.x));
    const minY = Math.min(...all.map(p => p.y)), maxY = Math.max(...all.map(p => p.y));
    const span = Math.max(1, maxX - minX, maxY - minY);
    const scale = 300 / span * zoom;
    const map = (p: { x: number; y: number }) => ({ x: 250 + (p.x - (minX + maxX) / 2) * scale, y: 190 + (p.y - (minY + maxY) / 2) * scale });
    return { base: projectedBase.map(map), back: projectedBack.map(map), depth };
  }, [points, rotation, zoom]);
  const pointsAttr = (arr: { x: number; y: number }[]) => arr.map(p => `${p.x},${p.y}`).join(' ');
  const startDrag = (e: React.PointerEvent<SVGSVGElement>) => {
    last.current = { x: e.clientX, y: e.clientY };
    setDrag(last.current);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const moveDrag = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drag || !last.current) return;
    const dx = e.clientX - last.current.x, dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    onRotationChange({ yaw: rotation.yaw + dx * 0.009, pitch: Math.max(-1.2, Math.min(1.2, rotation.pitch + dy * 0.007)) });
  };
  return <div className="absolute inset-0 bg-[#080d15] flex flex-col">
    <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/90 p-1.5 text-xs">
      <span className="px-1.5 text-slate-400">Painted face</span>
      <button onClick={() => onPaintSideChange('outside')} className={`rounded px-2 py-1 ${paintSide === 'outside' ? 'bg-red-700 text-white' : 'text-slate-400'}`}>Outside</button>
      <button onClick={() => onPaintSideChange('inside')} className={`rounded px-2 py-1 ${paintSide === 'inside' ? 'bg-red-700 text-white' : 'text-slate-400'}`}>Inside</button>
    </div>
    <svg viewBox="0 0 500 380" className="h-full w-full touch-none" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={() => { setDrag(null); last.current = null; }} onPointerCancel={() => { setDrag(null); last.current = null; }}
      onWheel={e => { e.preventDefault(); e.stopPropagation(); onZoomChange(Math.max(0.35, Math.min(4, zoom * (e.deltaY < 0 ? 1.12 : 0.89)))); }}>
      <defs><linearGradient id="flashing-metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#cbd5e1"/><stop offset="50%" stopColor="#64748b"/><stop offset="100%" stopColor="#334155"/></linearGradient></defs>
      {!scene || points.length < 2 ? <text x="250" y="190" textAnchor="middle" fill="#94a3b8" fontSize="13">Draw or select a profile to preview in 3D</text> : <>
        {points.slice(0, -1).map((_, i) => {
          const a = scene.base[i], b = scene.base[i + 1], c = scene.back[i + 1], d = scene.back[i];
          const painted = (paintSide === 'outside' ? i % 2 === 0 : i % 2 !== 0);
          return <g key={i}>
            <polygon points={pointsAttr([a,b,c,d])} fill={painted ? '#b91c1c' : 'url(#flashing-metal)'} stroke="#e2e8f0" strokeWidth="1.2" />
            <polygon points={pointsAttr([a,b,scene.base[Math.min(i + 1, scene.base.length - 1)]])} fill="none" />
          </g>;
        })}
        <polyline points={pointsAttr(scene.base)} fill="none" stroke="#f8fafc" strokeWidth="2.4" strokeLinejoin="round" />
        <polyline points={pointsAttr(scene.back)} fill="none" stroke="#475569" strokeWidth="1.5" strokeLinejoin="round" />
        {scene.base.map((p, i) => <line key={i} x1={p.x} y1={p.y} x2={scene.back[i].x} y2={scene.back[i].y} stroke="#94a3b8" strokeWidth="1.1" />)}
      </>}
    </svg>
    <div className="absolute bottom-3 left-3 rounded-md bg-slate-950/80 px-2 py-1 text-[11px] text-slate-400">Drag to rotate · Scroll to zoom · View only</div>
  </div>;
};
