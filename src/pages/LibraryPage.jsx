import { useState, useRef, useEffect, useMemo } from 'react';
import EpisodeCard from '../components/Cards/EpisodeCard';
import episodesData from '../data/episodes.json';
import { Search, Filter, Heart, X, Clock } from 'lucide-react';

// ── Búsqueda inteligente ───────────────────────────────────────────────────────

// Normaliza texto: minúsculas + sin acentos + sin puntuación
function normalize(str = '') {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Puntúa un episodio según la consulta. Retorna { score, matchedIn }
function scoreEpisode(episode, query) {
  const words = normalize(query).split(' ').filter(Boolean);
  if (!words.length) return { score: 1, matchedIn: [] };

  const fields = {
    title:    { text: normalize(episode.title),                     weight: 60 },
    keywords: { text: normalize((episode.keywords || []).join(' ')), weight: 30 },
    category: { text: normalize(episode.category || ''),            weight: 20 },
    desc:     { text: normalize(episode.description || ''),         weight: 10 },
  };

  let total = 0;
  const matchedIn = new Set();

  for (const word of words) {
    let wordMatched = false;
    for (const [key, { text, weight }] of Object.entries(fields)) {
      if (text.includes(word)) {
        // Bonus si es match exacto de palabra completa
        const exactBonus = new RegExp(`\\b${word}\\b`).test(text) ? 1.5 : 1;
        total += weight * exactBonus;
        matchedIn.add(key);
        wordMatched = true;
      }
    }
    // Prefijo fuzzy (mínimo 3 letras): evita falsos positivos con 1-2 chars
    if (!wordMatched && word.length >= 3) {
      const prefix = word.slice(0, Math.max(3, word.length - 1));
      for (const [key, { text, weight }] of Object.entries(fields)) {
        if (text.includes(prefix)) {
          total += weight * 0.4;
          matchedIn.add(key);
        }
      }
    }
    // Si ningún campo matchea esta palabra, penaliza fuerte (AND lógico suave)
    if (!matchedIn.size) total -= 20;
  }

  return { score: total, matchedIn: [...matchedIn] };
}

// Historial de búsquedas recientes (localStorage)
const HISTORY_KEY = 'poodcast-search-history';
function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}
function saveHistory(term) {
  if (!term.trim()) return;
  const prev = getHistory().filter(t => t !== term);
  localStorage.setItem(HISTORY_KEY, JSON.stringify([term, ...prev].slice(0, 5)));
}

// ── Chip de filtro activo ──────────────────────────────────────────────────────
const FilterChip = ({ label, color, onRemove }) => (
  <span
    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all"
    style={{ background: `${color}18`, borderColor: `${color}50`, color }}
  >
    {label}
    <button onClick={onRemove} className="hover:opacity-70 transition-opacity" aria-label="Quitar filtro">
      <X size={11} />
    </button>
  </span>
);

// ── Highlight de texto coincidente ────────────────────────────────────────────
const Highlight = ({ text, query }) => {
  if (!query.trim()) return <span>{text}</span>;
  const words = normalize(query).split(' ').filter(w => w.length >= 2);
  if (!words.length) return <span>{text}</span>;
  const regex = new RegExp(`(${words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part)
          ? <mark key={i} className="bg-blue-500/25 text-blue-300 rounded px-0.5">{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </span>
  );
};

// ── Componente principal ───────────────────────────────────────────────────────
const LibraryPage = ({
  currentEpisode,
  isPlaying,
  onPlay,
  onAddToQueue,
  queue,
  isFavorite,
  onToggleFavorite,
}) => {
  const episodes = episodesData;
  const [searchTerm, setSearchTerm] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [history, setHistory] = useState(getHistory);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Debounce: actualiza searchTerm 250ms después de que el usuario para de escribir
  useEffect(() => {
    const t = setTimeout(() => setSearchTerm(inputValue), 250);
    return () => clearTimeout(t);
  }, [inputValue]);

  // Cierra dropdown al hacer click fuera
  useEffect(() => {
    const handler = (e) => {
      if (!dropdownRef.current?.contains(e.target) && !inputRef.current?.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const categories = useMemo(
    () => ['Todos', ...new Set(episodes.map(ep => ep.category))],
    [episodes]
  );

  // Filtrado y ranking
  const filteredEpisodes = useMemo(() => {
    return episodes
      .map(ep => ({ ep, ...scoreEpisode(ep, searchTerm) }))
      .filter(({ ep, score }) => {
        if (score <= 0 && searchTerm.trim()) return false;
        const matchesCat = selectedCategory === 'Todos' || ep.category === selectedCategory;
        const matchesFav = !showOnlyFavorites || isFavorite(ep.id);
        return matchesCat && matchesFav;
      })
      .sort((a, b) => b.score - a.score)
      .map(({ ep }) => ep);
  }, [searchTerm, selectedCategory, showOnlyFavorites, isFavorite, episodes]);

  // Sugerencias del dropdown (máx. 4 episodios que coincidan)
  const suggestions = useMemo(() => {
    if (!inputValue.trim() || inputValue.trim().length < 2) return [];
    return episodes
      .map(ep => ({ ep, score: scoreEpisode(ep, inputValue).score }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(({ ep }) => ep);
  }, [inputValue, episodes]);

  const handleSearch = (term) => {
    setInputValue(term);
    setSearchTerm(term);
    if (term.trim()) {
      saveHistory(term.trim());
      setHistory(getHistory());
    }
    setShowDropdown(false);
  };

  const clearSearch = () => {
    setInputValue('');
    setSearchTerm('');
    inputRef.current?.focus();
  };

  const activeFilters = [
    selectedCategory !== 'Todos' && { label: selectedCategory, color: '#3b82f6', onRemove: () => setSelectedCategory('Todos') },
    showOnlyFavorites && { label: 'Mis favoritos', color: '#ec4899', onRemove: () => setShowOnlyFavorites(false) },
  ].filter(Boolean);

  const isSearching = searchTerm.trim().length > 0;

  return (
    <div className="animate-in fade-in duration-500">

      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Tu Biblioteca</h1>
          <p className="text-slate-400">
            {filteredEpisodes.length} de {episodes.length} episodios
            {isSearching && <span className="text-blue-400 ml-1">para "<strong>{searchTerm}</strong>"</span>}
          </p>
        </div>
        <button
          onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${
            showOnlyFavorites
              ? 'bg-pink-500/10 border-pink-500 text-pink-500 shadow-lg shadow-pink-500/10'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-pink-500/50 hover:text-pink-400'
          }`}
        >
          <Heart size={18} fill={showOnlyFavorites ? 'currentColor' : 'none'} />
          <span className="font-bold text-sm">Mis Favoritos</span>
        </button>
      </header>

      {/* Bloque de búsqueda + filtros */}
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 mb-6 space-y-3">

        {/* Barra de búsqueda — fila completa */}
        <div className="relative w-full" ref={dropdownRef}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar por tema, concepto o palabra clave... (ej: herencia, molde, polimorfismo)"
            className="w-full bg-slate-900/70 border border-slate-600 rounded-xl py-3.5 pl-12 pr-12 text-base placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:bg-slate-900 transition-all"
            value={inputValue}
            onChange={e => { setInputValue(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSearch(inputValue);
              if (e.key === 'Escape') { setShowDropdown(false); clearSearch(); }
            }}
          />
          {inputValue ? (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          ) : (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 font-mono hidden md:block">
              Enter ↵
            </span>
          )}

          {/* Dropdown de sugerencias */}
          {showDropdown && (suggestions.length > 0 || (history.length > 0 && !inputValue)) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
              {/* Sugerencias de episodios */}
              {suggestions.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Episodios relacionados
                  </div>
                  {suggestions.map(ep => (
                    <button
                      key={ep.id}
                      onClick={() => handleSearch(ep.title.replace(/Capítulo \d+: /, ''))}
                      className="w-full text-left px-4 py-3 hover:bg-slate-800 transition-colors flex items-center gap-3"
                    >
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: ep.color }} />
                      <span className="text-sm text-slate-200 truncate flex-1">
                        <Highlight text={ep.title} query={inputValue} />
                      </span>
                      <span className="text-[10px] text-slate-500 shrink-0 px-2 py-0.5 bg-slate-800 rounded-full border border-slate-700">
                        {ep.category}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Historial reciente */}
              {!inputValue && history.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Clock size={10} /> Búsquedas recientes
                  </div>
                  {history.map((term, i) => (
                    <button
                      key={i}
                      onClick={() => handleSearch(term)}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-800 transition-colors text-sm text-slate-400 flex items-center gap-3"
                    >
                      <Clock size={13} className="text-slate-600 shrink-0" />
                      {term}
                    </button>
                  ))}
                </div>
              )}

              {/* Búsquedas rápidas de POO */}
              {!inputValue && (
                <div className="px-4 py-3 border-t border-slate-800">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">Conceptos POO</div>
                  <div className="flex flex-wrap gap-2">
                    {['clase', 'herencia', 'encapsulamiento', 'polimorfismo', 'abstraccion', 'objeto', 'atributos'].map(term => (
                      <button
                        key={term}
                        onClick={() => handleSearch(term)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-blue-500/20 hover:text-blue-400 text-slate-400 rounded-full text-xs border border-slate-700 hover:border-blue-500/50 transition-all capitalize"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filtros de categoría — fila separada */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
            <Filter size={15} />
            <span className="text-xs font-medium hidden sm:block">Filtrar:</span>
          </div>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap transition-all font-semibold ${
                selectedCategory === category
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                  : 'bg-slate-700/60 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-600/50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Chips de filtros activos */}
      {(activeFilters.length > 0 || isSearching) && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span className="text-xs text-slate-500">Filtros activos:</span>
          {isSearching && (
            <FilterChip label={`"${searchTerm}"`} color="#3b82f6" onRemove={clearSearch} />
          )}
          {activeFilters.map((f, i) => (
            <FilterChip key={i} label={f.label} color={f.color} onRemove={f.onRemove} />
          ))}
          {(activeFilters.length > 0 || isSearching) && (
            <button
              onClick={() => { clearSearch(); setSelectedCategory('Todos'); setShowOnlyFavorites(false); }}
              className="text-xs text-slate-500 hover:text-white underline transition-colors ml-1"
            >
              Limpiar todo
            </button>
          )}
        </div>
      )}

      {/* Resultados */}
      {filteredEpisodes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
          {filteredEpisodes.map(ep => (
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
              searchQuery={searchTerm}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-slate-800/20 rounded-3xl border-2 border-dashed border-slate-800">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-slate-300 text-lg font-semibold mb-1">
            Sin resultados para "{searchTerm}"
          </p>
          <p className="text-slate-500 text-sm mb-6">
            Prueba con términos como: clase, herencia, polimorfismo, objeto...
          </p>
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {['clase', 'herencia', 'polimorfismo', 'encapsulamiento'].map(s => (
              <button
                key={s}
                onClick={() => { setInputValue(s); setSearchTerm(s); }}
                className="px-4 py-1.5 bg-slate-800 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 rounded-full text-sm border border-slate-700 hover:border-blue-500/50 transition-all capitalize"
              >
                {s}
              </button>
            ))}
          </div>
          <button
            onClick={() => { clearSearch(); setSelectedCategory('Todos'); setShowOnlyFavorites(false); }}
            className="text-blue-500 hover:underline font-bold text-sm"
          >
            Restablecer todos los filtros
          </button>
        </div>
      )}
    </div>
  );
};

export default LibraryPage;
