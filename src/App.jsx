import { useState, useRef, useEffect } from 'react';
import Layout from './components/Layout/Layout';
import PlayerBar from './components/AudioPlayer/PlayerBar';
import episodesData from './data/episodes.json';
import { Play, Pause, BarChart3 } from 'lucide-react';
import Visualizer from './components/Visualizer/Visualizer';

function App() {
  // --- ESTADO (La memoria de la App) ---
  const [episodes] = useState(episodesData);
  const [currentEpisode, setCurrentEpisode] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // --- REF (Referencia al objeto de Audio HTML5 sin renderizar) ---
  const audioRef = useRef(new Audio());
  /*useEffect(() => {
    // Esto es crucial para que el visualizador tenga permiso de "leer" el audio
    audioRef.current.crossOrigin = "anonymous";
  }, []);*/

  // --- LÓGICA DE REPRODUCCIÓN ---
  const playEpisode = (episode) => {
    // Si clicamos el mismo que ya suena, pausamos/reanudamos
    if (currentEpisode?.id === episode.id) {
      togglePlay();
      return;
    }

    // Si es uno nuevo:
    audioRef.current.src = episode.audioSrc; // Cargamos URL
    audioRef.current.play(); // Damos play
    setCurrentEpisode(episode); // Actualizamos estado visual
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Efecto para limpiar el audio si cerramos la app (Unidad 1: Gestión de memoria)
  useEffect(() => {
    return () => {
      audioRef.current.pause();
      audioRef.current.src = "";
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;

    // Actualizar tiempo actual mientras suena
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);

    // Actualizar duración total cuando carga el archivo
    const handleLoadedMetadata = () => setDuration(audio.duration);

    // Cuando termina, cambiar el icono a Play
    const handleEnded = () => setIsPlaying(false);

    // Suscribirse a eventos
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    // Limpieza (importante en React)
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const handleSeek = (time) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolume = (volume) => {
    audioRef.current.volume = volume;
  };

  return (
    <Layout>
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Bienvenido a POOdcast 🎙️</h1>
        <p className="text-slate-400">Aprende Programación Orientada a Objetos escuchando.</p>
      </header>

      {/* Grid de Episodios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
        {episodes.map((ep) => {
          // Calculamos si ESTA tarjeta específica está sonando
          const isActive = currentEpisode?.id === ep.id;

          return (
            <div 
              key={ep.id} 
              onClick={() => playEpisode(ep)}
              className={`
                relative p-4 rounded-xl border transition-all cursor-pointer group
                ${isActive 
                  ? 'bg-blue-900/20 border-blue-500 shadow-lg shadow-blue-500/10' 
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-500 hover:bg-slate-800'}
              `}
            >
              {/* Imagen */}
              <div className="aspect-square rounded-lg bg-slate-700 mb-4 overflow-hidden relative">
                <img src={ep.imageSrc} alt={ep.title} className="w-full h-full object-cover" />
                
                {/* Overlay oscuro al hacer hover o si está activo */}
                <div className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                   {isActive && isPlaying ? (
                     <div className="flex gap-1 items-end h-8">
                        {/* Pequeña animación de barras simulada con CSS */}
                        <span className="w-1 bg-white h-3 animate-pulse"></span>
                        <span className="w-1 bg-white h-6 animate-pulse delay-75"></span>
                        <span className="w-1 bg-white h-4 animate-pulse delay-150"></span>
                     </div>
                   ) : (
                     <div className="bg-blue-500 p-3 rounded-full shadow-lg transform hover:scale-110 transition-transform">
                       <Play fill="white" className="text-white ml-1" />
                     </div>
                   )}
                </div>
              </div>

              <h3 className={`font-bold text-lg mb-1 truncate ${isActive ? 'text-blue-400' : 'text-white'}`}>
                {ep.title}
              </h3>
              <p className="text-sm text-slate-400 line-clamp-2 mb-3">{ep.description}</p>
            </div>
          );
        })}
      </div>

      {/* Grid de Episodios (Esto ya lo tienes arriba, no cambies nada ahí) */}
      {/* --- VISUALIZADOR (COMENTADO CORRECTAMENTE) --- */}
      {/* {currentEpisode && (
          <div className="fixed bottom-24 left-0 right-0 z-40 px-8 pointer-events-none opacity-50">
            <Visualizer audioRef={audioRef} isPlaying={isPlaying} />
          </div>
      )} 
      */}

      {/* --- BARRA DE REPRODUCCIÓN --- */}
      {/* IMPORTANTE: No comentes 'currentEpisode', es obligatorio para que funcione */}
      <PlayerBar 
          currentEpisode={currentEpisode} 
          isPlaying={isPlaying} 
          onTogglePlay={togglePlay}
          currentTime={currentTime}
          duration={duration}
          onSeek={handleSeek}
          onVolumeChange={handleVolume}
      />
    </Layout>
  );
}

export default App;