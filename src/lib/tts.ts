/**
 * Utility to generate speech via our Next.js API route that hooks into Sarvam AI.
 * 
 * @param text The text to be synthesized into speech
 * @param description Originally used for Maya, kept for component compatibility
 */

let currentAudioContext: { stopRequested: boolean, audioElement: HTMLAudioElement | null } | null = null;

export async function stopSpeech() {
    if (currentAudioContext) {
        currentAudioContext.stopRequested = true;
        if (currentAudioContext.audioElement) {
            currentAudioContext.audioElement.pause();
            currentAudioContext.audioElement.currentTime = 0;
        }
    }
}

export async function generateSpeech(text: string, description?: string): Promise<void> {
    try {
        await stopSpeech();

        const myContext = { stopRequested: false, audioElement: null as HTMLAudioElement | null };
        currentAudioContext = myContext;

        const response = await fetch('/api/tts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to generate speech`);
        }

        const data = await response.json();

        if (!data.audios) return;

        for (const base64Audio of data.audios) {
            if (myContext.stopRequested) break;

            const byteCharacters = atob(base64Audio);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const audioBlob = new Blob([byteArray], { type: 'audio/wav' });

            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            myContext.audioElement = audio;

            await new Promise((resolve) => {
                audio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                    resolve(null);
                };
                audio.onerror = () => {
                    URL.revokeObjectURL(audioUrl);
                    resolve(null);
                };
                audio.play().catch((e) => {
                    console.error("Playback interrupted:", e);
                    resolve(null);
                });
            });

            myContext.audioElement = null;
        }
    } catch (error) {
        console.error('Error in generateSpeech:', error);
    }
}
