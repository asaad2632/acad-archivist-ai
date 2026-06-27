import { GEMINI_API_KEY, GROQ_API_KEY, getSelectedModel } from "./config";
import { supabase } from "./integrations/supabase/client";

// Unified AI call. Accepts Anthropic-style body and returns Anthropic-shaped response:
// { content: [{ type: "text", text: "..." }] }
export async function callLLM({ system, messages = [], max_tokens = 1024 } = {}) {
  const model = getSelectedModel();
  try {
    let text = "";
    if (model === "gemini") {
      text = await callGemini({ system, messages, max_tokens });
    } else if (model === "groq") {
      text = await callGroq({ system, messages, max_tokens });
    } else {
      text = await callLovable({ system, messages, max_tokens });
    }
    return { content: [{ type: "text", text }] };
  } catch (err) {
    console.error("[callLLM]", model, err);
    return { content: [{ type: "text", text: `حدث خطأ في الاتصال بنموذج (${model}): ${err.message || err}` }] };
  }
}

async function callGemini({ system, messages, max_tokens }) {
  if (!GEMINI_API_KEY) throw new Error("VITE_GEMINI_API_KEY غير مهيّأ");
  const contents = messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: typeof m.content === "string" ? m.content : JSON.stringify(m.content) }],
  }));
  const body = {
    contents,
    generationConfig: { maxOutputTokens: max_tokens, temperature: 0.7 },
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
}

async function callGroq({ system, messages, max_tokens }) {
  if (!GROQ_API_KEY) throw new Error("VITE_GROQ_API_KEY غير مهيّأ");
  const msgs = [];
  if (system) msgs.push({ role: "system", content: system });
  for (const m of messages) {
    msgs.push({
      role: m.role === "assistant" ? "assistant" : "user",
      content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
    });
  }
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: msgs,
      max_tokens,
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || "";
}

async function callLovable({ system, messages, max_tokens }) {
  const { data, error } = await supabase.functions.invoke("ai-chat", {
    body: { system, messages, max_tokens },
  });
  if (error) throw new Error(error.message || String(error));
  if (data?.error) throw new Error(data.error);
  return data?.content?.[0]?.text || "";
}
