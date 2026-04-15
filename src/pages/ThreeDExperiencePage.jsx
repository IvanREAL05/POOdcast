import Visualizer from '../components/Visualizer/Visualizer';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { Box, Info, Cpu, Zap } from 'lucide-react';

const ThreeDExperiencePage = ({ currentEpisode, isPlaying, audioRef }) => {
  return (
    <div className="animate-in fade-in duration-700 pb-32">
      <header className="mb-8">
        <h1 className="text-4xl font-black mb-2 flex items-center gap-3">
          <Box className="text-blue-500" size={36} />
          Laboratorio 3D <span className="text-blue-500">POO</span>
        </h1>
        <p className="text-slate-400 max-w-2xl font-medium">
          Explora la representación visual de los conceptos de Programación Orientada a Objetos a través de geometría generativa reactiva al audio.
        </p>
      </header>

      {/* Visualizador Principal en Pantalla Completa dentro del contenedor */}
      <div className="mb-12">
        <Visualizer 
          audioRef={audioRef} 
          isPlaying={isPlaying} 
          episodeType={currentEpisode?.category || 'default'}
          // Forzamos que se vea grande aquí
        />
      </div>

      {/* Info Cards - Valor agregado para la materia de Multimedia */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/30 border border-slate-800 p-6 rounded-2xl hover:bg-slate-800/50 transition-all group">
          <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Cpu size={24} />
          </div>
          <h3 className="font-bold text-lg mb-2 text-white">Análisis en Tiempo Real</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Utiliza la Web Audio API para extraer el espectro de frecuencias y mapearlo a parámetros de distorsión y escala.
          </p>
        </div>

        <div className="bg-slate-800/30 border border-slate-800 p-6 rounded-2xl hover:bg-slate-800/50 transition-all group">
          <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Zap size={24} />
          </div>
          <h3 className="font-bold text-lg mb-2 text-white">Geometría Generativa</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Los Shaders modifican la geometría base representando conceptos como Polimorfismo y Abstracción mediante cambios de forma.
          </p>
        </div>

        <div className="bg-slate-800/30 border border-slate-800 p-6 rounded-2xl hover:bg-slate-800/50 transition-all group">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Info size={24} />
          </div>
          <h3 className="font-bold text-lg mb-2 text-white">Interpretación Semántica</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            La jerarquía de objetos en la escena 3D emula la relación entre Clases, Atributos y Métodos de la POO.
          </p>
        </div>
      </div>

      {!isPlaying && (
        <div className="mt-12 p-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-center">
          <p className="text-blue-400 font-bold">💡 Tip: Reproduce un episodio desde la biblioteca para ver la magia.</p>
        </div>
      )}
    </div>
  );
};

export default ThreeDExperiencePage;