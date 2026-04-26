import { Play, Pause, Plus, Check, Clock, Heart } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const EpisodeCard = ({ 
  episode, 
  isActive, 
  isPlaying, 
  onPlay, 
  onAddToQueue,
  isFavorite,
  onToggleFavorite,
  queue = [] 
}) => {
  const [showAddedFeedback, setShowAddedFeedback] = useState(false);

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite(episode.id);
  };

  const handleAddToQueue = (e) => {
    e.preventDefault();
    e.stopPropagation(); 
    onAddToQueue(episode);
    setShowAddedFeedback(true);
    setTimeout(() => setShowAddedFeedback(false), 2000);
  };

  const handlePlayClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onPlay(episode);
  };

  const isInQueue = queue.some(item => item.id === episode.id);

  const formatDuration = (seconds) => {
    if (!seconds) return null;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative group">
      {/* Botones de acción rápida (Top Right) */}
      <div className="absolute top-2 right-2 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {!isActive && (
          <button
            onClick={handleAddToQueue}
            className={`
              p-2.5 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg
              ${isInQueue 
                ? 'bg-green-500 text-white cursor-default'
                : 'bg-slate-900/80 text-slate-300 hover:bg-blue-500 hover:text-white'
              }
            `}
            title={isInQueue ? 'Ya está en la cola' : 'Añadir a cola'}
            disabled={isInQueue}
          >
            {showAddedFeedback ? <Check size={16} className="animate-pop" /> : <Plus size={16} />}
          </button>
        )}

        <button
          onClick={handleFavoriteClick}
          className={`
            p-2.5 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg
            ${isFavorite 
              ? 'bg-pink-500 text-white opacity-100' 
              : 'bg-slate-900/80 text-slate-300 hover:bg-pink-500 hover:text-white'
            }
          `}
          title={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
        >
          <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
        </button>
      </div>

      {isActive && (
        <div className="absolute top-2 left-2 z-20 bg-blue-500 p-2 rounded-full shadow-lg">
          <Clock size={16} className="text-white" />
        </div>
      )}

      <Link 
        to={`/episode/${episode.id}`}
        className={`
          block relative p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer
          ${isActive 
            ? 'bg-gradient-to-br from-blue-900/30 to-slate-900 border-blue-500 shadow-2xl shadow-blue-500/20 scale-[1.02]' 
            : 'bg-slate-800/50 border-slate-700 hover:border-blue-500/50 hover:bg-slate-800 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1'
          }
        `}
      >
        <div className="relative aspect-square rounded-xl bg-slate-700 mb-4 overflow-hidden">
          <img 
            src={episode.imageSrc} 
            alt={episode.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className={`
            absolute inset-0 flex items-center justify-center 
            transition-all duration-300
            ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
          `}>
            {isActive && isPlaying ? (
              <div className="flex gap-1.5 items-end h-12" onClick={handlePlayClick}>
                <span className="w-1.5 bg-white h-4 animate-pulse rounded-full"></span>
                <span className="w-1.5 bg-white h-8 animate-pulse delay-75 rounded-full"></span>
                <span className="w-1.5 bg-white h-6 animate-pulse delay-150 rounded-full"></span>
                <span className="w-1.5 bg-white h-10 animate-pulse delay-200 rounded-full"></span>
              </div>
            ) : (
              <div 
                onClick={handlePlayClick}
                className="bg-blue-500 p-4 rounded-full shadow-xl transform hover:scale-110 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/50"
              >
                <Play fill="white" className="text-white ml-1" size={24} />
              </div>
            )}
          </div>

          {episode.duration && (
            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-xs text-slate-300 px-2 py-1 rounded-full">
              {episode.duration}
            </div>
          )}
        </div>

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

        {isActive && episode.progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-700 rounded-b-xl overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${episode.progress}%` }}
            />
          </div>
        )}
      </Link>

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
