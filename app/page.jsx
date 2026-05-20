"use client";

import { useState, useEffect, useRef } from "react";

const SUGGESTIONS = [
  "Qual o tema central do último sermão?",
  "Quais textos bíblicos foram pregados?",
  "Qual a linha doutrinária da Igreja Seara?",
  "O que foi pregado no Dia das Mães?",
  "O que a igreja ensina sobre o coração endurecido?",
];

function cleanTitle(t) {
  return t
    .replace(/Igreja_Seara_+/g, "")
    .replace(/Culto_+/g, "")
    .replace(/_/g, " ")
    .trim();
}

function Avatar() {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: "50%", background: "#FAEEDA",
      border: "1px solid #FAC775", display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: 16, flexShrink: 0, marginTop: 2,
    }}>✝</div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
      <Avatar />
      <div style={{
        padding: "12px 16px", borderRadius: "4px 16px 16px 16px",
        background: "#fff", border: "1px solid #e8e2d8",
        display: "flex", gap: 5, alignItems: "center",
      }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: "50%", background: "#C8A55A",
            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}

function Message({ role, content }) {
  const isUser = role === "user";
  return (
    <div style={{
      display: "flex", gap: 10, marginBottom: 16,
      justifyContent: isUser ? "flex-end" : "flex-start",
    }}>
      {!isUser && <Avatar />}
      <div style={{
        maxWidth: "75%", padding: "12px 16px", fontSize: 15, lineHeight: 1.7,
        whiteSpace: "pre-wrap", wordBreak: "break-word",
        borderRadius: isUser ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
        background: isUser ? "#FAEEDA" : "#fff",
        border: `1px solid ${isUser ? "#FAC775" : "#e8e2d8"}`,
        color: isUser ? "#3a1f00" : "#1a1a1a",
        fontFamily: isUser ? "system-ui, sans-serif" : "Georgia, serif",
      }}>
        {content}
      </div>
    </div>
  );
}

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [busy, setBusy]         = useState(false);
  const [sermons, setSermons]   = useState([]);
  const [sideOpen, setSideOpen] = useState(true);
  const histRef  = useRef([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    // Carregar lista de sermões
    fetch("/api/sermons")
      .then((r) => r.json())
      .then((d) => setSermons(d.sermons || []))
      .catch(console.error);

    setMessages([{
      role: "assistant",
      content: "Olá! Sou o assistente teológico da Igreja Seara. 📖\n\nPosso responder perguntas sobre os sermões pregados, os textos bíblicos usados, temas abordados e a teologia da igreja. Como posso ajudar?",
    }]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send(text) {
    const txt = (text || input).trim();
    if (!txt || busy) return;
    setInput("");
    setBusy(true);

    const userMsg = { role: "user", content: txt };
    setMessages((prev) => [...prev, userMsg]);
    histRef.current.push(userMsg);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: histRef.current }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      const reply = data.reply || "Sem resposta.";
      histRef.current.push({ role: "assistant", content: reply });
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: `Erro: ${err.message}`,
      }]);
    }
    setBusy(false);
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes bounce {
          0%,80%,100% { transform: translateY(0); }
          40%          { transform: translateY(-5px); }
        }
        textarea { resize: none; outline: none; }
        textarea:focus { border-color: #BA7517 !important; box-shadow: 0 0 0 2px rgba(186,117,23,0.15); }
        .pill:hover { background: #FAEEDA !important; border-color: #BA7517 !important; color: #633806 !important; }
        .sug:hover  { background: #fdf4e7 !important; border-color: #d4a843 !important; }
        .send-btn:hover:not(:disabled) { background: #854F0B !important; }
        @media (max-width: 640px) { .sidebar { display: none !important; } }
      `}</style>

      <div style={{ display: "flex", height: "100dvh", fontFamily: "system-ui, sans-serif" }}>

        {/* ── Sidebar */}
        {sideOpen && (
          <div className="sidebar" style={{
            width: 260, flexShrink: 0, borderRight: "1px solid #e8e2d8",
            background: "#fff", display: "flex", flexDirection: "column",
          }}>
            <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid #e8e2d8" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, background: "#FAEEDA",
                  border: "1px solid #FAC775", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 20,
                }}>✝</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>Igreja Seara</div>
                  <div style={{ fontSize: 11, color: "#888" }}>Assistente Teológico</div>
                </div>
              </div>
            </div>

            <div style={{ padding: "12px 16px 8px" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#aaa", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Sermões disponíveis
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 16px" }}>
              {sermons.length === 0 && (
                <div style={{ fontSize: 13, color: "#bbb", padding: "8px 8px" }}>Carregando...</div>
              )}
              {sermons.map((s) => (
                <button key={s.id} className="pill" onClick={() => send(`Me fale sobre o sermão: ${cleanTitle(s.title)}`)} style={{
                  width: "100%", textAlign: "left", padding: "9px 10px",
                  borderRadius: 8, border: "1px solid transparent",
                  background: "transparent", color: "#555", fontSize: 13,
                  cursor: "pointer", marginBottom: 2, lineHeight: 1.4,
                  transition: "all 0.15s",
                }}>
                  📖 {cleanTitle(s.title)}
                </button>
              ))}
            </div>

            <div style={{ padding: "12px 16px", borderTop: "1px solid #e8e2d8", fontSize: 11, color: "#bbb" }}>
              Conectado ao Notion · seara-agent
            </div>
          </div>
        )}

        {/* ── Main */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

          {/* Header */}
          <div style={{
            padding: "12px 20px", borderBottom: "1px solid #e8e2d8",
            background: "#fff", display: "flex", alignItems: "center",
            justifyContent: "space-between", flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => setSideOpen((v) => !v)} style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 18, color: "#888", padding: "2px 4px",
              }}>☰</button>
              <span style={{ fontWeight: 600, fontSize: 15, color: "#1a1a1a" }}>
                Assistente Teológico
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#639922" }} />
              <span style={{ fontSize: 12, color: "#888" }}>Notion conectado</span>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px 8px" }}>
            {messages.map((m, i) => <Message key={i} role={m.role} content={m.content} />)}

            {busy && <TypingIndicator />}

            {/* Sugestões iniciais */}
            {messages.length === 1 && !busy && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4, marginBottom: 16 }}>
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="sug" onClick={() => send(s)} style={{
                    padding: "7px 14px", borderRadius: 20,
                    border: "1px solid #e8e2d8", background: "#fff",
                    color: "#555", fontSize: 13, cursor: "pointer",
                    fontFamily: "system-ui", transition: "all 0.15s",
                  }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "12px 20px 16px", borderTop: "1px solid #e8e2d8",
            background: "#fff", flexShrink: 0,
          }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", maxWidth: 800, margin: "0 auto" }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                disabled={busy}
                placeholder="Pergunte sobre sermões, textos bíblicos, teologia..."
                rows={1}
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: 10,
                  border: "1px solid #ddd", background: "#fafafa",
                  color: "#1a1a1a", fontSize: 15, lineHeight: 1.5,
                  fontFamily: "system-ui", transition: "border-color 0.15s, box-shadow 0.15s",
                }}
              />
              <button className="send-btn" onClick={() => send()} disabled={busy || !input.trim()} style={{
                width: 40, height: 40, borderRadius: 10, border: "none",
                background: busy || !input.trim() ? "#eee" : "#BA7517",
                color: busy || !input.trim() ? "#bbb" : "#fff",
                cursor: busy || !input.trim() ? "default" : "pointer",
                fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.15s", flexShrink: 0,
              }}>↑</button>
            </div>
            <div style={{ textAlign: "center", fontSize: 11, color: "#ccc", marginTop: 8 }}>
              Respostas baseadas nas transcrições dos cultos da Igreja Seara
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
