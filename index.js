const express = require('express');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const KNOWLEDGE_PATH = path.join(__dirname, 'data', 'knowledge.json');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ 缺少 GEMINI_API_KEY，請在 .env 設定你的 API Key');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

function readKnowledge() {
  try {
    const raw = fs.readFileSync(KNOWLEDGE_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('讀取知識庫失敗:', error.message);
    return { rules: [], characters: [], works: [], links: [] };
  }
}

function normalizeText(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(normalizeText).join(' ');
  return Object.values(value).map(normalizeText).join(' ');
}

function getSearchableEntries(knowledge) {
  const entries = [];

  Object.entries(knowledge).forEach(([key, value]) => {
    if (!Array.isArray(value)) return;

    value.forEach((item) => {
      const text = normalizeText(item);
      entries.push({
        key,
        title: item.title || item.name || key,
        text,
        url: item.url || '',
        content: item.content || item.details || item.role || ''
      });
    });
  });

  return entries;
}

function findRelevantKnowledge(question, knowledge) {
  const query = (question || '').toLowerCase().trim();
  if (!query) return [];

  const entries = getSearchableEntries(knowledge);
  const tokens = query.split(/\s+/).filter(Boolean);

  return entries
    .map((entry) => {
      const searchable = `${entry.title} ${entry.text} ${entry.content}`.toLowerCase();
      const score = tokens.reduce((sum, token) => sum + (searchable.includes(token) ? 1 : 0), 0);
      return { ...entry, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function buildKnowledgeContext(matches) {
  if (!matches.length) return '';

  const context = matches
    .map((match) => {
      const detail = match.content || match.text || '無補充資訊';
      const url = match.url ? `（連結：${match.url}）` : '';
      return `• ${match.title}：${detail}${url}`;
    })
    .join('\n');

  return `\n\n📚 相關知識庫資料：\n${context}`;
}

async function generateAIResponse(userMessage, knowledge) {
  try {
    const matches = findRelevantKnowledge(userMessage, knowledge);
    const knowledgeContext = buildKnowledgeContext(matches);

    const prompt = `你是萌希（Meng-Xi），一個溫暖、親切、會幫忙的 AI 助手，代表萌氏家族。
請用繁體中文回答，語氣自然、有活力，適當使用 emoji。

你需要：
1. 先確認使用者問題是什麼
2. 參考以下知識庫內容，若有相關資料請優先引用
3. 若不知道或不確定，誠實說明
4. 直接回答，不要過度長篇
5. 若內容涉及連結，提供可點擊連結或簡短說明

${knowledgeContext ? `知識庫資料：${knowledgeContext}` : '目前沒有直接匹配的知識庫資料，請以一般知識與官方資訊回答。'}

使用者問題：${userMessage}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API 錯誤:', error.message);
    return '⚠️ 抱歉，萌希暫時無法處理你的請求。請檢查 GEMINI_API_KEY 是否正確設定，或稍後再試。';
  }
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, status: 'ready', ai: 'Gemini' });
});

app.get('/api/knowledge', (req, res) => {
  res.json(readKnowledge());
});

app.post('/api/chat', async (req, res) => {
  const message = (req.body && req.body.message) || '';

  if (!message.trim()) {
    return res.status(400).json({
      success: false,
      error: '訊息不能為空'
    });
  }

  try {
    const knowledge = readKnowledge();
    const answer = await generateAIResponse(message, knowledge);

    res.json({
      success: true,
      answer
    });
  } catch (error) {
    console.error('Chat API 錯誤:', error);
    res.status(500).json({
      success: false,
      error: 'AI 處理失敗'
    });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'ai-使用介面.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('🚀 萌希 AI 助手已啟動！');
  console.log(`📍 訪問地址: http://localhost:${PORT}`);
  console.log('🤖 AI 引擎: Google Gemini');
  console.log(`💾 知識庫: ${KNOWLEDGE_PATH}`);
});

module.exports = app;
