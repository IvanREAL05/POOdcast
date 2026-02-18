// components/UI/ResumeNotification.jsx
import { Play, X, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

const ResumeNotification = ({ 
  episode, 
  progress, 
  onResume, 
  onCancel,
  autoHideDelay = 10000 // 10 segundos
}) => {
  const [timeLeft, setTimeLeft] = useState(autoHideDelay / 1000);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-cancel after delay
    const timer = setTimeout(() => {
      handleCancel();
    }, autoHideDelay);

    // Countdown timer
    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const handleResume = () => {
    setIsVisible(false);
    onResume();
  };

  const handleCancel = () => {
    setIsVisible(false);
    onCancel();
  };

  if (!isVisible) return null;

  // Formatear tiempo
  const formatProgressTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calcular porcentaje
  const progressPercent = episode.duration 
    ? Math.round((progress / episode.duration) * 100)
    : 0;

  return (
    <div className="fixed top-4 right-4 z-[100] max-w-sm w-full animate-slideIn">
      {/* Notificación principal */}
      <div className="bg-slate-900 border border-blue-500/30 rounded-2xl shadow-2xl shadow-blue-500/20 overflow-hidden backdrop-blur-sm">
        
        {/* Barra de progreso superior */}
        <div className="h-1 bg-slate-800 w-full">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000"
            style={{ width: `${(timeLeft / (autoHideDelay / 1000)) * 100}%` }}
          />
        </div>

        <div className="p-4">
          {/* Header con icono y título */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <Clock size={18} className="text-blue-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-300">Continuar reproduciendo</h4>
                <p className="text-xs text-slate-500">Episodio guardado</p>
              </div>
            </div>
            <button 
              onClick={handleCancel}
              className="text-slate-500 hover:text-slate-300 transition-colors p-1 hover:bg-slate-800 rounded-lg"
            >
              <X size={16} />
            </button>
          </div>

          {/* Info del episodio */}
          <div className="flex gap-3 mb-4">
            {/* Imagen del episodio */}
            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 border-blue-500/30">
              <img 
                src={episode.imageSrc} 
                alt={episode.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Detalles */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-sm mb-1 line-clamp-2">
                {episode.title}
              </h3>
              
              {/* Barra de progreso */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-blue-400 font-mono">
                    {formatProgressTime(progress)}
                  </span>
                  <span className="text-slate-500">
                    {progressPercent}%
                  </span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-2">
            <button
              onClick={handleResume}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5 px-4 rounded-xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
            >
              <Play size={16} fill="white" />
              Continuar desde {formatProgressTime(progress)}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all text-sm font-medium"
            >
              Empezar desde el inicio
            </button>
          </div>

          {/* Tiempo restante para auto-cancel */}
          <p className="text-xs text-center text-slate-600 mt-3">
            Se cerrará automáticamente en {timeLeft} segundos
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResumeNotification;