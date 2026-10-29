'use client'

export default function LogoAnimado() {
  return (
    <>
      {/*
        Layout: todo dentro de 160x48px
        El SVG tiene viewBox="0 0 160 48"
        - Pin: x=10..26, y=20..48
        - Figura sobre pin: centrada en x=18, figura arriba del pin
        - Texto "Encuentrame": x=32, y=28
        - Figura corriendo: debajo del texto, y=38..48
      */}
      <svg
        viewBox="0 0 170 48"
        width={170}
        height={48}
        style={{ display: 'block', overflow: 'visible' }}
      >
        {/* ── PIN ── */}
        <path
          d="M18 18 C12 18 8 22 8 27 C8 34 18 46 18 46 C18 46 28 34 28 27 C28 22 24 18 18 18Z"
          fill="#F97316"
        />
        <circle cx="18" cy="27" r="3.5" fill="white" />

        {/* ── TEXTO ── alineado verticalmente al centro del pin */}
        <text
          x="34" y="32"
          fontFamily="inherit"
          fontSize="18"
          fontWeight="bold"
          fill="#7C3AED"
        >
          Encuentrame
        </text>

        {/* ══ POSE 1: SENTADO sobre el pin ══
            Cadera en y=16, piernas cuelgan hacia y=22 */}
        <g style={{ animation: 'pose1 5s ease-in-out infinite' }}>
          <circle cx="18" cy="4"  r="4" fill="#7C3AED" />
          <line x1="18" y1="8"  x2="18" y2="15" stroke="#7C3AED" strokeWidth="2.2" strokeLinecap="round" />
          {/* cadera horizontal — base de la pose sentado */}
          <line x1="12" y1="15" x2="24" y2="15" stroke="#7C3AED" strokeWidth="2.2" strokeLinecap="round" />
          {/* brazos relajados apoyados */}
          <line x1="18" y1="10" x2="12" y2="14" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" />
          <line x1="18" y1="10" x2="24" y2="14" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" />
          {/* pierna izq: rodilla y pie colgando */}
          <line x1="12" y1="15" x2="10" y2="20" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" />
          <line x1="10" y1="20" x2="8"  y2="25" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" />
          {/* pierna der: rodilla y pie colgando */}
          <line x1="24" y1="15" x2="26" y2="20" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" />
          <line x1="26" y1="20" x2="28" y2="25" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* ══ POSE 2: DE PIE sobre pin, brazos arriba ══ */}
        <g style={{ animation: 'pose2 5s ease-in-out infinite' }}>
          <circle cx="18" cy="3"  r="4" fill="#7C3AED" />
          <line x1="18" y1="7"  x2="18" y2="16" stroke="#7C3AED" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="18" y1="10" x2="12" y2="4"  stroke="#7C3AED" strokeWidth="2"   strokeLinecap="round" />
          <line x1="18" y1="10" x2="24" y2="4"  stroke="#7C3AED" strokeWidth="2"   strokeLinecap="round" />
          <line x1="18" y1="16" x2="15" y2="22" stroke="#7C3AED" strokeWidth="2"   strokeLinecap="round" />
          <line x1="18" y1="16" x2="21" y2="22" stroke="#7C3AED" strokeWidth="2"   strokeLinecap="round" />
        </g>

        {/* ══ POSE 3: SALTO — sube con translateY ══ */}
        <g style={{ animation: 'pose3 5s ease-in-out infinite' }}>
          <circle cx="18" cy="3"  r="4" fill="#7C3AED" />
          <line x1="18" y1="7"  x2="17" y2="15" stroke="#7C3AED" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="18" y1="10" x2="12" y2="13" stroke="#7C3AED" strokeWidth="2"   strokeLinecap="round" />
          <line x1="18" y1="10" x2="24" y2="13" stroke="#7C3AED" strokeWidth="2"   strokeLinecap="round" />
          {/* piernas encogidas */}
          <line x1="17" y1="15" x2="13" y2="11" stroke="#7C3AED" strokeWidth="2"   strokeLinecap="round" />
          <line x1="17" y1="15" x2="22" y2="11" stroke="#7C3AED" strokeWidth="2"   strokeLinecap="round" />
        </g>

        {/* ══ FIGURA CORRIENDO — debajo del texto ══ */}
        {/* Pose A */}
        <g style={{ animation: 'correr 5s linear infinite' }}>
          <g style={{ animation: 'poseA 0.28s steps(1) infinite' }}>
            <circle cx="0" cy="37" r="3" fill="#7C3AED" />
            <line x1="0" y1="40" x2="-0.5" y2="45" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="-0.2" y1="42" x2="3.5" y2="40" stroke="#7C3AED" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="-0.2" y1="42" x2="-3.5" y2="43" stroke="#7C3AED" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="-0.5" y1="45" x2="3"   y2="48" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="-0.5" y1="45" x2="-4"  y2="48" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" />
          </g>
          {/* Pose B */}
          <g style={{ animation: 'poseB 0.28s steps(1) infinite' }}>
            <circle cx="0" cy="37" r="3" fill="#7C3AED" />
            <line x1="0" y1="40" x2="-0.5" y2="45" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="-0.2" y1="42" x2="-3.5" y2="40" stroke="#7C3AED" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="-0.2" y1="42" x2="3.5"  y2="43" stroke="#7C3AED" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="-0.5" y1="45" x2="-3"   y2="48" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="-0.5" y1="45" x2="4"    y2="48" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" />
          </g>
        </g>
      </svg>

      <style>{`
        @keyframes pose1 {
          0%   { opacity: 1; }
          24%  { opacity: 1; }
          27%  { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes pose2 {
          0%   { opacity: 0; }
          25%  { opacity: 0; }
          27%  { opacity: 1; }
          40%  { opacity: 1; }
          43%  { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes pose3 {
          0%   { opacity: 0; transform: translateY(0px);   }
          41%  { opacity: 0; transform: translateY(0px);   }
          43%  { opacity: 1; transform: translateY(0px);   }
          50%  { opacity: 1; transform: translateY(-14px); }
          57%  { opacity: 1; transform: translateY(0px);   }
          60%  { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes correr {
          0%   { transform: translateX(34px);  opacity: 0; }
          58%  { transform: translateX(34px);  opacity: 0; }
          62%  { transform: translateX(34px);  opacity: 1; }
          96%  { transform: translateX(165px); opacity: 1; }
          100% { transform: translateX(165px); opacity: 0; }
        }
        @keyframes poseA {
          0%  { opacity: 1; } 50% { opacity: 1; }
          51% { opacity: 0; } 100%{ opacity: 0; }
        }
        @keyframes poseB {
          0%  { opacity: 0; } 50% { opacity: 0; }
          51% { opacity: 1; } 100%{ opacity: 1; }
        }
      `}</style>
    </>
  )
}
