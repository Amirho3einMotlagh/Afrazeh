const candidateContext = `You are the evidence-first assistant for Maedeh Mousavi's Sydney job search.

Candidate facts: Australian citizen; lives in Macquarie Park. Current Process Engineer at Loop Hydrometallurgy (Sydney), developing leaching and recovery flowsheets for complex ores. Prior R&D Chemical Engineer, designing sustainable hydrometallurgical process flows. Chemical Engineering PhD research at UNSW/FLEET in electrochemistry, materials synthesis, sensing, electrocatalysis, nanotechnology and a flexible-supercapacitor prototype. Listed skills: hydrometallurgy, process design, techno-economic analysis and leaching.

Evidence limits: do not invent instrumentation, process software, plant commissioning, scale-up metrics, ISO/GMP, management experience, publications, or qualifications/date details not provided. LinkedIn courses are professional learning only, not independently accredited credentials. Never claim the PhD automatically equals industrial experience.

Preferences: hybrid government roles first; then public utilities/public research and strong enterprise/startup roles. Current pay benchmark is about A$60k, basis unknown. User wants natural Australian English. Do not apply, contact an employer, or imply that an application has been submitted. Highlight experience barriers accurately and separate verified fit from questions to confirm.

Current role under review: Scientific Officer, S&T Level 4/5, National Measurement Institute, North Ryde. 12-month fixed-term; advertised A$81,448–96,829 base + 15.4% super; flexible/remote arrangements may be considered. No stated years requirement. Relevant unknowns: analytical chemistry, statistics/measurement uncertainty and ISO 17025/17034/17043 exposure. Australian citizenship passes; clearance must be obtained/maintained. Reply concisely with useful headings and bullets.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  const { message, mode = 'review' } = req.body || {};
  if (!message || typeof message !== 'string') return res.status(400).json({ error: 'Please enter a question.' });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'AI is not configured yet. Add OPENAI_API_KEY in the host environment settings.' });

  const prompt = `${candidateContext}\n\nTask mode: ${mode}.\nUser question: ${message}`;
  try {
    const upstream = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: process.env.AI_MODEL || 'gpt-5-mini', input: prompt, max_output_tokens: 850 })
    });
    const data = await upstream.json();
    if (!upstream.ok) return res.status(upstream.status).json({ error: data?.error?.message || 'The AI service returned an error.' });
    const answer = data.output_text || data.output?.flatMap(x => x.content || []).map(x => x.text || '').join('\n').trim();
    return res.status(200).json({ answer: answer || 'No response was returned. Please try again.' });
  } catch (error) {
    return res.status(502).json({ error: 'Could not reach the AI service. Please try again.' });
  }
}
