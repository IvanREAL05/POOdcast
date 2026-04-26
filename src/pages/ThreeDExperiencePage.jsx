import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Text, CameraControls, Line, Html, Sparkles, Float } from '@react-three/drei';
import * as THREE from 'three';
import { getAnalyser } from '../utils/sharedAudio';
import { Lock, Unlock, Trophy, Target, Sparkle, X, Check, ChevronRight, Zap, Award, Star } from 'lucide-react';

// ── Paleta ─────────────────────────────────────────────────────────────────────
const CY = '#00d4ff';
const OR = '#ff6b00';
const PU = '#a855f7';
const GR = '#10b981';
const YE = '#fbbf24';
const RD = '#ef4444';

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
    missionGoal: 'Aprende a proteger el estado interno de tus objetos',
    xpReward: 100,
  },
  {
    id: 1, icon: '🧬', name: 'Herencia', color: YE,
    short: 'Reutiliza código del padre.',
    desc: 'Una clase hija extiende la clase padre con extends. Hereda sus atributos y métodos, y puede añadir los propios. super() invoca el constructor del padre.',
    example: ['class Perro extends Animal {', '  constructor(nombre, raza) {', '    super(nombre); // hereda', '    this.raza = raza;', '  }', '}'],
    missionGoal: 'Domina la reutilización de código entre clases',
    xpReward: 150,
  },
  {
    id: 2, icon: '🎭', name: 'Polimorfismo', color: PU,
    short: 'Misma interfaz, distinto resultado.',
    desc: 'Un método con el mismo nombre puede comportarse diferente según el objeto. Animal.hablar() devuelve "..." pero Perro.hablar() devuelve "¡Woof!" y Gato.hablar() devuelve "¡Miau!".',
    example: ['const animales = [new Perro(), new Gato()];', 'animales.forEach(a => {', '  console.log(a.hablar());', '  // Perro → "¡Woof!"', '  // Gato  → "¡Miau!"', '});'],
    missionGoal: 'Descubre cómo un mensaje puede tener mil respuestas',
    xpReward: 200,
  },
  {
    id: 3, icon: '🌀', name: 'Abstracción', color: GR,
    short: 'Oculta complejidad, muestra interfaz.',
    desc: 'La clase Animal define la interfaz (qué puede hacer) sin revelar el cómo. El usuario de la clase solo necesita conocer los métodos públicos, no la implementación interna.',
    example: ['// El usuario solo ve la interfaz', 'const animal = new Perro("Rex");', 'animal.hablar();  // "¡Woof!"', 'animal.moverse(); // se mueve', '// No sabe CÓMO está implementado'],
    missionGoal: 'Aprende a diseñar interfaces que oculten la complejidad',
    xpReward: 250,
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

// ── Quizzes por pilar (3 preguntas cada uno) ──────────────────────────────────
const QUIZZES = {
  0: [
    {
      q: '¿Qué prefijo usa JavaScript moderno para marcar un atributo como verdaderamente privado?',
      options: ['_saldo', '#saldo', 'private saldo', 'hidden saldo'],
      correct: 1,
      explain: 'En JS moderno, # marca un atributo como privado de clase. _ es solo una convención de nombre.',
    },
    {
      q: '¿Cuál es el principal beneficio del encapsulamiento?',
      options: ['Hace el código más rápido', 'Protege el estado interno y controla el acceso', 'Permite herencia múltiple', 'Reduce el tamaño del bundle'],
      correct: 1,
      explain: 'Encapsular protege los datos: nadie los modifica sin pasar por los métodos que tú defines.',
    },
    {
      q: '¿Para qué sirve un método getter como getSaldo()?',
      options: ['Para crear nuevos objetos', 'Para acceder al valor de forma controlada', 'Para heredar de la clase padre', 'Para destruir el objeto'],
      correct: 1,
      explain: 'Un getter permite leer un valor pero el dato sigue siendo privado: no puede modificarse desde fuera.',
    },
  ],
  1: [
    {
      q: '¿Qué palabra clave usa JavaScript para que una clase herede de otra?',
      options: ['inherit', 'parent', 'extends', 'super'],
      correct: 2,
      explain: '"extends" indica que la clase hija hereda atributos y métodos de la clase padre.',
    },
    {
      q: 'En el constructor de Perro, ¿qué hace super(nombre)?',
      options: ['Crea una instancia de Perro', 'Llama al constructor de la clase padre', 'Define un atributo privado', 'Sobrescribe hablar()'],
      correct: 1,
      explain: 'super() invoca el constructor del padre, asegurando que la inicialización heredada se ejecute primero.',
    },
    {
      q: 'Si Perro extends Animal y Animal tiene moverse(), entonces un Perro...',
      options: ['No puede usar moverse()', 'Hereda moverse() automáticamente', 'Tiene que reescribir moverse()', 'Solo puede usarlo si lo declara igual'],
      correct: 1,
      explain: 'Toda clase hija hereda los métodos públicos del padre sin escribir nada extra.',
    },
  ],
  2: [
    {
      q: 'Cuando una subclase reescribe un método del padre con la misma firma, eso se llama...',
      options: ['Override', 'Encapsulamiento', 'Composición', 'Casting'],
      correct: 0,
      explain: 'Override (sobrescritura) reemplaza la implementación heredada con una propia.',
    },
    {
      q: 'Si tienes un Perro guardado en una variable de tipo Animal y llamas a animal.hablar(), ¿qué se ejecuta?',
      options: ['El método de Animal', 'Error: no se sabe', 'El método de Perro (la clase real del objeto)', 'Ambos a la vez'],
      correct: 2,
      explain: 'En tiempo de ejecución se llama al método de la clase real. Eso es polimorfismo dinámico.',
    },
    {
      q: '¿Cuál frase resume mejor el polimorfismo?',
      options: ['Crear muchas clases distintas', 'Una sola interfaz, múltiples comportamientos', 'Heredar siempre de una clase abstracta', 'Encapsular cada atributo'],
      correct: 1,
      explain: 'Polimorfismo = mismo mensaje, respuestas distintas según el objeto que lo recibe.',
    },
  ],
  3: [
    {
      q: '¿Qué oculta la abstracción al usuario de una clase?',
      options: ['El nombre de la clase', 'La complejidad de la implementación interna', 'Los pilares de la POO', 'El número de instancias'],
      correct: 1,
      explain: 'La abstracción oculta el "cómo" y expone solo el "qué". Tú usas el método sin ver su código.',
    },
    {
      q: '¿Qué expone públicamente una buena abstracción?',
      options: ['Los atributos privados', 'La interfaz: los métodos públicos necesarios', 'El estado completo del objeto', 'Toda la jerarquía de herencia'],
      correct: 1,
      explain: 'Lo público es la interfaz, el contrato. Lo demás permanece oculto.',
    },
    {
      q: 'Una clase abstracta...',
      options: ['No puede instanciarse directamente; sirve como plantilla', 'Solo tiene atributos, no métodos', 'No puede ser heredada', 'Es lo mismo que una interfaz vacía'],
      correct: 0,
      explain: 'Una clase abstracta define la forma y comportamiento común, pero las subclases la concretan.',
    },
  ],
};

const ACHIEVEMENTS = {
  'first-blood': { icon: '🎯', name: 'Primera Sangre', desc: 'Completaste tu primera misión' },
  'perfectionist': { icon: '💎', name: 'Perfeccionista', desc: 'Quiz sin errores' },
  'half-master': { icon: '⚡', name: 'A Mitad de Camino', desc: '2 pilares dominados' },
  'oop-master': { icon: '👑', name: 'Maestro de la POO', desc: 'Los 4 pilares completados' },
  'explorer': { icon: '🔍', name: 'Explorador', desc: 'Inspeccionaste las 3 clases' },
};

// ── localStorage ──────────────────────────────────────────────────────────────
const GAME_KEY = 'poodcast-game-state';
const INITIAL_STATE = {
  xp: 0,
  completedPillars: [],
  achievements: [],
  inspectedClasses: [],
  mode: null, // null | 'campaign' | 'free'
};
function loadGame() {
  try {
    const raw = localStorage.getItem(GAME_KEY);
    if (!raw) return { ...INITIAL_STATE };
    return { ...INITIAL_STATE, ...JSON.parse(raw) };
  } catch { return { ...INITIAL_STATE }; }
}
function saveGame(s) {
  try { localStorage.setItem(GAME_KEY, JSON.stringify(s)); } catch {}
}

// Nivel calculado a partir del XP (cada 250 xp = 1 nivel)
const xpToLevel = (xp) => Math.floor(xp / 250) + 1;
const xpInLevel = (xp) => xp % 250;
const xpNeeded = 250;

// ── Beep simple (Web Audio) ──
let _beepCtx = null;
function beep(freq = 600, dur = 0.08, type = 'square') {
  try {
    _beepCtx = _beepCtx ?? new (window.AudioContext || window.webkitAudioContext)();
    const o = _beepCtx.createOscillator();
    const g = _beepCtx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = 0.04;
    o.connect(g); g.connect(_beepCtx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, _beepCtx.currentTime + dur);
    o.stop(_beepCtx.currentTime + dur);
  } catch {}
}
const sfx = {
  click: () => beep(800, 0.05, 'square'),
  correct: () => { beep(880, 0.10); setTimeout(() => beep(1320, 0.14), 90); },
  wrong: () => beep(180, 0.18, 'sawtooth'),
  unlock: () => { beep(660, 0.08); setTimeout(() => beep(990, 0.08), 80); setTimeout(() => beep(1320, 0.18), 160); },
  victory: () => { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.18, 'triangle'), i * 130)); },
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

const InheritanceLine = ({ from, to }) => {
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

const PillarNode = ({ pillar, position, isActive, isLocked, isCompleted, isCurrent, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const hot = (isActive || hovered) && !isLocked;
  const baseColor = isLocked ? '#475569' : pillar.color;

  return (
    <Html position={position} center distanceFactor={8} zIndexRange={[50, 0]}>
      <div
        onClick={() => !isLocked && onClick()}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hot ? `${baseColor}18` : 'rgba(2,6,20,0.85)',
          border: `1px solid ${hot ? baseColor + '70' : baseColor + '30'}`,
          borderRadius: '10px',
          padding: '10px 14px',
          cursor: isLocked ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          transform: hot ? 'scale(1.08) translateY(-2px)' : 'scale(1)',
          boxShadow: hot ? `0 0 30px ${baseColor}40` : `0 0 15px ${baseColor}15`,
          backdropFilter: 'blur(12px)',
          minWidth: '155px',
          maxWidth: '155px',
          textAlign: 'center',
          opacity: isLocked ? 0.55 : 1,
          position: 'relative',
        }}
      >
        {/* Badge esquina */}
        {isCompleted && (
          <div style={{
            position: 'absolute', top: -7, right: -7, width: 22, height: 22, borderRadius: '50%',
            background: GR, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 14px ${GR}70`, border: '2px solid #020812',
          }}>
            <Check size={12} color="#fff" strokeWidth={3.5} />
          </div>
        )}
        {isCurrent && !isCompleted && (
          <div style={{
            position: 'absolute', top: -8, right: -8, padding: '2px 7px', borderRadius: 999,
            background: pillar.color, fontSize: 8, color: '#020812', fontWeight: 900,
            letterSpacing: '1px', fontFamily: 'monospace', border: '2px solid #020812',
            boxShadow: `0 0 14px ${pillar.color}90`, animation: 'pulse-soft 1.6s infinite',
          }}>
            MISIÓN
          </div>
        )}
        {isLocked && (
          <div style={{
            position: 'absolute', top: -7, right: -7, width: 22, height: 22, borderRadius: '50%',
            background: '#1e293b', border: '2px solid #020812',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Lock size={11} color="#94a3b8" />
          </div>
        )}

        <div style={{ fontSize: '26px', lineHeight: 1, marginBottom: '6px', filter: isLocked ? 'grayscale(1)' : 'none' }}>{pillar.icon}</div>
        <div style={{ fontSize: '11px', fontWeight: 800, color: hot ? baseColor : `${baseColor}cc`, letterSpacing: '0.5px', fontFamily: 'system-ui', marginBottom: '4px' }}>
          {pillar.name}
        </div>
        <div style={{ fontSize: '9.5px', color: '#94a3b8', fontFamily: 'system-ui', lineHeight: 1.4 }}>
          {isLocked ? 'Completa la misión anterior' : pillar.short}
        </div>
        <div style={{
          marginTop: '7px', height: '2px', borderRadius: '2px',
          background: `linear-gradient(90deg, ${baseColor}, transparent)`,
          opacity: hot ? 1 : 0.4,
          transition: 'opacity 0.2s',
        }} />
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

// ── Confetti 3D ────────────────────────────────────────────────────────────────
const ConfettiBurst = ({ trigger, color }) => {
  const groupRef = useRef();
  const piecesRef = useRef([]);
  const COUNT = 60;

  useEffect(() => {
    if (trigger && groupRef.current) {
      piecesRef.current = Array.from({ length: COUNT }, () => ({
        v: [(Math.random() - 0.5) * 0.18, Math.random() * 0.20 + 0.08, (Math.random() - 0.5) * 0.18],
        rot: [Math.random() * 0.2, Math.random() * 0.2, Math.random() * 0.2],
        life: 1,
      }));
      groupRef.current.children.forEach((c, i) => {
        c.position.set(0, 0, 0);
        c.visible = true;
      });
    }
  }, [trigger]);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((c, i) => {
      const p = piecesRef.current[i];
      if (!p) return;
      if (p.life <= 0) { c.visible = false; return; }
      c.position.x += p.v[0];
      c.position.y += p.v[1];
      c.position.z += p.v[2];
      p.v[1] -= 0.006; // gravedad
      c.rotation.x += p.rot[0];
      c.rotation.y += p.rot[1];
      c.rotation.z += p.rot[2];
      p.life -= 0.012;
      c.material.opacity = Math.max(0, p.life);
    });
  });

  const palette = [color, '#fff', YE, GR, CY];
  return (
    <group ref={groupRef} position={[0, 0, 1]}>
      {Array.from({ length: COUNT }).map((_, i) => (
        <mesh key={i} visible={false}>
          <planeGeometry args={[0.10, 0.16]} />
          <meshBasicMaterial color={palette[i % palette.length]} side={THREE.DoubleSide} transparent />
        </mesh>
      ))}
    </group>
  );
};

// ── CameraRig: anima la cámara hacia el target ────────────────────────────────
const CameraRig = ({ target, controlsRef }) => {
  const { camera } = useThree();
  const targetVec = useRef(new THREE.Vector3());
  const lookVec = useRef(new THREE.Vector3());

  useFrame(() => {
    if (!target || !controlsRef.current) return;
    targetVec.current.set(target.cam[0], target.cam[1], target.cam[2]);
    lookVec.current.set(target.look[0], target.look[1], target.look[2]);

    if (target.smooth !== false) {
      camera.position.lerp(targetVec.current, 0.06);
      const cur = controlsRef.current.getTarget(new THREE.Vector3());
      cur.lerp(lookVec.current, 0.06);
      controlsRef.current.setTarget(cur.x, cur.y, cur.z, false);
    }
  });

  return null;
};

// ── Escena 3D ──────────────────────────────────────────────────────────────────
const Scene3D = ({
  selectedClass, selectedPillar, onSelectClass, onSelectPillar,
  analyzer, gameState, currentMission, cameraTarget, controlsRef, confettiTrigger, confettiColor,
}) => {
  const pillarPositions = [[-6.2, 2.0, -1], [-4.2, 2.0, -1], [-6.2, 0.1, -1], [-4.2, 0.1, -1]];

  const isLocked = (id) => gameState.mode === 'campaign' &&
    !gameState.completedPillars.includes(id) && id !== currentMission;

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

      <AudioOrb analyzer={analyzer} />

      <Text position={[3.2, 3.3, -0.8]} fontSize={0.28} color={CY} anchorX="center" letterSpacing={0.1} outlineWidth={0.02} outlineColor="#000">
        DIAGRAMA DE CLASES
      </Text>
      <Text position={[-5.2, 3.3, -0.8]} fontSize={0.28} color={OR} anchorX="center" letterSpacing={0.1} outlineWidth={0.02} outlineColor="#000">
        4 PILARES POO
      </Text>

      <Line points={[[-0.8, 3.6, -0.9], [-0.8, -3.2, -0.9]]} color="#0a2040" lineWidth={1.5} transparent opacity={0.7} />

      {/* Clases */}
      {CLASSES.map(cls => (
        <group key={cls.id} position={cls.position}>
          <GlowOrb color={cls.color} active={selectedClass === cls.id} />
          <ClassNode cls={cls} isSelected={selectedClass === cls.id} onSelect={onSelectClass} />
        </group>
      ))}

      <InheritanceLine from={[3.2, 1.0, 0]} to={[1.6, -0.35, 0]} />
      <InheritanceLine from={[3.2, 1.0, 0]} to={[4.8, -0.35, 0]} />

      {/* Pilares */}
      {PILLARS.map((p, i) => (
        <PillarNode
          key={p.id} pillar={p} position={pillarPositions[i]}
          isActive={selectedPillar === p.id}
          isLocked={isLocked(p.id)}
          isCompleted={gameState.completedPillars.includes(p.id)}
          isCurrent={gameState.mode === 'campaign' && currentMission === p.id}
          onClick={() => onSelectPillar(p.id)}
        />
      ))}

      {/* Confetti */}
      <ConfettiBurst trigger={confettiTrigger} color={confettiColor} />

      <CameraControls
        ref={controlsRef}
        minDistance={5} maxDistance={20}
        minPolarAngle={Math.PI / 10} maxPolarAngle={Math.PI * 0.68}
      />
      <CameraRig target={cameraTarget} controlsRef={controlsRef} />
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
              {isCurrent && <span style={{ color: '#64748b', marginLeft: 3 }}>▌</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── HUD de jugador (barra superior con XP, nivel) ──────────────────────────────
const GameHUD = ({ gameState, onReset, onChangeMode }) => {
  const lvl = xpToLevel(gameState.xp);
  const inLvl = xpInLevel(gameState.xp);
  const progress = (inLvl / xpNeeded) * 100;
  const completedCount = gameState.completedPillars.length;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16, padding: '10px 16px',
      background: 'linear-gradient(90deg, rgba(0,212,255,0.08), rgba(168,85,247,0.06))',
      border: '1px solid rgba(0,212,255,0.20)',
      borderRadius: 14, marginBottom: 12,
      backdropFilter: 'blur(12px)',
      flexWrap: 'wrap',
    }}>
      {/* Level badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 10,
          background: `linear-gradient(135deg, ${CY}, ${PU})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 900, color: '#020812',
          boxShadow: `0 0 18px ${CY}50`, fontFamily: 'monospace',
        }}>
          {lvl}
        </div>
        <div>
          <div style={{ fontSize: 9, color: '#475569', fontWeight: 700, letterSpacing: 2, fontFamily: 'monospace' }}>NIVEL</div>
          <div style={{ fontSize: 13, color: '#fff', fontWeight: 800, fontFamily: 'system-ui' }}>Aprendiz POO</div>
        </div>
      </div>

      {/* XP bar */}
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 10, fontFamily: 'monospace' }}>
          <span style={{ color: YE, fontWeight: 700 }}>● XP {gameState.xp}</span>
          <span style={{ color: '#475569' }}>{inLvl} / {xpNeeded}</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: 'rgba(0,0,0,0.4)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{
            width: `${progress}%`, height: '100%',
            background: `linear-gradient(90deg, ${YE}, ${OR})`,
            boxShadow: `0 0 10px ${YE}80`,
            transition: 'width 0.6s ease',
          }} />
        </div>
      </div>

      {/* Misiones */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <Trophy size={14} color={GR} />
        <span style={{ fontSize: 11, color: '#cbd5e1', fontFamily: 'monospace', fontWeight: 700 }}>
          {completedCount} / 4
        </span>
        <span style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace' }}>PILARES</span>
      </div>

      {/* Logros */}
      <div style={{ display: 'flex', gap: 4 }}>
        {Object.keys(ACHIEVEMENTS).slice(0, 5).map(key => {
          const has = gameState.achievements.includes(key);
          const a = ACHIEVEMENTS[key];
          return (
            <div key={key} title={`${a.name}: ${a.desc}`} style={{
              width: 26, height: 26, borderRadius: 6,
              background: has ? `${YE}25` : 'rgba(0,0,0,0.3)',
              border: `1px solid ${has ? YE + '60' : '#1e293b'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, opacity: has ? 1 : 0.3,
              filter: has ? 'none' : 'grayscale(1)',
              boxShadow: has ? `0 0 10px ${YE}40` : 'none',
            }}>
              {a.icon}
            </div>
          );
        })}
      </div>

      {/* Mode toggle */}
      <button
        onClick={onChangeMode}
        style={{
          padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.10)',
          background: 'rgba(0,0,0,0.4)', color: '#cbd5e1', fontSize: 10, fontWeight: 700,
          fontFamily: 'monospace', cursor: 'pointer', letterSpacing: 1,
        }}
      >
        {gameState.mode === 'campaign' ? '🎯 CAMPAÑA' : '🔓 MODO LIBRE'}
      </button>

      <button
        onClick={onReset}
        title="Reiniciar progreso"
        style={{
          padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.20)',
          background: 'rgba(239,68,68,0.05)', color: RD, fontSize: 11,
          cursor: 'pointer',
        }}
      >
        ↻
      </button>
    </div>
  );
};

// ── Tarjeta de misión actual ──────────────────────────────────────────────────
const MissionCard = ({ pillar, onStartQuiz, completed }) => (
  <div style={{
    padding: 16, borderRadius: 14,
    background: `linear-gradient(135deg, ${pillar.color}15, transparent)`,
    border: `1px solid ${pillar.color}40`,
    borderLeft: `4px solid ${pillar.color}`,
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <span style={{ fontSize: 28 }}>{pillar.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 9, color: pillar.color, fontWeight: 700, letterSpacing: 2, fontFamily: 'monospace' }}>
          MISIÓN ACTUAL · +{pillar.xpReward} XP
        </div>
        <div style={{ fontSize: 17, fontWeight: 900, color: '#fff', fontFamily: 'system-ui' }}>
          {pillar.name}
        </div>
      </div>
      {completed && (
        <div style={{
          padding: '4px 10px', borderRadius: 999, background: `${GR}20`,
          border: `1px solid ${GR}50`, fontSize: 10, color: GR, fontWeight: 700,
          fontFamily: 'monospace', letterSpacing: 1,
        }}>
          ✓ COMPLETADA
        </div>
      )}
    </div>
    <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, margin: '0 0 12px' }}>
      <Target size={11} style={{ display: 'inline', marginRight: 5, marginBottom: -1 }} />
      {pillar.missionGoal}
    </p>
    <button
      onClick={onStartQuiz}
      disabled={completed}
      style={{
        width: '100%', padding: '10px 14px', borderRadius: 10,
        background: completed ? 'rgba(255,255,255,0.05)' : `linear-gradient(90deg, ${pillar.color}, ${pillar.color}aa)`,
        border: 'none',
        color: completed ? '#64748b' : '#020812',
        fontSize: 12, fontWeight: 900, fontFamily: 'system-ui',
        cursor: completed ? 'not-allowed' : 'pointer',
        letterSpacing: 1,
        boxShadow: completed ? 'none' : `0 0 20px ${pillar.color}50`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'transform 0.15s',
      }}
      onMouseEnter={e => !completed && (e.currentTarget.style.transform = 'scale(1.02)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      <Zap size={14} />
      {completed ? 'YA SUPERADA' : 'INICIAR DESAFÍO'}
      {!completed && <ChevronRight size={14} />}
    </button>
  </div>
);

// ── Modal de Quiz ──────────────────────────────────────────────────────────────
const QuizModal = ({ pillar, onComplete, onClose }) => {
  const questions = QUIZZES[pillar.id];
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  const q = questions[step];
  const isLast = step === questions.length - 1;
  const total = questions.length;

  const handlePick = (idx) => {
    if (picked !== null) return;
    setPicked(idx);
    if (idx === q.correct) {
      setScore(s => s + 1);
      sfx.correct();
    } else {
      setMistakes(m => m + 1);
      sfx.wrong();
    }
  };

  const next = () => {
    if (isLast) {
      onComplete({ correct: score, total, mistakes });
    } else {
      setStep(s => s + 1);
      setPicked(null);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)', zIndex: 999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      animation: 'fade-in 0.25s',
    }}>
      <div style={{
        maxWidth: 620, width: '100%', background: '#050d1a',
        border: `1px solid ${pillar.color}40`,
        borderTop: `3px solid ${pillar.color}`,
        borderRadius: 18, padding: 24,
        boxShadow: `0 0 60px ${pillar.color}30, 0 20px 60px rgba(0,0,0,0.6)`,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 30 }}>{pillar.icon}</span>
            <div>
              <div style={{ fontSize: 9, color: `${pillar.color}aa`, fontWeight: 700, letterSpacing: 2, fontFamily: 'monospace' }}>
                DESAFÍO · {pillar.name.toUpperCase()}
              </div>
              <div style={{ fontSize: 14, color: '#fff', fontWeight: 800 }}>
                Pregunta {step + 1} / {total}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: '1px solid #1e293b', color: '#64748b',
            borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex',
          }}>
            <X size={14} />
          </button>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
          {questions.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i < step ? pillar.color : i === step ? `${pillar.color}50` : '#1e293b',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {/* Pregunta */}
        <div style={{
          padding: 16, borderRadius: 12,
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 10, color: '#475569', letterSpacing: 2, fontFamily: 'monospace', marginBottom: 8, fontWeight: 700 }}>
            ◆ PREGUNTA
          </div>
          <p style={{ fontSize: 16, color: '#e2e8f0', lineHeight: 1.5, margin: 0, fontWeight: 600 }}>
            {q.q}
          </p>
        </div>

        {/* Opciones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {q.options.map((opt, i) => {
            const isPicked = picked === i;
            const isCorrect = i === q.correct;
            const showResult = picked !== null;
            let bg = 'rgba(255,255,255,0.03)';
            let border = '#1e293b';
            let color = '#cbd5e1';

            if (showResult) {
              if (isCorrect) { bg = `${GR}15`; border = GR; color = GR; }
              else if (isPicked) { bg = `${RD}15`; border = RD; color = RD; }
              else { bg = 'rgba(255,255,255,0.02)'; color = '#475569'; }
            } else if (isPicked) {
              bg = `${pillar.color}15`; border = pillar.color;
            }

            return (
              <button
                key={i}
                onClick={() => handlePick(i)}
                disabled={showResult}
                style={{
                  padding: '12px 14px', borderRadius: 10,
                  background: bg, border: `1px solid ${border}`,
                  color, fontSize: 13, textAlign: 'left',
                  cursor: showResult ? 'default' : 'pointer',
                  fontFamily: 'system-ui', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 12,
                  transition: 'all 0.18s',
                  transform: showResult && isCorrect ? 'scale(1.01)' : 'scale(1)',
                }}
                onMouseEnter={e => !showResult && (e.currentTarget.style.background = `${pillar.color}10`)}
                onMouseLeave={e => !showResult && (e.currentTarget.style.background = bg)}
              >
                <span style={{
                  width: 26, height: 26, borderRadius: 6,
                  background: showResult && isCorrect ? GR : showResult && isPicked ? RD : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${showResult && (isCorrect || isPicked) ? 'transparent' : '#1e293b'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'monospace', fontSize: 11, fontWeight: 800,
                  color: showResult && (isCorrect || isPicked) ? '#020812' : '#64748b',
                  flexShrink: 0,
                }}>
                  {showResult && isCorrect ? '✓' : showResult && isPicked ? '✕' : String.fromCharCode(65 + i)}
                </span>
                <span style={{ flex: 1 }}>{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Explicación */}
        {picked !== null && (
          <div style={{
            padding: 12, borderRadius: 10,
            background: picked === q.correct ? `${GR}10` : `${RD}10`,
            border: `1px solid ${picked === q.correct ? GR : RD}30`,
            marginBottom: 16,
            animation: 'fade-in 0.25s',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, fontFamily: 'monospace', marginBottom: 4, color: picked === q.correct ? GR : RD }}>
              {picked === q.correct ? '✓ CORRECTO' : '✗ INCORRECTO'}
            </div>
            <p style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
              {q.explain}
            </p>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace' }}>
            ✓ {score} aciertos · ✗ {mistakes} fallos
          </div>
          <button
            onClick={next}
            disabled={picked === null}
            style={{
              padding: '10px 22px', borderRadius: 10,
              background: picked === null ? '#1e293b' : `linear-gradient(90deg, ${pillar.color}, ${pillar.color}cc)`,
              border: 'none',
              color: picked === null ? '#475569' : '#020812',
              fontSize: 12, fontWeight: 900, letterSpacing: 1,
              cursor: picked === null ? 'not-allowed' : 'pointer',
              fontFamily: 'system-ui',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {isLast ? 'FINALIZAR' : 'SIGUIENTE'} <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Pantalla de resultado de misión ────────────────────────────────────────────
const ResultScreen = ({ pillar, result, achievements, onContinue }) => {
  const passed = result.correct >= 2;
  const perfect = result.mistakes === 0;
  const xp = passed ? pillar.xpReward + (perfect ? 50 : 0) : Math.floor(pillar.xpReward * 0.3);

  useEffect(() => {
    if (passed) sfx.victory();
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.90)',
      backdropFilter: 'blur(10px)', zIndex: 999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      animation: 'fade-in 0.3s',
    }}>
      <div style={{
        maxWidth: 480, width: '100%', textAlign: 'center',
        background: '#050d1a',
        border: `1px solid ${passed ? GR : RD}50`,
        borderTop: `3px solid ${passed ? GR : RD}`,
        borderRadius: 18, padding: 32,
        boxShadow: `0 0 80px ${passed ? GR : RD}30`,
      }}>
        <div style={{ fontSize: 56, marginBottom: 12, animation: 'bounce-in 0.6s' }}>
          {passed ? (perfect ? '👑' : '🏆') : '💔'}
        </div>
        <div style={{ fontSize: 11, color: passed ? GR : RD, fontWeight: 800, letterSpacing: 3, fontFamily: 'monospace', marginBottom: 6 }}>
          {passed ? (perfect ? 'PERFECTO' : 'MISIÓN CUMPLIDA') : 'INTÉNTALO DE NUEVO'}
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>
          {passed ? `¡Dominaste ${pillar.name}!` : 'No te rindas'}
        </h2>
        <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 20px', lineHeight: 1.6 }}>
          Acertaste <strong style={{ color: GR }}>{result.correct} / {result.total}</strong>{' '}
          {passed ? 'preguntas. ¡Sigue así!' : 'preguntas. Necesitas al menos 2 para superar la misión.'}
        </p>

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
          marginBottom: 20, padding: 16, borderRadius: 12,
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: GR }}>{result.correct}</div>
            <div style={{ fontSize: 9, color: '#475569', fontFamily: 'monospace', letterSpacing: 1 }}>ACIERTOS</div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: RD }}>{result.mistakes}</div>
            <div style={{ fontSize: 9, color: '#475569', fontFamily: 'monospace', letterSpacing: 1 }}>FALLOS</div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: YE }}>+{xp}</div>
            <div style={{ fontSize: 9, color: '#475569', fontFamily: 'monospace', letterSpacing: 1 }}>XP</div>
          </div>
        </div>

        {/* Achievements ganados */}
        {achievements.length > 0 && (
          <div style={{
            padding: 12, borderRadius: 10, marginBottom: 16,
            background: `${YE}10`, border: `1px solid ${YE}30`,
          }}>
            <div style={{ fontSize: 10, color: YE, fontWeight: 700, letterSpacing: 2, fontFamily: 'monospace', marginBottom: 6 }}>
              🏅 LOGROS DESBLOQUEADOS
            </div>
            {achievements.map(key => {
              const a = ACHIEVEMENTS[key];
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                  <span style={{ fontSize: 18 }}>{a.icon}</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 12, color: '#fff', fontWeight: 700 }}>{a.name}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>{a.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={onContinue}
          style={{
            padding: '12px 28px', borderRadius: 10,
            background: `linear-gradient(90deg, ${passed ? GR : pillar.color}, ${passed ? GR : pillar.color}aa)`,
            border: 'none', color: '#020812',
            fontSize: 13, fontWeight: 900, letterSpacing: 1,
            cursor: 'pointer', fontFamily: 'system-ui',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            boxShadow: `0 0 20px ${passed ? GR : pillar.color}50`,
          }}
        >
          {passed ? 'CONTINUAR AVENTURA' : 'REINTENTAR'} <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

// ── Achievement Toast ──────────────────────────────────────────────────────────
const AchievementToast = ({ achievement, onDismiss }) => {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [achievement]);

  return (
    <div style={{
      position: 'fixed', top: 100, right: 24, zIndex: 998,
      padding: '12px 16px', borderRadius: 12,
      background: 'linear-gradient(135deg, rgba(251,191,36,0.95), rgba(245,158,11,0.95))',
      border: '1px solid rgba(255,255,255,0.2)',
      boxShadow: '0 0 30px rgba(251,191,36,0.6), 0 8px 24px rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', gap: 12,
      minWidth: 260, maxWidth: 340,
      animation: 'slide-in-right 0.4s',
    }}>
      <span style={{ fontSize: 32 }}>{achievement.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 9, color: '#020812', fontWeight: 800, letterSpacing: 2, fontFamily: 'monospace', marginBottom: 2 }}>
          🏅 LOGRO DESBLOQUEADO
        </div>
        <div style={{ fontSize: 13, color: '#020812', fontWeight: 900, fontFamily: 'system-ui' }}>
          {achievement.name}
        </div>
        <div style={{ fontSize: 10, color: '#020812bb', fontFamily: 'system-ui' }}>
          {achievement.desc}
        </div>
      </div>
    </div>
  );
};

// ── Pantalla de victoria final ─────────────────────────────────────────────────
const VictoryScreen = ({ gameState, onClose }) => {
  useEffect(() => { sfx.victory(); }, []);
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
      backdropFilter: 'blur(12px)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        maxWidth: 540, width: '100%', textAlign: 'center',
        background: 'linear-gradient(135deg, #050d1a, #0a1530)',
        border: `2px solid ${YE}80`,
        borderRadius: 22, padding: 40,
        boxShadow: `0 0 100px ${YE}40, 0 0 200px ${PU}30`,
      }}>
        <div style={{ fontSize: 80, marginBottom: 12, animation: 'bounce-in 0.8s' }}>👑</div>
        <div style={{ fontSize: 11, color: YE, fontWeight: 900, letterSpacing: 4, fontFamily: 'monospace', marginBottom: 8 }}>
          ★ ★ ★ MAESTRÍA COMPLETA ★ ★ ★
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 900, margin: '0 0 12px',
          background: `linear-gradient(90deg, ${YE}, ${OR}, ${PU})`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          ¡Maestro de la POO!
        </h1>
        <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7, margin: '0 0 24px' }}>
          Has dominado los <strong style={{ color: '#fff' }}>4 pilares fundamentales</strong> de la Programación Orientada a Objetos.
          Encapsulamiento, Herencia, Polimorfismo y Abstracción ya son parte de tu arsenal.
        </p>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 24,
        }}>
          {PILLARS.map(p => (
            <div key={p.id} style={{
              padding: 12, borderRadius: 10,
              background: `${p.color}15`, border: `1px solid ${p.color}50`,
            }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{p.icon}</div>
              <div style={{ fontSize: 10, color: p.color, fontWeight: 800, fontFamily: 'monospace' }}>
                ✓ {p.name.toUpperCase()}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 24, fontSize: 13, color: '#cbd5e1' }}>
          XP final: <strong style={{ color: YE, fontSize: 18 }}>{gameState.xp}</strong>{' · '}
          Nivel: <strong style={{ color: CY, fontSize: 18 }}>{xpToLevel(gameState.xp)}</strong>
        </div>

        <button
          onClick={onClose}
          style={{
            padding: '14px 32px', borderRadius: 12,
            background: `linear-gradient(90deg, ${YE}, ${OR})`,
            border: 'none', color: '#020812',
            fontSize: 14, fontWeight: 900, letterSpacing: 2,
            cursor: 'pointer', fontFamily: 'system-ui',
            boxShadow: `0 0 30px ${YE}60`,
          }}
        >
          🎉 EXPLORAR LIBREMENTE
        </button>
      </div>
    </div>
  );
};

// ── Pantalla de inicio (Mode Select) ───────────────────────────────────────────
const ModeSelectScreen = ({ onSelect, hasProgress }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(2,8,18,0.96)',
    backdropFilter: 'blur(10px)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
  }}>
    <div style={{
      maxWidth: 560, width: '100%', textAlign: 'center',
    }}>
      <div style={{ fontSize: 11, color: CY, fontWeight: 800, letterSpacing: 4, fontFamily: 'monospace', marginBottom: 8 }}>
        ▸ LABORATORIO HOLOGRÁFICO POO
      </div>
      <h1 style={{
        fontSize: 44, fontWeight: 900, margin: '0 0 12px',
        background: `linear-gradient(135deg, #fff, ${CY}, ${PU})`,
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>
        Aprende POO jugando
      </h1>
      <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7, margin: '0 0 28px', maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}>
        Una experiencia 3D interactiva donde dominarás los 4 pilares de la Programación Orientada a Objetos a través de misiones, desafíos y XP.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
        <button
          onClick={() => { sfx.unlock(); onSelect('campaign'); }}
          style={{
            padding: '24px 18px', borderRadius: 16,
            background: `linear-gradient(135deg, ${CY}15, ${PU}15)`,
            border: `1px solid ${CY}50`, color: '#fff',
            cursor: 'pointer', fontFamily: 'system-ui',
            transition: 'transform 0.18s, box-shadow 0.18s',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 12px 40px ${CY}40`; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <div style={{ fontSize: 36 }}>🎯</div>
          <div style={{ fontSize: 16, fontWeight: 900 }}>Campaña</div>
          <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>
            4 misiones progresivas con desafíos. Gana XP, sube de nivel y desbloquea logros.
          </div>
          <div style={{
            marginTop: 6, padding: '4px 10px', borderRadius: 999,
            background: `${CY}20`, fontSize: 9, color: CY, fontWeight: 800,
            letterSpacing: 1.5, fontFamily: 'monospace',
          }}>
            {hasProgress ? '↻ CONTINUAR' : '▶ EMPEZAR'}
          </div>
        </button>

        <button
          onClick={() => { sfx.click(); onSelect('free'); }}
          style={{
            padding: '24px 18px', borderRadius: 16,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid #1e293b', color: '#fff',
            cursor: 'pointer', fontFamily: 'system-ui',
            transition: 'transform 0.18s, border-color 0.18s',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = OR; e.currentTarget.style.transform = 'translateY(-3px)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <div style={{ fontSize: 36 }}>🔓</div>
          <div style={{ fontSize: 16, fontWeight: 900 }}>Modo Libre</div>
          <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>
            Explora el diagrama y los pilares sin restricciones. Sin misiones, sin bloqueos.
          </div>
          <div style={{
            marginTop: 6, padding: '4px 10px', borderRadius: 999,
            background: 'rgba(255,255,255,0.05)', fontSize: 9, color: '#94a3b8', fontWeight: 800,
            letterSpacing: 1.5, fontFamily: 'monospace',
          }}>
            EXPLORACIÓN
          </div>
        </button>
      </div>

      <div style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace', letterSpacing: 1 }}>
        Tu progreso se guarda automáticamente · Cambia de modo en cualquier momento
      </div>
    </div>
  </div>
);

// ── Panel informativo lateral ──────────────────────────────────────────────────
const InfoPanel = ({ selectedClass, selectedPillar, onClearClass, onClearPillar, gameState, onStartQuiz, currentMission }) => {
  const cls = CLASSES.find(c => c.id === selectedClass);
  const pillar = selectedPillar !== null ? PILLARS[selectedPillar] : null;

  // Modo campaña sin selección: muestra misión actual
  if (gameState.mode === 'campaign' && !cls && !pillar && currentMission !== null) {
    const mission = PILLARS[currentMission];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
        <MissionCard pillar={mission} onStartQuiz={() => onStartQuiz(mission.id)} completed={false} />
        <div style={{
          padding: 14, borderRadius: 12, flex: 1,
          background: 'rgba(0,0,0,0.3)', border: '1px solid #1e293b',
        }}>
          <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, letterSpacing: 2, fontFamily: 'monospace', marginBottom: 10 }}>
            🎮 CONTROLES
          </div>
          {[
            { icon: '🖱️', text: 'Clic en una clase para ver su código' },
            { icon: '🎯', text: 'Clic en el pilar de misión para leer la teoría' },
            { icon: '⚡', text: 'Botón "INICIAR DESAFÍO" para el quiz' },
            { icon: '🔄', text: 'Arrastra y haz scroll en la escena 3D' },
          ].map((it, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 14 }}>{it.icon}</span>
              <span style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>{it.text}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Sin selección, modo libre
  if (!cls && !pillar) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{
          background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)',
          borderRadius: 12, padding: 16,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: CY, letterSpacing: 2, marginBottom: 10, fontFamily: 'monospace' }}>
            🔓 MODO LIBRE
          </div>
          {[
            { icon: '🖱️', text: 'Haz clic en una clase del diagrama para ver su código' },
            { icon: '🧩', text: 'Haz clic en un pilar para leer su explicación' },
            { icon: '⚡', text: 'Inicia un quiz para practicar lo aprendido' },
            { icon: '🔄', text: 'Arrastra para orbitar · scroll para zoom' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              <span style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>{item.text}</span>
            </div>
          ))}
        </div>

        <div style={{
          background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.15)',
          borderRadius: 12, padding: 16, flex: 1,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: PU, letterSpacing: 2, marginBottom: 10, fontFamily: 'monospace' }}>
            ¿QUÉ ES LA POO?
          </div>
          <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.7, margin: 0 }}>
            La <span style={{ color: '#c084fc' }}>Programación Orientada a Objetos</span> organiza el código en objetos que combinan datos (atributos) y comportamiento (métodos).
          </p>
          <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.7, marginTop: 10, marginBottom: 0 }}>
            Sus cuatro pilares: <span style={{ color: OR }}>Encapsulamiento</span>, <span style={{ color: YE }}>Herencia</span>, <span style={{ color: PU }}>Polimorfismo</span> y <span style={{ color: GR }}>Abstracción</span>.
          </p>
        </div>
      </div>
    );
  }

  // Clase seleccionada
  if (cls) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
        <div style={{
          background: `${cls.color}10`, border: `1px solid ${cls.color}30`,
          borderTop: `2px solid ${cls.color}`, borderRadius: 12, padding: 14,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 9, color: `${cls.color}80`, fontWeight: 700, letterSpacing: 2, fontFamily: 'monospace', marginBottom: 4 }}>{cls.badge}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: cls.color }}>{cls.name}</div>
            </div>
            <button onClick={onClearClass} style={{ background: 'none', border: '1px solid #1e3a5f', color: '#475569', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 11 }}>✕</button>
          </div>
          <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>{cls.description}</p>
          <div style={{ marginTop: 10, display: 'inline-block', padding: '4px 10px', background: `${cls.conceptColor}15`, border: `1px solid ${cls.conceptColor}30`, borderRadius: 20 }}>
            <span style={{ fontSize: 10, color: cls.conceptColor, fontWeight: 700, fontFamily: 'monospace' }}>● {cls.concept}</span>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'hidden' }}>
          <CodePanel lines={CODES[cls.id]} accent={cls.color} filename={`${cls.id}.js`} />
        </div>
      </div>
    );
  }

  // Pilar seleccionado
  if (pillar) {
    const completed = gameState.completedPillars.includes(pillar.id);
    const locked = gameState.mode === 'campaign' && !completed && currentMission !== pillar.id;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
        <div style={{
          background: `${pillar.color}10`, border: `1px solid ${pillar.color}30`,
          borderTop: `2px solid ${pillar.color}`, borderRadius: 12, padding: 14,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 30 }}>{pillar.icon}</span>
              <div>
                <div style={{ fontSize: 9, color: `${pillar.color}80`, fontWeight: 700, letterSpacing: 2, fontFamily: 'monospace', marginBottom: 3 }}>PILAR POO</div>
                <div style={{ fontSize: 19, fontWeight: 800, color: pillar.color }}>{pillar.name}</div>
              </div>
            </div>
            <button onClick={onClearPillar} style={{ background: 'none', border: '1px solid #1e3a5f', color: '#475569', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 11 }}>✕</button>
          </div>
          <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.7, margin: '12px 0 12px' }}>{pillar.desc}</p>

          {!locked && (
            <button
              onClick={() => onStartQuiz(pillar.id)}
              disabled={completed && gameState.mode === 'campaign'}
              style={{
                width: '100%', padding: '9px 14px', borderRadius: 8,
                background: completed ? `${GR}20` : `linear-gradient(90deg, ${pillar.color}, ${pillar.color}cc)`,
                border: completed ? `1px solid ${GR}50` : 'none',
                color: completed ? GR : '#020812',
                fontSize: 11, fontWeight: 900, letterSpacing: 1,
                cursor: completed && gameState.mode === 'campaign' ? 'not-allowed' : 'pointer',
                fontFamily: 'system-ui',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {completed ? <><Check size={12} /> COMPLETADA</> : <><Zap size={12} /> INICIAR DESAFÍO</>}
            </button>
          )}
          {locked && (
            <div style={{ padding: 8, background: 'rgba(0,0,0,0.3)', borderRadius: 8, textAlign: 'center', fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>
              <Lock size={11} style={{ display: 'inline', marginRight: 5, marginBottom: -1 }} />
              Completa la misión actual primero
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace', letterSpacing: 1.5, marginBottom: 6, fontWeight: 700 }}>EJEMPLO PRÁCTICO</div>
          <CodePanel lines={pillar.example} accent={pillar.color} filename={`${pillar.name.toLowerCase()}.js`} />
        </div>
      </div>
    );
  }
  return null;
};

// ── Página principal ───────────────────────────────────────────────────────────
const ThreeDExperiencePage = ({ audioRef, isPlaying }) => {
  const [gameState, setGameState] = useState(loadGame);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedPillar, setSelectedPillar] = useState(null);
  const [analyzer, setAnalyzer] = useState(null);
  const [quizPillar, setQuizPillar] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  const [achievementToast, setAchievementToast] = useState(null);
  const [showVictory, setShowVictory] = useState(false);
  const [showModeSelect, setShowModeSelect] = useState(gameState.mode === null);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [confettiColor, setConfettiColor] = useState(YE);
  const [cameraTarget, setCameraTarget] = useState(null);
  const controlsRef = useRef(null);

  // Persistir estado
  useEffect(() => { saveGame(gameState); }, [gameState]);

  // Audio analyzer
  useEffect(() => {
    if (isPlaying && audioRef?.current) {
      const a = getAnalyser(audioRef.current);
      if (a) setAnalyzer(a);
    }
  }, [isPlaying]);

  // Calcular misión actual (primer pilar no completado)
  const currentMission = useMemo(() => {
    if (gameState.mode !== 'campaign') return null;
    const next = PILLARS.find(p => !gameState.completedPillars.includes(p.id));
    return next ? next.id : null;
  }, [gameState.mode, gameState.completedPillars]);

  const handleSelectClass = (id) => {
    sfx.click();
    setSelectedClass(prev => prev === id ? null : id);
    setSelectedPillar(null);

    // Achievement: explorer
    if (id && !gameState.inspectedClasses.includes(id)) {
      const newInspected = [...gameState.inspectedClasses, id];
      const newAchievements = [...gameState.achievements];
      if (newInspected.length === 3 && !newAchievements.includes('explorer')) {
        newAchievements.push('explorer');
        setAchievementToast(ACHIEVEMENTS['explorer']);
      }
      setGameState(s => ({ ...s, inspectedClasses: newInspected, achievements: newAchievements }));
    }

    // Camera focus
    if (id) {
      const cls = CLASSES.find(c => c.id === id);
      setCameraTarget({ cam: [cls.position[0] - 0.5, cls.position[1] + 0.5, 8], look: cls.position });
    } else {
      setCameraTarget({ cam: [-0.8, 1.2, 13], look: [0, 0, 0] });
    }
  };

  const handleSelectPillar = (id) => {
    sfx.click();
    setSelectedPillar(prev => prev === id ? null : id);
    setSelectedClass(null);

    if (id !== null && id !== selectedPillar) {
      const positions = [[-6.2, 2.0, -1], [-4.2, 2.0, -1], [-6.2, 0.1, -1], [-4.2, 0.1, -1]];
      setCameraTarget({ cam: [positions[id][0] + 1.5, positions[id][1] + 0.5, 8], look: positions[id] });
    } else {
      setCameraTarget({ cam: [-0.8, 1.2, 13], look: [0, 0, 0] });
    }
  };

  const handleStartQuiz = (pillarId) => {
    sfx.unlock();
    setQuizPillar(PILLARS[pillarId]);
  };

  const handleQuizComplete = (result) => {
    const passed = result.correct >= 2;
    const perfect = result.mistakes === 0;
    const xp = passed ? quizPillar.xpReward + (perfect ? 50 : 0) : Math.floor(quizPillar.xpReward * 0.3);

    const newAchievements = [];
    let updatedAchievements = [...gameState.achievements];
    let updatedCompleted = [...gameState.completedPillars];

    if (passed && !updatedCompleted.includes(quizPillar.id)) {
      updatedCompleted.push(quizPillar.id);

      // Achievements
      if (!updatedAchievements.includes('first-blood')) {
        updatedAchievements.push('first-blood');
        newAchievements.push('first-blood');
      }
      if (perfect && !updatedAchievements.includes('perfectionist')) {
        updatedAchievements.push('perfectionist');
        newAchievements.push('perfectionist');
      }
      if (updatedCompleted.length === 2 && !updatedAchievements.includes('half-master')) {
        updatedAchievements.push('half-master');
        newAchievements.push('half-master');
      }
      if (updatedCompleted.length === 4 && !updatedAchievements.includes('oop-master')) {
        updatedAchievements.push('oop-master');
        newAchievements.push('oop-master');
      }
    }

    setGameState(s => ({
      ...s,
      xp: s.xp + xp,
      completedPillars: updatedCompleted,
      achievements: updatedAchievements,
    }));

    setQuizResult({ ...result, achievements: newAchievements });

    if (passed) {
      setConfettiColor(quizPillar.color);
      setConfettiTrigger(t => t + 1);
    }
  };

  const handleResultContinue = () => {
    const wasLastPillar = quizResult?.correct >= 2 && gameState.completedPillars.length === 4;
    setQuizPillar(null);
    setQuizResult(null);

    // Mostrar toast del PRIMER logro nuevo
    if (quizResult?.achievements?.length > 0) {
      const ach = quizResult.achievements[0];
      setAchievementToast(ACHIEVEMENTS[ach]);
    }

    if (wasLastPillar) setShowVictory(true);
  };

  const handleSelectMode = (mode) => {
    setGameState(s => ({ ...s, mode }));
    setShowModeSelect(false);
  };

  const handleResetGame = () => {
    if (confirm('¿Reiniciar todo el progreso? Perderás XP, logros y misiones completadas.')) {
      sfx.click();
      setGameState({ ...INITIAL_STATE });
      setShowModeSelect(true);
    }
  };

  const handleChangeMode = () => {
    setShowModeSelect(true);
  };

  const activeCls = CLASSES.find(c => c.id === selectedClass);
  const activePillar = selectedPillar !== null ? PILLARS[selectedPillar] : null;
  const activeColor = activeCls?.color ?? activePillar?.color ?? CY;

  return (
    <div className="pb-36 animate-in fade-in duration-500" style={{ fontFamily: 'system-ui, sans-serif' }}>

      {/* CSS embebido para animaciones del juego */}
      <style>{`
        @keyframes pulse-soft { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.05); } }
        @keyframes fade-in { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        @keyframes slide-in-right { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes bounce-in { 0% { transform: scale(0.3); opacity: 0; } 50% { transform: scale(1.15); } 100% { transform: scale(1); opacity: 1; } }
      `}</style>

      {/* Header */}
      <header style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#f1f5f9', margin: 0, lineHeight: 1.1 }}>
            Laboratorio <span style={{ color: CY }}>Holográfico</span>{' '}
            <span style={{ color: '#475569' }}>POO</span>
          </h1>
          {gameState.mode === 'campaign' && (
            <span style={{
              padding: '3px 12px', borderRadius: 999, fontSize: 10, fontWeight: 800,
              border: `1px solid ${YE}40`, color: YE,
              background: `${YE}15`, fontFamily: 'monospace', letterSpacing: 1.5,
            }}>
              ⚔ MODO CAMPAÑA
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: '#475569' }}>
          Diagrama UML interactivo · Sistema de misiones · Quizzes desbloqueables
        </div>
      </header>

      {/* HUD del jugador */}
      <GameHUD
        gameState={gameState}
        onReset={handleResetGame}
        onChangeMode={handleChangeMode}
      />

      {/* Layout principal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 14, alignItems: 'stretch' }}>

        {/* Canvas 3D */}
        <div style={{
          position: 'relative', borderRadius: 18, overflow: 'hidden',
          border: `1px solid ${activeColor}25`, background: '#020812',
          height: '68vh', minHeight: 460,
          transition: 'border-color 0.4s',
          boxShadow: `inset 0 0 60px rgba(0,0,0,0.6)`,
        }}>
          <Canvas camera={{ position: [-0.8, 1.2, 13], fov: 54 }} dpr={[1, 2]}>
            <Scene3D
              selectedClass={selectedClass}
              selectedPillar={selectedPillar}
              onSelectClass={handleSelectClass}
              onSelectPillar={handleSelectPillar}
              analyzer={analyzer}
              gameState={gameState}
              currentMission={currentMission}
              cameraTarget={cameraTarget}
              controlsRef={controlsRef}
              confettiTrigger={confettiTrigger}
              confettiColor={confettiColor}
            />
          </Canvas>

          {/* Overlay clase activa */}
          {activeCls && (
            <div style={{
              position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
              borderRadius: 999, padding: '5px 14px', border: `1px solid ${activeCls.color}30`,
              display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'none',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: activeCls.color }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: activeCls.color, fontFamily: 'monospace' }}>{activeCls.name}</span>
              <span style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace' }}>— {activeCls.badge}</span>
            </div>
          )}

          {/* Hint */}
          {!selectedClass && !selectedPillar && (
            <div style={{
              position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
              pointerEvents: 'none',
            }}>
              <div style={{
                background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                borderRadius: 999, padding: '6px 16px', border: `1px solid ${CY}18`,
              }}>
                <p style={{ fontSize: 10, fontFamily: 'monospace', color: `${CY}80`, margin: 0 }}>
                  {gameState.mode === 'campaign'
                    ? `🎯 Misión: ${currentMission !== null ? PILLARS[currentMission].name : '¡Todas completas!'}`
                    : 'Clic en clase o pilar · Arrastra para orbitar · Scroll para zoom'}
                </p>
              </div>
            </div>
          )}

          {/* Audio indicator */}
          <div style={{
            position: 'absolute', top: 14, left: 14,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
            borderRadius: 8, padding: '4px 9px', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <p style={{ fontSize: 9, fontFamily: 'monospace', color: isPlaying ? GR : '#1e3a5f', margin: 0 }}>
              {isPlaying ? '● AUDIO REACTIVO' : '○ sin audio'}
            </p>
          </div>
        </div>

        {/* Panel lateral */}
        <div style={{
          background: '#030d1a',
          border: `1px solid ${activeColor}18`,
          borderRadius: 18,
          padding: 14,
          height: '68vh',
          minHeight: 460,
          overflow: 'auto',
          transition: 'border-color 0.4s',
        }}>
          <InfoPanel
            selectedClass={selectedClass}
            selectedPillar={selectedPillar}
            onClearClass={() => setSelectedClass(null)}
            onClearPillar={() => setSelectedPillar(null)}
            gameState={gameState}
            onStartQuiz={handleStartQuiz}
            currentMission={currentMission}
          />
        </div>
      </div>

      {/* Acceso rápido a pilares */}
      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {PILLARS.map(p => {
          const completed = gameState.completedPillars.includes(p.id);
          const locked = gameState.mode === 'campaign' && !completed && p.id !== currentMission;
          return (
            <button
              key={p.id}
              onClick={() => !locked && handleSelectPillar(p.id)}
              disabled={locked}
              style={{
                background: selectedPillar === p.id ? `${p.color}18` : 'rgba(3,13,26,0.8)',
                border: `1px solid ${selectedPillar === p.id ? p.color + '60' : completed ? GR + '40' : p.color + '20'}`,
                borderRadius: 12, padding: '10px 12px',
                cursor: locked ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', gap: 10,
                textAlign: 'left', position: 'relative',
                opacity: locked ? 0.5 : 1,
              }}
            >
              <span style={{ fontSize: 18, filter: locked ? 'grayscale(1)' : 'none' }}>{p.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: locked ? '#64748b' : selectedPillar === p.id ? p.color : `${p.color}cc`, fontFamily: 'system-ui' }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 10, color: '#475569', marginTop: 1, fontFamily: 'system-ui' }}>
                  {locked ? 'Bloqueado' : completed ? '✓ Completado' : p.short}
                </div>
              </div>
              {completed && <Check size={14} color={GR} strokeWidth={3} />}
              {locked && <Lock size={12} color="#64748b" />}
              {p.id === currentMission && !completed && (
                <Star size={14} color={p.color} fill={p.color} />
              )}
            </button>
          );
        })}
      </div>

      {/* Modales */}
      {showModeSelect && (
        <ModeSelectScreen
          onSelect={handleSelectMode}
          hasProgress={gameState.completedPillars.length > 0}
        />
      )}
      {quizPillar && !quizResult && (
        <QuizModal
          pillar={quizPillar}
          onComplete={handleQuizComplete}
          onClose={() => setQuizPillar(null)}
        />
      )}
      {quizResult && quizPillar && (
        <ResultScreen
          pillar={quizPillar}
          result={quizResult}
          achievements={quizResult.achievements || []}
          onContinue={handleResultContinue}
        />
      )}
      {achievementToast && (
        <AchievementToast
          achievement={achievementToast}
          onDismiss={() => setAchievementToast(null)}
        />
      )}
      {showVictory && (
        <VictoryScreen
          gameState={gameState}
          onClose={() => setShowVictory(false)}
        />
      )}
    </div>
  );
};

export default ThreeDExperiencePage;
