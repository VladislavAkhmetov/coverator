import React, { useState, useEffect, useRef } from 'react';
import { Controls } from './components/Controls';
import { GeneratorSettings, Preset } from './types';
import { DEFAULT_SETTINGS, PRESETS } from './constants';
import { processImage } from './utils/canvasUtils';

// Default Placeholder Image (Abstract Tech)
const PLACEHOLDER_IMG_URL = "https://picsum.photos/1920/1080?grayscale&blur=2"; 

export default function App() {
  const [settings, setSettings] = useState<GeneratorSettings>(DEFAULT_SETTINGS);
  const [imageSrc, setImageSrc] = useState<string>(PLACEHOLDER_IMG_URL);
  const [patternSrc, setPatternSrc] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(new Image());
  const patternImgRef = useRef<HTMLImageElement | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load initial image
  useEffect(() => {
    imgRef.current.crossOrigin = "Anonymous";
    imgRef.current.src = imageSrc;
    imgRef.current.onload = () => renderCanvas();
  }, [imageSrc]);

  // Load pattern image (second source)
  useEffect(() => {
    if (!patternSrc) return;
    if (!patternImgRef.current) {
      patternImgRef.current = new Image();
    }
    patternImgRef.current.crossOrigin = "Anonymous";
    patternImgRef.current.src = patternSrc;
    patternImgRef.current.onload = () => renderCanvas();
  }, [patternSrc]);

  // Re-render when settings change
  useEffect(() => {
    requestAnimationFrame(renderCanvas);
  }, [settings]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    const patternImg = patternImgRef.current;
    if (!canvas || !img.complete) return;

    // Set canvas size (High res)
    const displayWidth = window.innerWidth > 1200 ? 1920 : 1080;
    const displayHeight = window.innerWidth > 1200 ? 1080 : 1080; 
    
    canvas.width = displayWidth;
    canvas.height = displayHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    processImage(ctx, img, patternImg ?? null, settings, canvas.width, canvas.height);
  };

  const handleUploadBase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          setImageSrc(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadPattern = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          setPatternSrc(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `tsekh_vlab_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleRandomize = () => {
      // Pick a random preset or randomize values nicely
      const randomPreset = PRESETS[Math.floor(Math.random() * PRESETS.length)];
      
      const randomized: GeneratorSettings = {
          ...randomPreset.settings,
          distortionX: Math.random() * 100,
          colorMix: 80 + Math.random() * 20,
          rotation: Math.random() * 360,
          zoom: 0.8 + Math.random() * 1.5,
          kaleidoscopeSegments: Math.random() > 0.5 ? 4 : (Math.random() > 0.5 ? 8 : 0),
          limeAccent: Math.random() * 50
      };
      setSettings(randomized);
  };

  const handleTakePhoto = async () => {
    try {
      // Проверяем поддержку камеры
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Камера не поддерживается в этом браузере. Используйте современный браузер (Chrome, Firefox, Safari, Edge).');
        return;
      }

      // Запрашиваем доступ к камере
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment' // Предпочитаем заднюю камеру на телефоне
          } 
        });
      } catch (e) {
        // Если задняя камера недоступна, пробуем любую
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: true
        });
      }
      
      streamRef.current = stream;
      setShowCamera(true);

      // Ждем, пока DOM обновится и video элемент появится
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(err => {
            console.error('Ошибка воспроизведения видео:', err);
          });
        }
      }, 100);
    } catch (error: any) {
      console.error('Ошибка доступа к камере:', error);
      let message = 'Не удалось получить доступ к камере.';
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        message = 'Доступ к камере запрещен. Разрешите доступ в настройках браузера.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        message = 'Камера не найдена. Убедитесь, что камера подключена и не используется другим приложением.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        message = 'Камера уже используется другим приложением.';
      }
      alert(message);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    // Создаем canvas для захвата кадра
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      // Преобразуем в data URL
      const dataUrl = canvas.toDataURL('image/png');
      setImageSrc(dataUrl);
    }

    // Закрываем камеру
    closeCamera();
  };

  const closeCamera = () => {
    // Останавливаем поток камеры
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#050505] overflow-hidden">
      {/* Sidebar Controls */}
      <div className="w-full md:w-[400px] h-1/3 md:h-full flex-shrink-0 z-20">
        <Controls 
            settings={settings}
            onUpdate={setSettings}
            onUploadBase={handleUploadBase}
            onUploadPattern={handleUploadPattern}
            onDownload={handleDownload}
            presets={PRESETS}
            onApplyPreset={(p) => setSettings(p.settings)}
            onRandomize={handleRandomize}
            onTakePhoto={handleTakePhoto}
        />
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 relative bg-neutral-900 flex items-center justify-center overflow-hidden">
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
            backgroundImage: `linear-gradient(#3253EE 1px, transparent 1px), linear-gradient(90deg, #3253EE 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
        }}></div>

        <div className="relative shadow-2xl border border-gray-800">
            {/* The Canvas */}
            <canvas 
                ref={canvasRef} 
                className="max-w-full max-h-[80vh] w-auto h-auto object-contain bg-black"
                style={{ imageRendering: 'pixelated' }}
            />
            
            {/* Canvas Overlay Text */}
            <div className="absolute bottom-4 right-4 text-[#3253EE] text-xs font-mono opacity-50 pointer-events-none">
                PREVIEW MODE // {settings.kaleidoscopeSegments > 0 ? 'SYMMETRY_ACTIVE' : 'RAW_GLITCH'}
            </div>
        </div>

        {/* Floating elements for aesthetics */}
        <div className="absolute top-4 right-4 flex flex-col items-end gap-1 pointer-events-none">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#B4FF00] rounded-full animate-pulse"></div>
                <span className="text-[#B4FF00] font-mono text-xs">SYSTEM ONLINE</span>
            </div>
            <div className="text-gray-600 font-mono text-[10px]">1920x1080 OUTPUT</div>
        </div>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col items-center">
            {/* Video Preview */}
            <div className="relative w-full max-h-[70vh] border-2 border-[#3253EE] rounded-lg overflow-hidden shadow-[0_0_40px_rgba(50,83,238,0.3)]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />
              {/* Overlay grid for camera feel */}
              <div className="absolute inset-0 pointer-events-none opacity-20" style={{
                backgroundImage: `linear-gradient(#3253EE 1px, transparent 1px), linear-gradient(90deg, #3253EE 1px, transparent 1px)`,
                backgroundSize: '40px 40px'
              }}></div>
            </div>
            
            {/* Controls */}
            <div className="mt-6 flex gap-4 items-center">
              <button
                onClick={closeCamera}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-mono text-sm uppercase tracking-wider transition-all hover:border-gray-600"
              >
                CANCEL
              </button>
              <button
                onClick={capturePhoto}
                className="px-8 py-3 bg-[#3253EE] hover:bg-[#203bc4] text-white font-mono text-sm uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(50,83,238,0.5)] hover:shadow-[0_0_30px_rgba(50,83,238,0.7)]"
              >
                CAPTURE
              </button>
            </div>
            
            {/* Hint */}
            <p className="mt-4 text-gray-500 font-mono text-xs text-center">
              Разрешите доступ к камере в браузере
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
