import { useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  RotateCcw, 
  RotateCw, 
  Gauge,
  ListMusic // ← Nuevo
} from 'lucide-react';

const PlayerBar = ({ 
  currentEpisode, 
  isPlaying, 
  onTogglePlay, 
  currentTime, 
  duration, 
  onSeek,
  onVolumeChange,
  onNext,
  onPrevious,
  onSkip,
  playbackRate,
  onChangeRate,
  onToggleQueue, // ← Nuevo
  queueLength    // ← Nuevo
}) => {
  
  // Atajos de teclado (UX Senior)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return; 

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          onTogglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onSkip(30);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onSkip(-10);
          break;
        case 'KeyQ': // ← Nuevo atajo para la cola
          e.preventDefault();
          onToggleQueue();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTogglePlay, onSkip, onToggleQueue]);

  if (!currentEpisode) return null;

  const formatTime = (time) => {
    if (!time) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const speeds = [1, 1.25, 1.5, 2];
  const nextSpeed = () => {
    const currentIndex = speeds.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % speeds.length;
    onChangeRate(speeds[nextIndex]);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 p-4 h-28 flex items-center justify-between z-50 px-8 shadow-2xl">
      
      {/* 1. Info del Track */}
      <div className="flex items-center gap-4 w-1/4">
        <div className="w-16 h-16 bg-slate-800 rounded-lg overflow-hidden shadow-lg group relative">
          <img src={currentEpisode.imageSrc} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="overflow-hidden">
          <h4 className="font-bold text-white text-sm truncate hover:text-blue-400 cursor-pointer transition-colors">
            {currentEpisode.title}
          </h4>
          <p className="text-xs text-slate-400 flex items-center gap-2">
            <span className="bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
              {currentEpisode.category || 'Podcast'}
            </span>
            POOdcast
          </p>
        </div>
      </div>

      {/* 2. Controles Centrales */}
      <div className="flex flex-col items-center gap-3 w-2/4 max-w-xl">
        <div className="flex items-center gap-5">
          {/* Botones Secundarios */}
          <button 
            onClick={onPrevious}
            className="text-slate-500 hover:text-white transition-colors"
            title="Anterior"
          >
            <SkipBack size={22} fill="currentColor" />
          </button>
          
          <button 
            onClick={() => onSkip(-10)}
            className="text-slate-400 hover:text-blue-400 transition-all active:scale-90"
            title="Retroceder 10s"
          >
            <RotateCcw size={22} />
          </button>
          
          {/* Play/Pause Principal */}
          <button 
            onClick={onTogglePlay}
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-all text-black shadow-xl shadow-white/5 active:scale-95"
          >
            {isPlaying ? <Pause size={24} fill="black" /> : <Play size={24} fill="black" className="ml-1" />}
          </button>
          
          <button 
            onClick={() => onSkip(30)}
            className="text-slate-400 hover:text-blue-400 transition-all active:scale-90"
            title="Adelantar 30s"
          >
            <RotateCw size={22} />
          </button>

          <button 
            onClick={onNext}
            className="text-slate-500 hover:text-white transition-colors"
            title="Siguiente"
          >
            <SkipForward size={22} fill="currentColor" />
          </button>
        </div>
        
        {/* BARRA DE PROGRESO MEJORADA */}
        <div className="w-full flex items-center gap-3 text-xs text-slate-500 font-medium">
          <span className="w-12 text-right tabular-nums">{formatTime(currentTime)}</span>
          
          <div className="relative flex-1 group h-6 flex items-center">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 z-10"
            />
            {/* Background progress fill */}
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 rounded-lg pointer-events-none transition-all"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
          
          <span className="w-12 tabular-nums">{formatTime(duration)}</span>
        </div>
      </div>

      {/* 3. Ajustes Adicionales (Velocidad y Volumen) */}
      <div className="flex items-center justify-end gap-6 w-1/4">
        {/* Selector de Velocidad */}
        <button 
          onClick={nextSpeed}
          className="flex items-center gap-1.5 text-slate-400 hover:text-blue-400 transition-colors font-bold text-xs bg-slate-800/50 px-2.5 py-1.5 rounded-lg border border-slate-700/50"
          title="Velocidad de reproducción"
        >
          <Gauge size={14} />
          <span>{playbackRate}x</span>
        </button>

        {/* Botón de Cola */}
        <button 
          onClick={onToggleQueue}
          className={`relative p-2 rounded-lg transition-all ${queueLength > 0 ? 'text-blue-400 hover:bg-blue-500/10' : 'text-slate-400 hover:bg-slate-800'}`}
          title="Ver cola de reproducción (Q)"
        >
          <ListMusic size={20} />
          {queueLength > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-slate-900">
              {queueLength}
            </span>
          )}
        </button>

        {/* Control de Volumen */}
        <div className="flex items-center gap-2 text-slate-400 group min-w-[120px]">
          <Volume2 size={18} className="group-hover:text-white transition-colors"/>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            onChange={(e) => onVolumeChange(e.target.value)}
            defaultValue="1"
            className="w-20 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-500 hover:accent-white"
          />
        </div>
      </div>

    </div>
  );
};

export default PlayerBar;
