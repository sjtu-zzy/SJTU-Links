// functions/chat.js
export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    
    // 解析前端传过来的 JSON 数据
    const { message, history = [] } = await request.json();

    // 从 Cloudflare 环境变量中读取真实的 API Key 和 API URL
    const apiKey = env.AI_API_KEY;
    const apiUrl = env.AI_API_URL || "https://apihub.agnes-ai.com/v1"; 

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'AI API Key is not configured on server.' }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 构造发送给大模型的对话上下文
    const messages = [
      { role: "system", content: "你是'交我导'网站的AI助手，负责热心解答上海交通大学相关的校园、网站和部门问题。" },
      ...history,
      { role: "user", content: message }
    ];

    // 请求 agnes 的 API
    const response = await fetch(`${apiUrl.replace(/\/$/, '')}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "agnes-2.0-flash", // 指定使用该模型
        messages: messages
      })
    });

    const data = await response.json();

    // 将大模型的返回结果再返回给前端
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error: ' + err.message }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}