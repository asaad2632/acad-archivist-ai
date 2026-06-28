import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { messages = [], system, max_tokens = 1500, provider = 'openrouter' } = await req.json();

    let text = '';
    if (provider === 'gemini') {
      text = await callGemini({ messages, system, max_tokens });
    } else if (provider === 'groq') {
      text = await callGroq({ messages, system, max_tokens });
    } else if (provider === 'lovable') {
      text = await callLovable({ messages, system, max_tokens });
    } else {
      text = await callOpenRouter({ messages, system, max_tokens });
    }

    return new Response(JSON.stringify({ content: [{ type: 'text', text }] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error)?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function toOpenAIMessages(messages: any[], system?: string) {
  const msgs: any[] = [];
  if (system) msgs.push({ role: 'system', content: system });
  for (const m of messages) {
    msgs.push({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
    });
  }
  return msgs;
}

async function callOpenRouter({ messages, system, max_tokens }: any) {
  const key = Deno.env.get('OPENROUTER_API_KEY');
  if (!key) throw new Error('Missing OPENROUTER_API_KEY');
  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'HTTP-Referer': 'https://acadarchiv.lovable.app',
      'X-Title': 'AcadArchiv',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-maverick:free',
      messages: toOpenAIMessages(messages, system),
      max_tokens,
    }),
  });
  if (!resp.ok) throw new Error(`OpenRouter ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  return data?.choices?.[0]?.message?.content || '';
}

async function callLovable({ messages, system, max_tokens }: any) {
  const key = Deno.env.get('LOVABLE_API_KEY');
  if (!key) throw new Error('Missing LOVABLE_API_KEY');
  const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': key },
    body: JSON.stringify({ model: 'google/gemini-3-flash-preview', messages: toOpenAIMessages(messages, system), max_tokens }),
  });
  if (!resp.ok) throw new Error(`Lovable ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  return data?.choices?.[0]?.message?.content || '';
}

async function callGemini({ messages, system, max_tokens }: any) {
  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key) throw new Error('Missing GEMINI_API_KEY');
  const contents = messages.map((m: any) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }],
  }));
  const body: any = { contents, generationConfig: { maxOutputTokens: max_tokens, temperature: 0.7 } };
  if (system) body.systemInstruction = { parts: [{ text: system }] };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${encodeURIComponent(key)}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`Gemini ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  return data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || '';
}

async function callGroq({ messages, system, max_tokens }: any) {
  const key = Deno.env.get('GROQ_API_KEY');
  if (!key) throw new Error('Missing GROQ_API_KEY');
  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: toOpenAIMessages(messages, system),
      max_tokens,
      temperature: 0.7,
    }),
  });
  if (!resp.ok) throw new Error(`Groq ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  return data?.choices?.[0]?.message?.content || '';
}
