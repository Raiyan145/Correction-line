const STYLES = {
  "Normal":"clean, natural, grammatically correct",
  "Casual":"relaxed, everyday chat tone",
  "Gen Z":"Gen Z slang, trendy, short, playful (no cringe overload)",
  "Friendly":"warm, kind, friendly",
  "Regular":"simple, neutral, everyday",
  "Professional":"polite and professional",
  "Short":"as short and crisp as possible",
  "Funny":"light humorous tone",
  "Romantic":"sweet and caring tone",
  "Polite":"very respectful and polite"
};
const $ = id => document.getElementById(id);
const selected = new Set(["Normal","Casual","Gen Z","Friendly"]);

$("apiKey").value = localStorage.getItem("gkey") || "";
$("model").value = localStorage.getItem("gmodel") || "gemini-2.5-flash";
if (!$("apiKey").value) $("keybox").open = true;
$("saveKey").onclick = () => {
  localStorage.setItem("gkey", $("apiKey").value.trim());
  localStorage.setItem("gmodel", $("model").value.trim() || "gemini-2.5-flash");
  $("keybox").open = false;
};

const box = $("styles");
Object.keys(STYLES).forEach(s => {
  const c = document.createElement("div");
  c.className = "chip" + (selected.has(s) ? " on" : "");
  c.textContent = s;
  c.onclick = () => { selected.has(s) ? selected.delete(s) : selected.add(s); c.classList.toggle("on"); };
  box.appendChild(c);
});

$("go").onclick = async () => {
  const key = localStorage.getItem("gkey"), model = localStorage.getItem("gmodel") || "gemini-2.5-flash";
  const text = $("input").value.trim();
  const out = $("out");
  if (!key) { $("keybox").open = true; return alert("Add your Gemini API key first"); }
  if (!text) return;
  if (!selected.size) return alert("Pick at least one style");

  const styles = [...selected].map(s => `- ${s}: ${STYLES[s]}`).join("\n");
  const lang = $("lang").value;
  const langRule = lang === "same"
    ? "Keep the SAME language/script as the input (Bangla stays Bangla script, Banglish stays Banglish in English letters, English stays English)."
    : `Write every rewrite in ${lang}.`;

  const prompt = `You are a text correction assistant for Bangla, Banglish and English.
Fix spelling, grammar and clarity of the user's line, keep the original meaning, then rewrite it in each requested style.
${langRule}
Styles:
${styles}
Return ONLY a JSON array like [{"style":"Normal","text":"..."}] with one item per style, in the same order.

User line: """${text}"""`;

  $("go").disabled = true; $("go").textContent = "Thinking...";
  out.innerHTML = "";
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.8 }
      })
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error?.message || "API error");
    const raw = d.candidates[0].content.parts.map(p => p.text || "").join("");
    const items = JSON.parse(raw.replace(/```json|```/g, "").trim());
    items.forEach(i => {
      const el = document.createElement("div");
      el.className = "res";
      const b = document.createElement("b"); b.textContent = i.style;
      const p = document.createElement("p"); p.textContent = i.text;
      const btn = document.createElement("button"); btn.textContent = "Copy";
      btn.onclick = () => { navigator.clipboard.writeText(i.text); btn.textContent = "Copied ✓"; setTimeout(() => btn.textContent = "Copy", 1200); };
      el.append(b, p, btn);
      out.appendChild(el);
    });
  } catch (e) {
    out.innerHTML = `<p class="err">Error: ${e.message}</p>`;
  }
  $("go").disabled = false; $("go").textContent = "Correct it 🚀";
};
