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

type Vec3 = { x: number; y: number; z: number };
type Vec2 = { x: number; y: number };

/**
 * Orthographic, read-only extrusion of the exact 2D profile.
 * The same profile vertices are used on both ends; zoom only changes the
 * uniform camera scale, never the underlying geometry or aspect ratio.
 */
export const FlashingProfile3D: React.FC<Props> = ({
  points, paintSide, onPaintSideChange, rotation, onRotationChange, zoom, onZoomChange
}) => {
  const [dragging, setDragging] = useState(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  const scene = useMemo(() => {
    if (points.length < 2) return null;
    const yaw = rotation.yaw;
    const pitch = rotation.pitch;
    const profileLength = points.reduce((sum, p, i) => i ? sum + dist(points[i - 1], p) : sum, 0);
    // Keep the extrusion depth proportional to the profile's actual scale.
    const depth = Math.max(18, Math.min(90, profileLength * 0.22));
    const origin = points[0];
    const model: Vec3[] = points.map(p => ({ x: p.x - origin.x, y: -(p.y - origin.y), z: 0 }));
    const backModel = model.map(p => ({ ...p, z: depth }));
    const project = (p: Vec3): Vec2 => ({
      x: p.x * Math.cos(yaw) + p.z * Math.sin(yaw),
      y: -p.x * Math.sin(yaw) * Math.sin(pitch) + p.y * Math.cos(pitch) + p.z * Math.cos(yaw) * Math.sin(pitch)
    });
    const frontProjected = model.map(project);
    const backProjected = backModel.map(project);
    const all = [...frontProjected, ...backProjected];
    const minX = Math.min(...all.map(p => p.x));
    const maxX = Math.max(...all.map(p => p.x));
    const minY = Math.min(...all.map(p => p.y));
    const maxY = Math.max(...all.map(p => p.y));
    const spanX = Math.max(1, maxX - minX);
    const spanY = Math.max(1, maxY - minY);
    // Fit uniformly into the camera frame, then apply user zoom around the centre.
    const fitScale = Math.min(340 / spanX, 250 / spanY);
    const scale = fitScale * Math.max(0.25, Math.min(5, zoom));
    const centreX = (minX + maxX) / 2;
    const centreY = (minY + maxY) / 2;
    const map = (p: Vec2): Vec2 => ({ x: 250 + (p.x - centreX) * scale, y: 190 - (p.y - centreY) * scale });
    return {
      front: frontProjected.map(map),
      back: backProjected.map(map),
      frontDepth: model.map(p => p.z),
      // Preserve the original profile point order for accurate joins.
      length: points.length
    };
  }, [points, rotation.yaw, rotation.pitch, zoom]);

  const pointsAttr = (arr: Vec2[]) => arr.map(p => `${p.x},${p.y}`).join(' ');
  const startDrag = (e: React.PointerEvent<SVGSVGElement>) => {
    last.current = { x: e.clientX, y: e.clientY };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const moveDrag = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging || !last.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    onRotationChange({
      yaw: rotation.yaw + dx * 0.008,
      pitch: Math.max(-1.25, Math.min(1.25, rotation.pitch + dy * 0.006))
    });
  };
  const stopDrag = () => { setDragging(false); last.current = null; };
  const zoomBy = (factor: number) => onZoomChange(Math.max(0.25, Math.min(5, zoom * factor)));
  const frontPainted = paintSide !== 'inside';

  return <div className="absolute inset-0 bg-[#080d15] flex flex-col">
    <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/95 p-1.5 text-xs">
      <span className="px-1.5 text-slate-400">Painted face</span>
      <button onClick={() => onPaintSideChange('outside')} className={`rounded px-2 py-1 ${paintSide !== 'inside' ? 'bg-red-700 text-white' : 'text-slate-400 hover:text-white'}`}>Outside</button>
      <button onClick={() => onPaintSideChange('inside')} className={`rounded px-2 py-1 ${paintSide === 'inside' ? 'bg-red-700 text-white' : 'text-slate-400 hover:text-white'}`}>Inside</button>
    </div>
    <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950/95 p-1">
      <button aria-label="Zoom out 3D preview" onClick={() => zoomBy(1 / 1.2)} className="rounded px-2 py-1 text-slate-200 hover:bg-slate-800">−</button>
      <span className="min-w-12 text-center text-[11px] font-mono text-slate-400">{Math.round(zoom * 100)}%</span>
      <button aria-label="Zoom in 3D preview" onClick={() => zoomBy(1.2)} className="rounded px-2 py-1 text-slate-200 hover:bg-slate-800">+</button>
      <button aria-label="Fit 3D preview" onClick={() => onZoomChange(1)} className="rounded px-2 py-1 text-slate-200 hover:bg-slate-800">Fit</button>
    </div>
    <svg viewBox="0 0 500 380" preserveAspectRatio="xMidYMid meet" className="h-full w-full touch-none"
      onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={stopDrag} onPointerCancel={stopDrag}
      onWheel={e => { e.preventDefault(); e.stopPropagation(); zoomBy(e.deltaY < 0 ? 1.12 : 1 / 1.12); }}>
      <defs>
        <linearGradient id="flashing-metal-back" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#cbd5e1"/><stop offset="55%" stopColor="#64748b"/><stop offset="100%" stopColor="#334155"/>
        </linearGradient>
        <linearGradient id="flashing-metal-painted" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f87171"/><stop offset="45%" stopColor="#b91c1c"/><stop offset="100%" stopColor="#7f1d1d"/>
        </linearGradient>
      </defs>
      {!scene ? <text x="250" y="190" textAnchor="middle" fill="#94a3b8" fontSize="13">Draw or select a profile to preview in 3D</text> : <>
        {/* Rear surface first, so it never incorrectly paints over the near surface. */}
        {points.slice(0, -1).map((_, i) => {
          const quad = [scene.back[i], scene.back[i + 1], scene.front[i + 1], scene.front[i]];
          return <polygon key={`rear-${i}`} points={pointsAttr(quad)}
            fill={frontPainted ? 'url(#flashing-metal-back)' : 'url(#flashing-metal-painted)'}
            stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />;
        })}
        {points.slice(0, -1).map((_, i) => {
          const quad = [scene.front[i], scene.front[i + 1], scene.back[i + 1], scene.back[i]];
          return <polygon key={`front-${i}`} points={pointsAttr(quad)}
            fill={frontPainted ? 'url(#flashing-metal-painted)' : 'url(#flashing-metal-back)'}
            stroke="#e2e8f0" strokeWidth="1.1" strokeLinejoin="round" />;
        })}
        <polyline points={pointsAttr(scene.front)} fill="none" stroke="#f8fafc" strokeWidth="1.8" strokeLinejoin="round" />
        <polyline points={pointsAttr(scene.back)} fill="none" stroke="#64748b" strokeWidth="1.2" strokeLinejoin="round" />
        {scene.front.map((p, i) => <line key={`edge-${i}`} x1={p.x} y1={p.y} x2={scene.back[i].x} y2={scene.back[i].y} stroke="#94a3b8" strokeWidth="1.1" />)}
      </>}
    </svg>
    <div className="absolute bottom-3 left-3 rounded-md bg-slate-950/90 px-2 py-1 text-[11px] text-slate-400">Drag to rotate · Scroll or +/− to zoom · Fit resets scale · View only</div>
  </div>;
};
