import { NextResponse } from "next/server";
import { getAllSermonsContent } from "@/lib/notion";

function buildSystem(sermons) {
  const sermonsBlock = sermons
    .map((s) => `### ${s.title}\n\n${s.content}`)
    .join("\n\n---\n\n");

  return `Você é o Assistente Teológico da Igreja Seara (Porto Alegre, RS).
Responda perguntas sobre os sermões, ensinamentos e teologia pregados na igreja.
Responda em português brasileiro, com precisão teológica e tom pastoral.
Cite o sermão e os textos bíblicos sempre que relevante.
Se a pergunta não tiver relação com os sermões abaixo, diga educadamente que sua função é responder sobre os sermões da Seara.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRANSCRIÇÕES DOS SERMÕES DISPONÍVEIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${sermonsBlock}`;
}

// Cache em memória — 5 minutos
let cachedSermons = null;
let cacheTime = 0;

async function getSermons() {
  const now = Date.now();
  if (cachedSermons && now - cacheTime < 5 * 60 * 1000) return cachedSermons;
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
    const system  = buildSystem(sermons);

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system,
        messages,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    const reply = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[/api/chat]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
