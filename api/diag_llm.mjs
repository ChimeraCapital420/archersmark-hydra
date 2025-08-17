export default async function handler(req, res) {
  const checkKey = (key) => {
    const value = process.env[key];
    if (value) {
      return `Present (ends with ...${value.slice(-4)})`;
    }
    return 'Missing';
  };

  const diagnostics = {
    ok: true,
    timestamp: new Date().toISOString(),
    llm_api_keys_status: {
      OPENAI_API_KEY: checkKey('OPENAI_API_KEY'),
      CLAUDE_API_KEY: checkKey('CLAUDE_API_KEY'),
      GEMINI_API_KEY: checkKey('GEMINI_API_KEY'),
      GROK_API_KEY: checkKey('GROK_API_KEY'),
      DEEPSEEK_API_KEY: checkKey('DEEPSEEK_API_KEY'),
    },
  };

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json(diagnostics);
}