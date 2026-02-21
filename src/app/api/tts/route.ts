import { NextResponse } from 'next/server';
import { generateWithFailover } from '@/lib/gemini';

export async function POST(req: Request) {
    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        const sarvamApiKey = process.env.SARVAM_API_KEY;

        if (!sarvamApiKey) {
            return NextResponse.json({ error: 'SARVAM_API_KEY is not configured in .env.local' }, { status: 500 });
        }

        // 1. Ask Gemini to clean the text for TTS, detect language and configure emotion
        const prompt = `You are an expert TTS script preparer. Produce an optimized script and parameters.
Original Text: "${text.slice(0, 3000)}"

Instructions for "cleaned_text":
1. Readability: Remove all markdown (*, #, _, [, ], etc).
2. Mathematics: Convert ALL numbers, fractions, and math symbols into natural spoken words (e.g., "1/2" -> "one half", "15" -> "fifteen", "3/4" -> "three fourths").
3. Punctuation: DO NOT spell out punctuation. Never say words like "parenthesis", "bracket", or "asterisk". Remove brackets/parentheses completely and replace with natural conversational commas/pauses.
4. Smoothness: Ensure the text reads as a fluid, conversational sentence without weird robotic interruptions.

Instructions for parameters:
1. "language": "hi-IN" if there is ANY Hindi or Hinglish, otherwise "en-IN".
2. "emotion": The emotional tone (e.g. "cheerful", "calm").
3. "pace": float between 0.85 and 1.25.

Return STRICTLY valid JSON with exact keys: "cleaned_text" (string), "language" (string), "emotion" (string), "pace" (number).`;

        let ttsParams = { cleaned_text: text.slice(0, 3000).replace(/[*#\(\)\[\]_]/g, ''), language: "en-IN", emotion: "neutral", pace: 1.0 };
        try {
            const result = await generateWithFailover({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            });
            const parsed = JSON.parse(result.response.text());
            ttsParams = { ...ttsParams, ...parsed };
            console.log("🎙️ Detected TTS Params/Cleaned Text:", Object.keys(ttsParams));
        } catch (e) {
            console.warn("TTS Emotion/Clean detection failed, falling back to defaults", e);
        }

        // 2. Chunk text and prepare concurrent Sarvam TTS calls to bypass 500-char limits
        const chunks: string[] = [];
        let currentChunk = "";
        const rawSentences = ttsParams.cleaned_text.match(/[^.?!,\n]+[.?!,\n]*/g) || [ttsParams.cleaned_text];
        const sentences = rawSentences.map((s: string) => s.trim()).filter((s: string) => s.length > 0);

        for (const sentence of sentences) {
            let parts = [sentence];
            if (sentence.length > 450) {
                const words = sentence.split(" ");
                let tempPart = "";
                parts = [];
                for (const word of words) {
                    if (tempPart.length + word.length > 450) {
                        parts.push(tempPart.trim());
                        tempPart = word;
                    } else {
                        tempPart += (tempPart ? " " : "") + word;
                    }
                }
                if (tempPart) parts.push(tempPart.trim());
            }

            for (const part of parts) {
                if (currentChunk.length + part.length > 450) {
                    if (currentChunk) chunks.push(currentChunk.trim());
                    currentChunk = part;
                } else {
                    currentChunk += (currentChunk ? " " : "") + part;
                }
            }
        }
        if (currentChunk) chunks.push(currentChunk.trim());

        if (chunks.length === 0) {
            return NextResponse.json({ error: 'No text to speak' }, { status: 400 });
        }

        // Send all requests to Sarvam concurrently!
        const audioPromises = chunks.map(async (chunk) => {
            const response = await fetch('https://api.sarvam.ai/text-to-speech', {
                method: 'POST',
                headers: {
                    'api-subscription-key': sarvamApiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputs: [chunk],
                    target_language_code: ttsParams.language || "hi-IN",
                    speaker: "ishita",
                    pace: ttsParams.pace || 1.0,
                    speech_sample_rate: 8000,
                    enable_preprocessing: true,
                    model: "bulbul:v3"
                }),
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Sarvam API error: ${response.statusText} - ${errorData}`);
            }

            const data = await response.json();
            return data.audios[0];
        });

        const base64Audios = await Promise.all(audioPromises);

        // Return a JSON array of all audio nodes instead of streaming a Blob
        return NextResponse.json({ audios: base64Audios });

    } catch (error: any) {
        console.error("TTS API Route Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
