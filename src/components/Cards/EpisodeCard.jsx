// components/EpisodeCard.jsx
import { Play, Pause, Plus, Check, Clock } from 'lucide-react';
import { useState } from 'react';

/**
 * EpisodeCard - Tarjeta de episodio profesional estilo Spotify/Netflix
 * 
 * Características:
 * - Muestra información del episodio
 * - Indicador visual de reproducción actual
 * - Botón para añadir a cola
 * - Efectos hover profesionales
 * - Tooltips para mejor UX
 */

const EpisodeCard = ({ 
  episode, 
  isActive, 
  isPlaying, 
  onPlay, 
  onAddToQueue,
  queue = [] // Para saber si ya está en cola
}) => {
  // Estado local para feedback al añadir a cola
  const [showAddedFeedback, setShowAddedFeedback] = useState(false);

  /**
   * Maneja el click en el botón de cola
   * Evita que el evento se propague al contenedor principal
   */
  const handleAddToQueue = (e) => {
    e.stopPropagation(); // ¡Importante! Evita que se active onPlay
    
    onAddToQueue(episode);
    
    // Feedback visual: muestra "Añadido" por 2 segundos
    setShowAddedFeedback(true);
    setTimeout(() => setShowAddedFeedback(false), 2000);
  };

  /**
   * Determina si el episodio ya está en la cola
   */
  const isInQueue = queue.some(item => item.id === episode.id);

  /**
   * Formatea la duración del episodio (si existe)
   * @param {number} seconds - Duración en segundos
   * @returns {string} Tiempo formateado MM:SS
   */
  const formatDuration = (seconds) => {
    if (!seconds) return null;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative group">
      {/* 🎯 Botón de añadir a cola (solo visible si no es el episodio actual) */}
      {!isActive && (
        <button
          onClick={handleAddToQueue}
          className={`
            absolute top-2 right-2 z-20 
            p-2.5 rounded-full 
            transition-all duration-300 
            transform hover:scale-110
            ${isInQueue 
              ? 'bg-green-500 text-white cursor-default'  // Ya en cola
              : 'bg-slate-900/80 text-slate-300 hover:bg-blue-500 hover:text-white'
            }
            opacity-0 group-hover:opacity-100
            shadow-lg
          `}
          title={isInQueue ? 'Ya está en la cola' : 'Añadir a cola'}
          disabled={isInQueue}
        >
          {showAddedFeedback ? (
            <Check size={16} className="animate-pop" />
          ) : (
            <Plus size={16} />
          )}
        </button>
      )}

      {/* 🎨 Indicador de "en cola" para el episodio actual */}
      {isActive && (
        <div className="absolute top-2 right-2 z-20 bg-blue-500 p-2 rounded-full shadow-lg">
          <Clock size={16} className="text-white" />
        </div>
      )}

      {/* 🖼️ Contenedor principal de la tarjeta */}
      <div 
        onClick={() => onPlay(episode)}
        className={`
          relative p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer
          ${isActive 
            ? 'bg-gradient-to-br from-blue-900/30 to-slate-900 border-blue-500 shadow-2xl shadow-blue-500/20 scale-[1.02]' 
            : 'bg-slate-800/50 border-slate-700 hover:border-blue-500/50 hover:bg-slate-800 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1'
          }
        `}
      >
        {/* 📸 Contenedor de imagen con overlay */}
        <div className="relative aspect-square rounded-xl bg-slate-700 mb-4 overflow-hidden">
          <img 
            src={episode.imageSrc} 
            alt={episode.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          
          {/* 🌟 Overlay gradiente */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* ▶️ Botón de reproducción flotante (hover) */}
          <div className={`
            absolute inset-0 flex items-center justify-center 
            transition-all duration-300
            ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
          `}>
            {isActive && isPlaying ? (
              // Animación de barras cuando está sonando
              <div className="flex gap-1.5 items-end h-12">
                <span className="w-1.5 bg-white h-4 animate-pulse rounded-full"></span>
                <span className="w-1.5 bg-white h-8 animate-pulse delay-75 rounded-full"></span>
                <span className="w-1.5 bg-white h-6 animate-pulse delay-150 rounded-full"></span>
                <span className="w-1.5 bg-white h-10 animate-pulse delay-200 rounded-full"></span>
              </div>
            ) : (
              // Botón de play con animación
              <div className="bg-blue-500 p-4 rounded-full shadow-xl transform hover:scale-110 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/50">
                <Play fill="white" className="text-white ml-1" size={24} />
              </div>
            )}
          </div>

          {/* 🏷️ Badge de duración (si existe) */}
          {episode.duration && (
            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-xs text-slate-300 px-2 py-1 rounded-full">
              {formatDuration(episode.duration)}
            </div>
          )}
        </div>

        {/* 📝 Información del episodio */}
        <div className="space-y-2">
          <h3 className={`
            font-bold text-lg truncate transition-colors duration-300
            ${isActive ? 'text-blue-400' : 'text-white group-hover:text-blue-400'}
          `}>
            {episode.title}
          </h3>
          
          <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
            {episode.description}
          </p>

          {/* 🏷️ Metadatos del episodio */}
          <div className="flex items-center gap-2 pt-2">
            {episode.category && (
              <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-full">
                {episode.category}
              </span>
            )}
            {episode.date && (
              <span className="text-xs text-slate-500">
                {new Date(episode.date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* 📊 Barra de progreso (solo para episodio activo) */}
        {isActive && episode.progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-700 rounded-b-xl overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${episode.progress}%` }}
            />
          </div>
        )}
      </div>

      {/* 💬 Tooltip personalizado para feedback */}
      {showAddedFeedback && (
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 z-30 bg-green-500 text-white text-sm py-1 px-3 rounded-full shadow-lg animate-fadeInUp">
          ¡Añadido a la cola!
        </div>
      )}
    </div>
  );
};

// Valores por defecto para props
EpisodeCard.defaultProps = {
  queue: [],
  isActive: false,
  isPlaying: false
};

export default EpisodeCard;