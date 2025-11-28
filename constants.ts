
import { GeneratorSettings, Preset } from './types';

export const DEFAULT_SETTINGS: GeneratorSettings = {
    contrast: 130,
    brightness: 100,
    distortionX: 0,
    distortionY: 0,
    pixelSortThreshold: 0,
    noiseAmount: 15,
    scanlines: 0,
    colorMix: 100, // Fully brand colors by default
    limeAccent: 0,
    patternTextureMix: 0,
    patternDetailMix: 0,
    kaleidoscopeSegments: 4,
    mirrorMode: true,
    zoom: 1.0,
    rotation: 0,
    shiftX: 0,
    shiftY: 0,
    logoOverlay: 'mask-negative',
    logoScale: 0.8,
    animationEnabled: false,
    animationSpeed: 50,
    animationIntensity: 30,
    typewriterEnabled: false,
    typewriterSpeed: 50,
    cameraPreviewEnabled: false
};

export const PRESETS: Preset[] = [
    {
        name: "SOVIET CARPET",
        settings: {
            ...DEFAULT_SETTINGS,
            contrast: 145,
            brightness: 105,
            distortionX: 2,
            distortionY: 2,
            pixelSortThreshold: 5,
            noiseAmount: 25, // Wool texture
            scanlines: 10,
            kaleidoscopeSegments: 4, // The classic rug symmetry
            zoom: 1.2,
            shiftX: 0,
            shiftY: 0,
            colorMix: 100,
            limeAccent: 10,
            logoOverlay: 'mask-negative',
            logoScale: 0.7
        }
    },
    {
        name: "TSEKH GLITCH",
        settings: {
            ...DEFAULT_SETTINGS,
            distortionX: 40,
            distortionY: 5,
            pixelSortThreshold: 45,
            noiseAmount: 30,
            kaleidoscopeSegments: 0,
            mirrorMode: false,
            zoom: 1.0,
            shiftX: 0,
            shiftY: 0,
            colorMix: 90,
            limeAccent: 60,
            logoOverlay: 'watermark',
            logoScale: 0.3
        }
    },
    {
        name: "VORTEX MATRIX",
        settings: {
            ...DEFAULT_SETTINGS,
            kaleidoscopeSegments: 8,
            rotation: 0,
            zoom: 1.8,
            shiftX: 20,
            shiftY: -20,
            contrast: 160,
            colorMix: 100,
            limeAccent: 80, 
            logoOverlay: 'mask-positive',
            logoScale: 0.9
        }
    },
    {
        name: "BROKEN SIGNAL",
        settings: {
            ...DEFAULT_SETTINGS,
            distortionX: 85,
            distortionY: 15,
            scanlines: 60,
            pixelSortThreshold: 20,
            noiseAmount: 50,
            kaleidoscopeSegments: 0,
            colorMix: 100,
            logoOverlay: 'none',
        }
    }
];