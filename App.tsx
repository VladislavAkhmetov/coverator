import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Controls } from './components/Controls';
import { GeneratorSettings, Preset } from './types';
import { DEFAULT_SETTINGS, PRESETS } from './constants';
import { processImage } from './utils/canvasUtils';
import { TYPEWRITER_PHRASES } from './constants/typewriterPhrases';
import { removeBackgroundSimple } from './utils/backgroundRemoval';

// Default Placeholder Image (Abstract Tech)
const PLACEHOLDER_IMG_URL = "https://picsum.photos/1920/1080?grayscale&blur=2"; 

export default function App() {
  const [settings, setSettings] = useState<GeneratorSettings>(DEFAULT_SETTINGS);
  const [imageSrc, setImageSrc] = useState<string>(PLACEHOLDER_IMG_URL);
  const [patternSrc, setPatternSrc] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isExportingAnimation, setIsExportingAnimation] = useState(false);
  
  // Animation state
  const animationFrameRef = useRef<number>(0);
  const animationTimeRef = useRef<number>(0);
  
  // Typewriter state
  const [typewriterText, setTypewriterText] = useState<string>('');
  const [typewriterCharIndex, setTypewriterCharIndex] = useState<number>(0);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState<number>(0);
  const typewriterTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(new Image());
  const patternImgRef = useRef<HTMLImageElement | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewStreamRef = useRef<MediaStream | null>(null); // For camera preview overlay
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const segmentationCanvasRef = useRef<HTMLCanvasElement | null>(null); // For background removal

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

  // Animation loop
  useEffect(() => {
    if (!settings.animationEnabled) {
      animationTimeRef.current = 0;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = 0;
      }
      renderCanvas();
      return;
    }

    let lastTime = 0;
    const animate = (timestamp: number) => {
      if (lastTime === 0) {
        lastTime = timestamp;
      }
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;
      
      renderCanvas(timestamp); // Pass timestamp for animation calculation
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [settings.animationEnabled, settings]);

  // Typewriter effect - зацикленный: набор → стирание → снова набор
  const [isTyping, setIsTyping] = useState(true); // true = typing, false = erasing
  
  useEffect(() => {
    if (!settings.typewriterEnabled) {
      setTypewriterText('');
      setTypewriterCharIndex(0);
      setIsTyping(true);
      if (typewriterTimerRef.current) {
        clearTimeout(typewriterTimerRef.current);
        typewriterTimerRef.current = null;
      }
      return;
    }

    const currentPhrase = TYPEWRITER_PHRASES[currentPhraseIndex] || '';
    const speed = Math.max(30, 400 - (settings.typewriterSpeed * 3.7)); // 30-400ms per char
    const eraseSpeed = speed * 0.5; // Стирание быстрее в 2 раза

    if (isTyping) {
      // Набираем текст
      if (typewriterCharIndex < currentPhrase.length) {
        typewriterTimerRef.current = setTimeout(() => {
          setTypewriterText(currentPhrase.substring(0, typewriterCharIndex + 1));
          setTypewriterCharIndex(typewriterCharIndex + 1);
        }, speed);
      } else {
        // Фраза набрана, ждём и начинаем стирать
        typewriterTimerRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 1500); // Пауза после набора
      }
    } else {
      // Стираем текст
      if (typewriterCharIndex > 0) {
        typewriterTimerRef.current = setTimeout(() => {
          setTypewriterText(currentPhrase.substring(0, typewriterCharIndex - 1));
          setTypewriterCharIndex(typewriterCharIndex - 1);
        }, eraseSpeed);
      } else {
        // Текст стёрт, переходим к следующей фразе и начинаем набирать
        setCurrentPhraseIndex((prev) => (prev + 1) % TYPEWRITER_PHRASES.length);
        setIsTyping(true);
        typewriterTimerRef.current = setTimeout(() => {
          // Небольшая пауза перед новой фразой
        }, 300);
      }
    }

    return () => {
      if (typewriterTimerRef.current) {
        clearTimeout(typewriterTimerRef.current);
      }
    };
  }, [settings.typewriterEnabled, typewriterCharIndex, currentPhraseIndex, settings.typewriterSpeed, isTyping]);

  // Camera preview overlay
  useEffect(() => {
    if (!settings.cameraPreviewEnabled) {
      if (previewStreamRef.current) {
        previewStreamRef.current.getTracks().forEach(track => track.stop());
        previewStreamRef.current = null;
      }
      return;
    }

    const initPreviewCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          alert('Камера не поддерживается для предпросмотра');
          setSettings(prev => ({ ...prev, cameraPreviewEnabled: false }));
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' } // Front camera for preview
        });
        
        previewStreamRef.current = stream;
        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = stream;
          previewVideoRef.current.play();
        }
      } catch (error) {
        console.error('Ошибка доступа к камере для предпросмотра:', error);
        setSettings(prev => ({ ...prev, cameraPreviewEnabled: false }));
      }
    };

    initPreviewCamera();

    return () => {
      if (previewStreamRef.current) {
        previewStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [settings.cameraPreviewEnabled]);

  const renderCanvas = (deltaTime: number = 0) => {
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

    // Calculate animation offset if enabled
    const animOffset = settings.animationEnabled ? {
      rotation: (deltaTime / 100) * (settings.animationSpeed / 10), // degrees per second
      zoom: 1 + Math.sin(deltaTime / 1000) * (settings.animationIntensity / 200),
      shiftX: Math.sin(deltaTime / 2000) * (settings.animationIntensity / 2),
      shiftY: Math.cos(deltaTime / 2000) * (settings.animationIntensity / 2)
    } : null;

    // Сначала рисуем сгенерированный фон
    processImage(ctx, img, patternImg ?? null, settings, canvas.width, canvas.height, animOffset, typewriterText);

    // Затем рисуем человека с вырезанным фоном поверх (как виртуальный фон в Zoom)
    if (settings.cameraPreviewEnabled && previewVideoRef.current && previewVideoRef.current.readyState >= 2) {
      const video = previewVideoRef.current;
      
      // Создаём временный canvas для сегментации, если его нет
      if (!segmentationCanvasRef.current) {
        segmentationCanvasRef.current = document.createElement('canvas');
      }
      const segCanvas = segmentationCanvasRef.current;
      
      // Обрабатываем видео для вырезания фона
      const processedImageData = removeBackgroundSimple(video, segCanvas);
      
      if (processedImageData) {
        // Создаём временный canvas для обработанного изображения
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = processedImageData.width;
        tempCanvas.height = processedImageData.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        if (tempCtx) {
          tempCtx.putImageData(processedImageData, 0, 0);
          
          // Масштабируем видео под размер основного canvas (сохраняя пропорции)
          const videoAspect = video.videoWidth / video.videoHeight;
          const canvasAspect = canvas.width / canvas.height;
          
          let drawWidth = canvas.width;
          let drawHeight = canvas.height;
          let drawX = 0;
          let drawY = 0;
          
          if (videoAspect > canvasAspect) {
            // Видео шире - подгоняем по высоте
            drawHeight = canvas.height;
            drawWidth = drawHeight * videoAspect;
            drawX = (canvas.width - drawWidth) / 2;
          } else {
            // Видео выше - подгоняем по ширине
            drawWidth = canvas.width;
            drawHeight = drawWidth / videoAspect;
            drawY = (canvas.height - drawHeight) / 2;
          }
          
          // Рисуем человека поверх фона
          ctx.drawImage(tempCanvas, drawX, drawY, drawWidth, drawHeight);
        }
      } else {
        // Fallback: если сегментация не сработала, рисуем видео с прозрачностью
        ctx.globalAlpha = 0.9;
        const videoAspect = video.videoWidth / video.videoHeight;
        const canvasAspect = canvas.width / canvas.height;
        
        let drawWidth = canvas.width;
        let drawHeight = canvas.height;
        let drawX = 0;
        let drawY = 0;
        
        if (videoAspect > canvasAspect) {
          drawHeight = canvas.height;
          drawWidth = drawHeight * videoAspect;
          drawX = (canvas.width - drawWidth) / 2;
        } else {
          drawWidth = canvas.width;
          drawHeight = drawWidth / videoAspect;
          drawY = (canvas.height - drawHeight) / 2;
        }
        
        ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight);
        ctx.globalAlpha = 1.0;
      }
    }
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

  const handleExportAnimation = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setIsExportingAnimation(true);
    
    try {
      // For GIF export, we'll use a simple approach with multiple frames
      // Note: For production, consider using a library like gif.js or similar
      const frames: string[] = [];
      const frameCount = 60; // 2 seconds at 30fps
      const duration = 2000; // 2 seconds
      const frameDelay = duration / frameCount;
      
      // Capture frames
      for (let i = 0; i < frameCount; i++) {
        const time = i * frameDelay;
        animationTimeRef.current = time;
        renderCanvas(time);
        await new Promise(resolve => setTimeout(resolve, frameDelay / 10)); // Small delay for rendering
        frames.push(canvas.toDataURL('image/png'));
      }
      
      // For now, export as WebM video (better browser support)
      // Convert frames to video using MediaRecorder API
      const stream = canvas.captureStream(30); // 30 fps
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      return new Promise<void>((resolve, reject) => {
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `tsekh_vlab_animation_${Date.now()}.webm`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
          setIsExportingAnimation(false);
          resolve();
        };
        
        mediaRecorder.onerror = (e) => {
          setIsExportingAnimation(false);
          reject(e);
        };
        
        mediaRecorder.start();
        setTimeout(() => {
          mediaRecorder.stop();
        }, duration);
      });
    } catch (error) {
      console.error('Ошибка экспорта анимации:', error);
      alert('Не удалось экспортировать анимацию. Попробуйте другой формат.');
      setIsExportingAnimation(false);
    }
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
      // Сначала пробуем заднюю камеру (для телефонов), если не получится - любую доступную
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
            onExportAnimation={handleExportAnimation}
            isExportingAnimation={isExportingAnimation}
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

      {/* Hidden video for camera preview overlay */}
      <video
        ref={previewVideoRef}
        autoPlay
        playsInline
        muted
        className="hidden"
        style={{ display: 'none' }}
      />

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