import { useNavigate } from 'react-router-dom';
import { Play, Box, ChevronRight, Headphones, Layers, Zap, Code2, BookOpen } from 'lucide-react';

// ── Datos ────────────────────────────────────────────────────────────────────

const PILLARS = [
  {
    icon: '🔒', name: 'Encapsulamiento', color: '#3b82f6',
    desc: 'Protege los datos internos de un objeto y controla el acceso desde afuera mediante métodos definidos.',
  },
  {
    icon: '🧬', name: 'Herencia', color: '#10b981',
    desc: 'Una clase hija hereda atributos y métodos de su clase padre, evitando duplicar código.',
  },
  {
    icon: '🎭', name: 'Polimorfismo', color: '#a855f7',
    desc: 'El mismo método se comporta diferente según el objeto que lo ejecuta. Una interfaz, muchos comportamientos.',
  },
  {
    icon: '🌀', name: 'Abstracción', color: '#f59e0b',
    desc: 'Oculta la complejidad interna y expone solo lo que el usuario necesita saber para usar el objeto.',
  },
];

const STEPS = [
  {
    num: '01', icon: <Headphones size={22} />, color: '#3b82f6',
    title: 'Elige un episodio',
    desc: 'Explora la biblioteca de episodios organizados por concepto.',
  },
  {
    num: '02', icon: <BookOpen size={22} />, color: '#a855f7',
    title: 'Escucha y aprende',
    desc: 'Audio explicativo con analogías del mundo real para cada concepto.',
  },
  {
    num: '03', icon: <Box size={22} />, color: '#10b981',
    title: 'Explora en 3D',
    desc: 'Visualiza los 4 pilares de la POO en una experiencia 3D interactiva.',
  },
];

const KEYWORDS = [
  { text: 'class',       x: '4%',  y: '18%', dur: '4.2s', delay: '0s',    r: '-6deg'  },
  { text: 'extends',     x: '80%', y: '12%', dur: '5.1s', delay: '0.6s',  r: '4deg'   },
  { text: 'new()',       x: '88%', y: '55%', dur: '4.7s', delay: '1.2s',  r: '-3deg'  },
  { text: '#private',    x: '3%',  y: '65%', dur: '5.4s', delay: '0.3s',  r: '5deg'   },
  { text: 'super()',     x: '70%', y: '82%', dur: '4.0s', delay: '1.8s',  r: '-4deg'  },
  { text: 'interface',   x: '12%', y: '86%', dur: '5.8s', delay: '0.9s',  r: '3deg'   },
  { text: 'this.method()', x: '55%', y: '6%', dur: '4.5s', delay: '0.4s', r: '-2deg'  },
  { text: 'abstract',   x: '30%', y: '92%', dur: '5.2s', delay: '2.1s',  r: '6deg'   },
  { text: 'get saldo()', x: '72%', y: '40%', dur: '4.9s', delay: '1.5s',  r: '-5deg'  },
  { text: 'override',   x: '18%', y: '30%', dur: '5.6s', delay: '0.7s',  r: '2deg'   },
];

const STATS = [
  { icon: <Headphones size={20} />, value: '10', label: 'Episodios', color: '#3b82f6' },
  { icon: <Layers     size={20} />, value: '4', label: 'Pilares POO', color: '#a855f7' },
  { icon: <Box        size={20} />, value: '3D', label: 'Experiencia', color: '#10b981' },
  { icon: <Zap        size={20} />, value: '∞', label: 'Audio reactivo', color: '#f59e0b' },
];

// ── Componente: Pilar card ────────────────────────────────────────────────────

const PillarCard = ({ pillar, onClick }) => (
  <button
    onClick={onClick}
    className="group text-left p-6 rounded-2xl border border-slate-800 bg-slate-900/40
               transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl focus:outline-none"
    style={{ '--glow': pillar.color }}
    onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${pillar.color}50`; e.currentTarget.style.backgroundColor = `${pillar.color}08`; }}
    onMouseLeave={(e) => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.backgroundColor = ''; }}
  >
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4
                 transition-transform duration-300 group-hover:scale-110"
      style={{ backgroundColor: `${pillar.color}18` }}
    >
      {pillar.icon}
    </div>
    <h3 className="font-black text-base mb-2 text-white group-hover:transition-colors duration-200"
      style={{}}>
      {pillar.name}
    </h3>
    <p className="text-slate-500 text-sm leading-relaxed">{pillar.desc}</p>
    <div className="mt-4 flex items-center gap-1 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      style={{ color: pillar.color }}>
      Explorar <ChevronRight size={12} />
    </div>
  </button>
);

// ── Componente: Tarjeta de episodio compacta ──────────────────────────────────

const EpisodePreviewCard = ({ ep, isCurrent, isPlaying, onPlay }) => (
  <div
    className="flex items-center gap-4 p-4 rounded-2xl border border-slate-800 bg-slate-900/40
               hover:bg-slate-800/50 hover:border-slate-700 transition-all duration-300 group"
  >
    {/* Avatar con número */}
    <div
      className="w-14 h-14 rounded-xl flex items-center justify-center font-black text-lg shrink-0 relative"
      style={{ backgroundColor: `${ep.color}20`, color: ep.color }}
    >
      {isCurrent && isPlaying ? (
        <span className="animate-pulse text-sm">▶</span>
      ) : (
        <span className="font-mono">E{ep.id}</span>
      )}
      {isCurrent && (
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400">
          <span className="animate-pulse-ring absolute inset-0 rounded-full bg-green-400" />
        </span>
      )}
    </div>

    {/* Info */}
    <div className="flex-1 min-w-0">
      <p className="font-bold text-sm text-white truncate">{ep.title}</p>
      <p className="text-slate-500 text-xs truncate mt-0.5">{ep.description}</p>
      <p className="text-slate-600 text-xs mt-1 font-mono">{ep.duration}</p>
    </div>

    {/* Botón */}
    <button
      onClick={() => onPlay(ep)}
      className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200
                 hover:scale-110 active:scale-95"
      style={{ backgroundColor: `${ep.color}20`, color: ep.color }}
    >
      <Play size={16} fill="currentColor" />
    </button>
  </div>
);

// ── Página principal ──────────────────────────────────────────────────────────

const HomePage = ({ episodes = [], currentEpisode, isPlaying, onPlay }) => {
  const navigate = useNavigate();

  return (
    <div className="pb-36 animate-in fade-in duration-500">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative min-h-[72vh] flex flex-col items-center justify-center text-center overflow-hidden rounded-3xl mb-10 px-8"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(59,130,246,0.12) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 80% 70%, rgba(168,85,247,0.10) 0%, transparent 60%), #020817',
          backgroundImage: `
            radial-gradient(ellipse 80% 60% at 50% 40%, rgba(59,130,246,0.12) 0%, transparent 70%),
            radial-gradient(ellipse 60% 50% at 80% 70%, rgba(168,85,247,0.10) 0%, transparent 60%),
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
          `,
          backgroundSize: 'auto, auto, 44px 44px, 44px 44px',
          backgroundColor: '#020817',
        }}
      >
        {/* Blobs animados */}
        <div className="absolute top-10 left-10 w-72 h-72 rounded-full blur-3xl pointer-events-none animate-blob"
          style={{ background: 'rgba(59,130,246,0.12)', animationDuration: '9s' }} />
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full blur-3xl pointer-events-none animate-blob"
          style={{ background: 'rgba(168,85,247,0.10)', animationDuration: '12s', animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/4 w-60 h-60 rounded-full blur-3xl pointer-events-none animate-blob"
          style={{ background: 'rgba(16,185,129,0.07)', animationDuration: '10s', animationDelay: '6s' }} />

        {/* Palabras clave flotantes */}
        {KEYWORDS.map((kw) => (
          <span
            key={kw.text}
            className="absolute font-mono text-xs pointer-events-none select-none animate-float-keyword"
            style={{
              left: kw.x, top: kw.y,
              color: '#94a3b8',
              '--r': kw.r,
              '--op-low': '0.15',
              '--op-high': '0.35',
              animationDuration: kw.dur,
              animationDelay: kw.delay,
              transform: `rotate(${kw.r})`,
            }}
          >
            {kw.text}
          </span>
        ))}

        {/* Badge */}
        <div className="relative z-10 inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/25 rounded-full px-4 py-1.5 mb-6">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-xs font-bold text-blue-400 tracking-widest uppercase">
            Proyecto Final · Ing. en Computación
          </span>
        </div>

        {/* Título principal */}
        <h1 className="relative z-10 text-5xl md:text-7xl font-black leading-[1.05] mb-6 tracking-tight">
          <span
            className="animate-gradient-text"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #93c5fd 35%, #c4b5fd 65%, #ffffff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              backgroundSize: '200% 200%',
              animation: 'gradient-text-shift 5s ease infinite',
            }}
          >
            Aprende POO
          </span>
          <br />
          <span className="text-white">de otra manera</span>
        </h1>

        {/* Subtítulo */}
        <p className="relative z-10 text-slate-400 text-lg max-w-lg leading-relaxed mb-10">
          Un podcast interactivo que te explica los fundamentos de la{' '}
          <span className="text-blue-400 font-semibold">Programación Orientada a Objetos</span>{' '}
          con audio, analogías del mundo real y visualizaciones 3D.
        </p>

        {/* CTAs */}
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => navigate('/podcast')}
            className="group flex items-center gap-3 px-7 py-3.5 rounded-2xl font-bold text-sm
                       transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              boxShadow: '0 0 30px rgba(99,102,241,0.25)',
            }}
          >
            <Play size={16} fill="white" />
            Empezar a escuchar
            <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
          </button>

          <button
            onClick={() => navigate('/experience')}
            className="group flex items-center gap-3 px-7 py-3.5 rounded-2xl font-bold text-sm border border-slate-700
                       text-slate-300 hover:text-white hover:border-purple-500/50 hover:bg-purple-500/10
                       transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <Box size={16} />
            Explorar en 3D
            <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Indicador scroll */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30 animate-bounce">
          <span className="text-xs text-slate-500 font-mono tracking-widest uppercase">scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-slate-500 to-transparent" />
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="flex flex-col items-center gap-2 p-5 rounded-2xl border border-slate-800 bg-slate-900/30
                       hover:bg-slate-900/60 transition-all duration-300"
          >
            <div className="p-2 rounded-xl" style={{ color: s.color, backgroundColor: `${s.color}15` }}>
              {s.icon}
            </div>
            <span className="text-3xl font-black" style={{ color: s.color }}>{s.value}</span>
            <span className="text-xs text-slate-500 font-medium text-center">{s.label}</span>
          </div>
        ))}
      </section>

      {/* ── LOS 4 PILARES ────────────────────────────────────────── */}
      <section className="mb-14">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-xs text-blue-400 font-bold tracking-widest uppercase mb-1">Contenido del curso</p>
            <h2 className="text-2xl font-black text-white">Los 4 Pilares de la POO</h2>
          </div>
          <button
            onClick={() => navigate('/experience')}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-blue-400 font-medium transition-colors"
          >
            Ver en 3D <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PILLARS.map((p) => (
            <PillarCard key={p.name} pillar={p} onClick={() => navigate('/experience')} />
          ))}
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ────────────────────────────────────────── */}
      <section className="mb-14 p-8 rounded-3xl border border-slate-800 bg-slate-950/50">
        <p className="text-xs text-purple-400 font-bold tracking-widest uppercase mb-1 text-center">Flujo de aprendizaje</p>
        <h2 className="text-2xl font-black text-white text-center mb-10">¿Cómo funciona?</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Línea conectora (solo md+) */}
          <div className="hidden md:block absolute top-8 left-1/3 right-1/3 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, #334155, transparent)' }} />

          {STEPS.map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center gap-4">
              <div className="relative">
                {/* Anillo pulsante */}
                <div className="absolute inset-0 rounded-full animate-pulse opacity-30"
                  style={{ backgroundColor: step.color }} />
                <div
                  className="relative w-16 h-16 rounded-full flex items-center justify-center font-black text-white z-10"
                  style={{ backgroundColor: `${step.color}25`, border: `2px solid ${step.color}50`, color: step.color }}
                >
                  {step.icon}
                </div>
                <span
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center"
                  style={{ backgroundColor: step.color }}
                >
                  {step.num.slice(1)}
                </span>
              </div>
              <div>
                <h3 className="font-black text-white mb-1">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PREVIEW EPISODIOS ─────────────────────────────────────── */}
      <section className="mb-4">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-xs text-green-400 font-bold tracking-widest uppercase mb-1">Disponibles ahora</p>
            <h2 className="text-2xl font-black text-white">Episodios del podcast</h2>
          </div>
          <button
            onClick={() => navigate('/podcast')}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-green-400 font-medium transition-colors"
          >
            Ver todos <ChevronRight size={14} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {episodes.map((ep) => (
            <EpisodePreviewCard
              key={ep.id}
              ep={ep}
              isCurrent={currentEpisode?.id === ep.id}
              isPlaying={isPlaying}
              onPlay={onPlay}
            />
          ))}
        </div>

        <button
          onClick={() => navigate('/podcast')}
          className="mt-6 w-full py-3.5 rounded-2xl border border-slate-800 text-slate-400 text-sm font-bold
                     hover:bg-slate-800/50 hover:text-white hover:border-slate-700 transition-all duration-300
                     flex items-center justify-center gap-2"
        >
          <Code2 size={16} />
          Explorar biblioteca completa
          <ChevronRight size={14} />
        </button>
      </section>

    </div>
  );
};

export default HomePage;
