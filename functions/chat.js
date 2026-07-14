// api/chat.js
export default async function handler(req, res) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, history = [] } = req.body;

  // 从 Vercel 环境变量中读取真实的 API Key 和 API URL
  const apiKey = process.env.AI_API_KEY;
  const apiUrl = process.env.AI_API_URL || "https://apihub.agnes-ai.com/v1"; 

  if (!apiKey) {
    return res.status(500).json({ error: 'AI API Key is not configured on server.' });
  }

  try {
    // 构造发送给大模型的对话上下文
    const messages = [
      { role: "system", content: "你是'交我导'网站的AI助手，负责热心解答上海交通大学相关的校园、网站和部门问题。" },
      ...history,
      { role: "user", content: message }
    ];

    const response = await fetch(`${apiUrl.replace(/\/$/, '')}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "agnes-2.0-flash", // 指定使用该模型
        messages: messages,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `AI Service Error: ${errText}` });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}