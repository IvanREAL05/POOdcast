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
      if (queue.length > 0) playNext();
    };

    const handleError = (e) => {
      console.error('Error en el audio:', e);
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
      audio.src = "";
    };
  }, []);

  useEffect(() => {
    if (!currentEpisode?.audioSrc) return;

    const audio = audioRef.current;
    audio.src = currentEpisode.audioSrc;
    audio.load();
    
    if (isPlaying) {
      audio.play().catch(error => {
        console.log("Autoplay bloqueado por el navegador:", error);
        setIsPlaying(false);
      });
    }
    
    audio.volume = volume;
    audio.playbackRate = playbackRate;

  }, [currentEpisode]);

  useEffect(() => {
    const audio = audioRef.current;
    
    if (isPlaying) {
      audio.play().catch(error => {
        console.log("No se pudo reproducir:", error);
        setIsPlaying(false);
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

  const playPrevious = () => {
    if (history.length > 0) {
      const previousEpisode = history[history.length - 1];
      setHistory(prev => prev.slice(0, -1));
      playEpisode(previousEpisode);
    }
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
          playEpisode(fullEpisode);
          
          const progress = localStorage.getItem(`episode-${fullEpisode.id}-progress`);
          if (progress) {
            const checkMetadata = setInterval(() => {
              if (duration > 0) {
                // No hacer seek automático, la notificación se encargará
                clearInterval(checkMetadata);
              }
            }, 100);
            
            setTimeout(() => clearInterval(checkMetadata), 3000);
          }
          
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
    changeVolume,
    changePlaybackRate,
    
    addToQueue,
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