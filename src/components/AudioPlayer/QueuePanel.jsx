import { X, Play, Trash2, ListMusic, Music } from 'lucide-react';

const QueuePanel = ({ 
  isOpen, 
  onClose, 
  queue, 
  currentEpisode, 
  onPlayEpisode, 
  onRemoveFromQueue, 
  onClearQueue 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 md:w-96 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 z-[60] shadow-2xl animate-in slide-in-from-right duration-300">
      <div className="flex flex-col h-full">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListMusic className="text-blue-500" size={24} />
            <h2 className="text-xl font-bold text-white">Cola de reproducción</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-full transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {/* Sonando ahora */}
          {currentEpisode && (
            <div className="mb-8">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Reproduciendo ahora</h3>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-4">
                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 shadow-lg">
                  <img src={currentEpisode.imageSrc} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-blue-400 truncate">{currentEpisode.title}</p>
                  <p className="text-xs text-slate-500">POOdcast</p>
                </div>
              </div>
            </div>
          )}

          {/* Siguiente en la cola */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Siguiente en la cola</h3>
              {queue.length > 0 && (
                <button 
                  onClick={onClearQueue}
                  className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
                >
                  Vaciar cola
                </button>
              )}
            </div>

            {queue.length > 0 ? (
              <div className="space-y-3">
                {queue.map((episode, index) => (
                  <div 
                    key={`${episode.id}-${index}`}
                    className="group flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50 border border-transparent hover:border-slate-700 transition-all"
                  >
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
                      <img src={episode.imageSrc} alt="" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => onPlayEpisode(episode)}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Play size={16} fill="white" className="text-white" />
                      </button>
                    </div>
                    
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                        {episode.title}
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{episode.category}</p>
                    </div>

                    <button 
                      onClick={() => onRemoveFromQueue(episode.id)}
                      className="text-slate-600 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-all"
                      title="Eliminar de la cola"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Music size={40} className="text-slate-800 mx-auto mb-4" />
                <p className="text-slate-500 text-sm">Tu cola está vacía.</p>
                <p className="text-slate-600 text-xs mt-1">Añade episodios desde la biblioteca.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer (Info) */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
          <p className="text-[10px] text-slate-500 text-center">
            {queue.length} episodio(s) restantes • POOdcast v1.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default QueuePanel;
