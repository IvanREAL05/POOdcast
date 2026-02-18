import { useState, useEffect } from 'react';
import Layout from './components/Layout/Layout';
import PlayerBar from './components/AudioPlayer/PlayerBar';
import Visualizer from './components/Visualizer/Visualizer';
import EpisodeCard from './components/Cards/EpisodeCard';
import ResumeNotification from './components/Cards/ResumeNotification';
import episodesData from './data/episodes.json';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { RefreshCw } from 'lucide-react';

function App() {
  const [episodes] = useState(episodesData);
  const [isLoading, setIsLoading] = useState(true);
  
  const {
    currentEpisode,
    isPlaying,
    currentTime,
    duration,
    playEpisode,
    togglePlay,
    seekTo,
    changeVolume,
    playNext,
    playPrevious,
    addToQueue, 
    queue,
    audioRef,
    resumeFromLastSession,
    saveFullSession,
    volume,
    showResumeNotification,  // ← Nuevo
    pendingProgress,         // ← Nuevo
    handleResume,           // ← Nuevo
    handleCancelResume,     // ← Nuevo
  } = useAudioPlayer();

  // Cargar última sesión al iniciar la app
  useEffect(() => {
    const loadLastSession = async () => {
      setIsLoading(true);
      
      setTimeout(() => {
        const resumed = resumeFromLastSession(episodes);
        if (!resumed) {
          console.log('No hay sesión previa para reanudar');
        }
        setIsLoading(false);
      }, 500);
    };

    loadLastSession();
  }, []);

  // Guardar sesión cuando el usuario cierra o recarga
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveFullSession();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      saveFullSession();
    };
  }, [currentEpisode, currentTime, duration, queue, volume]);

  // Función auxiliar para formatear tiempo
  const formatTime = (seconds) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Mostrar loader mientras se recupera la sesión
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
      {/* Notificación de reanudación */}
      {showResumeNotification && currentEpisode && pendingProgress && (
        <ResumeNotification
          episode={currentEpisode}
          progress={pendingProgress}
          onResume={handleResume}
          onCancel={handleCancelResume}
          autoHideDelay={10000}
        />
      )}

      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Bienvenido a POOdcast 🎙️</h1>
        <p className="text-slate-400">Aprende Programación Orientada a Objetos escuchando.</p>
        
        {/* Banner de bienvenida con última sesión */}
        {currentEpisode && (
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-400">
              🎧 Escuchando: <span className="font-semibold">{currentEpisode.title}</span>
              {currentTime > 0 && (
                <span className="ml-2 text-slate-400">
                  • {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              )}
            </p>
          </div>
        )}
        
        {/* Indicador de cola mejorado */}
        {queue.length > 0 && (
          <div className="mt-4 flex items-center gap-3 text-sm">
            <span className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-full flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              🎵 {queue.length} episodio(s) en cola
            </span>
            <button 
              onClick={playNext}
              className="text-slate-400 hover:text-white text-xs bg-slate-800/50 hover:bg-slate-800 px-3 py-2 rounded-full transition-all"
            >
              Reproducir siguiente →
            </button>
            {queue.length > 0 && (
              <span className="text-xs text-slate-500">
                Próximo: {queue[0]?.title.substring(0, 30)}...
              </span>
            )}
          </div>
        )}
      </header>

      {/* Grid de episodios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
        {episodes.map((ep) => (
          <EpisodeCard
            key={ep.id}
            episode={ep}
            isActive={currentEpisode?.id === ep.id}
            isPlaying={isPlaying}
            onPlay={playEpisode}
            onAddToQueue={addToQueue}
            queue={queue}
          />
        ))}
      </div>

      {/* Visualizer */}
      {currentEpisode && (
        <div className="fixed bottom-24 left-0 right-0 z-40 px-8 pointer-events-none">
          <Visualizer 
            audioRef={audioRef}
            isPlaying={isPlaying}
            episodeType={currentEpisode.category || 'default'}
          />
        </div>
      )}

      {/* PlayerBar */}
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
      />

      {/* Botón flotante para guardar sesión manualmente */}
      {currentEpisode && (
        <button
          onClick={saveFullSession}
          className="fixed bottom-28 right-4 z-50 bg-slate-800 hover:bg-slate-700 text-slate-300 p-3 rounded-full shadow-lg transition-all hover:scale-110"
          title="Guardar progreso manualmente"
        >
          <RefreshCw size={20} />
        </button>
      )}
    </Layout>
  );
}

export default App;