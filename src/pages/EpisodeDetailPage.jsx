import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import episodesData from '../data/episodes.json';
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  Calendar, 
  Clock, 
  Tag, 
  Share2, 
  Heart,
  Plus
} from 'lucide-react';

const EpisodeDetailPage = ({ 
  currentEpisode, 
  isPlaying, 
  onPlay, 
  isFavorite, 
  onToggleFavorite,
  onAddToQueue 
}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [episode, setEpisode] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    const foundEpisode = episodesData.find(ep => ep.id === parseInt(id));
    if (foundEpisode) {
      setEpisode(foundEpisode);
      
      // Lógica de recomendación: Mismo tema, diferente ID, máximo 3
      const related = episodesData
        .filter(ep => ep.category === foundEpisode.category && ep.id !== foundEpisode.id)
        .slice(0, 3);
      setRecommendations(related);
      
      // Scroll to top al cambiar de episodio
      window.scrollTo(0, 0);
    }
  }, [id]);

  if (!episode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-slate-400 mb-4 text-xl font-bold animate-pulse">Cargando episodio...</p>
        <button onClick={() => navigate('/')} className="text-blue-500 hover:underline">Volver a la biblioteca</button>
      </div>
    );
  }

  const isCurrentActive = currentEpisode?.id === episode.id;

  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-32">
      {/* Botón Volver */}
      <button 
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-slate-400 hover:text-white mb-10 transition-colors group"
      >
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Volver a la biblioteca</span>
      </button>

      <div className="flex flex-col md:flex-row gap-10 mb-16">
        {/* Imagen Portada con Efectos */}
        <div className="relative group w-full md:w-80 h-80 shrink-0">
          <div className="absolute inset-0 bg-blue-500 rounded-2xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50">
            <img src={episode.imageSrc} alt={episode.title} className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Info Principal */}
        <div className="flex flex-col justify-center flex-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-blue-400">
              <Tag size={16} />
              <span className="text-sm font-bold uppercase tracking-widest">{episode.category}</span>
            </div>
            
            <button 
              onClick={() => onToggleFavorite(episode.id)}
              className={`p-3 rounded-xl transition-all ${
                isFavorite(episode.id) 
                  ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20' 
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              <Heart size={20} fill={isFavorite(episode.id) ? "currentColor" : "none"} />
            </button>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black mb-6 text-white leading-tight">
            {episode.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-slate-400 text-sm mb-10">
            <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/30">
              <Calendar size={16} className="text-blue-500" />
              {new Date(episode.date).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/30">
              <Clock size={16} className="text-blue-500" />
              {formatDuration(episode.duration)}
            </div>
          </div>

          {/* Acciones principales */}
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => onPlay(episode)}
              className={`
                flex items-center justify-center gap-3 px-10 py-5 rounded-2xl font-black text-lg transition-all transform hover:scale-105 active:scale-95 shadow-2xl
                ${isCurrentActive && isPlaying 
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-white/5' 
                  : 'bg-blue-600 text-white shadow-blue-600/25 hover:bg-blue-500'}
              `}
            >
              {isCurrentActive && isPlaying ? (
                <>
                  <Pause fill="white" size={28} /> Pausar
                </>
              ) : (
                <>
                  <Play fill="white" size={28} /> Reproducir
                </>
              )}
            </button>
            
            <button 
              onClick={() => onAddToQueue(episode)}
              className="flex items-center justify-center gap-3 px-8 py-5 rounded-2xl font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition-all"
            >
              <Plus size={24} />
              A la cola
            </button>

            <button className="p-5 rounded-2xl bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-all">
              <Share2 size={24} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Descripción Principal */}
        <div className="lg:col-span-2 space-y-10">
          <section className="bg-slate-800/20 border border-slate-800 p-8 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
              <span className="w-1.5 h-8 bg-blue-500 rounded-full"></span>
              Resumen del episodio
            </h2>
            <p className="text-slate-300 leading-relaxed text-xl font-medium">
              {episode.description}
            </p>
          </section>

          <section className="px-4">
            <h2 className="text-2xl font-black mb-6">Puntos clave</h2>
            <div className="grid gap-4">
              {[
                `Conceptos avanzados de ${episode.category}.`,
                "Mejores prácticas y patrones de diseño.",
                "Errores comunes y cómo evitarlos en producción.",
                "Estrategias de implementación eficientes."
              ].map((point, i) => (
                <div key={i} className="flex gap-4 items-start p-4 rounded-xl bg-slate-800/10 hover:bg-slate-800/30 transition-colors border border-transparent hover:border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 font-bold text-xs mt-1">
                    {i+1}
                  </div>
                  <p className="text-slate-400 font-medium">{point}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Recomendaciones Laterales */}
        <aside className="space-y-8">
          <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
              Te puede interesar 💡
            </h3>
            
            <div className="space-y-6">
              {recommendations.length > 0 ? recommendations.map(rec => (
                <Link 
                  key={rec.id} 
                  to={`/episode/${rec.id}`}
                  className="flex gap-4 group cursor-pointer"
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-slate-700/50">
                    <img src={rec.imageSrc} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                  </div>
                  <div className="overflow-hidden py-1">
                    <h4 className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors truncate text-sm">
                      {rec.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 italic">
                      {rec.description}
                    </p>
                  </div>
                </Link>
              )) : (
                <p className="text-slate-600 text-sm italic py-4">
                  No hay más episodios en esta categoría por ahora.
                </p>
              )}
            </div>
            
            <button 
              onClick={() => navigate('/')}
              className="w-full mt-8 py-3 rounded-xl bg-blue-500/10 text-blue-400 font-bold text-sm hover:bg-blue-500 hover:text-white transition-all border border-blue-500/20"
            >
              Ver todos los episodios
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default EpisodeDetailPage;
