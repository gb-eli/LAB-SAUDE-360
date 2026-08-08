export class EvidenceManager {
  constructor({ progress, assessment, activities, journeys, sessions }) {
    this.progress = progress;
    this.assessment = assessment;
    this.activities = activities;
    this.journeys = journeys;
    this.sessions = sessions;
  }

  buildSnapshot(moduleCatalog = []) {
    const session = this.sessions.getCurrent();
    const activeJourney = this.journeys.getActiveJourney();
    const journeyState = this.journeys.getState();

    return {
      generatedAt: new Date().toISOString(),
      session: session || null,
      journey: activeJourney ? {
        id: activeJourney.id,
        code: activeJourney.code,
        title: activeJourney.title,
        state: journeyState
      } : null,
      modules: moduleCatalog.map(module => ({
        id: module.id,
        name: module.name,
        progress: this.progress.getModuleProgress(module.id)
      })),
      assessments: this.activities.activities.map(activity => ({
        activityId: activity.id,
        code: activity.code,
        title: activity.title,
        best: this.assessment.getBest(activity.id),
        attempts: this.assessment.getAttempts(activity.id)
      }))
    };
  }

  downloadJson(snapshot, filename = "evidencia-lab-enfermagem.json") {
    const blob = new Blob(
      [JSON.stringify(snapshot, null, 2)],
      { type: "application/json;charset=utf-8" }
    );
    this.downloadBlob(blob, filename);
  }

  downloadHtml(snapshot, filename = "evidencia-lab-enfermagem.html") {
    const esc = (value = "") => String(value).replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[c]));

    const session = snapshot.session || {};
    const visited = session.visitedModules || [];
    const assessments = snapshot.assessments.filter(x => x.attempts?.length);

    const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Evidência — Laboratório Virtual de Enfermagem</title>
<style>
body{font-family:system-ui,-apple-system,sans-serif;margin:0;background:#f6f8fa;color:#17202a}
main{max-width:900px;margin:auto;padding:32px}
header{border-bottom:2px solid #17324a;padding-bottom:18px;margin-bottom:24px}
h1{margin:.2rem 0}h2{margin-top:28px}
.meta{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
.card{background:#fff;border:1px solid #d8e0e6;border-radius:12px;padding:14px;margin:10px 0}
small{color:#607080}.score{font-weight:800}
button{padding:10px 14px;border:0;border-radius:8px;background:#17324a;color:#fff;cursor:pointer}
@media print{button{display:none}body{background:#fff}main{padding:0}.card{break-inside:avoid}}
</style>
</head>
<body>
<main>
<header>
<small>Laboratório Virtual de Enfermagem</small>
<h1>Evidência local da sessão</h1>
<p>Documento gerado no próprio navegador. Não contém validação institucional.</p>
<button onclick="window.print()">Imprimir / Salvar como PDF</button>
</header>

<div class="meta">
<div class="card"><strong>Identificação opcional</strong><br>${esc(session.displayName || "Não informada")}</div>
<div class="card"><strong>Turma/grupo opcional</strong><br>${esc(session.groupName || session.className || "Não informada")}</div>
<div class="card"><strong>Início</strong><br>${esc(session.startedAt || "—")}</div>
<div class="card"><strong>Término</strong><br>${esc(session.finishedAt || "Sessão ainda ativa")}</div>
</div>

<h2>Laboratórios visitados</h2>
${visited.length ? visited.map(item => `
<div class="card">
<strong>${esc(item.moduleName || item.moduleId)}</strong>
<p>Acessos nesta sessão: ${Number(item.opens || 0)}</p>
<small>Primeiro acesso: ${esc(item.firstOpenedAt || "—")}</small>
</div>`).join("") : "<p>Nenhum laboratório registrado nesta sessão.</p>"}

<h2>Avaliações</h2>
${assessments.length ? assessments.map(item => `
<div class="card">
<strong>${esc(item.code)} — ${esc(item.title)}</strong>
<p class="score">Melhor resultado: ${item.best ? `${item.best.percent}%` : "—"}</p>
<small>Tentativas: ${item.attempts.length}</small>
</div>`).join("") : "<p>Nenhuma avaliação registrada.</p>"}

<h2>Jornada</h2>
<div class="card">
${snapshot.journey
  ? `<strong>${esc(snapshot.journey.code)} — ${esc(snapshot.journey.title)}</strong>
     <p>Etapa atual: ${Number(snapshot.journey.state?.stepIndex || 0) + 1}</p>
     <small>Etapas concluídas: ${(snapshot.journey.state?.completedSteps || []).length}</small>`
  : "Nenhuma jornada ativa no momento da exportação."}
</div>

<p><small>Gerado em ${esc(snapshot.generatedAt)}</small></p>
</main>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    this.downloadBlob(blob, filename);
  }

  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
