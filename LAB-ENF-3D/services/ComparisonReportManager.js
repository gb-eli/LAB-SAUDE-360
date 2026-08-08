export class ComparisonReportManager {
  sanitizeFilename(value = "") {
    const normalized = String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    return normalized || "comparacao-anatomica";
  }

  escape(value = "") {
    return String(value).replace(
      /[&<>"']/g,
      char => ({
        "&":"&amp;",
        "<":"&lt;",
        ">":"&gt;",
        '"':"&quot;",
        "'":"&#039;"
      }[char])
    );
  }

  blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  buildHtml({
    title = "Ficha Comparativa Anatômica",
    imageDataUrl = "",
    snapshot = {}
  } = {}) {
    const esc = value => this.escape(value);
    const markers = snapshot.markers || [];
    const categoryLabel = value => ({
      structure:"Estrutura",
      attention:"Atenção",
      relation:"Relação",
      question:"Dúvida"
    }[value] || "Estrutura");

    return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<style>
:root{color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:#07131f;color:#eef5f7;font-family:Arial,sans-serif;line-height:1.5}
main{width:min(1080px,calc(100% - 32px));margin:24px auto 48px}
header,.card{border:1px solid #29404f;border-radius:16px;background:#0b1c2a;padding:20px;margin-bottom:16px}
h1,h2,h3,p{margin-top:0}
.meta{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.side{padding:16px;border-radius:12px;background:#0e2434;border:1px solid #29404f}
.side.a{border-left:5px solid #63e6be}.side.b{border-left:5px solid #ff8da1}
img{display:block;width:100%;border-radius:14px;border:1px solid #29404f;background:#07131f}
.badge{display:inline-block;padding:4px 8px;border-radius:999px;background:#142d3d;color:#b9cad5;font-size:12px}
ul{padding-left:20px}.muted{color:#9fb2bd}
@media(max-width:680px){.meta,.pair{grid-template-columns:1fr}}
</style>
</head>
<body>
<main>
<header>
<span class="badge">Laboratório Virtual de Enfermagem</span>
<h1>${esc(title)}</h1>
<p class="muted">Registro local gerado pelo Comparador Anatômico G3.</p>
</header>

<section class="card pair">
<div class="side a">
<h2>A</h2>
<h3>${esc(snapshot.labelA || "—")}</h3>
<p>${esc(snapshot.systemLabelA || "")}</p>
</div>
<div class="side b">
<h2>B</h2>
<h3>${esc(snapshot.labelB || "—")}</h3>
<p>${esc(snapshot.systemLabelB || "")}</p>
</div>
</section>

<section class="card">
<h2>Vista exportada</h2>
${imageDataUrl ? `<img src="${imageDataUrl}" alt="Comparação anatômica exportada">` : "<p>Imagem não disponível.</p>"}
</section>

<section class="card meta">
<div>
<strong>Modo</strong>
<p>${esc(snapshot.modeLabel || "—")}</p>
</div>
<div>
<strong>Perfil gráfico</strong>
<p>${esc(snapshot.profile || "—")}</p>
</div>
<div>
<strong>Data/hora</strong>
<p>${esc(snapshot.createdAt || "—")}</p>
</div>
<div>
<strong>Sincronização</strong>
<p>${snapshot.semanticSync ? "Ativa" : "Desativada"}</p>
</div>
</section>

<section class="card">
<h2>Anotação</h2>
<p>${esc(snapshot.annotation || "Sem anotação.")}</p>
</section>

<section class="card">
<h2>Marcadores da vista</h2>
${markers.length
  ? `<ul>${markers.map(marker => {
      const style = marker.categoryStyle || {};
      const color = /^#[0-9a-f]{6}$/i.test(String(style.color || ""))
        ? style.color
        : "#9fb2bd";
      const icon = esc(style.icon || "");
      return `<li><strong style="color:${color}">${icon ? `${icon} ` : ""}${esc(marker.side)}</strong> · ${esc(categoryLabel(marker.category))} — ${esc(marker.text)} <span class="muted">(${esc(marker.objectName)})</span></li>`;
    }).join("")}</ul>`
  : "<p>Sem marcadores.</p>"}
</section>

<section class="card">
<h2>Observação pedagógica</h2>
<p class="muted">Os modelos, destaques, alinhamentos e sobreposições são recursos educacionais. Não representam escala anatômica relativa real, exame ou diagnóstico.</p>
</section>
</main>
</body>
</html>`;
  }

  downloadHtml(html, filename = "comparacao-anatomica.html") {
    const blob = new Blob(
      [html],
      { type:"text/html;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1200);
  }
}
