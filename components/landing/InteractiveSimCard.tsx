'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Play, RotateCcw, ArrowRight, Sliders, Cpu, Eye } from 'lucide-react';

export default function InteractiveSimCard() {
  const [activeTab, setActiveTab] = useState<'interference' | 'superposition'>('interference');
  // Interference state
  const [slitDistance, setSlitDistance] = useState<number>(45);
  const [wavelength, setWavelength] = useState<number>(32);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);

  // Superposition state
  const [thetaDegrees, setThetaDegrees] = useState<number>(60);
  const thetaRad = (thetaDegrees * Math.PI) / 180;
  const p0 = Math.round(Math.pow(Math.cos(thetaRad / 2), 2) * 100);
  const p1 = 100 - p0;
  const alpha = Math.cos(thetaRad / 2).toFixed(3);
  const beta = Math.sin(thetaRad / 2).toFixed(3);

  return (
    <div
      className="atlas-card"
      style={{
        padding: 28,
        background: '#FFFFFF',
        border: '1.5px solid #E2E6DF',
        boxShadow: '0 20px 50px rgba(34, 37, 42, 0.08)',
        borderRadius: 24,
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          borderBottom: '1px solid #E6EBE0',
          paddingBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: '#FCEBE8',
              color: '#ED6A5A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sliders size={20} />
          </div>
          <div>
            <div style={{ fontFamily: "'Exo 2', sans-serif", fontWeight: 700, fontSize: 16, color: '#22252A' }}>
              Interactive Quantum Sandbox
            </div>
            <div style={{ fontSize: 12, color: '#5A6578' }}>
              Real-time parameter manipulation & state measurement
            </div>
          </div>
        </div>

        {/* Tab switchers */}
        <div
          style={{
            display: 'flex',
            background: '#E6EBE0',
            padding: 3,
            borderRadius: 10,
            gap: 2,
          }}
        >
          <button
            onClick={() => setActiveTab('interference')}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'interference' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'interference' ? '#ED6A5A' : '#5A6578',
              boxShadow: activeTab === 'interference' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            Wave Interference
          </button>
          <button
            onClick={() => setActiveTab('superposition')}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'superposition' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'superposition' ? '#ED6A5A' : '#5A6578',
              boxShadow: activeTab === 'superposition' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            Superposition State
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      {activeTab === 'interference' ? (
        <div>
          {/* Simulated Double-Slit Wave Screen */}
          <div
            style={{
              height: 220,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #1A1F2C 0%, #0F131D 100%)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.4)',
            }}
          >
            {/* Wave interference bands SVG */}
            <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
              <defs>
                <linearGradient id="slitGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ED6A5A" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#9BC1BC" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#0081A7" stopOpacity="0.8" />
                </linearGradient>
              </defs>

              {/* Central Barrier with slits */}
              <line x1="80" y1="0" x2="80" y2="80" stroke="#5A6578" strokeWidth="4" />
              <line x1="80" y1="140" x2="80" y2="220" stroke="#5A6578" strokeWidth="4" />

              {/* Slit points */}
              <circle cx="80" cy="90" r="3" fill="#ED6A5A" />
              <circle cx="80" cy="130" r="3" fill="#ED6A5A" />

              {/* Interference fringes across the detector screen */}
              {Array.from({ length: 36 }).map((_, i) => {
                const x = 110 + i * 14;
                const d1 = Math.sqrt(Math.pow(x - 80, 2) + Math.pow(110 - 90, 2));
                const d2 = Math.sqrt(Math.pow(x - 80, 2) + Math.pow(110 - 130, 2));
                const deltaPhase = ((d2 - d1) / wavelength) * (slitDistance / 25);
                const intensity = (Math.cos(deltaPhase) + 1) / 2;

                return (
                  <g key={i}>
                    {/* Intensity line */}
                    <line
                      x1={x}
                      y1={110 - intensity * 60}
                      x2={x}
                      y2={110 + intensity * 60}
                      stroke={intensity > 0.5 ? '#ED6A5A' : '#9BC1BC'}
                      strokeOpacity={intensity * 0.85 + 0.1}
                      strokeWidth="3.5"
                    />
                  </g>
                );
              })}

              {/* Detector screen on right edge */}
              <line x1="95%" y1="20" x2="95%" y2="200" stroke="#E6EBE0" strokeWidth="2" strokeDasharray="4 4" />
            </svg>

            {/* Overlay badge */}
            <div
              style={{
                position: 'absolute',
                top: 12,
                left: 14,
                background: 'rgba(0,0,0,0.6)',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontFamily: 'monospace',
                color: '#9BC1BC',
              }}
            >
              |Ψ(x)|² = 4I₀ cos²(πd·sin θ / λ)
            </div>

            <div
              style={{
                position: 'absolute',
                bottom: 12,
                right: 14,
                background: 'rgba(237, 106, 90, 0.2)',
                border: '1px solid #ED6A5A',
                color: '#ED6A5A',
                padding: '3px 8px',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              PROBABILITY FRINGES
            </div>
          </div>

          {/* Sliders */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 18 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ fontWeight: 600, color: '#22252A' }}>Slit Separation (d)</span>
                <span style={{ fontFamily: 'monospace', color: '#ED6A5A', fontWeight: 600 }}>{slitDistance} nm</span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                value={slitDistance}
                onChange={(e) => setSlitDistance(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#ED6A5A' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ fontWeight: 600, color: '#22252A' }}>De Broglie Wavelength (λ)</span>
                <span style={{ fontFamily: 'monospace', color: '#0081A7', fontWeight: 600 }}>{wavelength} pm</span>
              </div>
              <input
                type="range"
                min="15"
                max="60"
                value={wavelength}
                onChange={(e) => setWavelength(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#0081A7' }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* Superposition & Bloch Vector display */}
          <div
            style={{
              height: 220,
              borderRadius: 16,
              background: '#FAFAF8',
              border: '1.5px solid #E2E6DF',
              position: 'relative',
              padding: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
            }}
          >
            {/* Mathematical state formula */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#5A6578', marginBottom: 4, fontWeight: 600 }}>
                QUANTUM STATE VECTOR
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#22252A',
                  background: '#FFFFFF',
                  padding: '8px 16px',
                  borderRadius: 10,
                  border: '1px solid #E2E6DF',
                  marginBottom: 12,
                }}
              >
                |ψ⟩ = <span style={{ color: '#0081A7' }}>{alpha}</span>|0⟩ +{' '}
                <span style={{ color: '#ED6A5A' }}>{beta}</span>|1⟩
              </div>
              <div style={{ fontSize: 13, color: '#5A6578' }}>
                Rotation Angle: <b>θ = {thetaDegrees}°</b>
              </div>
            </div>

            {/* Measurement Probabilities Histogram */}
            <div style={{ width: 160 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#5A6578', marginBottom: 8 }}>
                MEASUREMENT OUTCOMES
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: '#0081A7' }}>|0⟩ Probability</span>
                  <span style={{ fontWeight: 700 }}>{p0}%</span>
                </div>
                <div style={{ height: 10, background: '#E2E6DF', borderRadius: 5, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${p0}%`,
                      background: '#0081A7',
                      transition: 'width 0.2s',
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: '#ED6A5A' }}>|1⟩ Probability</span>
                  <span style={{ fontWeight: 700 }}>{p1}%</span>
                </div>
                <div style={{ height: 10, background: '#E2E6DF', borderRadius: 5, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${p1}%`,
                      background: '#ED6A5A',
                      transition: 'width 0.2s',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Theta Slider */}
          <div style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span style={{ fontWeight: 600, color: '#22252A' }}>Bloch Polar Angle θ (0° = |0⟩, 180° = |1⟩)</span>
              <span style={{ fontFamily: 'monospace', color: '#ED6A5A', fontWeight: 700 }}>{thetaDegrees}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="180"
              value={thetaDegrees}
              onChange={(e) => setThetaDegrees(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#ED6A5A' }}
            />
          </div>
        </div>
      )}

      {/* Footer link to launch full studio apps */}
      <div
        style={{
          marginTop: 24,
          paddingTop: 16,
          borderTop: '1px solid #E6EBE0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <span style={{ fontSize: 13, color: '#5A6578' }}>
          Explore full interactive simulations with code generation:
        </span>
        <div style={{ display: 'flex', gap: 10 }}>
          
          <Link
            href="/circuit"
            style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              color: '#FFFFFF',
              background: '#ED6A5A',
              padding: '7px 16px',
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(237, 106, 90, 0.3)',
              transition: 'all 0.2s',
            }}
          >
            <Cpu size={14} /> Circuit Studio <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
