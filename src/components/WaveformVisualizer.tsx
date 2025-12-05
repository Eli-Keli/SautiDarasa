import { useRef, useEffect } from 'react';

interface WaveformVisualizerProps {
  isActive: boolean;
  stream?: MediaStream | null;
  color?: string;
  barCount?: number;
  className?: string;
}

export default function WaveformVisualizer({
  isActive,
  stream,
  color = '#3B82F6',
  barCount = 30,
  className = '',
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!isActive || !stream) {
      // Stop visualization
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      analyserRef.current = null;
      
      // Clear canvas
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
      return;
    }

    // Set up audio analysis
    const setupAudioAnalysis = async () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        
        visualize();
      } catch (err) {
        console.error('Audio analysis setup error:', err);
      }
    };

    const visualize = () => {
      const canvas = canvasRef.current;
      const analyser = analyserRef.current;
      
      if (!canvas || !analyser) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        if (!isActive) return;

        animationFrameRef.current = requestAnimationFrame(draw);
        
        analyser.getByteFrequencyData(dataArray);

        ctx.fillStyle = '#0A0A0A';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = canvas.width / barCount;
        const step = Math.floor(bufferLength / barCount);

        for (let i = 0; i < barCount; i++) {
          const index = i * step;
          const value = dataArray[index] || 0;
          const barHeight = (value / 255) * canvas.height * 0.8;
          
          const x = i * barWidth;
          const y = (canvas.height - barHeight) / 2;

          ctx.fillStyle = color;
          ctx.fillRect(x + barWidth * 0.1, y, barWidth * 0.8, barHeight);
        }
      };

      draw();
    };

    setupAudioAnalysis();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isActive, stream, color, barCount]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={200}
      className={`w-full h-full ${className}`}
    />
  );
}
