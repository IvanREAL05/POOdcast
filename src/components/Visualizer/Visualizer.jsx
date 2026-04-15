import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  Float, 
  MeshDistortMaterial, 
  Stars,
  PerspectiveCamera,
  Text,
  Html,
  ContactShadows,
  Environment,
  PresentationControls
} from '@react-three/drei';
import * as THREE from 'three';
import { Maximize2, Minimize2, Activity, Box } from 'lucide-react';

let memoizedSource = null;

const HUD = ({ analyzer, category }) => {
  const [stats, setStats] = useState({ vol: 0 });

  useFrame(() => {
    if (!analyzer) return;
    const data = new Uint8Array(analyzer.frequencyBinCount);
    analyzer.getByteFrequencyData(data);
    const avg = data.reduce((a, b) => a + b) / data.length;
    setStats({ vol: Math.round(avg) });
  });

  return (
    <Html position={[-3, 2, 0]} className="pointer-events-none">
      <div className="bg-black/60 backdrop-blur-xl p-4 rounded-2xl border border-white/10 text-white font-mono w-48 shadow-2xl">
        <div className="text-[10px] text-blue-400 mb-2 font-bold tracking-tighter flex items-center gap-2">
          <Activity size={12} /> SYSTEM_OVERLAY_v1
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span>CLASS:</span>
            <span className="text-blue-400">{category}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span>SIGNAL:</span>
            <span className={stats.vol > 0 ? "text-green-400" : "text-red-400"}>
              {stats.vol > 0 ? "STABLE" : "OFFLINE"}
            </span>
          </div>
        </div>
        <div className="mt-3 h-1 w-full bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 transition-all duration-100" style={{ width: `${stats.vol}%` }} />
        </div>
      </div>
    </Html>
  );
};

const POOCore = ({ analyzer, category }) => {
  const meshRef = useRef();
  const [dataArray] = useState(() => new Uint8Array(analyzer?.frequencyBinCount || 128));

  useFrame(() => {
    if (!analyzer) return;
    analyzer.getByteFrequencyData(dataArray);
    const lowFreq = dataArray[2] / 255;
    const scale = 1.2 + lowFreq * 1.5;
    meshRef.current.scale.set(scale, scale, scale);
    meshRef.current.rotation.y += 0.01;
  });

  const theme = {
    'Básico': '#3b82f6',
    'Intermedio': '#a855f7',
    'Avanzado': '#f59e0b',
    'default': '#06b6d4'
  };

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef}>
        {category === 'Avanzado' ? (
          <octahedronGeometry args={[1, 0]} />
        ) : category === 'Intermedio' ? (
          <torusKnotGeometry args={[0.6, 0.2, 128, 16]} />
        ) : (
          <boxGeometry args={[1, 1, 1]} />
        )}
        <MeshDistortMaterial 
          color={theme[category] || theme.default} 
          speed={4} 
          distort={0.3} 
          radius={1}
        />
      </mesh>
    </Float>
  );
};

const Visualizer = ({ audioRef, isPlaying, episodeType }) => {
  const [analyzer, setAnalyzer] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      try {
        if (!memoizedSource) {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const source = audioContext.createMediaElementSource(audioRef.current);
          const newAnalyzer = audioContext.createAnalyser();
          newAnalyzer.fftSize = 256;
          source.connect(newAnalyzer);
          newAnalyzer.connect(audioContext.destination);
          memoizedSource = source;
          setAnalyzer(newAnalyzer);
        } else {
          setAnalyzer(memoizedSource.context.activeAnalyzer || memoizedSource.context.createAnalyser());
        }
      } catch (e) {
        console.warn("Audio connection active");
      }
    }
  }, [isPlaying]);

  return (
    <div 
      className={`
        fixed transition-all duration-500 ease-out z-[60] pointer-events-auto
        ${isExpanded 
          ? 'inset-0 bg-slate-950' 
          : 'bottom-28 right-8 w-64 h-64 rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl hover:border-blue-500/50 bg-slate-900/80 backdrop-blur-md'}
      `}
    >
      {/* Botones de Control */}
      <div className="absolute top-4 right-4 z-[70] flex gap-2">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl border border-white/10 transition-all active:scale-95"
          title={isExpanded ? "Contraer" : "Expandir"}
        >
          {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </div>

      {/* Overlay cuando no hay audio */}
      {!isPlaying && !isExpanded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
          <Box className="text-slate-700 animate-pulse" size={40} />
        </div>
      )}

      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, isExpanded ? 5 : 4]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#3b82f6" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#f43f5e" />
        
        <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
        
        <PresentationControls
          global
          config={{ mass: 1, tension: 500 }}
          snap={{ mass: 2, tension: 1500 }}
          rotation={[0, 0.3, 0]}
          polar={[-Math.PI / 3, Math.PI / 3]}
          azimuth={[-Math.PI / 1.4, Math.PI / 1.4]}
        >
          <POOCore analyzer={analyzer} category={episodeType} />
        </PresentationControls>

        {isExpanded && <HUD analyzer={analyzer} category={episodeType} />}
        
        <ContactShadows position={[0, -2, 0]} opacity={0.5} scale={10} blur={2.5} far={4} />
        <Environment preset="night" />
      </Canvas>

      {/* Título Inmersivo */}
      {isExpanded && (
        <div className="absolute bottom-10 left-10 text-white">
          <h2 className="text-4xl font-black italic tracking-tighter">POO <span className="text-blue-500">ENGINE</span></h2>
          <p className="text-slate-500 font-mono text-xs uppercase">Multimedia Experience Module</p>
        </div>
      )}
    </div>
  );
};

export default Visualizer;
