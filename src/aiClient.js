import { getSelectedModel } from "./config";
import { supabase } from "./integrations/supabase/client";

// Unified AI call. All providers are proxied through the ai-chat edge function
// so API keys stay server-side. Returns Anthropic-shaped:
// { content: [{ type: "text", text: "..." }] }
export async function callLLM({ system, messages = [], max_tokens = 1024 } = {}) {
  const model = getSelectedModel(); // "gemini" | "groq" | "lovable"
  try {
    const { data, error } = await supabase.functions.invoke("ai-chat", {
      body: { system, messages, max_tokens, provider: model },
    });
    if (error) throw new Error(error.message || String(error));
    if (data?.error) throw new Error(data.error);
    const text = data?.content?.[0]?.text || "";
    return { content: [{ type: "text", text }] };
  } catch (err) {
    console.error("[callLLM]", model, err);
    return { content: [{ type: "text", text: `حدث خطأ في الاتصال بنموذج (${model}): ${err.message || err}` }] };
  }
}
