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
      color: '#b91c1c', metalness: 0.48, roughness: 0.3, side: THREE.DoubleSide
    });
    const materialUnpainted = new THREE.MeshStandardMaterial({
      color: '#9aa7b8', metalness: 0.72, roughness: 0.28, side: THREE.DoubleSide
    });
    const grid = new THREE.GridHelper(1000, 40, 0x334155, 0x1e293b);
    grid.position.y = -0.02;
    scene.add(grid);

    const valid = points.length >= 2;
    if (valid) {
      const origin = points[0];
      const profile = points.map(p => new THREE.Vector3(p.x - origin.x, -(p.y - origin.y), 0));
      const profileLength = points.reduce((sum, p, i) => i ? sum + dist(points[i - 1], p) : sum, 0);
      const depth = clamp(profileLength * 0.22, 18, 90);
      const zFront = depth / 2;
      const zBack = -depth / 2;
      const paintedOnFront = paintSide !== 'inside' && paintSide !== 'right';

      // Each profile leg is a real sheet-metal panel between the front/back
      // planes. Faces have separate materials so the paint side is physical.
      points.slice(0, -1).forEach((_, i) => {
        const a = profile[i], b = profile[i + 1];
        const frontGeometry = new THREE.BufferGeometry();
        frontGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
          a.x, a.y, zFront, b.x, b.y, zFront, b.x, b.y, zBack, a.x, a.y, zBack
        ], 3));
        frontGeometry.setIndex([0, 1, 2, 0, 2, 3]);
        frontGeometry.computeVertexNormals();

        const frontMesh = new THREE.Mesh(frontGeometry, paintedOnFront ? materialPainted : materialUnpainted);
        profileGroup.add(frontMesh);

        // Opposite face: same physical panel, opposite finish.
        const backGeometry = new THREE.BufferGeometry();
        backGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
          a.x, a.y, zBack, b.x, b.y, zBack, b.x, b.y, zFront, a.x, a.y, zFront
        ], 3));
        backGeometry.setIndex([0, 1, 2, 0, 2, 3]);
        backGeometry.computeVertexNormals();
        const backMesh = new THREE.Mesh(backGeometry, paintedOnFront ? materialUnpainted : materialPainted);
        profileGroup.add(backMesh);

        // Thin exposed sheet edge at each fold line.
        const edgePoints = [
          new THREE.Vector3(a.x, a.y, zFront),
          new THREE.Vector3(b.x, b.y, zFront),
          new THREE.Vector3(b.x, b.y, zBack),
          new THREE.Vector3(a.x, a.y, zBack),
          new THREE.Vector3(a.x, a.y, zFront)
        ];
        const edgeGeometry = new THREE.BufferGeometry().setFromPoints(edgePoints);
        profileGroup.add(new THREE.Line(edgeGeometry, new THREE.LineBasicMaterial({ color: '#e2e8f0' })));
      });

      // Show the profile's actual cut edges, making the sheet thickness/depth legible.
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
      const initialDistance = maxDim * 2.05;
      camera.position.set(
        Math.sin(rotation.yaw) * Math.cos(rotation.pitch) * initialDistance,
        Math.sin(rotation.pitch) * initialDistance,
        Math.cos(rotation.yaw) * Math.cos(rotation.pitch) * initialDistance
      );
      fitDistanceRef.current = camera.position.length();
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
  }, [points, paintSide, onRotationChange, rotation.yaw, rotation.pitch]);

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
