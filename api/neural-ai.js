// api/neural-ai.js
// Proxy endpoint for Neural AI chat — keeps API keys server-side

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { messages, systemPrompt, temperature, max_tokens } = req.body
  if (!messages || !systemPrompt) return res.status(400).json({ error: 'Missing messages or systemPrompt' })

  const temp     = typeof temperature === 'number' ? temperature : 0.4
  const maxTok   = typeof max_tokens  === 'number' ? max_tokens  : 1000

  // Try Groq first
  try {
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: temp,
        max_tokens:  maxTok,
      }),
    })
    const data = await resp.json()
    const text = data?.choices?.[0]?.message?.content?.trim()
    if (text) return res.status(200).json({ text })
    console.log('Groq failed:', JSON.stringify(data?.error))
  } catch (e) {
    console.log('Groq error:', e.message)
  }

  // Fallback to Gemini
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'AI unavailable' })
  }
  try {
    const fullPrompt = systemPrompt + '\n\n' + messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: { temperature: temp, maxOutputTokens: maxTok },
      }),
    })
    const data = await resp.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    if (text) return res.status(200).json({ text })
    return res.status(500).json({ error: 'Both AI providers failed' })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}