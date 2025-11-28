// Утилита для вырезания фона с помощью MediaPipe Selfie Segmentation

let selfieSegmentation: any = null;
let isInitialized = false;

export const initBackgroundRemoval = async (): Promise<boolean> => {
  if (isInitialized && selfieSegmentation) {
    return true;
  }

  try {
    // @ts-ignore - MediaPipe доступен через CDN
    if (typeof SelfieSegmentation === 'undefined') {
      console.error('MediaPipe SelfieSegmentation не загружен');
      return false;
    }

    // @ts-ignore
    selfieSegmentation = new SelfieSegmentation({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
      }
    });

    selfieSegmentation.setOptions({
      modelSelection: 1, // 0 = general, 1 = landscape (лучше для видеозвонков)
      selfieMode: true
    });

    await selfieSegmentation.initialize();
    isInitialized = true;
    return true;
  } catch (error) {
    console.error('Ошибка инициализации MediaPipe:', error);
    return false;
  }
};

export const removeBackground = async (
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
): Promise<ImageData | null> => {
  if (!selfieSegmentation || !isInitialized) {
    const initialized = await initBackgroundRemoval();
    if (!initialized) {
      return null;
    }
  }

  try {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Устанавливаем размер canvas под размер video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Рисуем video на canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Обрабатываем через MediaPipe
    return new Promise((resolve) => {
      selfieSegmentation.onResults((results: any) => {
        if (results.segmentationMask) {
          // Создаём маску для вырезания фона
          const maskCanvas = document.createElement('canvas');
          maskCanvas.width = canvas.width;
          maskCanvas.height = canvas.height;
          const maskCtx = maskCanvas.getContext('2d');
          
          if (maskCtx && results.segmentationMask) {
            maskCtx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);
            const maskData = maskCtx.getImageData(0, 0, canvas.width, canvas.height);
            
            // Применяем маску к изображению
            const outputData = ctx.createImageData(canvas.width, canvas.height);
            for (let i = 0; i < imageData.data.length; i += 4) {
              const maskAlpha = maskData.data[i + 3]; // Альфа канал маски
              const alpha = maskAlpha / 255; // Нормализуем 0-1
              
              // Копируем пиксели только там, где есть человек (маска > 0)
              outputData.data[i] = imageData.data[i];     // R
              outputData.data[i + 1] = imageData.data[i + 1]; // G
              outputData.data[i + 2] = imageData.data[i + 2]; // B
              outputData.data[i + 3] = Math.round(imageData.data[i + 3] * alpha); // A
            }
            
            resolve(outputData);
          } else {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });

      // Отправляем кадр на обработку
      selfieSegmentation.send({ image: video });
    });
  } catch (error) {
    console.error('Ошибка обработки фона:', error);
    return null;
  }
};

// Упрощённая версия без MediaPipe (fallback) - использует улучшенную цветовую сегментацию
export const removeBackgroundSimple = (
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
): ImageData | null => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  // Анализируем центральную область для определения цвета кожи/человека
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const sampleSize = Math.min(100, Math.floor(width * 0.1));
  const sampleStartX = centerX - sampleSize / 2;
  const sampleStartY = centerY - sampleSize / 2;
  
  let skinR = 0, skinG = 0, skinB = 0, skinCount = 0;
  
  // Собираем образцы из центральной области (где обычно лицо)
  for (let y = sampleStartY; y < sampleStartY + sampleSize && y < height; y++) {
    for (let x = sampleStartX; x < sampleStartX + sampleSize && x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const brightness = (r + g + b) / 3;
      
      // Считаем, что это кожа, если не слишком светлая и не слишком тёмная
      if (brightness > 50 && brightness < 200) {
        skinR += r;
        skinG += g;
        skinB += b;
        skinCount++;
      }
    }
  }
  
  if (skinCount > 0) {
    skinR /= skinCount;
    skinG /= skinCount;
    skinB /= skinCount;
  }

  // Обрабатываем все пиксели
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (r + g + b) / 3;
    
    // Вычисляем расстояние до цвета кожи
    const distToSkin = Math.sqrt(
      Math.pow(r - skinR, 2) + 
      Math.pow(g - skinG, 2) + 
      Math.pow(b - skinB, 2)
    );
    
    // Вычисляем насыщенность (saturation)
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    
    // Удаляем фон на основе:
    // 1. Слишком светлый или тёмный (вероятно фон)
    // 2. Слишком далеко от цвета кожи
    // 3. Низкая насыщенность (серый фон)
    const isBackground = 
      brightness > 220 || 
      brightness < 25 ||
      (distToSkin > 80 && saturation < 0.3) ||
      (brightness > 180 && saturation < 0.2);
    
    if (isBackground) {
      data[i + 3] = 0; // Прозрачный
    } else {
      // Сохраняем пиксель, но можно добавить небольшое размытие краёв
      const edgeFactor = Math.min(1, distToSkin / 60);
      data[i + 3] = Math.round(255 * (1 - edgeFactor * 0.3)); // Немного прозрачные края
    }
  }

  return imageData;
};

