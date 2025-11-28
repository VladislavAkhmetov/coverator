
import { GeneratorSettings, BRAND_COLORS } from '../types';

// Convert Hex to RGB
const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
};

const BLUE = hexToRgb(BRAND_COLORS.BLUE); // #3253EE
const LIME = hexToRgb(BRAND_COLORS.LIME); // #B4FF00
const WHITE = { r: 255, g: 255, b: 255 };
const BLACK = { r: 5, g: 5, b: 5 }; // Soft black

export const drawTsekhLogo = (ctx: CanvasRenderingContext2D, width: number, height: number, scale: number) => {
    const originalWidth = 231;
    const originalHeight = 123;
    const baseSize = Math.min(width, height);
    const renderScale = (baseSize / originalWidth) * scale;
    
    const cx = width / 2;
    const cy = height / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(renderScale, renderScale);
    ctx.translate(-originalWidth / 2, -originalHeight / 2);
    
    // Correct TSEKH X Path
    const p = new Path2D("M177.342 0L113.341 37.6405L49.3449 0H0V33.446H24.9079L72.6891 61.5485L25.0779 89.5539H0V123H49.5149L113.341 85.4566L177.173 123L231 123V89.554L201.605 89.5539L153.993 61.5485L201.775 33.446L231 33.446V6.96101e-05L177.342 0Z");
    ctx.fill(p);
    
    ctx.restore();
};

export const processImage = (
    ctx: CanvasRenderingContext2D, 
    img: HTMLImageElement, 
    settings: GeneratorSettings,
    width: number,
    height: number
) => {
    // 1. Offscreen canvas for base processing
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tCtx = tempCanvas.getContext('2d')!;

    // 2. Draw original with Zoom, Rotation AND Shift
    const scale = Math.max(width / img.width, height / img.height) * settings.zoom;
    
    // Calculate centered position
    const baseX = (width / 2) - (img.width / 2) * scale;
    const baseY = (height / 2) - (img.height / 2) * scale;
    
    // Apply Shift (as percentage of canvas size)
    const offsetX = (settings.shiftX / 100) * width;
    const offsetY = (settings.shiftY / 100) * height;

    tCtx.save();
    tCtx.translate(width/2 + offsetX, height/2 + offsetY);
    tCtx.rotate((settings.rotation * Math.PI) / 180);
    tCtx.translate(-(width/2 + offsetX), -(height/2 + offsetY)); // Rotate around shift point
    
    tCtx.drawImage(img, baseX + offsetX, baseY + offsetY, img.width * scale, img.height * scale);
    tCtx.restore();

    // 3. Pixel Manipulation Loop
    const imageData = tCtx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const len = data.length;

    const contrastFactor = (259 * (settings.contrast + 255)) / (255 * (259 - settings.contrast));
    const mix = settings.colorMix / 100;
    
    for (let i = 0; i < len; i += 4) {
        let r = data[i];
        let g = data[i+1];
        let b = data[i+2];

        // Contrast & Brightness
        r = contrastFactor * (r - 128) + 128 + (settings.brightness - 100);
        g = contrastFactor * (g - 128) + 128 + (settings.brightness - 100);
        b = contrastFactor * (b - 128) + 128 + (settings.brightness - 100);

        // Clamp
        r = Math.min(255, Math.max(0, r));
        g = Math.min(255, Math.max(0, g));
        b = Math.min(255, Math.max(0, b));

        // Luma
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;

        // --- Brand Color Mapping (Gradient Map) ---
        if (mix > 0) {
            let tr, tg, tb;
            
            if (luma < 50) {
                // Shadow
                const t = luma / 50; 
                tr = BLACK.r * (1-t) + BLUE.r * 0.2 * t;
                tg = BLACK.g * (1-t) + BLUE.g * 0.2 * t;
                tb = BLACK.b * (1-t) + BLUE.b * 0.2 * t;
            } else if (luma < 180) {
                // Midtone - Corporate Blue
                tr = BLUE.r;
                tg = BLUE.g;
                tb = BLUE.b;
            } else {
                // Highlight - White
                tr = WHITE.r;
                tg = WHITE.g;
                tb = WHITE.b;
            }

            // Lime Accent logic
            const isLime = (Math.random() * 100 < (settings.noiseAmount * 0.5) && luma > 100) || 
                           (luma > 220 && Math.random() * 100 < settings.limeAccent);
            
            if (isLime) {
                tr = LIME.r;
                tg = LIME.g;
                tb = LIME.b;
            }

            // Blend based on mix parameter
            data[i] = r * (1 - mix) + tr * mix;
            data[i+1] = g * (1 - mix) + tg * mix;
            data[i+2] = b * (1 - mix) + tb * mix;
        } else {
            data[i] = r;
            data[i+1] = g;
            data[i+2] = b;
        }
    }
    
    // Write back color corrected data
    tCtx.putImageData(imageData, 0, 0);

    // 4. Pixel Sorting / Smearing (Horizontal)
    if (settings.pixelSortThreshold > 0) {
        const cycles = Math.floor(settings.pixelSortThreshold / 2);
        
        for (let k = 0; k < cycles; k++) {
            const y = Math.floor(Math.random() * height);
            const w = Math.floor(Math.random() * (width * 0.5));
            const h = Math.max(1, Math.floor(Math.random() * (height * 0.05)));
            
            // Random offset stretch
            if (Math.random() > 0.5) {
               // Stretch pixel at x across
               const x = Math.floor(Math.random() * width);
               tCtx.drawImage(tempCanvas, x, y, 1, h, x, y, w, h);
            } else {
               // Offset glitch strip
               const offset = (Math.random() - 0.5) * 50;
               tCtx.drawImage(tempCanvas, 0, y, width, h, offset, y, width, h);
            }
        }
    }
    
    // Glitch XY Displacement
    if (settings.distortionX > 0 || settings.distortionY > 0) {
         const slices = 20;
         const sh = height / slices;
         for (let i = 0; i < slices; i++) {
             const dx = (Math.random() - 0.5) * (settings.distortionX * 2);
             const dy = (Math.random() - 0.5) * (settings.distortionY * 2);
             tCtx.drawImage(tempCanvas, 0, i * sh, width, sh, dx, (i * sh) + dy, width, sh);
         }
    }

    // 5. Scanlines (Post-Color)
    if (settings.scanlines > 0) {
        const scanCtx = tempCanvas.getContext('2d')!;
        scanCtx.fillStyle = 'rgba(0,0,0,0.5)';
        const step = Math.max(2, Math.floor(400 / (settings.scanlines * 4 + 1))); 
        for (let y = 0; y < height; y += step) {
            scanCtx.fillRect(0, y, width, step / 2);
        }
    }
    
    // 6. Kaleidoscope & Geometry
    ctx.clearRect(0, 0, width, height);
    
    if (settings.kaleidoscopeSegments > 0) {
        // Create pattern source
        const kCanvas = document.createElement('canvas');
        const cropSize = Math.min(width, height);
        kCanvas.width = cropSize;
        kCanvas.height = cropSize;
        
        // Use central crop for kaleidoscope source
        kCanvas.getContext('2d')?.drawImage(
            tempCanvas, 
            (width - cropSize)/2, (height - cropSize)/2, cropSize, cropSize, 
            0, 0, cropSize, cropSize
        );
        
        const centerX = width / 2;
        const centerY = height / 2;
        
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, width, height);

        ctx.save();
        ctx.translate(centerX, centerY);

        if (settings.kaleidoscopeSegments === 4) {
            // "Soviet Carpet" Mode (4-way mirror)
            const qw = width / 2;
            const qh = height / 2;
            
            // Draw Top-Left
            ctx.save();
            ctx.translate(-qw, -qh);
            // We draw the Top-Left quadrant of the crop
            ctx.drawImage(kCanvas, 0, 0, cropSize/2, cropSize/2, 0, 0, qw, qh);
            ctx.restore();

            // Top-Right (Mirror X)
            ctx.save();
            ctx.scale(-1, 1);
            ctx.translate(-qw, -qh);
            ctx.drawImage(kCanvas, 0, 0, cropSize/2, cropSize/2, 0, 0, qw, qh);
            ctx.restore();

            // Bottom-Left (Mirror Y)
            ctx.save();
            ctx.scale(1, -1);
            ctx.translate(-qw, -qh);
            ctx.drawImage(kCanvas, 0, 0, cropSize/2, cropSize/2, 0, 0, qw, qh);
            ctx.restore();

            // Bottom-Right (Mirror XY)
            ctx.save();
            ctx.scale(-1, -1);
            ctx.translate(-qw, -qh);
            ctx.drawImage(kCanvas, 0, 0, cropSize/2, cropSize/2, 0, 0, qw, qh);
            ctx.restore();

        } else if (settings.kaleidoscopeSegments === 8) {
            // 8-way Radial
            const sliceAngle = (Math.PI * 2) / 8;
            for (let i = 0; i < 8; i++) {
                ctx.save();
                ctx.rotate(i * sliceAngle);
                if (i % 2 !== 0) ctx.scale(1, -1);
                
                ctx.beginPath();
                ctx.moveTo(0,0);
                ctx.lineTo(width, -width * Math.tan(sliceAngle/2));
                ctx.lineTo(width, width * Math.tan(sliceAngle/2));
                ctx.closePath();
                ctx.clip();
                
                ctx.drawImage(kCanvas, 0, -cropSize/2, cropSize, cropSize);
                ctx.restore();
            }
        } else {
             // 2-way
             ctx.save();
             ctx.translate(-width/2, -height/2);
             ctx.drawImage(tempCanvas, 0, 0); 
             ctx.restore();
             
             if (settings.mirrorMode) {
                 ctx.save();
                 ctx.scale(-1, 1);
                 ctx.globalAlpha = 0.5;
                 ctx.drawImage(tempCanvas, -width/2, -height/2, width, height);
                 ctx.restore();
             }
        }
        ctx.restore();
    } else {
        // No Symmetry - Raw Glitch
        ctx.drawImage(tempCanvas, 0, 0);
    }

    // 7. Logo Overlay
    if (settings.logoOverlay !== 'none') {
        ctx.save();
        
        // Helper to draw logo
        const renderLogo = () => drawTsekhLogo(ctx, width, height, settings.logoScale);

        if (settings.logoOverlay === 'mask-positive') {
            // Content ONLY inside Logo
            ctx.globalCompositeOperation = 'destination-in';
            ctx.fillStyle = '#000';
            renderLogo();
        } else if (settings.logoOverlay === 'mask-negative') {
            // Content everywhere EXCEPT Logo (Logo is transparent/black)
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = '#000';
            renderLogo();
            
            // NO STROKE (Removed as per request)
            
        } else if (settings.logoOverlay === 'watermark') {
            // White Overlay
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            renderLogo();
        }
        ctx.restore();
    }
};