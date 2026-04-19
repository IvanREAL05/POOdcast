import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Text, CameraControls, Line, Html, Sparkles, Float } from '@react-three/drei';
import * as THREE from 'three';
import { getAnalyser } from '../utils/sharedAudio';

// ── Paleta ─────────────────────────────────────────────────────────────────────
const CY = '#00d4ff';
const OR = '#ff6b00';
const PU = '#a855f7';
const GR = '#10b981';
const YE = '#fbbf24';

// ── Datos del diagrama ─────────────────────────────────────────────────────────
const CLASSES = [
  {
    id: 'animal', name: 'Animal', badge: 'CLASE ABSTRACTA',
    color: CY, position: [3.2, 1.8, 0],
    attrs: ['- nombre : String', '- edad   : Number'],
    methods: ['+ hablar()  : String', '+ moverse() : void'],
    description: 'Clase base que define la estructura común para todos los animales. No se instancia directamente.',
    concept: 'Abstracción',
    conceptColor: GR,
  },
  {
    id: 'perro', name: 'Perro', badge: 'extends Animal',
    color: '#38bdf8', position: [1.6, -1.2, 0],
    attrs: ['- raza  : String', '- dueño : String'],
    methods: ['+ hablar()  → "¡Woof!"', '+ fetch()   : void'],
    description: 'Hereda de Animal y sobrescribe hablar() retornando "¡Woof!". Agrega comportamiento específico de perros.',
    concept: 'Herencia + Polimorfismo',
    conceptColor: YE,
  },
  {
    id: 'gato', name: 'Gato', badge: 'extends Animal',
    color: '#7dd3fc', position: [4.8, -1.2, 0],
    attrs: ['- color  : String', '- indoor : Boolean'],
    methods: ['+ hablar()   → "¡Miau!"', '+ ronronear() : void'],
    description: 'Hereda de Animal y sobrescribe hablar() retornando "¡Miau!". Igual firma, distinto comportamiento.',
    concept: 'Herencia + Polimorfismo',
    conceptColor: YE,
  },
];

const PILLARS = [
  {
    id: 0, icon: '🔒', name: 'Encapsulamiento', color: OR,
    short: 'Dato privado. Acceso por métodos.',
    desc: 'Los atributos se marcan como privados (#saldo, _nombre). El acceso exterior solo ocurre a través de getters y setters, protegiendo el estado interno del objeto.',
    example: ['class Cuenta {', '  #saldo = 0;', '  depositar(n) {', '    if (n > 0) this.#saldo += n;', '  }', '  getSaldo() { return this.#saldo; }', '}'],
  },
  {
    id: 1, icon: '🧬', name: 'Herencia', color: YE,
    short: 'Reutiliza código del padre.',
    desc: 'Una clase hija extiende la clase padre con extends. Hereda sus atributos y métodos, y puede añadir los propios. super() invoca el constructor del padre.',
    example: ['class Perro extends Animal {', '  constructor(nombre, raza) {', '    super(nombre); // hereda', '    this.raza = raza;', '  }', '}'],
  },
  {
    id: 2, icon: '🎭', name: 'Polimorfismo', color: PU,
    short: 'Misma interfaz, distinto resultado.',
    desc: 'Un método con el mismo nombre puede comportarse diferente según el objeto. Animal.hablar() devuelve "..." pero Perro.hablar() devuelve "¡Woof!" y Gato.hablar() devuelve "¡Miau!".',
    example: ['const animales = [new Perro(), new Gato()];', 'animales.forEach(a => {', '  console.log(a.hablar());', '  // Perro → "¡Woof!"', '  // Gato  → "¡Miau!"', '});'],
  },
  {
    id: 3, icon: '🌀', name: 'Abstracción', color: GR,
    short: 'Oculta complejidad, muestra interfaz.',
    desc: 'La clase Animal define la interfaz (qué puede hacer) sin revelar el cómo. El usuario de la clase solo necesita conocer los métodos públicos, no la implementación interna.',
    example: ['// El usuario solo ve la interfaz', 'const animal = new Perro("Rex");', 'animal.hablar();  // "¡Woof!"', 'animal.moverse(); // se mueve', '// No sabe CÓMO está implementado'],
  },
];

const CODES = {
  default: null,
  animal: [
    '// 🌀 Abstracción: define la interfaz',
    'class Animal {',
    '  constructor(nombre, edad) {',
    '    this.nombre = nombre;',
    '    this.edad   = edad;',
    '  }',
    '',
    '  hablar()  { return "..."; }',
    '  moverse() { return "me muevo"; }',
    '}',
  ],
  perro: [
    '// 🧬 Herencia + 🎭 Polimorfismo',
    'class Perro extends Animal {',
    '  constructor(nombre, edad, raza) {',
    '    super(nombre, edad); // hereda',
    '    this.raza = raza;',
    '  }',
    '',
    '  hablar() {          // sobreescribe',
    '    return "¡Woof!";',
    '  }',
    '',
    '  fetch() { return "🎾 atrapado!"; }',
    '}',
  ],
  gato: [
    '// 🧬 Herencia + 🎭 Polimorfismo',
    'class Gato extends Animal {',
    '  constructor(nombre, edad, color) {',
    '    super(nombre, edad); // hereda',
    '    this.color = color;',
    '  }',
    '',
    '  hablar() {           // sobreescribe',
    '    return "¡Miau!";',
    '  }',
    '',
    '  ronronear() { return "~ purr ~"; }',
    '}',
  ],
};

// ── Componentes 3D ─────────────────────────────────────────────────────────────

const HoloScanner = () => {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.elapsedTime * 0.18) % 1;
    ref.current.position.y = -3.5 + t * 8;
    ref.current.material.opacity = 0.08 * Math.sin(Math.PI * t);
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[18, 0.06]} />
      <meshBasicMaterial color={CY} transparent opacity={0.08} />
    </mesh>
  );
};

const HoloRing = () => {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const s = 1 + 0.02 * Math.sin(clock.elapsedTime * 1.4);
    ref.current.scale.set(s, 1, s);
    ref.current.material.opacity = 0.04 + 0.025 * Math.sin(clock.elapsedTime * 2);
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.2, 0]}>
      <ringGeometry args={[7.5, 7.8, 80]} />
      <meshBasicMaterial color={CY} transparent opacity={0.04} side={THREE.DoubleSide} />
    </mesh>
  );
};

const GlowOrb = ({ color, active }) => {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const p = active ? 0.18 + 0.10 * Math.sin(clock.elapsedTime * 3) : 0.05;
    ref.current.material.opacity = p;
    if (active) {
      const s = 1 + 0.07 * Math.sin(clock.elapsedTime * 2.5);
      ref.current.scale.setScalar(s);
    }
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1.2, 16, 16]} />
      <meshBasicMaterial color={color} transparent opacity={0.05} />
    </mesh>
  );
};

const ClassNode = ({ cls, isSelected, onSelect }) => {
  const [hovered, setHovered] = useState(false);
  const hot = isSelected || hovered;
  return (
    <Html position={[0, 0, 0]} center distanceFactor={8} zIndexRange={[60, 0]}>
      <div
        onClick={() => onSelect(cls.id)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hot ? 'rgba(2,6,20,0.97)' : 'rgba(2,6,20,0.90)',
          border: `1px solid ${hot ? cls.color + '80' : cls.color + '35'}`,
          borderTop: `2px solid ${hot ? cls.color : cls.color + '60'}`,
          borderRadius: '10px',
          fontFamily: "'Courier New', monospace",
          color: '#e2e8f0',
          backdropFilter: 'blur(16px)',
          boxShadow: hot
            ? `0 0 36px ${cls.color}45, 0 0 80px ${cls.color}15, 0 12px 40px rgba(0,0,0,0.9)`
            : `0 0 20px ${cls.color}15, 0 8px 24px rgba(0,0,0,0.7)`,
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 3px, ${cls.color}06 3px, ${cls.color}06 4px)`,
          minWidth: '190px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          transform: hot ? 'scale(1.06)' : 'scale(1)',
          padding: '12px',
        }}
      >
        <div style={{ fontSize: '9px', color: hot ? OR : `${cls.color}80`, fontWeight: 700, letterSpacing: '2px', marginBottom: '5px', textTransform: 'uppercase' }}>
          {cls.badge}
        </div>
        <div style={{ fontSize: '17px', fontWeight: 800, color: hot ? '#fff' : cls.color, marginBottom: '10px' }}>
          {cls.name}
        </div>
        <div style={{ borderTop: `1px solid ${cls.color}25`, paddingTop: '8px', marginBottom: '7px' }}>
          {cls.attrs.map((a, i) => (
            <div key={i} style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.8 }}>{a}</div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${cls.color}18`, paddingTop: '8px' }}>
          {cls.methods.map((m, i) => (
            <div key={i} style={{ fontSize: '11px', color: hot ? CY : `${cls.color}cc`, lineHeight: 1.8 }}>{m}</div>
          ))}
        </div>
        {isSelected && (
          <div style={{ marginTop: '8px', textAlign: 'center', fontSize: '9px', color: GR, letterSpacing: '2px', fontWeight: 700, padding: '4px 0', borderTop: `1px solid ${GR}30` }}>
            ● VER CÓDIGO →
          </div>
        )}
      </div>
    </Html>
  );
};

const InheritanceLine = ({ from, to, label }) => {
  const lineRef = useRef();
  const mid = [(from[0] + to[0]) / 2 - 0.2, (from[1] + to[1]) / 2 + 0.15, 0];
  useFrame(({ clock }) => {
    if (lineRef.current?.material) {
      lineRef.current.material.opacity = 0.3 + 0.18 * Math.sin(clock.elapsedTime * 1.8);
    }
  });
  return (
    <>
      <Line ref={lineRef} points={[from, to]} color={CY} lineWidth={1.8} transparent opacity={0.4} dashed dashSize={0.15} gapSize={0.08} />
      <Text position={mid} fontSize={0.14} color={`${CY}cc`} anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#000">
        extends ▸
      </Text>
    </>
  );
};

const PillarNode = ({ pillar, position, isActive, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const hot = isActive || hovered;
  return (
    <Html position={position} center distanceFactor={8} zIndexRange={[50, 0]}>
      <div
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hot ? `${pillar.color}18` : 'rgba(2,6,20,0.85)',
          border: `1px solid ${hot ? pillar.color + '70' : pillar.color + '30'}`,
          borderRadius: '10px',
          padding: '10px 14px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          transform: hot ? 'scale(1.08) translateY(-2px)' : 'scale(1)',
          boxShadow: hot ? `0 0 30px ${pillar.color}40` : `0 0 15px ${pillar.color}15`,
          backdropFilter: 'blur(12px)',
          minWidth: '155px',
          maxWidth: '155px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '26px', lineHeight: 1, marginBottom: '6px' }}>{pillar.icon}</div>
        <div style={{ fontSize: '11px', fontWeight: 800, color: hot ? pillar.color : `${pillar.color}cc`, letterSpacing: '0.5px', fontFamily: 'system-ui', marginBottom: '4px' }}>
          {pillar.name}
        </div>
        <div style={{ fontSize: '9.5px', color: '#94a3b8', fontFamily: 'system-ui', lineHeight: 1.4 }}>
          {pillar.short}
        </div>
        <div style={{
          marginTop: '7px', height: '2px', borderRadius: '2px',
          background: `linear-gradient(90deg, ${pillar.color}, transparent)`,
          opacity: hot ? 1 : 0.4,
          transition: 'opacity 0.2s',
        }} />
        {isActive && <div style={{ fontSize: '9px', color: pillar.color, marginTop: '5px', fontWeight: 700, letterSpacing: '1.5px', fontFamily: 'monospace' }}>● ACTIVO</div>}
      </div>
    </Html>
  );
};

const AudioOrb = ({ analyzer }) => {
  const ref = useRef();
  const dataArr = useRef(new Uint8Array(128));
  useFrame(() => {
    if (!ref.current) return;
    if (analyzer) analyzer.getByteFrequencyData(dataArr.current);
    const bass = dataArr.current[2] / 255;
    const s = 1 + bass * 0.5;
    ref.current.scale.setScalar(s);
    ref.current.material.opacity = 0.1 + bass * 0.2;
  });
  return (
    <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.4}>
      <mesh ref={ref} position={[-0.8, 0.3, 0]}>
        <icosahedronGeometry args={[0.22, 1]} />
        <meshBasicMaterial color={CY} transparent opacity={0.12} wireframe />
      </mesh>
    </Float>
  );
};

const Scene3D = ({ selectedClass, selectedPillar, onSelectClass, onSelectPillar, analyzer }) => {
  const pillarPositions = [[-6.2, 2.0, -1], [-4.2, 2.0, -1], [-6.2, 0.1, -1], [-4.2, 0.1, -1]];

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[-4, 5, 4]} intensity={2.5} color={CY} />
      <pointLight position={[5, 4, 3]} intensity={2.0} color={OR} />
      <pointLight position={[0, -2, 5]} intensity={1.0} color={PU} />

      <Stars radius={50} depth={35} count={2500} factor={3} saturation={0} fade speed={0.25} />
      <gridHelper args={[22, 22, '#001529', '#001529']} position={[0, -3.0, 0]} />

      <HoloScanner />
      <HoloRing />
      <Sparkles count={70} scale={14} size={1.0} speed={0.2} opacity={0.2} color={CY} />

      <AudioOrb analyzer={analyzer} position={[-0.5, 0.3, 0]} />

      {/* Label diagrama */}
      <Text position={[3.2, 3.3, -0.8]} fontSize={0.28} color={CY} anchorX="center" letterSpacing={0.1} outlineWidth={0.02} outlineColor="#000">
        DIAGRAMA DE CLASES
      </Text>

      {/* Label pilares */}
      <Text position={[-5.2, 3.3, -0.8]} fontSize={0.28} color={OR} anchorX="center" letterSpacing={0.1} outlineWidth={0.02} outlineColor="#000">
        4 PILARES POO
      </Text>

      {/* Divisor */}
      <Line points={[[-0.8, 3.6, -0.9], [-0.8, -3.2, -0.9]]} color="#0a2040" lineWidth={1.5} transparent opacity={0.7} />

      {/* Clases UML */}
      {CLASSES.map(cls => (
        <group key={cls.id} position={cls.position}>
          <GlowOrb color={cls.color} active={selectedClass === cls.id} />
          <ClassNode cls={cls} isSelected={selectedClass === cls.id} onSelect={onSelectClass} />
        </group>
      ))}

      {/* Líneas herencia */}
      <InheritanceLine from={[3.2, 1.0, 0]} to={[1.6, -0.35, 0]} />
      <InheritanceLine from={[3.2, 1.0, 0]} to={[4.8, -0.35, 0]} />

      {/* Pilares */}
      {PILLARS.map((p, i) => (
        <PillarNode
          key={p.id} pillar={p} position={pillarPositions[i]}
          isActive={selectedPillar === p.id}
          onClick={() => onSelectPillar(p.id)}
        />
      ))}

      <CameraControls minDistance={5} maxDistance={20} minPolarAngle={Math.PI / 10} maxPolarAngle={Math.PI * 0.68} />
    </>
  );
};

// ── Panel de código animado ────────────────────────────────────────────────────
const CodePanel = ({ lines, accent, filename, onClose }) => {
  const [visible, setVisible] = useState(0);
  const [done, setDone] = useState(false);
  const key = lines.join('|');

  useEffect(() => {
    setVisible(0);
    setDone(false);
    const id = setInterval(() => {
      setVisible(v => {
        if (v >= lines.length) { clearInterval(id); setDone(true); return v; }
        return v + 1;
      });
    }, 140);
    return () => clearInterval(id);
  }, [key]);

  const getColor = (line) => {
    if (line.startsWith('//')) return '#4b6080';
    if (line.match(/^(class|extends|constructor|return|const|new|if)\b/)) return '#c084fc';
    if (line.includes('this.')) return '#60a5fa';
    if (line.includes('"') || line.includes("'")) return '#86efac';
    return '#cbd5e1';
  };

  return (
    <div style={{
      background: '#050d1a',
      border: `1px solid ${accent}30`,
      borderTop: `2px solid ${accent}`,
      borderRadius: '12px',
      fontFamily: "'Courier New', monospace",
      overflow: 'hidden',
    }}>
      {/* Terminal bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px',
        borderBottom: `1px solid ${accent}18`,
        background: '#030910',
      }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56', display: 'inline-block' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e', display: 'inline-block' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f', display: 'inline-block' }} />
        <span style={{ marginLeft: 8, fontSize: 11, color: '#475569', fontFamily: 'monospace' }}>{filename}</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: done ? '#4b5563' : GR }}>
          {done ? '✓ listo' : '● ejecutando...'}
        </span>
        {onClose && (
          <button onClick={onClose} style={{ marginLeft: 8, fontSize: 12, color: '#4b5563', cursor: 'pointer', background: 'none', border: 'none', lineHeight: 1 }}>✕</button>
        )}
      </div>
      {/* Código */}
      <div style={{ padding: '12px 14px', minHeight: '220px' }}>
        {lines.map((line, i) => {
          const show = done || i < visible;
          const isCurrent = !done && i === visible - 1;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', minHeight: '1.65em',
              opacity: show ? 1 : 0.06,
              transform: show ? 'none' : 'translateX(-6px)',
              transition: 'opacity 0.12s, transform 0.12s',
              borderLeft: isCurrent ? `2px solid ${accent}` : '2px solid transparent',
              background: isCurrent ? `${accent}12` : 'transparent',
              padding: '0 6px', marginLeft: '-6px', borderRadius: '3px',
            }}>
              <span style={{ color: '#1e3a5f', fontSize: 10, width: 22, textAlign: 'right', marginRight: 12, flexShrink: 0 }}>
                {i + 1}
              </span>
              <span style={{ color: getColor(line), fontSize: '12px' }}>{line || ' '}</span>
              {isCurrent && <span style={{ color: '#64748b', marginLeft: 3, animation: 'none' }}>▌</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Panel informativo lateral ──────────────────────────────────────────────────
const InfoPanel = ({ selectedClass, selectedPillar, onClearClass, onClearPillar }) => {
  const cls = CLASSES.find(c => c.id === selectedClass);
  const pillar = selectedPillar !== null ? PILLARS[selectedPillar] : null;

  if (!cls && !pillar) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Tutorial rápido */}
        <div style={{
          background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)',
          borderRadius: 12, padding: 18,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: CY, letterSpacing: '2px', marginBottom: 12, fontFamily: 'monospace' }}>
            CÓMO USAR
          </div>
          {[
            { icon: '🖱️', text: 'Haz clic en una clase del diagrama para ver su código' },
            { icon: '🧩', text: 'Haz clic en un pilar para leer su explicación detallada' },
            { icon: '🔄', text: 'Arrastra el canvas para orbitar la escena' },
            { icon: '🔍', text: 'Scroll para hacer zoom in/out' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>{item.text}</span>
            </div>
          ))}
        </div>

        {/* Resumen POO */}
        <div style={{
          background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.15)',
          borderRadius: 12, padding: 18, flex: 1,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: PU, letterSpacing: '2px', marginBottom: 12, fontFamily: 'monospace' }}>
            ¿QUÉ ES LA POO?
          </div>
          <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.7, margin: 0 }}>
            La <span style={{ color: '#c084fc' }}>Programación Orientada a Objetos</span> organiza el código en objetos que combinan datos (atributos) y comportamiento (métodos).
          </p>
          <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.7, marginTop: 10, marginBottom: 0 }}>
            Sus cuatro pilares son <span style={{ color: OR }}>Encapsulamiento</span>, <span style={{ color: YE }}>Herencia</span>, <span style={{ color: PU }}>Polimorfismo</span> y <span style={{ color: GR }}>Abstracción</span>.
          </p>
          <div style={{ marginTop: 16, padding: '10px 12px', background: 'rgba(168,85,247,0.08)', borderRadius: 8, border: '1px solid rgba(168,85,247,0.12)' }}>
            <code style={{ fontSize: 11, color: '#c084fc', fontFamily: 'monospace' }}>
              const obj = new Clase();<br />
              obj.metodo(); // ← así se usa
            </code>
          </div>
        </div>

        <div style={{ fontSize: 10, color: '#1e3a5f', textAlign: 'center', fontFamily: 'monospace', letterSpacing: '1px' }}>
          SELECCIONA UN ELEMENTO ARRIBA
        </div>
      </div>
    );
  }

  if (cls) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
        {/* Header clase */}
        <div style={{
          background: `${cls.color}10`, border: `1px solid ${cls.color}30`,
          borderTop: `2px solid ${cls.color}`, borderRadius: 12, padding: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 9, color: `${cls.color}80`, fontWeight: 700, letterSpacing: '2px', fontFamily: 'monospace', marginBottom: 4 }}>{cls.badge}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: cls.color }}>{cls.name}</div>
            </div>
            <button onClick={onClearClass} style={{ background: 'none', border: '1px solid #1e3a5f', color: '#475569', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 11 }}>✕</button>
          </div>
          <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>{cls.description}</p>
          <div style={{ marginTop: 10, display: 'inline-block', padding: '4px 10px', background: `${cls.conceptColor}15`, border: `1px solid ${cls.conceptColor}30`, borderRadius: 20 }}>
            <span style={{ fontSize: 10, color: cls.conceptColor, fontWeight: 700, fontFamily: 'monospace' }}>● {cls.concept}</span>
          </div>
        </div>

        {/* Código */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <CodePanel
            lines={CODES[cls.id]}
            accent={cls.color}
            filename={`${cls.id}.js`}
          />
        </div>
      </div>
    );
  }

  if (pillar) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
        {/* Header pilar */}
        <div style={{
          background: `${pillar.color}10`, border: `1px solid ${pillar.color}30`,
          borderTop: `2px solid ${pillar.color}`, borderRadius: 12, padding: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 32 }}>{pillar.icon}</span>
              <div>
                <div style={{ fontSize: 9, color: `${pillar.color}80`, fontWeight: 700, letterSpacing: '2px', fontFamily: 'monospace', marginBottom: 3 }}>PILAR POO</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: pillar.color }}>{pillar.name}</div>
              </div>
            </div>
            <button onClick={onClearPillar} style={{ background: 'none', border: '1px solid #1e3a5f', color: '#475569', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 11 }}>✕</button>
          </div>
          <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.7, margin: '12px 0 0' }}>{pillar.desc}</p>
        </div>

        {/* Ejemplo de código */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace', letterSpacing: '1.5px', marginBottom: 8, fontWeight: 700 }}>EJEMPLO PRÁCTICO</div>
          <CodePanel
            lines={pillar.example}
            accent={pillar.color}
            filename={`${pillar.name.toLowerCase()}.js`}
          />
        </div>
      </div>
    );
  }

  return null;
};

// ── Página principal ───────────────────────────────────────────────────────────
const ThreeDExperiencePage = ({ audioRef, isPlaying }) => {
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedPillar, setSelectedPillar] = useState(null);
  const [analyzer, setAnalyzer] = useState(null);

  useEffect(() => {
    if (isPlaying && audioRef?.current) {
      const a = getAnalyser(audioRef.current);
      if (a) setAnalyzer(a);
    }
  }, [isPlaying]);

  const handleSelectClass = (id) => {
    setSelectedClass(prev => prev === id ? null : id);
    setSelectedPillar(null);
  };
  const handleSelectPillar = (id) => {
    setSelectedPillar(prev => prev === id ? null : id);
    setSelectedClass(null);
  };

  const activeCls = CLASSES.find(c => c.id === selectedClass);
  const activePillar = selectedPillar !== null ? PILLARS[selectedPillar] : null;
  const activeColor = activeCls?.color ?? activePillar?.color ?? CY;

  return (
    <div className="pb-36 animate-in fade-in duration-500" style={{ fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <header style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 6, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#f1f5f9', margin: 0, lineHeight: 1.1 }}>
            Laboratorio{' '}
            <span style={{ color: CY }}>Holográfico</span>{' '}
            <span style={{ color: '#475569' }}>POO</span>
          </h1>
          {(activeCls || activePillar) && (
            <span style={{
              padding: '4px 14px', borderRadius: 999, fontSize: 11, fontWeight: 700,
              border: `1px solid ${activeColor}40`, color: activeColor,
              background: `${activeColor}12`, fontFamily: 'monospace',
            }}>
              ● {activeCls?.name ?? activePillar?.name}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: '#475569' }}>Diagrama UML · 4 Pilares · Consola interactiva</span>
          {isPlaying && (
            <span style={{ fontSize: 11, color: GR, fontFamily: 'monospace', fontWeight: 700 }}>● AUDIO REACTIVO</span>
          )}
        </div>
      </header>

      {/* Layout principal: Canvas + Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, alignItems: 'stretch' }}>

        {/* Canvas 3D */}
        <div style={{
          position: 'relative', borderRadius: 20, overflow: 'hidden',
          border: `1px solid ${activeColor}18`, background: '#020812',
          height: '72vh', minHeight: 480,
          transition: 'border-color 0.4s',
        }}>
          <Canvas camera={{ position: [-0.8, 1.2, 13], fov: 54 }} dpr={[1, 2]}>
            <Scene3D
              selectedClass={selectedClass}
              selectedPillar={selectedPillar}
              onSelectClass={handleSelectClass}
              onSelectPillar={handleSelectPillar}
              analyzer={analyzer}
            />
          </Canvas>

          {/* Overlay: clase activa */}
          {activeCls && (
            <div style={{
              position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
              borderRadius: 999, padding: '6px 16px', border: `1px solid ${activeCls.color}30`,
              display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'none',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: activeCls.color, display: 'inline-block' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: activeCls.color, fontFamily: 'monospace' }}>{activeCls.name}</span>
              <span style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace' }}>— {activeCls.badge}</span>
            </div>
          )}

          {/* Hint cuando nada está seleccionado */}
          {!selectedClass && !selectedPillar && (
            <div style={{
              position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
              pointerEvents: 'none',
            }}>
              <div style={{
                background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                borderRadius: 999, padding: '8px 20px', border: `1px solid ${CY}18`,
              }}>
                <p style={{ fontSize: 11, fontFamily: 'monospace', color: `${CY}70`, margin: 0 }}>
                  Haz clic en una clase o pilar · Arrastra para orbitar · Scroll para zoom
                </p>
              </div>
            </div>
          )}

          {/* Audio indicator */}
          <div style={{
            position: 'absolute', top: 14, left: 14,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
            borderRadius: 8, padding: '5px 10px', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <p style={{ fontSize: 10, fontFamily: 'monospace', color: isPlaying ? GR : '#1e3a5f', margin: 0 }}>
              {isPlaying ? '● AUDIO' : '○ sin audio'}
            </p>
          </div>
        </div>

        {/* Panel de información */}
        <div style={{
          background: '#030d1a',
          border: `1px solid ${activeColor}18`,
          borderRadius: 20,
          padding: 18,
          height: '72vh',
          minHeight: 480,
          overflow: 'auto',
          transition: 'border-color 0.4s',
        }}>
          <InfoPanel
            selectedClass={selectedClass}
            selectedPillar={selectedPillar}
            onClearClass={() => setSelectedClass(null)}
            onClearPillar={() => setSelectedPillar(null)}
          />
        </div>
      </div>

      {/* Barra inferior: acceso rápido a pilares */}
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {PILLARS.map(p => (
          <button
            key={p.id}
            onClick={() => handleSelectPillar(p.id)}
            style={{
              background: selectedPillar === p.id ? `${p.color}18` : 'rgba(3,13,26,0.8)',
              border: `1px solid ${selectedPillar === p.id ? p.color + '60' : p.color + '20'}`,
              borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', gap: 10,
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 20 }}>{p.icon}</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: selectedPillar === p.id ? p.color : `${p.color}cc`, fontFamily: 'system-ui' }}>
                {p.name}
              </div>
              <div style={{ fontSize: 10, color: '#475569', marginTop: 2, fontFamily: 'system-ui' }}>
                {p.short}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThreeDExperiencePage;
