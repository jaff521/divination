# 🧙 概述

**AI 算卦：** 通过进行六次硬币的随机卜筮，生成卦象，并使用 AI 对卦象进行分析。

## ⚙️ 设置

#### 环境变量

- `FORTUNE_TELLING_API_URL`：命理 agent API 地址，默认：`http://120.224.107.249:22388/fortune-telling-agent/stream`
- `FORTUNE_TELLING_USER_ID`：用户 ID（可选，不设置会自动生成）

## 🚀 本地运行

1. 克隆仓库：

```sh
git clone https://github.com/sunls24/divination
```

2. 安装依赖项：

```bash
pnpm install
```

3. 本地运行：

```bash
# 可选：设置环境变量
# FORTUNE_TELLING_API_URL=http://120.224.107.249:22388/fortune-telling-agent/stream
# FORTUNE_TELLING_USER_ID=your-user-id
touch .env.local
# 本地运行
pnpm run dev
```

## ☁️ 使用 Vercel 部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsunls23%2Fdivination&env=FORTUNE_TELLING_API_URL)

---

![screenshots](./docs/screenshots.jpg)


curl -X POST http://120.224.107.249:22388/research-assistant/stream \
  -H "Content-Type: application/json" \
  -d '{
    "message": "你是精通易经64卦, 擅长解读卦象的AI助手\n1.首先对卦象整体情况进行解读\n2.再重点结合要算的事情和变爻情况进行详细分析。我想要算的事情是：今天适合买彩票吗？, 请帮我解读此卦象：49.泽火革, 此卦象的详细解释：周易第49卦_革卦(泽火革_兑上离下), 变爻：九四",
    "thread_id": "thread-123",
    "user_id": "user-456",
    "stream_tokens": true
  }'