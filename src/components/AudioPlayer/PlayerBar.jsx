import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';

const PlayerBar = ({ 
  currentEpisode, 
  isPlaying, 
  onTogglePlay, 
  currentTime, 
  duration, 
  onSeek,
  onVolumeChange 
}) => {
  if (!currentEpisode) return null;

  // Función auxiliar para convertir segundos a MM:SS
  const formatTime = (time) => {
    if (!time) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 p-4 h-24 flex items-center justify-between z-50 px-8">
      
      {/* 1. Info del Track */}
      <div className="flex items-center gap-4 w-1/3">
        <div className="w-14 h-14 bg-slate-800 rounded-md overflow-hidden shadow-lg">
          <img src={currentEpisode.imageSrc} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="overflow-hidden">
          <h4 className="font-bold text-white text-sm truncate">{currentEpisode.title}</h4>
          <p className="text-xs text-slate-400">POOdcast</p>
        </div>
      </div>

      {/* 2. Controles Centrales */}
      <div className="flex flex-col items-center gap-2 w-1/3 max-w-md">
        <div className="flex items-center gap-6">
          <button className="text-slate-400 hover:text-white transition-colors"><SkipBack size={20} /></button>
          
          <button 
            onClick={onTogglePlay}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform text-black shadow-white/10 shadow-lg"
          >
            {isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" className="ml-1" />}
          </button>
          
          <button className="text-slate-400 hover:text-white transition-colors"><SkipForward size={20} /></button>
        </div>
        
        {/* BARRA DE PROGRESO REAL */}
        <div className="w-full flex items-center gap-2 text-xs text-slate-500 font-mono">
          <span className="w-10 text-right">{formatTime(currentTime)}</span>
          
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={(e) => onSeek(e.target.value)}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
          />
          
          <span className="w-10">{formatTime(duration)}</span>
        </div>
      </div>

      {/* 3. Volumen */}
      <div className="flex items-center justify-end gap-2 w-1/3 text-slate-400 group">
        <Volume2 size={18} className="group-hover:text-white transition-colors"/>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          onChange={(e) => onVolumeChange(e.target.value)}
          defaultValue="1"
          className="w-24 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-500 hover:accent-white"
        />
      </div>

    </div>
  );
};

export default PlayerBar;