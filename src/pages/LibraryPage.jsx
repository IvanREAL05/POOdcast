import { useState } from 'react';
import EpisodeCard from '../components/Cards/EpisodeCard';
import episodesData from '../data/episodes.json';
import { Search, Filter, Heart } from 'lucide-react';

const LibraryPage = ({ 
  currentEpisode, 
  isPlaying, 
  onPlay, 
  onAddToQueue, 
  queue,
  isFavorite,      // ← Nuevo
  onToggleFavorite  // ← Nuevo
}) => {
  const [episodes] = useState(episodesData);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Obtener categorías únicas
  const categories = ['Todos', ...new Set(episodes.map(ep => ep.category))];

  // Filtrado de episodios complejo (Búsqueda + Categoría + Favoritos)
  const filteredEpisodes = episodes.filter(ep => {
    const matchesSearch = ep.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          ep.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || ep.category === selectedCategory;
    const matchesFavorite = !showOnlyFavorites || isFavorite(ep.id);
    
    return matchesSearch && matchesCategory && matchesFavorite;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Tu Biblioteca 🎙️</h1>
          <p className="text-slate-400">Explora episodios sobre Programación Orientada a Objetos.</p>
        </div>
        
        {/* Toggle de Favoritos */}
        <button
          onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${
            showOnlyFavorites 
              ? 'bg-pink-500/10 border-pink-500 text-pink-500 shadow-lg shadow-pink-500/10' 
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-pink-500/50 hover:text-pink-400'
          }`}
        >
          <Heart size={18} fill={showOnlyFavorites ? "currentColor" : "none"} />
          <span className="font-bold text-sm">Mis Favoritos</span>
        </button>
      </header>

      {/* Barra de herramientas: Búsqueda y Filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text"
            placeholder="Buscar episodios..."
            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-blue-500 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          <Filter size={18} className="text-slate-500 shrink-0" />
          {categories.map(category => (
            <button
              key={`cat-${category}`}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                selectedCategory === category 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de resultados */}
      {filteredEpisodes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
          {filteredEpisodes.map((ep) => (
            <EpisodeCard
              key={ep.id}
              episode={ep}
              isActive={currentEpisode?.id === ep.id}
              isPlaying={isPlaying}
              onPlay={onPlay}
              onAddToQueue={onAddToQueue}
              queue={queue}
              isFavorite={isFavorite(ep.id)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-slate-800/20 rounded-3xl border-2 border-dashed border-slate-800">
          <p className="text-slate-500 text-lg">No se encontraron episodios que coincidan.</p>
          <button 
            onClick={() => {
              setSearchTerm(''); 
              setSelectedCategory('Todos');
              setShowOnlyFavorites(false);
            }}
            className="mt-4 text-blue-500 hover:underline font-bold"
          >
            Restablecer todos los filtros
          </button>
        </div>
      )}
    </div>
  );
};

export default LibraryPage;
