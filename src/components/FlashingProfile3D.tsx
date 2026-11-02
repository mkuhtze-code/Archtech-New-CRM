import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
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

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

/**
 * Real WebGL 3D preview. The cross-section remains the source of truth and is
 * extruded into a thin sheet along Z. Three.js provides perspective projection,
 * depth testing, lighting, orbit controls and camera zoom (not SVG projection).
 */
export const FlashingProfile3D: React.FC<Props> = ({
  points, paintSide, onPaintSideChange, rotation, onRotationChange, zoom, onZoomChange
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const fitDistanceRef = useRef(360);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#080d15');
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 10000);
    camera.position.set(240, 180, 360);
    cameraRef.current = camera;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch {
      setReady(false);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.className = 'block h-full w-full touch-none';
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xdbeafe, 0x172033, 2.0));
    const key = new THREE.DirectionalLight(0xffffff, 3.2);
    key.position.set(180, 260, 320);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x93c5fd, 1.4);
    fill.position.set(-220, 80, -180);
    scene.add(fill);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.enablePan = true;
    controls.minDistance = 20;
    controls.maxDistance = 4000;
    controlsRef.current = controls;

    const profileGroup = new THREE.Group();
    scene.add(profileGroup);

    const materialPainted = new THREE.MeshStandardMaterial({
      color: '#d71920', metalness: 0.28, roughness: 0.42,
      side: THREE.DoubleSide, transparent: false, opacity: 1, depthWrite: true
    });
    const materialUnpainted = new THREE.MeshStandardMaterial({
      color: '#aeb8c4', metalness: 0.52, roughness: 0.38,
      side: THREE.DoubleSide, transparent: false, opacity: 1, depthWrite: true
    });
    const grid = new THREE.GridHelper(1000, 40, 0x334155, 0x1e293b);
    grid.position.y = -0.02;
    scene.add(grid);

    const valid = points.length >= 2;
    if (valid) {
      const origin = points[0];
      const profile = points.map(p => new THREE.Vector3(p.x - origin.x, -(p.y - origin.y), 0));
      const profileLength = points.reduce((sum, p, i) => i ? sum + dist(points[i - 1], p) : sum, 0);
      // The extrusion length is intentionally much longer than the developed
      // cross-section (roughly 4:1) so the preview reads as a length of flashing.
      const depth = clamp(profileLength * 4, 1200, 6000);
      const zFront = depth / 2;
      const zBack = -depth / 2;
      const sheetThickness = 1.2;
      const paintedOnPositiveNormal = paintSide !== 'inside' && paintSide !== 'right';

      // Each leg is a solid, opaque sheet panel. The two faces are offset along
      // the leg normal (not overlapped coplanar quads), preventing z-fighting.
      points.slice(0, -1).forEach((_, i) => {
        const a = profile[i], b = profile[i + 1];
        const dx = b.x - a.x, dy = b.y - a.y;
        const legLength = Math.max(1e-6, Math.hypot(dx, dy));
        const nx = -dy / legLength, ny = dx / legLength;
        const faceOffset = sheetThickness / 2;
        const plusA = new THREE.Vector3(a.x + nx * faceOffset, a.y + ny * faceOffset, 0);
        const plusB = new THREE.Vector3(b.x + nx * faceOffset, b.y + ny * faceOffset, 0);
        const minusA = new THREE.Vector3(a.x - nx * faceOffset, a.y - ny * faceOffset, 0);
        const minusB = new THREE.Vector3(b.x - nx * faceOffset, b.y - ny * faceOffset, 0);

        const quad = (p1: THREE.Vector3, p2: THREE.Vector3, z1: number, z2: number) => {
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.Float32BufferAttribute([
            p1.x, p1.y, z1, p2.x, p2.y, z1,
            p2.x, p2.y, z2, p1.x, p1.y, z2
          ], 3));
          geometry.setIndex([0, 1, 2, 0, 2, 3]);
          geometry.computeVertexNormals();
          return geometry;
        };

        const positiveFace = new THREE.Mesh(quad(plusA, plusB, zFront, zBack),
          paintedOnPositiveNormal ? materialPainted : materialUnpainted);
        const negativeFace = new THREE.Mesh(quad(minusA, minusB, zFront, zBack),
          paintedOnPositiveNormal ? materialUnpainted : materialPainted);
        profileGroup.add(positiveFace, negativeFace);

        // Close the cut ends and the small thickness at each end of this leg.
        const edgeVertices = [
          new THREE.Vector3(plusA.x, plusA.y, zFront),
          new THREE.Vector3(minusA.x, minusA.y, zFront),
          new THREE.Vector3(minusB.x, minusB.y, zFront),
          new THREE.Vector3(plusB.x, plusB.y, zFront),
          new THREE.Vector3(plusA.x, plusA.y, zFront),
          new THREE.Vector3(plusA.x, plusA.y, zBack),
          new THREE.Vector3(minusA.x, minusA.y, zBack),
          new THREE.Vector3(minusA.x, minusA.y, zFront)
        ];
        const edgeGeometry = new THREE.BufferGeometry().setFromPoints(edgeVertices);
        profileGroup.add(new THREE.Line(edgeGeometry, new THREE.LineBasicMaterial({ color: '#e2e8f0' })));
      });

      // Trace both long profile edges to make the sheet's full extrusion length clear.
      [zFront, zBack].forEach(z => {
        const edge = new THREE.BufferGeometry().setFromPoints(
          profile.map(p => new THREE.Vector3(p.x, p.y, z))
        );
        profileGroup.add(new THREE.Line(edge, new THREE.LineBasicMaterial({ color: '#f1f5f9' })));
      });

      const box = new THREE.Box3().setFromObject(profileGroup);
      const size = box.getSize(new THREE.Vector3());
      const centre = box.getCenter(new THREE.Vector3());
      profileGroup.position.sub(centre);
      const maxDim = Math.max(size.x, size.y, size.z, 1);
      const fitDistance = maxDim * 2.05;
      const initialDistance = fitDistance / clamp(zoom, 0.25, 5);
      camera.position.set(
        Math.sin(rotation.yaw) * Math.cos(rotation.pitch) * initialDistance,
        Math.sin(rotation.pitch) * initialDistance,
        Math.cos(rotation.yaw) * Math.cos(rotation.pitch) * initialDistance
      );
      fitDistanceRef.current = fitDistance;
      camera.near = Math.max(0.1, maxDim / 1000);
      camera.far = maxDim * 100;
      camera.updateProjectionMatrix();
      controls.target.set(0, 0, 0);
      controls.minDistance = maxDim * 0.15;
      controls.maxDistance = maxDim * 12;
      grid.scale.setScalar(Math.max(1, maxDim / 600));
      grid.position.y = -size.y * 0.55;
    }

    const syncRotation = () => {
      const offset = camera.position.clone().sub(controls.target);
      const length = Math.max(0.001, offset.length());
      const yaw = Math.atan2(offset.x, offset.z);
      const pitch = Math.asin(clamp(offset.y / length, -1, 1));
      onRotationChange({ yaw, pitch });
    };
    controls.addEventListener('end', syncRotation);

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    let frame = 0;
    const render = () => {
      controls.update();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    render();
    setReady(true);

    controls.update();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.removeEventListener('end', syncRotation);
      controls.dispose();
      controlsRef.current = null;
      cameraRef.current = null;
      profileGroup.traverse(obj => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) mesh.material.forEach(m => m.dispose());
        else if (mesh.material) mesh.material.dispose();
      });
      materialPainted.dispose();
      materialUnpainted.dispose();
      grid.geometry.dispose();
      (Array.isArray(grid.material) ? grid.material : [grid.material]).forEach(m => m.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  // Rebuild the physical mesh when geometry or finish changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, paintSide]);

  useEffect(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    const factor = clamp(zoom, 0.25, 5);
    const target = controls.target;
    const offset = camera.position.clone().sub(target);
    const desired = Math.max(0.1, fitDistanceRef.current / factor);
    offset.setLength(desired);
    camera.position.copy(target).add(offset);
    controls.update();
  }, [zoom]);

  const changeZoom = (next: number) => onZoomChange(clamp(next, 0.25, 5));

  return <div className="absolute inset-0 flex flex-col bg-[#080d15]">
    <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/95 p-1.5 text-xs">
      <span className="px-1.5 text-slate-400">Painted face</span>
      <button onClick={() => onPaintSideChange('outside')} className={`rounded px-2 py-1 ${paintSide !== 'inside' && paintSide !== 'right' ? 'bg-red-700 text-white' : 'text-slate-400 hover:text-white'}`}>Outside</button>
      <button onClick={() => onPaintSideChange('inside')} className={`rounded px-2 py-1 ${paintSide === 'inside' || paintSide === 'right' ? 'bg-red-700 text-white' : 'text-slate-400 hover:text-white'}`}>Inside</button>
    </div>
    <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950/95 p-1">
      <button aria-label="Zoom out 3D preview" onClick={() => changeZoom(zoom / 1.2)} className="rounded px-2 py-1 text-slate-200 hover:bg-slate-800">−</button>
      <span className="min-w-12 text-center font-mono text-[11px] text-slate-400">{Math.round(zoom * 100)}%</span>
      <button aria-label="Zoom in 3D preview" onClick={() => changeZoom(zoom * 1.2)} className="rounded px-2 py-1 text-slate-200 hover:bg-slate-800">+</button>
      <button aria-label="Fit 3D preview" onClick={() => onZoomChange(1)} className="rounded px-2 py-1 text-slate-200 hover:bg-slate-800">Fit</button>
    </div>
    <div ref={hostRef} className="h-full w-full" />
    {!ready && <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-slate-400">Starting 3D renderer…</div>}
    <div className="absolute bottom-3 left-3 rounded-md bg-slate-950/90 px-2 py-1 text-[11px] text-slate-400">Drag to orbit · Scroll to zoom · View only</div>
  </div>;
};
