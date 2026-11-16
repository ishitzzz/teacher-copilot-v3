import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

// ====================================================================
// MULTI-KEY GEMINI FAILOVER ENGINE
// ====================================================================
// Uses 3 API keys × 2 models = 6 total model slots.
// Cycle order: Key1-Flash → Key2-Flash → Key3-Flash →
//              Key1-Lite  → Key2-Lite  → Key3-Lite
// If a call fails (rate limit, quota, network), we instantly try the
// next slot. A cooldown is tracked per-slot so we don't re-hit a
// rate-limited key too quickly.
// ====================================================================

const API_KEYS = [
    process.env.GEMINI_API_KEY || "",
    process.env.GEMINI_API_KEY_2 || "",
    process.env.GEMINI_API_KEY_3 || "",
].filter((k) => k.length > 0);

if (API_KEYS.length === 0) {
    console.error("⚠️  No GEMINI_API_KEY found in environment variables!");
}

// --- Build the client pool ---
interface ModelSlot {
    client: GoogleGenerativeAI;
    modelName: string;
    keyIndex: number;
    cooldownUntil: number; // epoch-ms — skip this slot until then
    label: string;
}

function buildSlots(): ModelSlot[] {
    const slots: ModelSlot[] = [];

    // First pass: all keys × flash (primary)
    API_KEYS.forEach((key, i) => {
        slots.push({
            client: new GoogleGenerativeAI(key),
            modelName: "gemini-3.5-flash",
            keyIndex: i,
            cooldownUntil: 0,
            label: `Key${i + 1}/gemini-3.5-flash`,
        });
    });

    // Second pass: all keys × flash-lite (fallback)
    API_KEYS.forEach((key, i) => {
        slots.push({
            client: new GoogleGenerativeAI(key),
            modelName: "gemini-3.5-flash-lite",
            keyIndex: i,
            cooldownUntil: 0,
            label: `Key${i + 1}/gemini-3.5-flash-lite`,
        });
    });

    return slots;
}

const MODEL_SLOTS = buildSlots();

// Cooldown period (ms) when a slot hits a rate limit / error
const COOLDOWN_MS = 60_000; // 1 minute

// Round-robin index so we spread load evenly
let nextSlotIndex = 0;

/**
 * Generate content with automatic multi-key, multi-model failover.
 *
 * Cycles through up to 6 model slots. If a slot is on cooldown or
 * throws an error, it moves to the next one immediately.
 *
 * @param options  — The same options object you'd pass to `model.generateContent()`
 * @param modelOverride — Optional: force a specific model name (e.g. for the agent route)
 */
export async function generateWithFailover(
    options: any,
    modelOverride?: string
): Promise<any> {
    const totalSlots = MODEL_SLOTS.length;
    const startIndex = nextSlotIndex;
    let lastError: any = null;

    for (let attempt = 0; attempt < totalSlots; attempt++) {
        const slotIndex = (startIndex + attempt) % totalSlots;
        const slot = MODEL_SLOTS[slotIndex];

        // Skip slots still on cooldown
        if (Date.now() < slot.cooldownUntil) {
            console.log(`⏳ Skipping ${slot.label} (cooldown active)`);
            continue;
        }

        try {
            const effectiveModel = modelOverride || slot.modelName;
            const model: GenerativeModel = slot.client.getGenerativeModel({
                model: effectiveModel,
            });

            console.log(`🔄 Trying ${slot.label}${modelOverride ? ` (override: ${modelOverride})` : ""}...`);
            const result = await model.generateContent(options);

            // Success — advance round-robin for next call
            nextSlotIndex = (slotIndex + 1) % totalSlots;
            console.log(`✅ Success on ${slot.label}`);
            return result;
        } catch (error: any) {
            const errMsg = error?.message || String(error);
            console.warn(`❌ ${slot.label} failed: ${errMsg.slice(0, 120)}`);

            // Set cooldown so we don't immediately retry this slot
            slot.cooldownUntil = Date.now() + COOLDOWN_MS;
            lastError = error;

            // Continue to next slot
        }
    }

    // All 6 slots exhausted
    throw new Error(
        `All ${totalSlots} Gemini model slots failed. Last error: ${lastError?.message || lastError}`
    );
}

/**
 * Get a raw GoogleGenerativeAI client for function-calling / chat mode.
 * Cycles through keys and returns the first available client + model name.
 * (Used by the agent route which needs startChat() etc.)
 */
export function getAvailableClient(): {
    client: GoogleGenerativeAI;
    modelName: string;
    label: string;
} {
    const now = Date.now();

    // Try to find a slot that's not on cooldown
    for (let attempt = 0; attempt < MODEL_SLOTS.length; attempt++) {
        const slotIndex = (nextSlotIndex + attempt) % MODEL_SLOTS.length;
        const slot = MODEL_SLOTS[slotIndex];

        if (now >= slot.cooldownUntil) {
            // Advance round-robin
            nextSlotIndex = (slotIndex + 1) % MODEL_SLOTS.length;
            return {
                client: slot.client,
                modelName: slot.modelName,
                label: slot.label,
            };
        }
    }

    // All on cooldown — just return the first one and hope for the best
    const slot = MODEL_SLOTS[0];
    return {
        client: slot.client,
        modelName: slot.modelName,
        label: slot.label,
    };
}

/**
 * Mark a specific client as rate-limited so the next call skips it.
 * Call this from the agent route catch block.
 */
export function markSlotCooldown(label: string) {
    const slot = MODEL_SLOTS.find((s) => s.label === label);
    if (slot) {
        slot.cooldownUntil = Date.now() + COOLDOWN_MS;
        console.log(`🧊 Marked ${label} on cooldown for ${COOLDOWN_MS / 1000}s`);
    }
}
