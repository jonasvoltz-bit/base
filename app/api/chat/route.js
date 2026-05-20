import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAllSermonsContent } from "@/lib/notion";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildSystem(sermons) {
  const sermonsBlock = sermons
    .map((s) => `### ${s.title}\n\n${s.content}`)
    .join("\n\n---\n\n");

  return `Você é o Assistente Teológico da Igreja Seara (Porto Alegre, RS).
Sua função é responder perguntas sobre os sermões, ensinamentos e teologia pregados na igreja.

Responda sempre em português brasileiro, com precisão teológica e tom pastoral.
Cite o sermão e os textos bíblicos sempre que relevante.
Se a pergunta não tiver relação com os sermões abaixo, diga educadamente que sua função é responder sobre os sermões da Seara.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRANSCRIÇÕES DOS SERMÕES DISPONÍVEIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${sermonsBlock}`;
}

// Cache simples em memória para evitar bater no Notion a cada mensagem
let cachedSermons = null;
let cacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

async function getSermons() {
  const now = Date.now();
  if (cachedSermons && now - cacheTime < CACHE_TTL_MS) {
    return cachedSermons;
  }
  cachedSermons = await getAllSermonsContent(process.env.NOTION_PAGE_ID);
  cacheTime = now;
  return cachedSermons;
}

export async function POST(req) {
  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages inválido" }, { status: 400 });
    }

    const sermons = await getSermons();
    const system = buildSystem(sermons);

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system,
      messages,
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    return NextResponse.json({ reply: text });
  } catch (err) {
    console.error("[/api/chat]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
