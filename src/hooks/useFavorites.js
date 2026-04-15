import { useState, useEffect } from 'react';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState([]);

  // Cargar favoritos al iniciar
  useEffect(() => {
    const saved = localStorage.getItem('poodcast-favorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error("Error cargando favoritos", e);
      }
    }
  }, []);

  // Persistir cambios
  useEffect(() => {
    localStorage.setItem('poodcast-favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (episodeId) => {
    setFavorites(prev => 
      prev.includes(episodeId) 
        ? prev.filter(id => id !== episodeId) 
        : [...prev, episodeId]
    );
  };

  const isFavorite = (episodeId) => favorites.includes(episodeId);

  return { favorites, toggleFavorite, isFavorite };
};
