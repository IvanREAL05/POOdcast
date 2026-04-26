import { useState, useRef, useEffect } from 'react';

export const useAudioPlayer = () => {
  const [currentEpisode, setCurrentEpisode] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);

  // Ref que siempre refleja el valor actual de isPlaying sin ser dependencia de otros effects
  const isPlayingRef = useRef(false);
  // Ref para playNext: evita el problema de TDZ en handleEnded
  const playNextRef = useRef(null);
  
  // Nuevos estados para la notificación elegante
  const [showResumeNotification, setShowResumeNotification] = useState(false);
  const [pendingProgress, setPendingProgress] = useState(null);

  const audioRef = useRef(new Audio());

  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (queue.length > 0) playNextRef.current?.();
    };

    const handleError = (e) => {
      const err = e.target?.error;
      const codes = { 1: 'ABORTED', 2: 'NETWORK', 3: 'DECODE', 4: 'SRC_NOT_SUPPORTED' };
      console.error('Error de audio:', err ? codes[err.code] || err.code : 'desconocido', audio.src);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    };
  }, []);

  // Mantiene el ref sincronizado con el estado real
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Cuando cambia el episodio: actualiza src y reproduce si ya estaba en play
  useEffect(() => {
    if (!currentEpisode?.audioSrc) return;
    const audio = audioRef.current;
    audio.src = currentEpisode.audioSrc;
    audio.volume = volume;
    audio.playbackRate = playbackRate;

    if (isPlayingRef.current) {
      audio.play().catch(err => {
        if (err.name !== 'AbortError') setIsPlaying(false);
      });
    }
  }, [currentEpisode]);

  // Cuando cambia el estado play/pausa
  useEffect(() => {
    const audio = audioRef.current;
    if (isPlaying) {
      if (!audio.src) return;
      audio.play().catch(err => {
        if (err.name !== 'AbortError') setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    audioRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    const checkPreviousSession = () => {
      try {
        const lastEpisode = localStorage.getItem('last-listened-episode');
        if (lastEpisode) {
          localStorage.setItem('should-resume-last-episode', 'true');
        }
      } catch (error) {
        console.error("Error verificando sesión previa:", error);
      }
    };

    checkPreviousSession();
  }, []);

  useEffect(() => {
    if (!currentEpisode || !isPlaying) return;
    
    let timeoutId;
    
    const saveProgress = () => {
      if (currentTime > 0) {
        localStorage.setItem(`episode-${currentEpisode.id}-progress`, currentTime);
        
        localStorage.setItem('last-listened-episode', JSON.stringify({
          id: currentEpisode.id,
          title: currentEpisode.title,
          imageSrc: currentEpisode.imageSrc,
          progress: currentTime,
          duration: duration,
          timestamp: Date.now(),
          audioSrc: currentEpisode.audioSrc
        }));
      }
    };

    timeoutId = setTimeout(saveProgress, 3000);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        saveProgress();
      }
    };
  }, [currentTime, currentEpisode, isPlaying, duration]);

  // 📢 VERSIÓN MEJORADA - Con notificación elegante en lugar de window.confirm
  useEffect(() => {
    if (!currentEpisode) return;
    
    const savedProgress = localStorage.getItem(`episode-${currentEpisode.id}-progress`);
    
    if (savedProgress && parseFloat(savedProgress) > 5) {
      const progress = parseFloat(savedProgress);
      
      const checkMetadata = setInterval(() => {
        if (duration > 0) {
          clearInterval(checkMetadata);
          
          const percentComplete = (progress / duration) * 100;
          
          if (percentComplete > 5 && percentComplete < 95) {
            // Guardamos el progreso pendiente y mostramos notificación
            setPendingProgress(progress);
            setShowResumeNotification(true);
          }
        }
      }, 100);

      setTimeout(() => clearInterval(checkMetadata), 5000);
    }
  }, [currentEpisode, duration]);

  const playEpisode = (episode) => {
    if (currentEpisode?.id === episode.id) {
      togglePlay();
      return;
    }
    
    if (currentEpisode) {
      setHistory(prev => [...prev, currentEpisode]);
    }
    
    setCurrentEpisode(episode);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const seekTo = (time) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const changeVolume = (newVolume) => {
    const validVolume = Math.max(0, Math.min(1, parseFloat(newVolume)));
    setVolume(validVolume);
  };

  const changePlaybackRate = (rate) => {
    setPlaybackRate(rate);
  };

  const addToQueue = (episode) => {
    if (!queue.some(item => item.id === episode.id)) {
      setQueue(prev => [...prev, episode]);
    }
  };

  const playNext = () => {
    if (queue.length > 0) {
      const [nextEpisode, ...remainingQueue] = queue;
      setQueue(remainingQueue);
      playEpisode(nextEpisode);
    }
  };

  useEffect(() => {
    playNextRef.current = playNext;
  });

  const playPrevious = () => {
    if (history.length > 0) {
      const previousEpisode = history[history.length - 1];
      setHistory(prev => prev.slice(0, -1));
      playEpisode(previousEpisode);
    }
  };

  const removeFromQueue = (episodeId) => {
    setQueue(prev => prev.filter(ep => ep.id !== episodeId));
  };

  const clearQueue = () => {
    setQueue([]);
  };

  const getProgressPercentage = () => {
    if (duration === 0) return 0;
    return (currentTime / duration) * 100;
  };

  // 🆕 Función para reanudar desde la notificación
  const handleResume = () => {
    if (pendingProgress) {
      seekTo(pendingProgress);
    }
    setShowResumeNotification(false);
    setPendingProgress(null);
  };

  // 🆕 Función para cancelar la reanudación
  const handleCancelResume = () => {
    setShowResumeNotification(false);
    setPendingProgress(null);
    // Opcional: eliminar el progreso guardado si el usuario decide empezar de nuevo
    if (currentEpisode) {
      localStorage.removeItem(`episode-${currentEpisode.id}-progress`);
    }
  };

  const resumeFromLastSession = (episodesData) => {
    try {
      const lastEpisodeData = localStorage.getItem('last-listened-episode');
      const shouldResume = localStorage.getItem('should-resume-last-episode');

      if (lastEpisodeData && shouldResume === 'true') {
        const parsed = JSON.parse(lastEpisodeData);
        const fullEpisode = episodesData.find(ep => ep.id === parsed.id);

        if (fullEpisode) {
          // Solo carga el episodio sin reproducirlo — el navegador bloquea autoplay sin gesto
          setCurrentEpisode(fullEpisode);
          setIsPlaying(false);
          localStorage.removeItem('should-resume-last-episode');
          return true;
        }
      }
    } catch (error) {
      console.error("Error reanudando sesión:", error);
    }
    return false;
  };

  const saveFullSession = () => {
    if (!currentEpisode) return;
    
    const sessionData = {
      currentEpisode: {
        id: currentEpisode.id,
        title: currentEpisode.title,
        progress: currentTime,
        duration: duration
      },
      queue: queue.map(ep => ({ id: ep.id, title: ep.title })),
      history: history.map(ep => ({ id: ep.id, title: ep.title })),
      volume: volume,
      playbackRate: playbackRate,
      timestamp: Date.now()
    };
    
    localStorage.setItem('podcast-session', JSON.stringify(sessionData));
  };

  const skipTime = (seconds) => {
    const audio = audioRef.current;
    const newTime = audio.currentTime + seconds;
    audio.currentTime = Math.max(0, Math.min(newTime, audio.duration));
    setCurrentTime(audio.currentTime);
  };

  return {
    currentEpisode,
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackRate,
    queue,
    history,
    
    // Nuevos estados para la notificación
    showResumeNotification,
    pendingProgress,
    
    playEpisode,
    togglePlay,
    seekTo,
    skipTime, // ← Nueva función
    changeVolume,
    changePlaybackRate,
    
    addToQueue,
    removeFromQueue, // ← Nueva función
    playNext,
    playPrevious,
    clearQueue,
    
    getProgressPercentage,
    
    // Nuevas funciones para la notificación
    handleResume,
    handleCancelResume,
    
    resumeFromLastSession,
    saveFullSession,
    
    audioRef,
  };
};