import { useEffect, useRef } from 'react';

const Visualizer = ({ audioRef, isPlaying }) => {
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationIdRef = useRef(null);

  useEffect(() => {
    // Verificamos que el audio exista
    if (!audioRef.current) return;

    const initAudio = () => {
      try {
        // 1. Inicializar AudioContext si no existe
        if (!audioContextRef.current) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          audioContextRef.current = new AudioContext();
        }

        const ctx = audioContextRef.current;

        // 2. Crear Analizador si no existe
        if (!analyserRef.current) {
          analyserRef.current = ctx.createAnalyser();
          analyserRef.current.fftSize = 256;
        }

        // 3. Conectar el Audio al Analizador (LA PARTE DELICADA)
        // Intentamos conectar solo si no tenemos una fuente ya guardada
        if (!sourceRef.current) {
           // IMPORTANTE: Esto fallará con audios de internet sin CORS,
           // por eso lo envolvemos en try/catch para que no rompa la app.
           try {
             sourceRef.current = ctx.createMediaElementSource(audioRef.current);
             sourceRef.current.connect(analyserRef.current);
             analyserRef.current.connect(ctx.destination);
           } catch (e) {
             console.warn("No se pudo conectar el audio al visualizador (Probablemente por CORS o ya conectado):", e);
             // Si falla la conexión, no podemos visualizar, así que salimos
             return false; 
           }
        }
        
        return true; // Éxito
      } catch (error) {
        console.error("Error inicializando audio context:", error);
        return false;
      }
    };

    const isReady = initAudio();
    if (!isReady || !analyserRef.current) return;

    // --- LÓGICA DE DIBUJO ---
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const renderFrame = () => {
      animationIdRef.current = requestAnimationFrame(renderFrame);
      analyserRef.current.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 1.5;
        // Color basado en Tailwind Blue-500 (#3b82f6) aprox
        ctx.fillStyle = `rgb(59, 130, 246, ${barHeight / 200})`; 
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    if (isPlaying) {
      renderFrame();
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
    }

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [audioRef, isPlaying]);

  return <canvas ref={canvasRef} width="800" height="64" className="w-full h-16 block" />;
};

export default Visualizer;