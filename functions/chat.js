// 云函数后端：负责读取环境变量并安全调用大模型 API
export async function onRequest(context) {
  // 1. 安全提取 Cloudflare Pages 后台设置的环境变量
  const apiKey = context.env.AI_API_KEY;
  const apiUrl = context.env.AI_API_URL;

  // 跨域处理与错误保护
  if (!apiKey || !apiUrl) {
    return new Response(JSON.stringify({ error: "Cloudflare 环境变量 AI_API_KEY 或 AI_API_URL 未正确配置。" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  // 仅允许 POST 请求
  if (context.request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    // 解析前端传来的用户问题和历史会话
    const { message, history } = await context.request.json();

    // 2. 设计完美的系统提示词 (System Prompt)
    const systemPrompt = `
你叫“导导”，是上海交通大学（SJTU）校园网站与微信公众号导航平台“交我导”的智能电子宠物。
你的声音和形象应该表现得热情、傲娇但又非常乐于助人（比如可以使用“哼”、“啦”、“嘛”或者特定的交大黑话）。

【你的核心任务】
1. 为用户解答关于交大各个学院、行政部门、公众号、常用系统（如：jAccount、Canvas、思源一号、交我算）的链接与查找问题。
2. 引导用户在网页的搜索框中查找他们需要的直达按钮。

【你的行为准则】
- 针对常见系统（如：Canvas、jAccount、教学信息服务网、综合服务门户），直接告诉用户“你可以使用页面上方的搜索框搜‘Canvas’”，并简要说明其用途（如：Canvas是交大的核心课程在线管理与作业提交平台）。
- 针对学院或公众号查找，给出明确的搜寻词建议。
- 如果用户询问你非交大、非校园生活、甚至写代码等宽泛问题，请幽默地拒绝并拉回主题（例如：“导导只是一只交大本地向导宠物啦！这种复杂的事情去问真正的生产力AI，让我带你逛交大不好吗？”）。
- 回复简明扼要，控制在 100-150 字以内，适合聊天气泡阅读。
`;

    // 3. 构建完整的请求上下文
    const messages = [
      { role: "system", content: systemPrompt }
    ];

    // 将前端保存的上下文记忆同步过来（限制条数防止体积过大）
    if (history && Array.isArray(history)) {
      messages.push(...history);
    }

    // 放入当前这一轮的用户问题
    messages.push({ role: "user", content: message });

    // 4. 调用大模型 API
    const apiResponse = await fetch(`${apiUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // 推荐此高连通性且速度极快的模型，也可改成你服务商支持的其他模型
        messages: messages,
        temperature: 0.7,
        max_tokens: 300
      })
    });

    const data = await apiResponse.json();

    // 5. 将大模型的结果返回给前端
    return new Response(JSON.stringify(data), {
      status: apiResponse.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" // 允许前端跨域
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: "服务器内部错误：" + error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}