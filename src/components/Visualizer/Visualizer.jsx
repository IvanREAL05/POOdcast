import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars, Html, Line, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { Maximize2, Minimize2 } from 'lucide-react';
import { getAnalyser } from '../../utils/sharedAudio';

// ── Utilidades de audio ────────────────────────────────────────────────────────
function readBass(analyzer, buf) {
  if (!analyzer) return 0;
  analyzer.getByteFrequencyData(buf);
  return buf[3] / 255;
}
function readMid(analyzer, buf) {
  if (!analyzer) return 0;
  analyzer.getByteFrequencyData(buf);
  let s = 0;
  for (let i = 10; i < 60; i++) s += buf[i];
  return s / (50 * 255);
}

// Suaviza los valores de audio frame a frame (evita el temblado)
// factor: 0.05 = muy suave, 0.2 = más reactivo
function smoothVal(smoothRef, target, factor = 0.08) {
  smoothRef.current = THREE.MathUtils.lerp(smoothRef.current, target, factor);
  return smoothRef.current;
}

// ── Escena 1: Pensar en Objetos ───────────────────────────────────────────────
// Tres formas flotantes representan objetos cotidianos. Cada una pulsa con el audio.
const Scene1 = ({ analyzer, expanded }) => {
  const buf = useRef(new Uint8Array(128));
  const smooth = useRef(0);
  const refs = [useRef(), useRef(), useRef()];
  const shapes = [
    { geo: <boxGeometry args={[0.55, 0.55, 0.55]} />, color: '#3b82f6', pos: [-1.2, 0, 0], label: 'Taza', sub: 'color, tamaño' },
    { geo: <sphereGeometry args={[0.4, 16, 16]} />,    color: '#8b5cf6', pos: [0, 0.3, 0],  label: 'Celular', sub: 'marca, batería' },
    { geo: <torusGeometry args={[0.3, 0.13, 12, 24]} />, color: '#10b981', pos: [1.2, -0.1, 0], label: 'Silla', sub: 'color, material' },
  ];
  useFrame(({ clock }) => {
    const bass = smoothVal(smooth, readBass(analyzer, buf.current));
    refs.forEach((r, i) => {
      if (!r.current) return;
      const s = 1 + bass * 0.5;
      r.current.scale.setScalar(s);
      r.current.rotation.y = clock.elapsedTime * 0.4 * (i % 2 === 0 ? 1 : -1);
    });
  });
  return (
    <>
      {shapes.map((s, i) => (
        <Float key={i} speed={1.2 + i * 0.3} floatIntensity={0.6} rotationIntensity={0.2}>
          <mesh ref={refs[i]} position={s.pos}>
            {s.geo}
            <meshStandardMaterial color={s.color} roughness={0.3} metalness={0.6} />
          </mesh>
          {expanded && (
            <Html position={[s.pos[0], s.pos[1] + 0.9, s.pos[2]]} center distanceFactor={6}>
              <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
                <div style={{ color: s.color, fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>{s.label}</div>
                <div style={{ color: '#64748b', fontSize: 9, fontFamily: 'monospace' }}>{s.sub}</div>
              </div>
            </Html>
          )}
        </Float>
      ))}
    </>
  );
};

// ── Escena 2: Atributos y Acciones ────────────────────────────────────────────
// Objeto central con esferas azules (atributos) y cubos verdes (métodos) orbitando.
const Scene2 = ({ analyzer, expanded }) => {
  const buf = useRef(new Uint8Array(128));
  const smoothMid = useRef(0);
  const smoothBass = useRef(0);
  const groupRef = useRef();
  const attrsRef = useRef([]);
  const methodsRef = useRef([]);
  const attrs = [[-0.9, 0.5], [-0.9, -0.5], [0, -1.0]];
  const methods = [[0.9, 0.5], [0.9, -0.5], [0, 1.0]];

  useFrame(({ clock }) => {
    const mid = smoothVal(smoothMid, readMid(analyzer, buf.current));
    const bass = smoothVal(smoothBass, readBass(analyzer, buf.current));
    const t = clock.elapsedTime;
    if (groupRef.current) groupRef.current.rotation.y = t * (0.3 + mid * 0.4);
    attrsRef.current.forEach((r, i) => {
      if (!r) return;
      const angle = (i / attrs.length) * Math.PI * 2 + t * 0.6;
      const radius = 1.1 + bass * 0.25;
      r.position.x = Math.cos(angle) * radius;
      r.position.z = Math.sin(angle) * radius;
      r.position.y = Math.sin(t * 0.8 + i) * 0.2;
    });
    methodsRef.current.forEach((r, i) => {
      if (!r) return;
      const angle = (i / methods.length) * Math.PI * 2 - t * 0.8;
      const radius = 0.75 + bass * 0.18;
      r.position.x = Math.cos(angle) * radius;
      r.position.z = Math.sin(angle) * radius;
      r.position.y = Math.cos(t * 0.6 + i) * 0.15;
    });
  });

  return (
    <group ref={groupRef}>
      {/* Objeto central */}
      <Float speed={1} floatIntensity={0.3}>
        <mesh>
          <icosahedronGeometry args={[0.45, 1]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.2} metalness={0.8} />
        </mesh>
      </Float>
      {/* Atributos (esferas azules) */}
      {attrs.map((_, i) => (
        <mesh key={`a${i}`} ref={el => attrsRef.current[i] = el}>
          <sphereGeometry args={[0.13, 10, 10]} />
          <meshStandardMaterial color="#3b82f6" emissive="#1d4ed8" emissiveIntensity={0.4} />
        </mesh>
      ))}
      {/* Métodos (cubos verdes) */}
      {methods.map((_, i) => (
        <mesh key={`m${i}`} ref={el => methodsRef.current[i] = el}>
          <boxGeometry args={[0.15, 0.15, 0.15]} />
          <meshStandardMaterial color="#10b981" emissive="#065f46" emissiveIntensity={0.5} />
        </mesh>
      ))}
      {expanded && (
        <>
          <Html position={[-1.5, 0.2, 0]} center distanceFactor={6}>
            <div style={{ color: '#3b82f6', fontSize: 10, fontFamily: 'monospace', fontWeight: 700, textAlign: 'center' }}>
              ● atributos<br/><span style={{ color: '#475569', fontSize: 9 }}>lo que es</span>
            </div>
          </Html>
          <Html position={[1.5, 0.2, 0]} center distanceFactor={6}>
            <div style={{ color: '#10b981', fontSize: 10, fontFamily: 'monospace', fontWeight: 700, textAlign: 'center' }}>
              ● métodos<br/><span style={{ color: '#475569', fontSize: 9 }}>lo que hace</span>
            </div>
          </Html>
        </>
      )}
    </group>
  );
};

// ── Escena 3: Clases → Instancias ─────────────────────────────────────────────
// Molde (wireframe) en la cima estampa instancias sólidas que caen con cada beat.
const Scene3 = ({ analyzer, expanded }) => {
  const buf = useRef(new Uint8Array(128));
  const smooth = useRef(0);
  const [instances, setInstances] = useState([]);
  const lastBass = useRef(0);
  const moldRef = useRef();
  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  useFrame(({ clock }) => {
    const rawBass = readBass(analyzer, buf.current);
    const bass = smoothVal(smooth, rawBass);
    if (moldRef.current) {
      moldRef.current.rotation.y = clock.elapsedTime * 0.5;
      const s = 1 + bass * 0.25;
      moldRef.current.scale.setScalar(s);
    }
    if (rawBass > 0.35 && lastBass.current < 0.35) {
      setInstances(prev => {
        const next = [...prev, { id: Date.now(), color: colors[prev.length % colors.length], y: 0.2 }];
        return next.slice(-4);
      });
    }
    lastBass.current = rawBass;
    setInstances(prev => prev.map(inst => ({ ...inst, y: inst.y - 0.018 })).filter(inst => inst.y > -2.2));
  });

  return (
    <>
      {/* Molde / Clase */}
      <group ref={moldRef} position={[0, 1.4, 0]}>
        <mesh>
          <boxGeometry args={[0.7, 0.7, 0.7]} />
          <meshStandardMaterial color="#00d4ff" wireframe />
        </mesh>
        {expanded && (
          <Html position={[0, 0.7, 0]} center distanceFactor={6}>
            <div style={{ color: '#00d4ff', fontSize: 10, fontFamily: 'monospace', fontWeight: 700 }}>Clase</div>
          </Html>
        )}
      </group>
      {/* Instancias cayendo */}
      {instances.map(inst => (
        <mesh key={inst.id} position={[0, inst.y, 0]}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color={inst.color} roughness={0.3} metalness={0.5} />
        </mesh>
      ))}
      {expanded && (
        <Html position={[1.2, -0.3, 0]} center distanceFactor={6}>
          <div style={{ color: '#94a3b8', fontSize: 9, fontFamily: 'monospace' }}>instancias →</div>
        </Html>
      )}
    </>
  );
};

// Offsets de caos pre-generados fuera del componente (valores estables)
const CHAOS_OFFSETS = Array.from({ length: 12 }, (_, i) => [
  ((i * 7 + 3) % 11 - 5.5) * 0.55,
  ((i * 5 + 1) % 9 - 4.5) * 0.55,
  ((i * 3 + 2) % 7 - 3.5) * 0.45,
]);

// ── Escena 4: Ordenar el Caos ─────────────────────────────────────────────────
// 12 cubos: con más volumen se organizan. Con silencio, caen en caos.
const Scene4 = ({ analyzer, expanded }) => {
  const buf = useRef(new Uint8Array(128));
  const smoothOrder = useRef(0);
  const refs = useRef([]);
  const gridPositions = useMemo(() => {
    const pos = [];
    for (let x = -1.1; x <= 1.1; x += 0.75) for (let y = -0.75; y <= 0.75; y += 0.75) pos.push([x, y, 0]);
    return pos.slice(0, 12);
  }, []);
  const chaosOffsets = CHAOS_OFFSETS;
  const colors = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#f97316','#ec4899','#6366f1','#14b8a6','#84cc16','#a78bfa'];

  useFrame(() => {
    const order = smoothVal(smoothOrder, Math.min(1, readMid(analyzer, buf.current) * 2.5), 0.05);
    refs.current.forEach((r, i) => {
      if (!r) return;
      const gp = gridPositions[i];
      const co = chaosOffsets[i];
      if (!gp || !co) return;
      r.position.x = THREE.MathUtils.lerp(gp[0] + co[0], gp[0], order);
      r.position.y = THREE.MathUtils.lerp(gp[1] + co[1], gp[1], order);
      r.position.z = THREE.MathUtils.lerp(co[2], 0, order);
      r.rotation.x += (1 - order) * 0.04;
      r.rotation.y += (1 - order) * 0.03;
    });
  });

  return (
    <>
      {gridPositions.map((_, i) => (
        <mesh key={i} ref={el => refs.current[i] = el}>
          <boxGeometry args={[0.28, 0.28, 0.28]} />
          <meshStandardMaterial color={colors[i]} roughness={0.4} metalness={0.4} />
        </mesh>
      ))}
      {expanded && (
        <Html position={[0, -1.5, 0]} center distanceFactor={6}>
          <div style={{ color: '#94a3b8', fontSize: 9, fontFamily: 'monospace', textAlign: 'center' }}>
            volumen → orden
          </div>
        </Html>
      )}
    </>
  );
};

// ── Escena 5: Herencia ────────────────────────────────────────────────────────
// Padre arriba, dos hijos abajo. El bass hace cascada de luz padre→hijos.
const Scene5 = ({ analyzer, expanded }) => {
  const buf = useRef(new Uint8Array(128));
  const smooth = useRef(0);
  const parentRef = useRef();
  const child1Ref = useRef();
  const child2Ref = useRef();
  const lineOpacity = useRef(0.3);

  useFrame(() => {
    const bass = smoothVal(smooth, readBass(analyzer, buf.current));
    lineOpacity.current = 0.2 + bass * 0.6;
    if (parentRef.current) {
      const s = 1 + bass * 0.35;
      parentRef.current.scale.setScalar(s);
      parentRef.current.material.emissiveIntensity = bass * 1.0;
    }
    const childBass = bass * 0.7;
    [child1Ref, child2Ref].forEach(r => {
      if (!r.current) return;
      const s = 1 + childBass * 0.3;
      r.current.scale.setScalar(s);
      r.current.material.emissiveIntensity = childBass * 0.8;
    });
  });

  return (
    <>
      {/* Padre */}
      <mesh ref={parentRef} position={[0, 1.2, 0]}>
        <boxGeometry args={[0.65, 0.65, 0.65]} />
        <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.2} roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Líneas herencia */}
      <Line points={[[0, 0.87, 0], [-0.9, 0.05, 0]]} color="#00d4ff" lineWidth={1.5} transparent opacity={0.4} dashed dashSize={0.1} gapSize={0.06} />
      <Line points={[[0, 0.87, 0], [0.9, 0.05, 0]]}  color="#00d4ff" lineWidth={1.5} transparent opacity={0.4} dashed dashSize={0.1} gapSize={0.06} />
      {/* Hijos */}
      <mesh ref={child1Ref} position={[-0.9, -0.35, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.1} roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh ref={child2Ref} position={[0.9, -0.35, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#7dd3fc" emissive="#7dd3fc" emissiveIntensity={0.1} roughness={0.4} metalness={0.5} />
      </mesh>
      {expanded && (
        <>
          <Html position={[0, 2.0, 0]} center distanceFactor={6}>
            <div style={{ color: '#00d4ff', fontSize: 10, fontFamily: 'monospace', fontWeight: 700 }}>Animal</div>
          </Html>
          <Html position={[-0.9, -1.0, 0]} center distanceFactor={6}>
            <div style={{ color: '#38bdf8', fontSize: 10, fontFamily: 'monospace' }}>Perro</div>
          </Html>
          <Html position={[0.9, -1.0, 0]} center distanceFactor={6}>
            <div style={{ color: '#7dd3fc', fontSize: 10, fontFamily: 'monospace' }}>Gato</div>
          </Html>
        </>
      )}
    </>
  );
};

// ── Escena 6: Encapsulamiento ─────────────────────────────────────────────────
// Esfera interna (privada) dentro de una capa exterior transparente (interfaz pública).
const Scene6 = ({ analyzer, expanded }) => {
  const buf = useRef(new Uint8Array(128));
  const smooth = useRef(0);
  const outerRef = useRef();
  const innerRef = useRef();

  useFrame(({ clock }) => {
    const bass = smoothVal(smooth, readBass(analyzer, buf.current));
    const t = clock.elapsedTime;
    if (outerRef.current) {
      const s = 1.05 + bass * 0.28;
      outerRef.current.scale.setScalar(s);
      outerRef.current.material.opacity = 0.12 + bass * 0.15;
      outerRef.current.rotation.y = t * 0.4;
      outerRef.current.rotation.x = t * 0.15;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y = -t * 0.6;
      innerRef.current.material.emissiveIntensity = 0.3 + bass * 0.6;
    }
  });

  return (
    <>
      {/* Capa exterior (pública) */}
      <mesh ref={outerRef}>
        <sphereGeometry args={[1.0, 24, 24]} />
        <meshStandardMaterial color="#06b6d4" transparent opacity={0.12} side={THREE.DoubleSide} wireframe={false} />
      </mesh>
      <mesh rotation={[0, 0, 0]}>
        <sphereGeometry args={[1.01, 16, 16]} />
        <meshBasicMaterial color="#06b6d4" wireframe transparent opacity={0.08} />
      </mesh>
      {/* Esfera interna (privada) */}
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[0.42, 1]} />
        <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={0.3} roughness={0.2} metalness={0.8} />
      </mesh>
      {expanded && (
        <>
          <Html position={[1.2, 0.5, 0]} center distanceFactor={6}>
            <div style={{ color: '#06b6d4', fontSize: 9, fontFamily: 'monospace', textAlign: 'center' }}>
              🔓 interfaz<br/>pública
            </div>
          </Html>
          <Html position={[0, 0, 0]} center distanceFactor={6}>
            <div style={{ color: '#f97316', fontSize: 9, fontFamily: 'monospace', textAlign: 'center', marginTop: 55 }}>
              🔒 privado
            </div>
          </Html>
        </>
      )}
    </>
  );
};

// ── Escena 7: Interfaces / Hablar sin saber cómo ──────────────────────────────
// Un botón central envía pulsos a receptores distintos que reaccionan igual.
const Scene7 = ({ analyzer, expanded }) => {
  const buf = useRef(new Uint8Array(128));
  const smooth = useRef(0);
  const centerRef = useRef();
  const receiverRefs = useRef([]);
  const pulseRefs = useRef([]);
  const lastBass = useRef(0);
  const pulseProgress = useRef([0, 0, 0, 0]);

  const receivers = [
    { pos: [0, 1.5, 0],   color: '#3b82f6', shape: <boxGeometry args={[0.35, 0.35, 0.35]} /> },
    { pos: [1.5, 0, 0],   color: '#8b5cf6', shape: <sphereGeometry args={[0.22, 12, 12]} /> },
    { pos: [0, -1.5, 0],  color: '#10b981', shape: <torusGeometry args={[0.18, 0.08, 8, 16]} /> },
    { pos: [-1.5, 0, 0],  color: '#f59e0b', shape: <octahedronGeometry args={[0.25, 0]} /> },
  ];

  useFrame(() => {
    const rawBass = readBass(analyzer, buf.current);
    const bass = smoothVal(smooth, rawBass);
    if (rawBass > 0.3 && lastBass.current < 0.3) {
      pulseProgress.current = pulseProgress.current.map(() => 0.01);
    }
    lastBass.current = rawBass;
    pulseProgress.current = pulseProgress.current.map(p => p > 0 ? Math.min(p + 0.03, 1.05) : 0);

    if (centerRef.current) {
      const s = 1 + bass * 0.4;
      centerRef.current.scale.setScalar(s);
      centerRef.current.material.emissiveIntensity = bass * 1.0;
    }
    receiverRefs.current.forEach((r, i) => {
      if (!r) return;
      const p = pulseProgress.current[i];
      const arrived = p > 0.9;
      r.material.emissiveIntensity = arrived ? 0.8 : 0.1;
      r.scale.setScalar(arrived ? 1.3 : 1);
    });
    pulseRefs.current.forEach((r, i) => {
      if (!r) return;
      const p = pulseProgress.current[i];
      r.visible = p > 0 && p < 1;
      if (r.visible) {
        const rec = receivers[i];
        r.position.x = THREE.MathUtils.lerp(0, rec.pos[0], p);
        r.position.y = THREE.MathUtils.lerp(0, rec.pos[1], p);
        r.position.z = THREE.MathUtils.lerp(0, rec.pos[2] ?? 0, p);
      }
    });
  });

  return (
    <>
      <mesh ref={centerRef}>
        <cylinderGeometry args={[0.22, 0.22, 0.12, 24]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} roughness={0.1} metalness={0.9} />
      </mesh>
      {receivers.map((rec, i) => (
        <group key={i}>
          <mesh ref={el => receiverRefs.current[i] = el} position={rec.pos}>
            {rec.shape}
            <meshStandardMaterial color={rec.color} emissive={rec.color} emissiveIntensity={0.1} roughness={0.3} metalness={0.5} />
          </mesh>
          <mesh ref={el => pulseRefs.current[i] = el} visible={false}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <Line points={[[0, 0, 0], rec.pos]} color="#1e3a5f" lineWidth={1} transparent opacity={0.3} />
        </group>
      ))}
      {expanded && (
        <Html position={[0, 0, 0]} center distanceFactor={6}>
          <div style={{ color: '#94a3b8', fontSize: 9, fontFamily: 'monospace', textAlign: 'center', marginTop: 30 }}>
            play()
          </div>
        </Html>
      )}
    </>
  );
};

// ── Escena 8: Polimorfismo ────────────────────────────────────────────────────
// Mismo mensaje "hablar()" → cada animal responde diferente (color burst distinto).
const Scene8 = ({ analyzer, expanded }) => {
  const buf = useRef(new Uint8Array(128));
  const lastBass = useRef(0);
  const burstRef = useRef([0, 0, 0, 0]);
  const meshRefs = useRef([]);

  const animals = [
    { pos: [0, 1.4, 0],   color: '#f97316', label: '"¡Guau!"',  shape: <sphereGeometry args={[0.28, 12, 12]} /> },
    { pos: [1.4, 0, 0],   color: '#ec4899', label: '"¡Miau!"',  shape: <boxGeometry args={[0.38, 0.38, 0.38]} /> },
    { pos: [0, -1.4, 0],  color: '#a3e635', label: '"¡Pío!"',   shape: <torusGeometry args={[0.2, 0.09, 8, 16]} /> },
    { pos: [-1.4, 0, 0],  color: '#fbbf24', label: '"¡Muu!"',   shape: <octahedronGeometry args={[0.28, 0]} /> },
  ];

  useFrame(({ clock }) => {
    const rawBass = readBass(analyzer, buf.current);
    if (rawBass > 0.3 && lastBass.current < 0.3) {
      burstRef.current = burstRef.current.map(() => 1.0);
    }
    lastBass.current = rawBass;
    burstRef.current = burstRef.current.map(b => Math.max(0, b - 0.035));

    meshRefs.current.forEach((r, i) => {
      if (!r) return;
      const burst = burstRef.current[i];
      r.material.emissiveIntensity = 0.1 + burst * 1.5;
      const s = 1 + burst * 0.5;
      r.scale.setScalar(s);
      r.rotation.y = clock.elapsedTime * 0.5;
    });
  });

  return (
    <>
      {/* Centro: el mensaje */}
      <Float speed={1} floatIntensity={0.2}>
        <mesh>
          <torusKnotGeometry args={[0.22, 0.07, 64, 10]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.1} metalness={0.9} />
        </mesh>
      </Float>
      {animals.map((a, i) => (
        <group key={i}>
          <Line points={[[0, 0, 0], a.pos]} color="#1e3a5f" lineWidth={1} transparent opacity={0.25} />
          <mesh ref={el => meshRefs.current[i] = el} position={a.pos}>
            {a.shape}
            <meshStandardMaterial color={a.color} emissive={a.color} emissiveIntensity={0.1} roughness={0.3} metalness={0.4} />
          </mesh>
          {expanded && (
            <Html position={[a.pos[0] * 1.5, a.pos[1] * 1.5, 0]} center distanceFactor={6}>
              <div style={{ color: a.color, fontSize: 9, fontFamily: 'monospace', fontWeight: 700 }}>{a.label}</div>
            </Html>
          )}
        </group>
      ))}
      {expanded && (
        <Html position={[0, 0, 0]} center distanceFactor={6}>
          <div style={{ color: '#94a3b8', fontSize: 9, fontFamily: 'monospace', textAlign: 'center', marginTop: 35 }}>
            hablar()
          </div>
        </Html>
      )}
    </>
  );
};

// ── Escena 9: Diseñar para el futuro ─────────────────────────────────────────
// Bloques tipo LEGO que se apilan con cada beat. Se resetea al llegar a 8.
const Scene9 = ({ analyzer, expanded }) => {
  const buf = useRef(new Uint8Array(128));
  const [stack, setStack] = useState([]);
  const lastBass = useRef(0);
  const colors = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#f97316','#ec4899'];

  useFrame(() => {
    const bass = readBass(analyzer, buf.current); // raw para detectar beats
    if (bass > 0.35 && lastBass.current < 0.35) {
      setStack(prev => {
        if (prev.length >= 8) return [{ id: Date.now(), color: colors[0] }];
        return [...prev, { id: Date.now(), color: colors[prev.length % colors.length] }];
      });
    }
    lastBass.current = bass;
  });

  return (
    <>
      {stack.map((block, i) => (
        <mesh key={block.id} position={[0, -1.2 + i * 0.55, 0]}>
          <boxGeometry args={[0.7, 0.45, 0.7]} />
          <meshStandardMaterial color={block.color} roughness={0.4} metalness={0.5} />
        </mesh>
      ))}
      {stack.length === 0 && (
        <mesh position={[0, -1.2, 0]}>
          <boxGeometry args={[0.7, 0.45, 0.7]} />
          <meshStandardMaterial color="#1e3a5f" roughness={0.6} metalness={0.2} />
        </mesh>
      )}
      {expanded && (
        <Html position={[1.2, -1.2 + stack.length * 0.55, 0]} center distanceFactor={6}>
          <div style={{ color: '#94a3b8', fontSize: 9, fontFamily: 'monospace' }}>
            {stack.length}/8 bloques
          </div>
        </Html>
      )}
    </>
  );
};

// ── Escena 10: POO es una forma de pensar ────────────────────────────────────
// Constelación de los 4 pilares POO como nodos conectados. Todo pulsa con el audio.
const Scene10 = ({ analyzer, expanded }) => {
  const buf = useRef(new Uint8Array(128));
  const smoothBass = useRef(0);
  const smoothMid = useRef(0);
  const nodeRefs = useRef([]);
  const groupRef = useRef();

  const pillars = [
    { pos: [0, 1.3, 0],   color: '#f97316', label: 'Encapsulamiento', icon: '🔒' },
    { pos: [1.3, 0, 0],   color: '#fbbf24', label: 'Herencia',         icon: '🧬' },
    { pos: [0, -1.3, 0],  color: '#a855f7', label: 'Polimorfismo',     icon: '🎭' },
    { pos: [-1.3, 0, 0],  color: '#10b981', label: 'Abstracción',      icon: '🌀' },
  ];
  const connections = [[0,1],[1,2],[2,3],[3,0],[0,2],[1,3]];

  useFrame(({ clock }) => {
    const bass = smoothVal(smoothBass, readBass(analyzer, buf.current));
    const mid = smoothVal(smoothMid, readMid(analyzer, buf.current));
    if (groupRef.current) groupRef.current.rotation.y = clock.elapsedTime * 0.2;
    nodeRefs.current.forEach(r => {
      if (!r) return;
      const s = 1 + bass * 0.45;
      r.scale.setScalar(s);
      r.material.emissiveIntensity = 0.2 + mid * 0.8;
    });
  });

  return (
    <group ref={groupRef}>
      {connections.map(([a, b], i) => (
        <Line key={i} points={[pillars[a].pos, pillars[b].pos]} color="#1e3a5f" lineWidth={1} transparent opacity={0.4} />
      ))}
      {pillars.map((p, i) => (
        <group key={i} position={p.pos}>
          <mesh ref={el => nodeRefs.current[i] = el}>
            <sphereGeometry args={[0.28, 14, 14]} />
            <meshStandardMaterial color={p.color} emissive={p.color} emissiveIntensity={0.2} roughness={0.2} metalness={0.7} />
          </mesh>
          {expanded && (
            <Html position={[0, 0.55, 0]} center distanceFactor={6}>
              <div style={{ color: p.color, fontSize: 9, fontFamily: 'monospace', fontWeight: 700, textAlign: 'center' }}>
                {p.icon} {p.label}
              </div>
            </Html>
          )}
        </group>
      ))}
      <Float speed={0.8} floatIntensity={0.2}>
        <mesh>
          <dodecahedronGeometry args={[0.18, 0]} />
          <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={1} />
        </mesh>
      </Float>
    </group>
  );
};

// ── Map episodeId → escena + meta ─────────────────────────────────────────────
const EPISODE_SCENES = {
  1:  { Scene: Scene1,  label: 'Objetos',         color: '#3b82f6' },
  2:  { Scene: Scene2,  label: 'Atributos',        color: '#8b5cf6' },
  3:  { Scene: Scene3,  label: 'Clases',           color: '#00d4ff' },
  4:  { Scene: Scene4,  label: 'Orden',            color: '#f59e0b' },
  5:  { Scene: Scene5,  label: 'Herencia',         color: '#38bdf8' },
  6:  { Scene: Scene6,  label: 'Encapsulamiento',  color: '#06b6d4' },
  7:  { Scene: Scene7,  label: 'Interfaces',       color: '#f97316' },
  8:  { Scene: Scene8,  label: 'Polimorfismo',     color: '#ec4899' },
  9:  { Scene: Scene9,  label: 'Diseño',           color: '#6366f1' },
  10: { Scene: Scene10, label: 'POO Mindset',      color: '#14b8a6' },
};

// ── Lights comunes ────────────────────────────────────────────────────────────
const SceneLights = ({ color }) => (
  <>
    <ambientLight intensity={0.3} />
    <pointLight position={[4, 4, 4]} intensity={2.5} color={color} />
    <pointLight position={[-4, -3, -3]} intensity={1.0} color="#1a1a2e" />
  </>
);

// ── Visualizer principal ───────────────────────────────────────────────────────
const Visualizer = ({ audioRef, isPlaying, episodeId, episodeTitle }) => {
  const [analyzer, setAnalyzer] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      const a = getAnalyser(audioRef.current);
      if (a) setAnalyzer(a);
    }
  }, [isPlaying, audioRef]);

  const meta = EPISODE_SCENES[episodeId] ?? { Scene: Scene1, label: 'Cap. ' + episodeId, color: '#3b82f6' };
  const { Scene, label, color } = meta;

  return (
    <div className={`
      fixed transition-all duration-500 ease-out z-[60] pointer-events-auto
      ${isExpanded
        ? 'inset-0 bg-slate-950'
        : 'bottom-28 right-8 w-64 h-64 rounded-3xl overflow-hidden border-2 shadow-2xl bg-slate-900/80 backdrop-blur-md'}
    `}
    style={{ borderColor: isExpanded ? 'transparent' : `${color}40` }}
    >
      {/* Header badge + botones */}
      <div className="absolute top-3 left-3 z-[70] flex items-center gap-2">
        <div
          className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono tracking-wider"
          style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}
        >
          CAP {episodeId} · {label.toUpperCase()}
        </div>
        {isPlaying && (
          <div className="flex gap-[2px] items-end h-3">
            {[0,1,2].map(i => (
              <div key={i} className="w-[3px] rounded-full bg-current animate-pulse"
                style={{ color, height: `${40 + i * 20}%`, animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        )}
      </div>
      <div className="absolute top-3 right-3 z-[70]">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-xl border border-white/10 transition-all active:scale-95"
        >
          {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      {/* Canvas 3D */}
      <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 0, 4.5], fov: 50 }}>
        <SceneLights color={color} />
        <Stars radius={80} depth={40} count={1200} factor={3} saturation={0} fade speed={0.5} />
        <Sparkles count={30} scale={5} size={0.8} speed={0.15} opacity={0.15} color={color} />
        <Scene analyzer={analyzer} expanded={isExpanded} />
      </Canvas>

      {/* Título en modo expandido */}
      {isExpanded && (
        <div className="absolute bottom-10 left-10 text-white pointer-events-none">
          <p className="text-xs font-mono tracking-widest mb-1" style={{ color: `${color}80` }}>
            VISUALIZADOR · CAP {episodeId}
          </p>
          <h2 className="text-2xl font-black" style={{ color }}>
            {label}
          </h2>
          {episodeTitle && (
            <p className="text-slate-500 text-sm mt-1 max-w-xs">{episodeTitle}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Visualizer;
