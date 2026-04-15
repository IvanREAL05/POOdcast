import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom'; // ← Añadido useLocation
import Layout from './components/Layout/Layout';
import PlayerBar from './components/AudioPlayer/PlayerBar';
import Visualizer from './components/Visualizer/Visualizer';
import QueuePanel from './components/AudioPlayer/QueuePanel';
import ResumeNotification from './components/Cards/ResumeNotification';
import episodesData from './data/episodes.json';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useFavorites } from './hooks/useFavorites';
import { RefreshCw } from 'lucide-react';

// Páginas
import LibraryPage from './pages/LibraryPage';
import EpisodeDetailPage from './pages/EpisodeDetailPage';
import ThreeDExperiencePage from './pages/ThreeDExperiencePage'; // ← Añadido

function App() {
  const [episodes] = useState(episodesData);
  const [isLoading, setIsLoading] = useState(true);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const location = useLocation(); // ← Añadido
  
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  
  const {
    currentEpisode,
    isPlaying,
    currentTime,
    duration,
    playEpisode,
    togglePlay,
    seekTo,
    skipTime,
    changeVolume,
    changePlaybackRate,
    playbackRate,
    playNext,
    playPrevious,
    addToQueue,
    removeFromQueue, // ← Nuevo
    clearQueue,      // ← Nuevo
    queue,
    audioRef,
    resumeFromLastSession,
    saveFullSession,
    volume,
    showResumeNotification,
    pendingProgress,
    handleResume,
    handleCancelResume,
  } = useAudioPlayer();

  // Cargar última sesión al iniciar la app
  useEffect(() => {
    const loadLastSession = async () => {
      setIsLoading(true);
      setTimeout(() => {
        resumeFromLastSession(episodes);
        setIsLoading(false);
      }, 500);
    };
    loadLastSession();
  }, []);

  // Guardar sesión cuando el usuario cierra o recarga
  useEffect(() => {
    const handleBeforeUnload = () => saveFullSession();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      saveFullSession();
    };
  }, [currentEpisode, currentTime, duration, queue, volume]);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <RefreshCw size={40} className="animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-slate-400">Recuperando tu última sesión...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Notificación de reanudación (Global) */}
      {showResumeNotification && currentEpisode && pendingProgress && (
        <ResumeNotification
          episode={currentEpisode}
          progress={pendingProgress}
          onResume={handleResume}
          onCancel={handleCancelResume}
          autoHideDelay={10000}
        />
      )}

      {/* Definición de Rutas */}
      <main className="min-h-screen">
        <Routes>
          <Route 
            path="/" 
            element={
              <LibraryPage 
                currentEpisode={currentEpisode}
                isPlaying={isPlaying}
                onPlay={playEpisode}
                onAddToQueue={addToQueue}
                queue={queue}
                isFavorite={isFavorite}
                onToggleFavorite={toggleFavorite}
              />
            } 
          />
          <Route 
            path="/episode/:id" 
            element={
              <EpisodeDetailPage 
                currentEpisode={currentEpisode}
                isPlaying={isPlaying}
                onPlay={playEpisode}
                isFavorite={isFavorite}
                onToggleFavorite={toggleFavorite}
                onAddToQueue={addToQueue}
              />
            } 
          />
          <Route 
            path="/experience" 
            element={
              <ThreeDExperiencePage 
                currentEpisode={currentEpisode}
                isPlaying={isPlaying}
                audioRef={audioRef}
              />
            } 
          />
        </Routes>
      </main>

      {/* Visualizer (Persistente y Controlado) - Solo se muestra si no estamos en la página de experiencia */}
      {currentEpisode && location.pathname !== '/experience' && (
        <Visualizer 
          audioRef={audioRef}
          isPlaying={isPlaying}
          episodeType={currentEpisode.category || 'default'}
        />
      )}
      {/* PlayerBar (Persistente) */}
      <PlayerBar 
        currentEpisode={currentEpisode} 
        isPlaying={isPlaying} 
        onTogglePlay={togglePlay}
        currentTime={currentTime}
        duration={duration}
        onSeek={seekTo}
        onVolumeChange={changeVolume}
        onNext={playNext}
        onPrevious={playPrevious}
        onSkip={skipTime}
        playbackRate={playbackRate}
        onChangeRate={changePlaybackRate}
        onToggleQueue={() => setIsQueueOpen(!isQueueOpen)} // ← Nuevo
        queueLength={queue.length}                        // ← Nuevo
      />

      {/* Panel de Cola (Persistente) */}
      <QueuePanel 
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        queue={queue}
        currentEpisode={currentEpisode}
        onPlayEpisode={(ep) => {
          playEpisode(ep);
          // Opcional: Cerrar panel al reproducir? Mejor dejarlo abierto para ver la cola.
        } }
        onRemoveFromQueue={removeFromQueue}
        onClearQueue={clearQueue}
      />
    </Layout>
  );
}

export default App;
