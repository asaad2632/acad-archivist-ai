export const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || "";
export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
export const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";

export const AI_MODELS = [
  { id: "gemini", label: "Gemini 1.5 Flash (Google)" },
  { id: "groq",   label: "Llama 3 (Groq)" },
  { id: "lovable", label: "Lovable Cloud (AI Gateway)" },
];

export const MODEL_STORAGE_KEY = "acadarchiv_ai_model";
export function getSelectedModel() {
  try {
    const v = localStorage.getItem(MODEL_STORAGE_KEY);
    if (v && AI_MODELS.some(m => m.id === v)) return v;
  } catch {}
  return "gemini";
}
export function setSelectedModel(id) {
  try { localStorage.setItem(MODEL_STORAGE_KEY, id); } catch {}
}
