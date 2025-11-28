export interface GeneratorSettings {
    // Basic
    contrast: number; // 0-200
    brightness: number; // 0-200
    
    // Glitch / Distortion
    distortionX: number; // 0-100
    distortionY: number; // 0-100
    pixelSortThreshold: number; // 0-100
    noiseAmount: number; // 0-100
    scanlines: number; // 0-100
    
    // Color
    colorMix: number; // 0-100 (Blend between original and brand colors)
    limeAccent: number; // 0-100 (Intensity of the lime green glitch)
    
    // Dual-source (base + pattern) mixing
    patternTextureMix: number; // 0-100 how much second image texture/colors are blended in
    patternDetailMix: number;  // 0-100 how much second image drives local contrast/structure
    
    // Geometry / Carpet
    kaleidoscopeSegments: 0 | 2 | 4 | 8; // Symmetry count
    mirrorMode: boolean;
    zoom: number; // 1-5
    rotation: number; // 0-360
    shiftX: number; // -100 to 100 (Pan image horizontally before kaleidoscope)
    shiftY: number; // -100 to 100 (Pan image vertically)
    
    // Branding
    logoOverlay: 'none' | 'watermark' | 'mask-positive' | 'mask-negative';
    logoScale: number; // 0.1 - 2.0
}

export interface Preset {
    name: string;
    settings: GeneratorSettings;
}

export const BRAND_COLORS = {
    BLUE: '#3253EE',
    LIME: '#B4FF00', // Approximate neon lime
    WHITE: '#FFFFFF',
    BLACK: '#000000',
    DARK_BG: '#050505'
};