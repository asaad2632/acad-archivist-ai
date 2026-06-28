// Default keys provided by the project owner. import.meta.env.VITE_* overrides them when set.
const DEFAULT_GEMINI_KEY = "AQ.Ab8RN6Il6Mk7lgY5Yj0zEUz5caQXmrK-LWRjJlvraOuXSAqgzZQ";
const DEFAULT_GROQ_KEY   = "Gsk_nZQGBBtoEK3oi4LRK8L3WGdyb3FYtfpHMPoiro51xEid2Vmb05es";

export const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || "";
export const GEMINI_API_KEY    = import.meta.env.VITE_GEMINI_API_KEY    || DEFAULT_GEMINI_KEY;
export const GROQ_API_KEY      = import.meta.env.VITE_GROQ_API_KEY      || DEFAULT_GROQ_KEY;

export const AI_MODELS = [
  { id: "openrouter", label: "Llama 4 Maverick (OpenRouter)" },
  { id: "lovable",    label: "Lovable Cloud (AI Gateway)" },
  { id: "gemini",     label: "Gemini 1.5 Flash (Google)" },
  { id: "groq",       label: "Llama 3 (Groq)" },
];

export const MODEL_STORAGE_KEY = "acadarchiv_ai_model";
export function getSelectedModel() {
  try {
    const v = localStorage.getItem(MODEL_STORAGE_KEY);
    if (v && AI_MODELS.some(m => m.id === v)) return v;
  } catch {}
  return "openrouter";
}
export function setSelectedModel(id) {
  try { localStorage.setItem(MODEL_STORAGE_KEY, id); } catch {}
}
