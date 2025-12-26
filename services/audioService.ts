
// A pure Web Audio API synthesizer for UI sound effects
// No external assets required - 100% procedural

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let activeLoop: { stop: () => void } | null = null;

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
        vibrate(10); 

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
    } catch (e) { }
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
        vibrate([30, 30, 50]); 

        const { ctx, master } = initAudio();
        if (!ctx || !master) return;

        // Stop any existing loop
        if (activeLoop) {
            activeLoop.stop();
            activeLoop = null;
        }

        // 1. Low rumble (Turbine)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(50, ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 5.0);
        
        gain1.gain.setValueAtTime(0, ctx.currentTime);
        gain1.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 1.0);

        // 2. Pulse modulation
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 10;
        lfoGain.gain.value = 0.1;
        lfo.connect(lfoGain);
        lfoGain.connect(gain1.gain);

        // 3. High pitch sweep
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(400, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 10.0);

        gain2.gain.setValueAtTime(0, ctx.currentTime);
        gain2.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 2.0);

        osc1.connect(gain1);
        gain1.connect(master);
        osc2.connect(gain2);
        gain2.connect(master);

        osc1.start();
        osc2.start();
        lfo.start();

        activeLoop = {
            stop: () => {
                const now = ctx.currentTime;
                gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                osc1.stop(now + 0.5);
                osc2.stop(now + 0.5);
                lfo.stop(now + 0.5);
            }
        };
    } catch (e) { }
};

export const stopHyperspaceLoop = () => {
    if (activeLoop) {
        activeLoop.stop();
        activeLoop = null;
    }
};

export const playSuccess = () => {
    try {
        stopHyperspaceLoop();
        vibrate([50, 50, 50]); 

        const { ctx, master } = initAudio();
        if (!ctx || !master) return;

        const notes = [523.25, 659.25, 783.99, 987.77]; 
        
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
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
        
    } catch (e) { }
};

export const playError = () => {
    try {
        stopHyperspaceLoop();
        vibrate([50, 100, 50]); 

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
