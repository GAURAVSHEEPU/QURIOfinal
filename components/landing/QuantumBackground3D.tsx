'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Waves, Atom, Compass, Play, Pause, Eye } from 'lucide-react';

export type SimMode = 'wave' | 'orbital' | 'bloch';

export default function QuantumBackground3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<SimMode>('wave');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [opacityLevel, setOpacityLevel] = useState<'subtle' | 'balanced' | 'vivid'>('balanced');
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // References to keep Three.js instances and animation loops stable
  const animFrameId = useRef<number | null>(null);
  const modeRef = useRef<SimMode>('wave');
  const isPlayingRef = useRef<boolean>(true);
  const mousePos = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── Three.js Scene Setup ──
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xfafaf8, 0.018);

    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 18, 42);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xfafaf8, 0); // Transparent so page background shows
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // ── Lighting ──
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xed6a5a, 2.5, 120); // Coral glow
    pointLight1.position.set(20, 25, 20);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x9bc1bc, 2.2, 120); // Mint glow
    pointLight2.position.set(-25, 15, -10);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0x0081a7, 1.8, 100); // Deep cyan
    pointLight3.position.set(0, -10, 25);
    scene.add(pointLight3);

    // ══════════════════════════════════════════════
    // MODE 1: QUANTUM WAVEPACKET PROBABILITY FIELD
    // ══════════════════════════════════════════════
    const waveGroup = new THREE.Group();

    // Floating probability cloud particles
    const particleCount = 120;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const coralCol = new THREE.Color(0xed6a5a);
    const mintCol = new THREE.Color(0x9bc1bc);
    const cyanCol = new THREE.Color(0x0081a7);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 60;
      particlePositions[i * 3 + 1] = Math.random() * 14 + 1;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 50;

      const pickColor = Math.random() > 0.5 ? coralCol : Math.random() > 0.5 ? mintCol : cyanCol;
      particleColors[i * 3] = pickColor.r;
      particleColors[i * 3 + 1] = pickColor.g;
      particleColors[i * 3 + 2] = pickColor.b;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.NormalBlending,
    });
    const particlePoints = new THREE.Points(particleGeometry, particleMaterial);
    waveGroup.add(particlePoints);
    scene.add(waveGroup);

    // ══════════════════════════════════════════════
    // MODE 2: QUANTUM ATOMIC ORBITALS & ENTANGLEMENT
    // ══════════════════════════════════════════════
    const orbitalGroup = new THREE.Group();
    orbitalGroup.position.set(0, 4, 0);

    // Nucleus / Entangled pair core
    const coreSphereGeom = new THREE.SphereGeometry(1.6, 32, 32);
    const coreMat1 = new THREE.MeshStandardMaterial({
      color: 0xed6a5a,
      emissive: 0xed6a5a,
      emissiveIntensity: 0.6,
      roughness: 0.3,
    });
    const coreSphere1 = new THREE.Mesh(coreSphereGeom, coreMat1);
    coreSphere1.position.set(-3.2, 0, 0);
    orbitalGroup.add(coreSphere1);

    const coreMat2 = new THREE.MeshStandardMaterial({
      color: 0x0081a7,
      emissive: 0x0081a7,
      emissiveIntensity: 0.6,
      roughness: 0.3,
    });
    const coreSphere2 = new THREE.Mesh(coreSphereGeom, coreMat2);
    coreSphere2.position.set(3.2, 0, 0);
    orbitalGroup.add(coreSphere2);

    // Entanglement filament line between the two qubits
    const filamentGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-3.2, 0, 0),
      new THREE.Vector3(3.2, 0, 0),
    ]);
    const filamentMat = new THREE.LineDashedMaterial({
      color: 0xed6a5a,
      dashSize: 0.4,
      gapSize: 0.2,
      linewidth: 2,
    });
    const entanglementLine = new THREE.Line(filamentGeom, filamentMat);
    entanglementLine.computeLineDistances();
    orbitalGroup.add(entanglementLine);

    // Orbital shells (Bohr / Schrödinger shells)
    const orbitalRings: THREE.LineLoop[] = [];
    const ringRadii = [8, 12, 16, 20];
    const ringColors = [0xed6a5a, 0x9bc1bc, 0x0081a7, 0x22252a];

    ringRadii.forEach((radius, idx) => {
      const ringGeom = new THREE.BufferGeometry();
      const points: THREE.Vector3[] = [];
      const segments = 90;
      for (let s = 0; s <= segments; s++) {
        const theta = (s / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
      }
      ringGeom.setFromPoints(points);
      const ringMat = new THREE.LineBasicMaterial({
        color: ringColors[idx % ringColors.length],
        transparent: true,
        opacity: 0.45,
      });
      const ringLoop = new THREE.LineLoop(ringGeom, ringMat);
      ringLoop.rotation.x = 0.35 * (idx + 1);
      ringLoop.rotation.z = 0.4 * (idx + 1);
      orbitalRings.push(ringLoop);
      orbitalGroup.add(ringLoop);
    });

    // Orbital electrons / orbiting probability nodes
    const electronGeom = new THREE.SphereGeometry(0.7, 16, 16);
    const electronMat = new THREE.MeshStandardMaterial({
      color: 0x9bc1bc,
      emissive: 0x9bc1bc,
      emissiveIntensity: 0.8,
    });
    const electrons: THREE.Mesh[] = [];
    for (let e = 0; e < 4; e++) {
      const electron = new THREE.Mesh(electronGeom, electronMat);
      electrons.push(electron);
      orbitalGroup.add(electron);
    }

    scene.add(orbitalGroup);

    // ══════════════════════════════════════════════
    // MODE 3: BLOCH SPHERE STATEVECTOR DYNAMICS
    // ══════════════════════════════════════════════
    const blochGroup = new THREE.Group();
    blochGroup.position.set(25, 0, 0);

    const blochRadius = 11;
    // Sphere wireframe
    const sphereWireGeom = new THREE.SphereGeometry(blochRadius, 24, 18);
    const sphereWireMat = new THREE.MeshBasicMaterial({
      color: 0x5a6578,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    });
    const blochSphereMesh = new THREE.Mesh(sphereWireGeom, sphereWireMat);
    blochGroup.add(blochSphereMesh);

    // Equator ring (coral)
    const equatorGeom = new THREE.RingGeometry(blochRadius - 0.05, blochRadius + 0.05, 64);
    const equatorMat = new THREE.MeshBasicMaterial({
      color: 0xed6a5a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
    });
    const equatorMesh = new THREE.Mesh(equatorGeom, equatorMat);
    equatorMesh.rotation.x = Math.PI / 2;
    blochGroup.add(equatorMesh);

    // Coordinate Axes (X, Y, Z)
    const axesLength = blochRadius * 1.35;
    const zAxisGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -axesLength, 0),
      new THREE.Vector3(0, axesLength, 0),
    ]);
    const zAxisMat = new THREE.LineBasicMaterial({ color: 0x22252a, transparent: true, opacity: 0.4 });
    const zAxis = new THREE.Line(zAxisGeom, zAxisMat);
    blochGroup.add(zAxis);

    const xAxisGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-axesLength, 0, 0),
      new THREE.Vector3(axesLength, 0, 0),
    ]);
    const xAxis = new THREE.Line(xAxisGeom, zAxisMat);
    blochGroup.add(xAxis);

    const yAxisGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, -axesLength),
      new THREE.Vector3(0, 0, axesLength),
    ]);
    const yAxis = new THREE.Line(yAxisGeom, zAxisMat);
    blochGroup.add(yAxis);

    // North pole (|0⟩) and South pole (|1⟩) markers
    const poleGeom = new THREE.SphereGeometry(0.6, 16, 16);
    const northPoleMat = new THREE.MeshStandardMaterial({ color: 0x0081a7, emissive: 0x0081a7, emissiveIntensity: 0.5 });
    const northPole = new THREE.Mesh(poleGeom, northPoleMat);
    northPole.position.set(0, blochRadius, 0);
    blochGroup.add(northPole);

    const southPoleMat = new THREE.MeshStandardMaterial({ color: 0xed6a5a, emissive: 0xed6a5a, emissiveIntensity: 0.5 });
    const southPole = new THREE.Mesh(poleGeom, southPoleMat);
    southPole.position.set(0, -blochRadius, 0);
    blochGroup.add(southPole);

    // Precessing State Vector |ψ⟩ arrow
    const stateVectorGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, blochRadius, 0),
    ]);
    const stateVectorMat = new THREE.LineBasicMaterial({
      color: 0xed6a5a,
      linewidth: 3,
    });
    const stateVectorLine = new THREE.Line(stateVectorGeom, stateVectorMat);
    blochGroup.add(stateVectorLine);

    const tipGeom = new THREE.ConeGeometry(0.8, 2, 16);
    const tipMat = new THREE.MeshStandardMaterial({
      color: 0xed6a5a,
      emissive: 0xed6a5a,
      emissiveIntensity: 0.6,
    });
    const stateVectorTip = new THREE.Mesh(tipGeom, tipMat);
    blochGroup.add(stateVectorTip);

    scene.add(blochGroup);

    // ── Mouse Listeners for subtle parallax ──
    const handleMouseMove = (e: MouseEvent) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -(e.clientY / window.innerHeight) * 2 + 1;
      mousePos.current.targetX = normX * 4;
      mousePos.current.targetY = normY * 3;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // ── Resize Handler ──
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // ── Animation Loop ──
    let clock = new THREE.Clock();
    let time = 0;

    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);

      if (isPlayingRef.current) {
        const delta = clock.getDelta();
        time += delta;

        // Smooth camera dampening to mouse
        mousePos.current.x += (mousePos.current.targetX - mousePos.current.x) * 0.04;
        mousePos.current.y += (mousePos.current.targetY - mousePos.current.y) * 0.04;

        camera.position.x = mousePos.current.x;
        camera.position.y = 18 + mousePos.current.y;
        camera.lookAt(0, 2, 0);

        const currentMode = modeRef.current;
        waveGroup.visible = true;
        orbitalGroup.visible = currentMode === 'orbital';
        blochGroup.visible = true;

        // 1. Wavepacket updates
        if (waveGroup.visible) {
          // Float particles
          const pPositions = particleGeometry.attributes.position;
          for (let j = 0; j < particleCount; j++) {
            let y = pPositions.getY(j);
            y += Math.sin(time * 2 + j) * 0.02;
            pPositions.setY(j, y);
          }
          pPositions.needsUpdate = true;
        }

        // 2. Orbital updates
        if (orbitalGroup.visible) {
          orbitalGroup.rotation.y = time * 0.2;
          orbitalRings.forEach((ring, idx) => {
            ring.rotation.y = time * 0.3 * (idx % 2 === 0 ? 1 : -1);
            ring.rotation.x += 0.002 * (idx + 1);
          });

          // Move electrons along shells
          electrons.forEach((electron, idx) => {
            const rad = ringRadii[idx];
            const speed = (idx + 1) * 0.8;
            const angle = time * speed;
            const ex = Math.cos(angle) * rad;
            const ez = Math.sin(angle) * rad;
            const ey = Math.sin(angle * 2) * 2;
            electron.position.set(ex, ey, ez);
          });

          // Entangled cores breathe
          const scaleVal = 1 + Math.sin(time * 3) * 0.12;
          coreSphere1.scale.set(scaleVal, scaleVal, scaleVal);
          coreSphere2.scale.set(scaleVal, scaleVal, scaleVal);
        }

        // 3. Bloch Sphere updates
        if (blochGroup.visible) {
          blochGroup.rotation.y = time * 0.15;

          // Statevector precession: theta and phi
          const theta = Math.PI * 0.35 + Math.sin(time * 0.8) * 0.45;
          const phi = time * 1.2;

          const vx = blochRadius * Math.sin(theta) * Math.cos(phi);
          const vy = blochRadius * Math.cos(theta);
          const vz = blochRadius * Math.sin(theta) * Math.sin(phi);

          // Update vector line
          const linePos = stateVectorLine.geometry.attributes.position;
          linePos.setXYZ(1, vx, vy, vz);
          linePos.needsUpdate = true;

          // Tip position and orientation
          stateVectorTip.position.set(vx, vy, vz);
          stateVectorTip.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(vx, vy, vz).normalize()
          );
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // ── Cleanup ──
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      if (container && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Opacity helper
  const canvasOpacity =
    opacityLevel === 'subtle' ? 0.45 : opacityLevel === 'balanced' ? 0.75 : 0.95;

  return (
    <>
      {/* Background Three.js WebGL Container */}
      <div
        ref={containerRef}
        className="quantum-3d-backdrop"
        style={{
          opacity: canvasOpacity,
          pointerEvents: 'none',
        }}
      />

      {/* Floating Physics Controls HUD (Quantum Atlas Style) */}
      <div
        className="quantum-physics-hud"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: isPlaying ? '#059669' : '#D97706',
              boxShadow: isPlaying ? '0 0 8px #059669' : 'none',
            }}
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: '#22252A',
              textTransform: 'uppercase',
            }}
          >
            3D Quantum Engine
          </span>
        </div>

        <div style={{ width: 1, height: 18, background: 'rgba(34, 37, 42, 0.15)' }} />

        {/* Mode Selectors */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setMode('wave')}
            style={{
              background: mode === 'wave' ? '#ED6A5A' : 'transparent',
              color: mode === 'wave' ? '#FFFFFF' : '#5A6578',
              border: mode === 'wave' ? 'none' : '1px solid rgba(34, 37, 42, 0.12)',
              borderRadius: 8,
              padding: '5px 10px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.2s',
            }}
            title="Schrödinger Wavepacket & Probability Surface"
          >
            <Waves size={13} />
            Wavefield
          </button>

          <button
            onClick={() => setMode('orbital')}
            style={{
              background: mode === 'orbital' ? '#ED6A5A' : 'transparent',
              color: mode === 'orbital' ? '#FFFFFF' : '#5A6578',
              border: mode === 'orbital' ? 'none' : '1px solid rgba(34, 37, 42, 0.12)',
              borderRadius: 8,
              padding: '5px 10px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.2s',
            }}
            title="Atomic Orbitals & Entangled Qubits"
          >
            <Atom size={13} />
            Orbitals
          </button>

          <button
            onClick={() => setMode('bloch')}
            style={{
              background: mode === 'bloch' ? '#ED6A5A' : 'transparent',
              color: mode === 'bloch' ? '#FFFFFF' : '#5A6578',
              border: mode === 'bloch' ? 'none' : '1px solid rgba(34, 37, 42, 0.12)',
              borderRadius: 8,
              padding: '5px 10px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.2s',
            }}
            title="Bloch Sphere Statevector Dynamics"
          >
            <Compass size={13} />
            Bloch
          </button>
        </div>

        <div style={{ width: 1, height: 18, background: 'rgba(34, 37, 42, 0.15)' }} />

        {/* Play/Pause Button */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#22252A',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            borderRadius: 6,
          }}
          title={isPlaying ? 'Pause 3D physics' : 'Resume 3D physics'}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>

        {/* Opacity switcher */}
        <button
          onClick={() =>
            setOpacityLevel((prev) =>
              prev === 'subtle' ? 'balanced' : prev === 'balanced' ? 'vivid' : 'subtle'
            )
          }
          style={{
            background: 'transparent',
            border: 'none',
            color: '#5A6578',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            fontWeight: 600,
          }}
          title={`Intensity: ${opacityLevel}`}
        >
          <Eye size={13} />
          <span style={{ textTransform: 'capitalize' }}>{opacityLevel}</span>
        </button>
      </div >
    </>
  );
}
