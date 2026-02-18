import { useEffect, useRef } from 'react';

// 🎨 Estilos predefinidos para diferentes tipos de episodios
const EPISODE_STYLES = {
  programacion: {
    colors: ['#3b82f6', '#60a5fa', '#93c5fd'], // Azules
    barWidth: 4,
    spacing: 2,
    shape: 'bars' // barras rectangulares
  },
  diseño: {
    colors: ['#ec4899', '#f472b6', '#f9a8d4'], // Rosas
    barWidth: 8,
    spacing: 0,
    shape: 'circles' // círculos en lugar de barras
  },
  negocios: {
    colors: ['#10b981', '#34d399', '#6ee7b7'], // Verdes
    barWidth: 2,
    spacing: 1,
    shape: 'wave' // forma de onda
  },
  default: {
    colors: ['#8b5cf6', '#a78bfa', '#c4b5fd'], // Púrpura
    barWidth: 6,
    spacing: 3,
    shape: 'bars'
  }
};

const Visualizer = ({ audioRef, isPlaying, episodeType = 'default' }) => {
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationIdRef = useRef(null);

  // Obtener estilo basado en el tipo de episodio
  const style = EPISODE_STYLES[episodeType] || EPISODE_STYLES.default;

  useEffect(() => {
    if (!audioRef.current) return;

    const initAudio = () => {
      try {
        // 1. Inicializar AudioContext si está suspendido o no existe
        if (!audioContextRef.current) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          audioContextRef.current = new AudioContext();
        }

        const ctx = audioContextRef.current;

        // 2. Reanudar si está suspendido (política de autoplay)
        if (ctx.state === 'suspended' && isPlaying) {
          ctx.resume();
        }

        // 3. Crear Analizador si no existe
        if (!analyserRef.current) {
          analyserRef.current = ctx.createAnalyser();
          analyserRef.current.fftSize = 256;
          analyserRef.current.smoothingTimeConstant = 0.8; // Suavizar la animación
        }

        // 4. Conectar el Audio al Analizador (solo una vez)
        if (!sourceRef.current && audioRef.current) {
          try {
            sourceRef.current = ctx.createMediaElementSource(audioRef.current);
            sourceRef.current.connect(analyserRef.current);
            analyserRef.current.connect(ctx.destination);
          } catch (e) {
            console.warn("CORS o conexión duplicada:", e);
            return false;
          }
        }
        
        return true;
      } catch (error) {
        console.error("Error en AudioContext:", error);
        return false;
      }
    };

    const isReady = initAudio();
    if (!isReady || !analyserRef.current) return;

    // --- MEJORA 1: Diferentes formas de visualización ---
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Ajustar tamaño del canvas al tamaño real
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight || 64;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // --- MEJORA 2: Múltiples estilos de visualización ---
    const renderBars = () => {
      const barWidth = style.barWidth;
      const spacing = style.spacing;
      const totalBars = Math.min(bufferLength, canvas.width / (barWidth + spacing));
      const step = Math.floor(bufferLength / totalBars);
      
      let x = 0;
      
      for (let i = 0; i < totalBars; i++) {
        const dataIndex = i * step;
        const barHeight = (dataArray[dataIndex] / 255) * canvas.height;
        
        // Degradado basado en la altura
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, style.colors[0]);
        gradient.addColorStop(0.5, style.colors[1] || style.colors[0]);
        gradient.addColorStop(1, style.colors[2] || style.colors[0]);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + spacing;
      }
    };

    const renderCircles = () => {
      const centerY = canvas.height / 2;
      const maxRadius = canvas.height / 3;
      const spacing = canvas.width / bufferLength;
      
      for (let i = 0; i < bufferLength; i += 2) {
        const radius = (dataArray[i] / 255) * maxRadius;
        const x = i * spacing;
        
        ctx.beginPath();
        ctx.arc(x, centerY, radius, 0, Math.PI * 2);
        
        const gradient = ctx.createRadialGradient(x, centerY, 0, x, centerY, radius);
        gradient.addColorStop(0, style.colors[0]);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    };

    const renderWave = () => {
      ctx.beginPath();
      ctx.strokeStyle = style.colors[0];
      ctx.lineWidth = 2;
      
      const sliceWidth = canvas.width / bufferLength;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        
        x += sliceWidth;
      }
      
      ctx.stroke();
    };

    // --- MEJORA 3: Sistema de partículas (nivel pro) ---
    const particles = [];
    const initParticles = () => {
      for (let i = 0; i < 50; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          speed: Math.random() * 2 + 1,
          size: Math.random() * 3 + 1
        });
      }
    };
    initParticles();

    const renderParticles = () => {
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const intensity = average / 255;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        // Las partículas se mueven según el ritmo
        p.y -= p.speed * intensity;
        if (p.y < 0) {
          p.y = canvas.height;
          p.x = Math.random() * canvas.width;
        }
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * intensity, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59, 130, 246, ${intensity})`;
        ctx.fill();
      });
    };

    const renderFrame = () => {
      analyserRef.current.getByteFrequencyData(dataArray);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Seleccionar estilo según el tipo
      switch(style.shape) {
        case 'circles':
          renderCircles();
          break;
        case 'wave':
          renderWave();
          break;
        case 'particles':
          renderParticles();
          break;
        case 'bars':
        default:
          renderBars();
          break;
      }
      
      animationIdRef.current = requestAnimationFrame(renderFrame);
    };

    if (isPlaying) {
      renderFrame();
      // Asegurar que el AudioContext esté activo
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [audioRef, isPlaying, episodeType]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-16 block transition-all duration-300"
      style={{
        filter: 'drop-shadow(0 0 10px rgba(59,130,246,0.3))'
      }}
    />
  );
};

export default Visualizer;