
import React from 'react';
import { GeneratorSettings, Preset } from '../types';
import { Sliders, Maximize, Palette, Layers, Grid, Cpu, Download, RefreshCw, Upload, Zap, Aperture, Move, Camera } from 'lucide-react';

interface ControlsProps {
    settings: GeneratorSettings;
    onUpdate: (newSettings: GeneratorSettings) => void;
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDownload: () => void;
    presets: Preset[];
    onApplyPreset: (p: Preset) => void;
    onRandomize: () => void;
    onTakePhoto: () => void;
}

const Slider = ({ label, value, min, max, onChange, unit = "" }: any) => (
    <div className="mb-4 group">
        <div className="flex justify-between text-[10px] text-gray-500 mb-1 font-mono uppercase tracking-widest">
            <span className="group-hover:text-white transition-colors flex items-center gap-1">
                <div className="w-1 h-1 bg-[#3253EE] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {label}
            </span>
            <span className="text-[#3253EE] bg-[#3253EE]/10 px-1 font-bold">{value.toFixed(0)}{unit}</span>
        </div>
        <div className="relative h-4 flex items-center">
            <input 
                type="range" 
                min={min} 
                max={max} 
                value={value} 
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full z-10 opacity-0 absolute cursor-pointer h-full"
            />
            {/* Custom Track */}
            <div className="w-full h-[2px] bg-gray-800 relative overflow-hidden">
                <div 
                    className="h-full bg-[#3253EE]" 
                    style={{ width: `${((value - min) / (max - min)) * 100}%` }}
                ></div>
                {/* Tick marks */}
                <div className="absolute top-0 bottom-0 left-1/4 w-[1px] bg-black/50"></div>
                <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-black/50"></div>
                <div className="absolute top-0 bottom-0 left-3/4 w-[1px] bg-black/50"></div>
            </div>
            {/* Custom Thumb */}
            <div 
                className="absolute w-3 h-3 bg-[#050505] border border-[#3253EE] rotate-45 pointer-events-none transition-all group-hover:bg-[#3253EE] group-hover:scale-110 shadow-[0_0_10px_rgba(50,83,238,0.5)]"
                style={{ left: `calc(${((value - min) / (max - min)) * 100}% - 6px)` }}
            ></div>
        </div>
    </div>
);

const Section = ({ title, icon: Icon, children }: any) => (
    <div className="border border-gray-800 bg-[#0A0A0A] p-5 mb-4 relative overflow-hidden group hover:border-[#3253EE]/30 transition-colors">
        {/* Tech Decorations */}
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#3253EE] opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#3253EE] opacity-50"></div>
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#3253EE]/20 to-transparent"></div>
        
        <div className="flex items-center gap-3 mb-6 text-white font-display font-bold uppercase text-xs tracking-widest">
            <div className="bg-[#3253EE]/10 p-1.5 rounded-sm text-[#3253EE] border border-[#3253EE]/20">
                <Icon size={14} />
            </div>
            {title}
        </div>
        {children}
    </div>
);

export const Controls: React.FC<ControlsProps> = ({ 
    settings, 
    onUpdate, 
    onUpload, 
    onDownload, 
    presets, 
    onApplyPreset,
    onRandomize,
    onTakePhoto
}) => {

    const update = (key: keyof GeneratorSettings, val: any) => {
        onUpdate({ ...settings, [key]: val });
    };

    return (
        <div className="h-full overflow-y-auto p-6 bg-black text-gray-300 w-full max-w-md border-r border-gray-800 shadow-[20px_0_50px_-10px_rgba(0,0,0,0.9)] z-10 custom-scrollbar">
            
            <div className="mb-8 relative select-none">
                <div className="flex items-baseline gap-2 mb-1">
                     <h1 className="text-4xl font-display font-black text-white tracking-tighter italic">COVERATOR</h1>
                     <span className="text-[#3253EE] font-mono text-xs animate-pulse">● V2.5</span>
                </div>
                <div className="h-[2px] w-full bg-gradient-to-r from-[#3253EE] to-transparent mb-2"></div>
                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest flex justify-between">
                    <span>TSEKH CORP. v-labs</span>
                    <span>RESTRICTED ACCESS</span>
                </p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-8">
                <label className="flex flex-col items-center justify-center gap-2 bg-[#0F0F0F] hover:bg-[#151515] border border-gray-800 text-white py-6 px-4 cursor-pointer transition-all hover:border-[#3253EE] hover:shadow-[0_0_20px_rgba(50,83,238,0.1)] group relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#3253EE]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Upload size={24} className="text-gray-500 group-hover:text-[#3253EE] transition-colors mb-1" />
                    <span className="text-[10px] font-bold font-mono tracking-wider z-10">UPLOAD SOURCE</span>
                    <input type="file" onChange={onUpload} accept="image/*" className="hidden" />
                </label>
                <button 
                    onClick={onTakePhoto}
                    className="flex flex-col items-center justify-center gap-2 bg-[#0F0F0F] hover:bg-[#151515] border border-gray-800 text-white py-6 px-4 cursor-pointer transition-all hover:border-[#3253EE] hover:shadow-[0_0_20px_rgba(50,83,238,0.1)] group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#3253EE]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Camera size={24} className="text-gray-500 group-hover:text-[#3253EE] transition-colors mb-1" />
                    <span className="text-[10px] font-bold font-mono tracking-wider z-10">TAKE A PHOTO</span>
                </button>
                <button 
                    onClick={onRandomize}
                    className="flex flex-col items-center justify-center gap-2 bg-[#0F0F0F] hover:bg-[#151515] border border-gray-800 text-white py-6 px-4 cursor-pointer transition-all hover:border-[#B4FF00] hover:shadow-[0_0_20px_rgba(180,255,0,0.1)] group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#B4FF00]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <RefreshCw size={24} className="text-gray-500 group-hover:text-[#B4FF00] transition-colors mb-1" />
                    <span className="text-[10px] font-bold font-mono tracking-wider z-10">RANDOMIZE</span>
                </button>
            </div>

            <div className="mb-8">
                <div className="text-[10px] font-mono uppercase text-gray-500 mb-2 tracking-widest flex items-center gap-2">
                    <Zap size={10} />
                    Configuration Presets
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {presets.map(p => (
                        <button 
                            key={p.name}
                            onClick={() => onApplyPreset(p)}
                            className="px-3 py-3 text-[10px] border border-gray-800 bg-[#0A0A0A] hover:bg-[#3253EE] hover:text-white hover:border-[#3253EE] transition-all font-mono uppercase text-left relative group overflow-hidden"
                        >
                            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#3253EE] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="flex justify-between items-center">
                                {p.name}
                                <div className="w-1 h-1 bg-current opacity-50 rounded-full"></div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <Section title="Pattern Geometry" icon={Grid}>
                 <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] font-mono uppercase text-gray-400">Tiling Mode</span>
                    <div className="flex bg-[#000] p-1 border border-gray-800 gap-1">
                        {[0, 2, 4, 8].map(seg => (
                            <button
                                key={seg}
                                onClick={() => update('kaleidoscopeSegments', seg)}
                                className={`px-3 py-1 text-[10px] font-mono transition-all border border-transparent ${settings.kaleidoscopeSegments === seg ? 'bg-[#3253EE] text-white border-[#3253EE]/50 shadow-[0_0_10px_rgba(50,83,238,0.5)]' : 'text-gray-500 hover:text-white hover:bg-gray-900'}`}
                            >
                                {seg === 0 ? 'OFF' : `${seg}X`}
                            </button>
                        ))}
                    </div>
                </div>
                
                <Slider label="Zoom / Scale" value={settings.zoom} min={0.1} max={5.0} unit="x" onChange={(v: number) => update('zoom', v)} />
                <Slider label="Rotation" value={settings.rotation} min={0} max={360} unit="°" onChange={(v: number) => update('rotation', v)} />
                
                <div className="grid grid-cols-2 gap-4 mt-2">
                     <Slider label="Shift X" value={settings.shiftX} min={-100} max={100} unit="%" onChange={(v: number) => update('shiftX', v)} />
                     <Slider label="Shift Y" value={settings.shiftY} min={-100} max={100} unit="%" onChange={(v: number) => update('shiftY', v)} />
                </div>
            </Section>

            <Section title="Distortion Engine" icon={Cpu}>
                <Slider label="Glitch X (Horiz)" value={settings.distortionX} min={0} max={100} onChange={(v: number) => update('distortionX', v)} />
                <Slider label="Glitch Y (Vert)" value={settings.distortionY} min={0} max={100} onChange={(v: number) => update('distortionY', v)} />
                <Slider label="Pixel Stretch" value={settings.pixelSortThreshold} min={0} max={100} onChange={(v: number) => update('pixelSortThreshold', v)} />
                <Slider label="Signal Noise" value={settings.noiseAmount} min={0} max={100} onChange={(v: number) => update('noiseAmount', v)} />
                <Slider label="Scanlines" value={settings.scanlines} min={0} max={20} onChange={(v: number) => update('scanlines', v)} />
            </Section>

            <Section title="Color Matrix" icon={Palette}>
                <Slider label="Brand Mix" value={settings.colorMix} min={0} max={100} unit="%" onChange={(v: number) => update('colorMix', v)} />
                <Slider label="Lime Accent" value={settings.limeAccent} min={0} max={100} unit="%" onChange={(v: number) => update('limeAccent', v)} />
                <Slider label="Contrast" value={settings.contrast} min={0} max={200} onChange={(v: number) => update('contrast', v)} />
                <Slider label="Brightness" value={settings.brightness} min={0} max={200} onChange={(v: number) => update('brightness', v)} />
            </Section>

            <Section title="Branding Layer" icon={Layers}>
                <div className="grid grid-cols-2 gap-2 mb-6">
                     {[
                         {id: 'none', label: 'Hidden'},
                         {id: 'watermark', label: 'Overlay'},
                         {id: 'mask-positive', label: 'Fill Logo'},
                         {id: 'mask-negative', label: 'Fill BG'},
                     ].map(mode => (
                         <button
                            key={mode.id}
                            onClick={() => update('logoOverlay', mode.id)}
                            className={`p-3 text-[9px] font-mono border uppercase transition-all flex flex-col items-center justify-center gap-1 ${settings.logoOverlay === mode.id ? 'border-[#3253EE] bg-[#3253EE] text-white shadow-[0_0_15px_rgba(50,83,238,0.3)]' : 'border-gray-800 bg-[#0F0F0F] text-gray-500 hover:border-gray-600 hover:text-white'}`}
                         >
                             <Aperture size={12} className={settings.logoOverlay === mode.id ? 'opacity-100' : 'opacity-30'} />
                             {mode.label}
                         </button>
                     ))}
                </div>
                 <Slider label="Logo Scale" value={settings.logoScale} min={0.1} max={2.0} onChange={(v: number) => update('logoScale', v)} />
            </Section>

            <button 
                onClick={onDownload}
                className="w-full bg-[#3253EE] hover:bg-[#203bc4] text-white font-bold py-5 px-6 flex items-center justify-center gap-3 transition-all mt-4 font-display uppercase tracking-widest border border-white/10 hover:border-white/30 hover:shadow-[0_0_30px_rgba(50,83,238,0.5)] group relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_3s_linear_infinite]"></div>
                <Download size={20} className="group-hover:animate-bounce z-10" />
                <span className="z-10">GENERATE .PNG</span>
            </button>
            
             <div className="mt-12 text-center opacity-40">
                <div className="flex justify-center gap-1 mb-2">
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                </div>
                <p className="text-[9px] font-mono tracking-[0.2em] text-[#3253EE]">TSEKH CORP. V-LABS</p>
            </div>
        </div>
    );
}