"use server";
import { createStreamableValue } from "ai/rsc";

const FORTUNE_TELLING_API_URL =
  process.env.FORTUNE_TELLING_API_URL ??
  "http://120.224.107.249:22388/research-assistant/stream";

// 生成唯一的 thread_id 和 user_id
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// 清理文本内容，移除无效字符
function cleanText(text: string): string {
  // 移除独立的 "token" 字符串（前后有空格或标点）
  text = text.replace(/\btoken\b/gi, "");
  // 移除连续的 "token" 字符串
  text = text.replace(/token+/gi, "");
  // 移除多余的空白字符
  text = text.replace(/\s+/g, " ");
  // 移除开头和结尾的空白
  return text.trim();
}

// 提取文本内容的辅助函数
function extractText(data: any): string | null {
  if (typeof data === "string") {
    // 过滤掉 [object Object] 这样的字符串
    if (data.includes("[object Object]")) {
      return null;
    }
    // 过滤掉单独的 "token" 字符串
    if (data.trim().toLowerCase() === "token") {
      return null;
    }
    const cleaned = cleanText(data);
    return cleaned || null;
  }

  if (typeof data !== "object" || data === null) {
    return null;
  }

  // 递归查找文本字段
  const textFields = [
    "content",
    "text",
    "delta",
    "message",
    "response",
    "answer",
    "output",
  ];

  for (const field of textFields) {
    if (data[field] !== undefined) {
      const text = extractText(data[field]);
      if (text) return text;
    }
  }

  // 如果是数组，遍历查找文本
  if (Array.isArray(data)) {
    for (const item of data) {
      const text = extractText(item);
      if (text) return text;
    }
  }

  // 如果是对象，递归查找所有属性
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const text = extractText(data[key]);
      if (text) return text;
    }
  }

  return null;
}

export async function getAnswer(
  prompt: string,
  guaMark: string,
  guaName: string,
  guaChange: string,
) {
  const stream = createStreamableValue();
  try {
    // 获取卦象详细解释
    let guaDetail = "";
    try {
      const res = await fetch(
        `https://raw.githubusercontent.com/sunls2/zhouyi/main/docs/${guaMark}/index.md`,
      );
      if (res.ok) {
        guaDetail = await res.text();
      }
    } catch (err) {
      console.warn("Failed to fetch gua detail, continuing without it:", err);
    }

    // 构建消息内容
    const systemPrompt =
      "你是精通易经64卦, 擅长解读卦象的AI助手\n1.首先对卦象整体情况进行解读\n2.再重点结合要算的事情和变爻情况进行详细分析\n3.回答要简洁、玄妙，不要出现与问题无关的描述，字数控制在 200 字以内。";
    
    let message = `${systemPrompt}。我想要算的事情是：${prompt}, 请帮我解读此卦象：${guaName}`;
    if (guaChange && guaChange !== "无变爻") {
      message += `, ${guaChange}`;
    }
    if (guaDetail) {
      message += `, 此卦象的详细解释：${guaDetail}`;
    }

    // 调用命理 agent API
    const threadId = generateId("thread");
    const userId = process.env.FORTUNE_TELLING_USER_ID ?? generateId("user");

    const response = await fetch(FORTUNE_TELLING_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
        thread_id: threadId,
        user_id: userId,
        stream_tokens: true,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`,
      );
    }

    // 处理流式响应
    (async () => {
      try {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        if (!reader) {
          throw new Error("Response body is not readable");
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine === "") continue;

            // 过滤掉明显无效的内容
            if (
              trimmedLine.includes("[object Object]") ||
              trimmedLine === "[DONE]" ||
              trimmedLine.toLowerCase() === "token" ||
              trimmedLine.startsWith(":")
            ) {
              continue;
            }

            // 处理 SSE 格式的数据
            if (trimmedLine.startsWith("data: ")) {
              const dataStr = trimmedLine.substring(6).trim();
              if (dataStr === "[DONE]" || dataStr === "") {
                continue;
              }

              try {
                const json = JSON.parse(dataStr);
                const text = extractText(json);
                if (text && !text.includes("[object Object]") && text.toLowerCase() !== "token") {
                  const cleaned = cleanText(text);
                  if (cleaned) {
                    stream.update(cleaned);
                  }
                }
              } catch (e) {
                // 如果不是 JSON，检查是否是纯文本
                if (
                  dataStr &&
                  !dataStr.includes("[object Object]") &&
                  dataStr.toLowerCase() !== "token" &&
                  !dataStr.startsWith("{") &&
                  !dataStr.startsWith("[")
                ) {
                  const cleaned = cleanText(dataStr);
                  if (cleaned) {
                    stream.update(cleaned);
                  }
                }
              }
            } else {
              // 如果不是 SSE 格式，检查是否是纯文本
              if (
                !trimmedLine.includes("[object Object]") &&
                !trimmedLine.startsWith("{") &&
                !trimmedLine.startsWith("[")
              ) {
                // 尝试解析为 JSON，如果失败则作为纯文本处理
                try {
                  const json = JSON.parse(trimmedLine);
                  const text = extractText(json);
                  if (text && !text.includes("[object Object]") && text.toLowerCase() !== "token") {
                    const cleaned = cleanText(text);
                    if (cleaned) {
                      stream.update(cleaned);
                    }
                  }
                } catch (e) {
                  // 不是 JSON，直接作为文本处理
                  const cleaned = cleanText(trimmedLine);
                  if (cleaned && cleaned.toLowerCase() !== "token") {
                    stream.update(cleaned);
                  }
                }
              }
            }
          }
        }
      } catch (err: any) {
        console.error("Stream reading error:", err);
        throw err;
      } finally {
        stream.done();
      }
    })()
      .catch((err) => {
        console.error("Stream processing error:", err);
        stream.done();
        throw err;
      });

    return { data: stream.value };
  } catch (err: any) {
    stream.done();
    return { error: err.message ?? err };
  }
}
