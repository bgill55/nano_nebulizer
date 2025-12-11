
// A pure Web Audio API synthesizer for UI sound effects
// No external assets required - 100% procedural

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;

const initAudio = () => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        masterGain = audioContext.createGain();
        masterGain.gain.value = 0.15; // Keep it subtle, don't blow out ears
        masterGain.connect(audioContext.destination);
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    return { ctx: audioContext, master: masterGain };
};

// Helper for Haptics
const vibrate = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
};

export const playClick = (pitch: number = 800) => {
    try {
        vibrate(10); // Short tick

        const { ctx, master } = initAudio();
        if (!ctx || !master) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(pitch, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(pitch * 0.5, ctx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(master);

        osc.start();
        osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
        // Audio not supported or blocked
    }
};

export const playHover = () => {
    try {
        const { ctx, master } = initAudio();
        if (!ctx || !master) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(master);

        osc.start();
        osc.stop(ctx.currentTime + 0.05);
    } catch (e) { }
};

export const playPowerUp = () => {
    try {
        vibrate([30, 30, 50]); // Revving engine feeling

        const { ctx, master } = initAudio();
        if (!ctx || !master) return;

        // 1. Low rumble (Turbine)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(50, ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 2.0);
        
        gain1.gain.setValueAtTime(0, ctx.currentTime);
        gain1.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.5);
        gain1.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.5);

        // 2. High pitch sweep (Capacitor charge)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(200, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 2.5);

        gain2.gain.setValueAtTime(0, ctx.currentTime);
        gain2.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 1.0);
        gain2.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.5);

        // Connect
        osc1.connect(gain1);
        gain1.connect(master);
        osc2.connect(gain2);
        gain2.connect(master);

        osc1.start();
        osc2.start();
        
        osc1.stop(ctx.currentTime + 2.5);
        osc2.stop(ctx.currentTime + 2.5);
    } catch (e) { }
};

export const playSuccess = () => {
    try {
        vibrate([50, 50, 50]); // Success pulse

        const { ctx, master } = initAudio();
        if (!ctx || !master) return;

        // Major Chord Arpeggio (C Major 7: C, E, G, B)
        const notes = [523.25, 659.25, 783.99, 987.77]; // C5, E5, G5, B5
        
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            // Stagger start times for arpeggio effect
            const startTime = ctx.currentTime + (i * 0.05);
            const duration = 1.5;

            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.2, startTime + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc.connect(gain);
            gain.connect(master);

            osc.start(startTime);
            osc.stop(startTime + duration);
        });
        
        // Sparkle overlay
        const oscNoise = ctx.createOscillator();
        const gainNoise = ctx.createGain();
        oscNoise.type = 'triangle';
        oscNoise.frequency.setValueAtTime(2000, ctx.currentTime);
        oscNoise.frequency.linearRampToValueAtTime(3000, ctx.currentTime + 0.5);
        
        gainNoise.gain.setValueAtTime(0.05, ctx.currentTime);
        gainNoise.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
        
        oscNoise.connect(gainNoise);
        gainNoise.connect(master);
        oscNoise.start();
        oscNoise.stop(ctx.currentTime + 0.5);

    } catch (e) { }
};

export const playError = () => {
    try {
        vibrate([50, 100, 50]); // Error buzz

        const { ctx, master } = initAudio();
        if (!ctx || !master) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.3);

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(master);

        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    } catch (e) { }
};
