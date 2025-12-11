
# Nebula AI Art Generator

**Next-Gen Interface for Google Gemini & Veo**

Nebula is a futuristic, high-performance web application designed to unleash the power of Google's latest Generative AI models. It combines a sci-fi aesthetic with professional-grade controls for Image and Video generation.

![Nebula UI Preview](https://ibb.co/VcyKNhNy) 


## 🚀 Key Features

### 🎨 AI Engines
*   **Gemini 3.0 Pro (Image)**: High-fidelity image synthesis with complex reasoning capabilities.
*   **Gemini 2.5 Flash**: Lightning-fast generation for rapid iteration and live previews.
*   **Veo 3.1 (Video)**: State-of-the-art Text-to-Video and Image-to-Video capabilities.
*   **Imagen 4**: Support for Google's dedicated high-quality image generation model.

### 🧠 Smart Prompting
*   **Magic Enhance**: One-click prompt engineering. Turns simple inputs (e.g., "A cat") into highly detailed, professional artistic descriptions using Gemini's reasoning capabilities.
*   **The Stylenator**:
    *   **Smart Match**: AI analyzes your text and automatically selects the best art style (e.g., detects "neon" → switches to Cyberpunk).
    *   **Surprise**: Random style generation.
*   **Voice Command**: Integrated Speech-to-Text for hands-free prompting.
*   **Context-Aware Randomizer**: The "Surprise Me" (Dice) button intelligently generates prompts specific to the active mode (Video prompts vs Image prompts).
*   **Templates**: Create, save, and reuse prompt structures with dynamic placeholders (e.g., `A [style] portrait of [subject]`).

### 🎛️ Advanced Controls
*   **Quantum Mode**: A "Pro" toggle that engages maximum fidelity settings (150 steps, strict guidance, 4K resolution) for "Hall of Fame" quality results.
*   **Live Preview**: Generates low-res drafts in real-time as you type to visualize concepts instantly.
*   **Parametric Control**: Fine-tune Guidance Scale, Inference Steps, Seed, and Quality.
*   **Reference Inputs**: 
    *   **Image-to-Image**: Upload references to guide composition.
    *   **Image-to-Video**: Upload a static image to animate it using Veo.

### 🌌 Immersive Experience
*   **Hyperspace Engine**: Interactive particle background system that accelerates into warp speed during generation.
*   **Neural Link**: The AI analyzes your generated images to write immersive sci-fi lore or backstories.
*   **Audio Feedback**: Procedural sound effects for clicks, success states, and power-ups.
*   **Holographic UI**: 3D tilt effects on cards and glassmorphism elements.
*   **Dual Themes**: Switch between "Nebula Dark" (Sci-fi) and "Starlight Light" (Clean).

### 💾 Gallery & Storage
*   **Local Gallery**: Persists images and videos using IndexedDB (browser storage) so you don't lose your work on refresh.
*   **Prompt History**: Auto-saves your recent creative history for quick recall.
*   **Upscaling**: Simulated 4K upscaling pipeline using Gemini Pro's image-to-image capabilities.

## 🛠️ Tech Stack
*   **Framework**: React 19
*   **Build Tool**: Vite
*   **Styling**: Tailwind CSS
*   **AI SDK**: Google GenAI SDK (`@google/genai`)
*   **Storage**: IDB (IndexedDB Wrapper)
*   **Icons**: Lucide React

## 📦 Getting Started

1. **Clone the repository**
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Run development server**:
   ```bash
   npm run dev
   ```
4. **Connect API Key**: 
   Launch the app and enter your Google Cloud API Key (with Vertex AI/Gemini API access enabled) in the settings or startup screen.

---

*Powered by Google Gemini & Veo*
