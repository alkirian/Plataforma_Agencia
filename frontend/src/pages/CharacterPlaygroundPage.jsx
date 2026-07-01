import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Smile, 
  Sparkles, 
  Glasses, 
  Headphones, 
  Crown, 
  Palette, 
  Terminal, 
  HelpCircle, 
  Maximize2,
  Footprints,
  HandMetal,
  Shapes
} from 'lucide-react';
import { InteractiveGSAPCharacter } from '../components/ui';

export const CharacterPlaygroundPage = () => {
  const navigate = useNavigate();
  const characterActionRef = useRef(null);
  
  // Active character preset
  const [preset, setPreset] = useState('bloop');

  // Manual override states
  const [emotion, setEmotion] = useState('happy');
  const [theme, setTheme] = useState('');
  const [size, setSize] = useState('lg');
  const [accessories, setAccessories] = useState(null);

  // Log events
  const [logs, setLogs] = useState([
    { id: 1, time: new Date().toLocaleTimeString(), text: 'System initialized. Ready for GSAP animations.' },
    { id: 2, time: new Date().toLocaleTimeString(), text: 'Squircle base shape unified across all roster presets.' }
  ]);

  const addLog = (text) => {
    setLogs((prev) => [
      { id: Date.now() + Math.random(), time: new Date().toLocaleTimeString(), text },
      ...prev.slice(0, 14) // Keep last 15 logs
    ]);
  };

  // Character profiles (all unified as squircles with unique face details)
  const characterRoster = [
    {
      id: 'bloop',
      name: 'Bloop',
      title: 'Líquido Bouncy 🫧',
      desc: 'Energético y juguetón. Ojos de anime brillantes y boca feliz con lengüita. Emite burbujas al tocarlo.',
      colors: 'from-violet-500 via-fuchsia-500 to-pink-500',
      specs: 'Ojos anime con doble brillo. Boca abierta y auriculares retro. Emisión de burbujas en click.'
    },
    {
      id: 'daisy',
      name: 'Daisy',
      title: 'Flor Creativa 🌸',
      desc: 'Dreamy y artística. Ojos curvos sonrientes, sonrisa felina y pétalos giratorios detrás de su cuerpo.',
      colors: 'from-emerald-400 via-teal-400 to-cyan-500',
      specs: 'Rotación orbital GSAP (360°) en pétalos externos. Ojos ^_^ y sonrisa w. Emana destellos.'
    },
    {
      id: 'hearty',
      name: 'Hearty',
      title: 'Corazón Tierno 💖',
      desc: 'Amoroso y tímido. Ojos de corazón y lengüita burlona. Su cuerpo late constantemente. Emite corazones.',
      colors: 'from-amber-400 via-orange-400 to-rose-400',
      specs: 'Timeline de latido doble (fístole/diástole a 1.6s). Ojos de corazón y emisión de corazones.'
    },
    {
      id: 'cloudy',
      name: 'Cloudy',
      title: 'Nube Dormilona ☁️',
      desc: 'Perezoza y tranquila. Ojos dormidos, boca bostezando y halo neon. Emite Zzzs perezosos flotando.',
      colors: 'from-indigo-900 via-purple-700 to-blue-500',
      specs: 'Desplazamiento lento (3.8s) y ojos -_-. Emite Zzzs cíclicos en el aire de forma pasiva.'
    },
    {
      id: 'chatter',
      name: 'Chatter',
      title: 'Burbuja Charlona 💬',
      desc: 'Inteligente y habladora. Anteojos redondos de lectura y sonrisa pícara. Se balancea al mover el mouse.',
      colors: 'from-yellow-400 via-amber-400 to-orange-400',
      specs: 'Inclinación de balanceo angular extra sensible. Anteojos de pasta y sonrisa ondulada.'
    }
  ];

  const activeProfile = characterRoster.find(c => c.id === preset) || characterRoster[0];

  const handlePresetSelect = (presetId) => {
    setPreset(presetId);
    // Reset overrides when changing presets to let them show their default personalities
    setEmotion(presetId === 'cloudy' ? 'sleeping' : 'happy');
    setTheme('');
    setAccessories(null);
    addLog(`[System] Switched to character preset '${presetId.toUpperCase()}'`);
  };

  const handleAccessoryToggle = (key) => {
    // If override state is null, clone preset defaults first
    const currentAcc = accessories || {
      headphones: preset === 'bloop',
      glasses: preset === 'chatter',
      halo: preset === 'cloudy',
      arms: preset !== 'hearty',
      feet: !['hearty'].includes(preset)
    };
    
    const updated = { ...currentAcc, [key]: !currentAcc[key] };
    setAccessories(updated);
    addLog(`[Config] Override accessory '${key}': ${updated[key] ? 'ON' : 'OFF'}`);
  };

  const handleEmotionChange = (newEmotion) => {
    setEmotion(newEmotion);
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    addLog(`[Config] Theme override: '${newTheme}'`);
  };

  const handleSizeChange = (newSize) => {
    setSize(newSize);
    addLog(`[Config] Size adjusted: '${newSize}'`);
  };

  const triggerWave = () => {
    if (characterActionRef.current) {
      characterActionRef.current.wave();
    }
  };

  // Resolve current active state helpers for UI buttons
  const resolvedAccessories = accessories || {
    headphones: preset === 'bloop',
    glasses: preset === 'chatter',
    halo: preset === 'cloudy',
    arms: preset !== 'hearty',
    feet: !['hearty'].includes(preset)
  };

  const resolvedTheme = theme || (preset === 'bloop' ? 'cyber' : preset === 'daisy' ? 'mint' : preset === 'hearty' ? 'peach' : preset === 'cloudy' ? 'nebula' : 'sun');

  return (
    <div className="min-h-screen bg-[#07070E] text-slate-100 p-4 md:p-8 flex flex-col items-center relative overflow-hidden font-sans">
      
      {/* Background ambient grids & shapes */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-slate-950/90 to-black pointer-events-none z-0" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-fuchsia-600/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/5 blur-[150px] rounded-full pointer-events-none" />

      {/* ================= HEADER ================= */}
      <header className="w-full max-w-6xl flex items-center justify-between mb-6 z-10">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer shadow-lg backdrop-blur-md"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Dashboard
        </button>

        <div className="text-right">
          <div className="text-[10px] font-black tracking-[0.25em] text-violet-400 uppercase">
            Módulo Experimental GSAP
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Character Sandbox: <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 font-extrabold">Bloop & Friends</span>
          </h1>
        </div>
      </header>

      {/* ================= CHARACTER PRESET DECK ================= */}
      <section className="w-full max-w-6xl mb-8 z-10">
        <h2 className="text-xs font-black tracking-[0.25em] text-slate-400 uppercase mb-3">
          Elige un Personaje Squircle (Roster)
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          {characterRoster.map((char) => {
            const isActive = preset === char.id;
            return (
              <button
                key={char.id}
                onClick={() => handlePresetSelect(char.id)}
                className={`p-4 rounded-2xl border text-left flex flex-col gap-2 relative transition-all duration-300 cursor-pointer backdrop-blur-md ${
                  isActive
                    ? 'bg-slate-900/80 border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.25)] scale-[1.02]'
                    : 'bg-slate-950/30 border-white/5 hover:bg-white/5 hover:border-white/10'
                }`}
              >
                {/* Active Light Dot */}
                {isActive && (
                  <span className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                  </span>
                )}

                {/* Character preview rounded square */}
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-r ${char.colors} shadow-md`} />
                
                <div>
                  <h3 className="font-extrabold text-sm text-slate-100">{char.name}</h3>
                  <div className="text-[10px] text-violet-300 font-semibold">{char.title}</div>
                </div>
                
                <p className="text-[10px] text-slate-400 leading-normal line-clamp-2">
                  {char.desc}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* ================= MAIN CONTENT GRID ================= */}
      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 z-10 items-stretch">
        
        {/* LEFT: CHARACTER INTERACTIVE AREA (7/12) */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Character Container Box */}
          <div className="flex-1 min-h-[420px] bg-slate-950/40 border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden group shadow-2xl backdrop-blur-md">
            
            {/* Grid Pattern BG */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
            
            {/* Ambient instructions */}
            <div className="absolute top-4 left-4 flex items-center gap-1.5 text-xs text-slate-500 pointer-events-none">
              <Maximize2 className="w-3.5 h-3.5" />
              Mové el mouse para interactuar • Click para apretar
            </div>

            {/* Mount the character component */}
            <InteractiveGSAPCharacter
              preset={preset}
              emotion={emotion}
              theme={resolvedTheme}
              size={size}
              accessories={resolvedAccessories}
              onAction={addLog}
              actionRef={characterActionRef}
              className="transition-transform duration-300"
            />
          </div>

          {/* Retro Logs Console */}
          <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 font-mono text-[11px] shadow-lg backdrop-blur-md flex flex-col h-44">
            <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2 text-slate-400 font-bold uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-violet-400" />
                GSAP Animation Console Logs
              </div>
              <button 
                onClick={() => setLogs([])}
                className="text-[9px] px-2 py-0.5 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 transition-all cursor-pointer"
              >
                Clear
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-white/10 pr-2">
              {logs.length === 0 ? (
                <div className="text-slate-600 italic">No animation logs captured yet. Move mouse or toggle states.</div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex gap-2">
                    <span className="text-slate-500">[{log.time}]</span>
                    <span className={
                      log.text.includes('Blink triggered') ? 'text-violet-400 font-bold' : 
                      log.text.includes('Squished') ? 'text-rose-400 font-bold' : 
                      log.text.includes('[Limbs]') ? 'text-cyan-400 font-bold' :
                      log.text.includes('[Config]') ? 'text-slate-400' :
                      'text-amber-400 font-semibold'
                    }>
                      {log.text}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* RIGHT: CONTROLS & DOCUMENTATION (5/12) */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Controls Panel */}
          <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-5">
            <div className="border-b border-white/5 pb-2 flex items-center justify-between">
              <h2 className="text-sm font-extrabold tracking-widest text-slate-400 uppercase">
                Panel de {activeProfile.name}
              </h2>
              <div className="text-[10px] bg-violet-600/20 text-violet-300 px-2 py-0.5 rounded-md font-extrabold uppercase">
                {preset}
              </div>
            </div>

            {/* 1. EMOTION SELECTOR */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Smile className="w-3.5 h-3.5 text-fuchsia-400" />
                Expresión y Posturas
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'happy', label: 'Feliz 😊' },
                  { id: 'excited', label: 'Excited 🤩' },
                  { id: 'surprised', label: 'Sorpresa 😮' },
                  { id: 'thinking', label: 'Pensando 🤔' },
                  { id: 'sleeping', label: 'Dormido 😴' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleEmotionChange(item.id)}
                    className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      emotion === item.id
                        ? 'bg-violet-600/25 border-violet-500 text-violet-300 shadow-md'
                        : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/10'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Wave Hand Button */}
              {resolvedAccessories.arms && (
                <button
                  onClick={triggerWave}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 border border-violet-400/20 shadow-lg shadow-violet-950/20 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <HandMetal className="w-4 h-4 animate-bounce" />
                  Pedirle que Salude 👋
                </button>
              )}
            </div>

            {/* 2. BASE SHAPE INFO */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Shapes className="w-3.5 h-3.5 text-amber-400" />
                Forma de Cuerpo Base Unificada
              </label>
              <div className="p-3 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-500 border border-white/10 shadow-lg flex-shrink-0 animate-pulse" />
                <div className="text-xs leading-snug">
                  <strong className="text-slate-200 block font-bold">Squircle (Cubo Redondeado)</strong>
                  <span className="text-slate-400 text-[11px]">Todos los personajes comparten la forma de cubo con morphing de border-radius orgánico.</span>
                </div>
              </div>
            </div>

            {/* 3. ACCESSORIES SELECTOR */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-cyan-400" />
                Accesorios & Extremidades
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'arms', label: 'Bracitos 👋', icon: HandMetal },
                  { id: 'feet', label: 'Patitas 👣', icon: Footprints },
                  { id: 'headphones', label: 'Auriculares 🎧', icon: Headphones },
                  { id: 'glasses', label: 'Anteojos 👓', icon: Glasses },
                  { id: 'halo', label: 'Halo Neon 😇', icon: Sparkles }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = resolvedAccessories[item.id];
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleAccessoryToggle(item.id)}
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[10px] font-extrabold transition-all border cursor-pointer ${
                        isActive
                          ? 'bg-fuchsia-600/25 border-fuchsia-500 text-fuchsia-300 shadow-md'
                          : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. THEME SELECTOR */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-emerald-400" />
                Paleta de Color (Gradient)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'cyber', label: 'Cyber Neon', colors: 'from-violet-500 to-pink-500' },
                  { id: 'peach', label: 'Sweet Peach', colors: 'from-amber-400 to-rose-500' },
                  { id: 'mint', label: 'Forest Mint', colors: 'from-emerald-400 to-cyan-500' },
                  { id: 'nebula', label: 'Nebula Dusk', colors: 'from-indigo-900 to-purple-600' },
                  { id: 'sun', label: 'Golden Sun', colors: 'from-yellow-400 to-orange-400' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleThemeChange(item.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      resolvedTheme === item.id
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-md'
                        : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/10'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${item.colors}`} />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. SIZE SELECTOR */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                Tamaño
              </label>
              <div className="flex gap-2">
                {['sm', 'md', 'lg', 'xl'].map((item) => (
                  <button
                    key={item}
                    onClick={() => handleSizeChange(item)}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold uppercase transition-all border cursor-pointer ${
                      size === item
                        ? 'bg-indigo-600/25 border-indigo-500 text-indigo-300 shadow-md'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Quick Explanation */}
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-4">
            <h2 className="text-sm font-extrabold tracking-widest text-slate-400 uppercase flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-violet-400" />
              Upgrades de {activeProfile.name}
            </h2>
            <div className="text-xs text-slate-400 space-y-2 leading-relaxed">
              <p className="font-bold text-slate-200">{activeProfile.title}</p>
              <p>{activeProfile.specs}</p>
              <ul className="list-disc pl-4 space-y-1.5 mt-2">
                <li>
                  <strong className="text-slate-200">Sombra 3D Flotante:</strong> Se escala y difumina de forma inversa al floats del personaje para simular profundidad física en tiempo real.
                </li>
                <li>
                  <strong className="text-slate-200">Emisor de Partículas GSAP:</strong> Al hacer click o flotar de forma pasiva, spawnean burbujas, destellos, corazones y Zzzs que se elevan y disuelven automáticamente.
                </li>
                <li>
                  <strong className="text-slate-200">Inercia en Extremidades:</strong> Los bracitos y patitas se desvían elásticamente según la velocidad y posición de tu cursor.
                </li>
              </ul>
            </div>
          </div>

        </section>

      </main>

    </div>
  );
};
