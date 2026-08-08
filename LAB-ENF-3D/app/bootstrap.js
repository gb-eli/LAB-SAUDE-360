import { APP_VERSION, APP_STAGE } from "./version.js";
import { APP_CONFIG } from "./config.js";
import { EventBus } from "../core/EventBus.js";
import { StorageManager } from "../core/StorageManager.js";
import { ModuleManager } from "../core/ModuleManager.js";
import { GraphicsManager } from "../services/GraphicsManager.js";
import { PerformanceManager } from "../services/PerformanceManager.js";
import { AssetManager } from "../services/AssetManager.js";
import { ProgressManager } from "../services/ProgressManager.js";
import { ActivityManager } from "../services/ActivityManager.js";
import { AssessmentManager } from "../services/AssessmentManager.js";
import { SessionManager } from "../services/SessionManager.js";
import { GuidedJourneyManager } from "../services/GuidedJourneyManager.js";
import { EvidenceManager } from "../services/EvidenceManager.js";
import { AccessibilityManager } from "../services/AccessibilityManager.js";
import { CatalogSearchManager } from "../services/CatalogSearchManager.js";
import { CatalogLibraryManager } from "../services/CatalogLibraryManager.js";
import { LoadingIndicatorManager } from "../services/LoadingIndicatorManager.js";
import { PerformanceBudgetManager } from "../services/PerformanceBudgetManager.js";
import { JourneyPreloadManager } from "../services/JourneyPreloadManager.js";
import { ImmersiveExperienceManager } from "../services/ImmersiveExperienceManager.js";
import { DemonstrationManager } from "../services/DemonstrationManager.js";

const $ = s => document.querySelector(s);

const safe = (s = "") => String(s).replace(/[&<>"']/g, c => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
}[c]));

const events = new EventBus();
const storage = new StorageManager(APP_CONFIG.storageNamespace);

const graphics = new GraphicsManager({
  events,
  storage,
  defaultProfile: APP_CONFIG.defaultGraphicsProfile
});

const performanceManager = new PerformanceManager({ events, graphics });
const assets = new AssetManager({ graphics, events });
const progress = new ProgressManager({ storage, events });
const activities = new ActivityManager({ storage, events });
const assessment = new AssessmentManager({ storage, events });
const sessions = new SessionManager({ storage, events });
const journeys = new GuidedJourneyManager({ storage, events });
const accessibility = new AccessibilityManager({ storage, events });
const catalogSearch = new CatalogSearchManager();
const catalogLibrary = new CatalogLibraryManager({ storage, events });
let catalogState = { query: "", category: "all", generation: "all", sort: "catalog", collection: "all" };
let catalogCollections = { collections: [] };

const evidence = new EvidenceManager({
  progress,
  assessment,
  activities,
  journeys,
  sessions
});

const dashboard = $("#dashboard-view");
const moduleView = $("#module-view");
const grid = $("#module-grid");
const host = $("#module-host");
const profile = $("#graphics-profile");
const loadingIndicator = new LoadingIndicatorManager({ host, events });
const performanceBudget = new PerformanceBudgetManager({ assets, events });
const immersiveExperience = new ImmersiveExperienceManager({
  moduleView,
  host,
  storage,
  events
});

const demonstration = new DemonstrationManager({
  panel: $("#demonstration-panel"),
  toggleButton: $("#demonstration-toggle"),
  openModule,
  closeModule,
  setCinema: value =>
    immersiveExperience.setCinema(value),
  toast
});

const manager = new ModuleManager({
  events,
  host,
  services: {
    graphics,
    storage,
    performance: performanceManager,
    assets,
    progress
  }
});

const journeyPreloader = new JourneyPreloadManager({
  moduleManager: manager,
  performanceBudget,
  graphics,
  events,
  maxAssets: 2
});

function toast(message) {
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  $("#toast-region").append(node);
  setTimeout(() => node.remove(), 2600);
}

function showDashboard() {
  dashboard.classList.add("active");
  moduleView.classList.remove("active");
}

function showModule() {
  dashboard.classList.remove("active");
  moduleView.classList.add("active");
}

function closePanels(except = null) {
  for (const id of ["tools-panel", "demonstration-panel", "progress-panel", "diagnostics-panel"]) {
    if (id === except) continue;
    const panel = document.getElementById(id);
    panel?.classList.remove("open");
    panel?.setAttribute("aria-hidden", "true");
  }
}

function openPanel(id) {
  closePanels(id);
  const panel = document.getElementById(id);
  panel.classList.add("open");
  panel.setAttribute("aria-hidden", "false");
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return "—";
  }
}

function populateCatalogCategories(items) {
  const select = $("#catalog-category");
  const previous = catalogState.category;

  select.innerHTML = `
    <option value="all">Todas as áreas</option>
    ${catalogSearch.categories(items).map(category => `
      <option value="${safe(category)}">${safe(category)}</option>
    `).join("")}
  `;

  if ([...select.options].some(option => option.value === previous)) {
    select.value = previous;
  } else {
    catalogState.category = "all";
    select.value = "all";
  }
}


function populateCatalogGenerations(items) {
  const select = $("#catalog-generation");
  const previous = catalogState.generation;

  select.innerHTML = `
    <option value="all">Todas</option>
    ${catalogSearch.generations(items).map(generation => `
      <option value="${safe(generation)}">${safe(generation)}</option>
    `).join("")}
  `;

  if ([...select.options].some(option => option.value === previous)) {
    select.value = previous;
  } else {
    catalogState.generation = "all";
    select.value = "all";
  }
}

function renderCatalog(items) {
  const activeCollection =
    catalogCollections.collections.find(
      item => item.id === catalogState.collection
    );

  const source = activeCollection
    ? items.filter(module =>
        activeCollection.moduleIds.includes(module.id)
      )
    : items;

  const filtered = catalogSearch.filter(source, catalogState);

  grid.replaceChildren();

  const collectionSuffix = activeCollection
    ? ` · ${activeCollection.label}`
    : "";

  $("#module-count").textContent =
    filtered.length === items.length
      ? `${items.length} módulos${collectionSuffix}`
      : `${filtered.length}/${items.length} módulos${collectionSuffix}`;

  $("#catalog-empty").hidden = filtered.length > 0;

  for (const module of filtered) {
    const p = progress.getModuleProgress(module.id);
    const card = document.createElement("article");
    card.className = "module-card";

    card.innerHTML = `
      ${immersiveExperience.cardVisual(module)}
      <div class="module-card-topline">
        <span class="eyebrow">${safe(module.category)}</span>
        <span class="module-generation gen-${safe(String(module.generation || "SIM").toLowerCase().replace(/[^a-z0-9]+/g,"-"))}">${safe(module.generation || "SIM")}</span>
      </div>
      <h3>${safe(module.name)}</h3>
      <p>${safe(module.description)}</p>
      <div class="lab-chip-row">
        ${(module.planned || []).slice(0, 5).map(x => `<span class="lab-chip">${safe(x)}</span>`).join("")}
      </div>
      ${catalogState.query ? (() => {
        const hits = catalogSearch.matchLabels(module, catalogState.query, 3);
        return hits.length ? `
          <div class="catalog-match-row" aria-label="Correspondências da busca">
            <span>Encontrado em:</span>
            ${hits.map(x => `<b>${safe(x)}</b>`).join("")}
          </div>
        ` : "";
      })() : ""}
      <div class="module-card-footer">
        <span class="meta">
          v${safe(module.version)} · ${safe(module.experience)}
          ${p.opens ? ` · ${p.opens} acesso(s)` : ""}
        </span>
        <div class="module-card-actions">
          <button class="favorite-button ${catalogLibrary.isFavorite(module.id) ? "active" : ""}" data-favorite="${module.id}" aria-label="Favoritar ${safe(module.name)}">${catalogLibrary.isFavorite(module.id) ? "★" : "☆"}</button>
          <button class="button" data-open="${module.id}">Explorar</button>
        </div>
      </div>
    `;

    grid.append(card);
  }
}


function renderFeaturedExperiences() {
  const host = $("#featured-experience-grid");
  if (!host) return;

  const modules =
    immersiveExperience.featuredModules(
      manager.catalog || []
    );

  host.innerHTML = modules
    .map(module =>
      immersiveExperience.featuredCard(module)
    )
    .join("");
}

function renderQuickAccess() {
  const modules = manager.catalog || [];
  const favorites = catalogLibrary.getFavorites(modules);
  const recent = catalogLibrary.getRecent(modules);

  $("#favorite-count").textContent = favorites.length;
  $("#recent-count").textContent = recent.length;

  $("#favorite-list").innerHTML = favorites.length
    ? favorites.map(module => `
        <button class="quick-item" data-open="${module.id}">
          <span>★</span>
          <span><strong>${safe(module.name)}</strong><small>${safe(module.category)} · ${safe(module.generation || "SIM")}</small></span>
        </button>
      `).join("")
    : `<div class="quick-empty">Use ☆ nos cards para salvar laboratórios.</div>`;

  $("#recent-list").innerHTML = recent.length
    ? recent.map(item => `
        <button class="quick-item" data-open="${item.module.id}">
          <span>↺</span>
          <span><strong>${safe(item.module.name)}</strong><small>${safe(item.module.generation || "SIM")} · ${formatDate(item.openedAt)}</small></span>
        </button>
      `).join("")
    : `<div class="quick-empty">Os laboratórios abertos recentemente aparecerão aqui.</div>`;
}


function renderCollectionHub(){
  const host=$("#collection-hub-grid");
  const quick=$("#collection-quick");
  if(!host)return;

  const modules=manager.catalog||[];
  const collections=catalogCollections.collections||[];

  host.innerHTML=collections.map(collection=>{
    const valid=collection.moduleIds.filter(id=>
      modules.some(module=>module.id===id)
    );

    const favorite=
      catalogLibrary.isCollectionFavorite(
        collection.id
      );

    return `
      <article class="collection-card ${catalogState.collection===collection.id?"active":""}">
        <button class="collection-favorite ${favorite?"active":""}" data-collection-favorite="${safe(collection.id)}" aria-label="${favorite?"Remover":"Adicionar"} coleção ${safe(collection.label)} dos favoritos">${favorite?"★":"☆"}</button>
        <button class="collection-main" data-collection="${safe(collection.id)}">
          <strong>${safe(collection.label)}</strong>
          <span>${safe(collection.description)}</span>
          <small>${valid.length} laboratório(s)</small>
        </button>
      </article>
    `;
  }).join("");

  if(quick){
    const favorites=
      catalogLibrary.getFavoriteCollections(
        collections
      );

    const recent=
      catalogLibrary.getRecentCollections(
        collections
      );

    const favoriteHtml=favorites.length
      ?favorites.slice(0,4).map(collection=>`
          <button class="collection-quick-chip" data-collection="${safe(collection.id)}">
            <span>★</span>
            <strong>${safe(collection.label)}</strong>
          </button>
        `).join("")
      :'<span class="collection-quick-empty">Nenhuma coleção favorita.</span>';

    const recentHtml=recent.length
      ?recent.slice(0,4).map(item=>`
          <button class="collection-quick-chip" data-collection="${safe(item.collection.id)}">
            <span>↺</span>
            <strong>${safe(item.collection.label)}</strong>
            <small>${safe(formatDate(item.openedAt))}</small>
          </button>
        `).join("")
      :'<span class="collection-quick-empty">Nenhuma coleção recente.</span>';

    quick.innerHTML=`
      <section>
        <span class="eyebrow">Coleções favoritas · ${favorites.length}</span>
        <div>${favoriteHtml}</div>
      </section>
      <section>
        <span class="eyebrow">Coleções recentes · ${recent.length}</span>
        <div>${recentHtml}</div>
      </section>
    `;
  }

  const clear=$("#collection-clear");
  if(clear){
    clear.hidden=catalogState.collection==="all";
  }
}
function renderAreaHub(){
  const descriptions={
    "Anatomia":"Corpo e sistemas",
    "Anatomia Regional":"Regiões específicas",
    "Órgãos dos Sentidos":"Visão e audição",
    "Ambientes":"Hospital, UBS, UPA e setores",
    "Materiais e Instrumentos":"Materiais e equipamentos",
    "Saúde Materno-Infantil":"Gestação, maternidade e recém-nascido",
    "Cuidados e Segurança":"Biossegurança e cuidados",
    "Simulação":"Experiências e sinais"
  };

  const modules=manager.catalog||[];
  const groups=catalogSearch.categories(modules);

  $("#area-hub-grid").innerHTML=groups.map(category=>{
    const count=modules.filter(x=>x.category===category).length;
    return `<button class="area-hub-card" data-area="${safe(category)}"><strong>${safe(category)}</strong><span>${safe(descriptions[category]||"Exploração especializada")}</span><small>${count} laboratório(s)</small></button>`;
  }).join("");
}

function getCurrentActivity() {
  return activities.getActiveActivity();
}

function renderActivityDetail() {
  const select = $("#activity-select");
  const activity = activities.getById(select.value);
  const box = $("#activity-detail");

  if (!activity) {
    box.innerHTML = "";
    return;
  }

  const checkpoints = activities.getCheckpoints(activity.id);
  const prompts = activity.explorationPrompts || [];

  box.innerHTML = `
    <div class="tool-card">
      <div class="tool-code">
        <span>Código</span>
        <strong>${safe(activity.code)}</strong>
      </div>
      <h3>${safe(activity.title)}</h3>
      <p>${safe(activity.duration)}</p>

      <span class="eyebrow">Objetivos</span>
      <ul>${activity.objectives.map(x => `<li>${safe(x)}</li>`).join("")}</ul>

      ${prompts.length ? `
        <span class="eyebrow">Sugestões de exploração</span>
        <ol>${prompts.map(x => `<li>${safe(x)}</li>`).join("")}</ol>
      ` : ""}

      <span class="eyebrow">Checkpoints</span>
      <div class="checkpoint-list">
        ${activity.checkpoints.map((x, i) => `
          <label class="checkpoint-item">
            <input type="checkbox" data-checkpoint="${i}" ${checkpoints[i] ? "checked" : ""}>
            ${safe(x)}
          </label>
        `).join("")}
      </div>
    </div>
  `;
}

function renderActiveActivity() {
  const card = $("#active-activity-card");
  const activity = getCurrentActivity();

  if (!activity) {
    card.hidden = true;
    $("#module-activity-context").hidden = true;
    $("#assessment-open").hidden = true;
    return;
  }

  card.hidden = false;
  card.innerHTML = `
    <span class="eyebrow">Roteiro ativo · ${safe(activity.code)}</span>
    <h3>${safe(activity.title)}</h3>
    <p>${safe(activity.duration)} · ${activity.objectives.length} objetivo(s)</p>
    <button class="button" data-open-activity-module="${activity.moduleId}">Abrir laboratório</button>
  `;

  const context = $("#module-activity-context");
  context.hidden = false;
  context.textContent = `${activity.code} · ${activity.title}`;

  $("#assessment-open").hidden = false;
}

function renderToolsPanel() {
  const current = sessions.getCurrent();
  const state = $("#session-state");

  if (current) {
    state.innerHTML = `
      <div class="session-card">
        <strong>${current.active ? "Sessão ativa" : "Última sessão encerrada"}</strong>
        <span>ID: ${safe(current.id)}</span>
        <span>Identificação: ${safe(current.displayName || "não informada")}</span>
        <span>Turma/grupo: ${safe(current.groupName || current.className || "não informado")}</span>
        <span>Início: ${formatDate(current.startedAt)}</span>
        <span>Laboratórios visitados: ${(current.visitedModules || []).length}</span>
      </div>
    `;
    $("#session-name").value = current.displayName || "";
    $("#session-group").value = current.groupName || current.className || "";
  } else {
    state.innerHTML = `
      <div class="session-card">
        <strong>Exploração livre</strong>
        <span>Você pode usar toda a plataforma sem iniciar uma sessão.</span>
      </div>
    `;
  }

  const journeySelect = $("#journey-select");
  journeySelect.innerHTML = `
    <option value="">Sem jornada</option>
    ${journeys.journeys.map(j => `<option value="${j.id}">${safe(j.code)} — ${safe(j.title)}</option>`).join("")}
  `;
  if (journeys.getActiveJourney()) journeySelect.value = journeys.getActiveJourney().id;

  const activitySelect = $("#activity-select");
  const previous = activitySelect.value;
  activitySelect.innerHTML = activities.activities
    .map(a => `<option value="${a.id}">${safe(a.code)} — ${safe(a.title)}</option>`)
    .join("");

  if (previous && activities.getById(previous)) activitySelect.value = previous;
  else if (getCurrentActivity()) activitySelect.value = getCurrentActivity().id;

  document.querySelectorAll("[data-accessibility]").forEach(input => {
    input.checked = Boolean(accessibility.state[input.dataset.accessibility]);
  });

  renderActivityDetail();
}

function renderJourney() {
  const card = $("#active-journey-card");
  const toolbar = $("#journey-toolbar");
  const journey = journeys.getActiveJourney();
  const state = journeys.getState();

  if (!journey || !state) {
    card.hidden = true;
    toolbar.hidden = true;
    return;
  }

  const current = journey.steps[state.stepIndex];
  const completed = state.completedSteps || [];
  const pct = Math.round((completed.length / journey.steps.length) * 100);

  card.hidden = false;
  card.innerHTML = `
    <span class="eyebrow">Jornada ativa · ${safe(journey.code)}</span>
    <h3>${safe(journey.title)}</h3>
    <p><strong>Etapa ${state.stepIndex + 1}/${journey.steps.length}:</strong> ${safe(current.title)}</p>
    <p>${safe(current.instruction)}</p>
    <div class="journey-progress"><span style="width:${pct}%"></span></div>
    <small>${completed.length} de ${journey.steps.length} etapa(s) concluída(s)</small>
  `;

  toolbar.hidden = false;
  $("#journey-step-label").textContent = `${state.stepIndex + 1}/${journey.steps.length}`;
  $("#journey-prev").disabled = state.stepIndex <= 0;
  $("#journey-next").textContent =
    state.stepIndex >= journey.steps.length - 1
      ? "Concluir jornada"
      : "Próxima etapa →";
}

async function openModule(id) {
  const module = manager.getModule(id);
  if (!module) return;

  $("#module-title").textContent = module.name;
  $("#module-category").textContent = module.category;
  $("#module-status").textContent = "carregando";
  showModule();

  try {
    await manager.open(id);
    immersiveExperience.activate(module);
    progress.recordModuleOpen(id);
    catalogLibrary.recordOpen(id);
    sessions.recordModule(id, module.name);
    renderQuickAccess();
    $("#module-status").textContent = "ativo";
    renderProgressPanel();
  } catch (error) {
    console.error(error);
    $("#module-status").textContent = "erro";
    host.innerHTML = `
      <section class="placeholder-module">
        <div class="placeholder-card">
          <span class="eyebrow">Falha isolada</span>
          <h2>O laboratório não pôde ser iniciado.</h2>
          <p>${safe(error.message)}</p>
        </div>
      </section>
    `;
  }
}

async function closeModule() {
  demonstration.pause();

  const activeId = manager.active?.manifest?.id;
  if (activeId) progress.recordModuleClose(activeId);

  immersiveExperience.deactivate();
  await manager.close();
  showDashboard();
  renderCatalog(manager.catalog);
  renderProgressPanel();
}

async function openJourneyStep(step) {
  if (!step) return;

  if (step.activityCode) {
    const activity = activities.activateByCode(step.activityCode);
    if (activity) renderActiveActivity();
  } else {
    activities.clearActive();
    renderActiveActivity();
  }

  await openModule(step.moduleId);
  renderJourney();
}

async function startJourney(journey) {
  if (!journey) return;

  journeys.start(journey);

  if (sessions.isActive()) {
    sessions.update({ journeyId: journey.id });
  }

  renderJourney();
  renderToolsPanel();
  await openJourneyStep(journey.steps[0]);
}

function renderProgressPanel() {
  const modules = manager.catalog || [];
  const all = progress.getAll(modules.map(x => x.id));

  const opened = modules.filter(x => Number(all[x.id]?.opens || 0) > 0).length;
  const totalOpens = modules.reduce((sum, x) => sum + Number(all[x.id]?.opens || 0), 0);
  const completed = modules.filter(x => all[x.id]?.completed).length;

  const attempts = activities.activities.reduce(
    (sum, a) => sum + assessment.getAttempts(a.id).length,
    0
  );

  $("#progress-summary").innerHTML = `
    <div class="progress-grid">
      <div class="progress-stat"><span>Laboratórios acessados</span><strong>${opened}/${modules.length}</strong></div>
      <div class="progress-stat"><span>Acessos</span><strong>${totalOpens}</strong></div>
      <div class="progress-stat"><span>Concluídos</span><strong>${completed}</strong></div>
      <div class="progress-stat"><span>Revisões</span><strong>${attempts}</strong></div>
    </div>

    <div class="progress-card">
      <span class="eyebrow">Por laboratório</span>
      ${modules.map(m => {
        const p = all[m.id] || {};
        return `
          <div class="progress-module">
            <div class="progress-module-head">
              <strong>${safe(m.name)}</strong>
              <span class="badge">${Number(p.opens || 0)} acesso(s)</span>
            </div>
            <small>Último acesso: ${formatDate(p.lastOpenedAt)}</small>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function openAssessment() {
  const activity = getCurrentActivity();

  if (!activity) {
    toast("Abra um roteiro primeiro.");
    return;
  }

  $("#assessment-title").textContent = `${activity.code} — ${activity.title}`;

  $("#assessment-form").innerHTML = `
    ${activity.quiz.map((q, qi) => `
      <fieldset class="assessment-question">
        <strong>${qi + 1}. ${safe(q.question)}</strong>
        ${q.options.map((option, oi) => `
          <label class="assessment-option">
            <input type="radio" name="q${qi}" value="${oi}" required>
            <span>${safe(option)}</span>
          </label>
        `).join("")}
      </fieldset>
    `).join("")}
    <button class="button" type="submit">Conferir</button>
    <div id="assessment-result"></div>
  `;

  $("#assessment-modal").hidden = false;
}

function closeAssessment() {
  $("#assessment-modal").hidden = true;
}

function submitAssessment(event) {
  event.preventDefault();

  const activity = getCurrentActivity();
  if (!activity) return;

  const form = new FormData(event.currentTarget);
  const answers = activity.quiz.map((_, index) => form.get(`q${index}`));

  if (answers.some(x => x === null)) {
    toast("Responda todas as questões.");
    return;
  }

  const result = assessment.submit(activity, answers);
  sessions.recordAssessment(result);

  const box = $("#assessment-result");
  box.className = "assessment-result";
  box.innerHTML = `
    <strong>Resultado: ${result.correct}/${result.total} · ${result.percent}%</strong>
    <p>Resultado salvo somente neste navegador.</p>
  `;

  if (result.percent === 100) {
    progress.markComplete(activity.moduleId, activity.id);
  }

  renderProgressPanel();
  renderToolsPanel();
}

function sessionFileBase() {
  const session = sessions.getCurrent();
  const suffix = session?.id || new Date().toISOString().slice(0, 10);
  return `evidencia-lab-enfermagem-${suffix}`;
}

function exportEvidence(type) {
  const snapshot = evidence.buildSnapshot(manager.catalog || []);
  const base = sessionFileBase();

  if (type === "html") evidence.downloadHtml(snapshot, `${base}.html`);
  else evidence.downloadJson(snapshot, `${base}.json`);
}


document.addEventListener("click", event => {
  if (event.target.closest("[data-scroll-featured]")) {
    $("#featured-experiences")?.scrollIntoView({
      behavior:
        document.documentElement.classList.contains("reduced-motion")
          ? "auto"
          : "smooth",
      block:"start"
    });
  }

  if (event.target.closest("[data-scroll-catalog]")) {
    $("#module-grid")?.scrollIntoView({
      behavior:
        document.documentElement.classList.contains("reduced-motion")
          ? "auto"
          : "smooth",
      block:"start"
    });
  }
});

$("#catalog-search").addEventListener("input", e => {
  catalogState.query = e.target.value;
  renderCatalog(manager.catalog || []);
});

$("#catalog-category").addEventListener("change", e => {
  catalogState.category = e.target.value;
  renderCatalog(manager.catalog || []);
});

$("#catalog-generation").addEventListener("change", e => {
  catalogState.generation = e.target.value;
  renderCatalog(manager.catalog || []);
});

$("#catalog-sort").addEventListener("change", e => {
  catalogState.sort = e.target.value;
  renderCatalog(manager.catalog || []);
});

$("#catalog-clear").addEventListener("click", () => {
  catalogState = { query: "", category: "all", generation: "all", sort: "catalog", collection: "all" };
  $("#catalog-search").value = "";
  $("#catalog-category").value = "all";
  $("#catalog-generation").value = "all";
  $("#catalog-sort").value = "catalog";
  renderCollectionHub();
  renderCatalog(manager.catalog || []);
  $("#catalog-search").focus();
});

$("#featured-experience-grid")?.addEventListener("click", event => {
  const id =
    event.target.closest("[data-open]")
      ?.dataset.open;

  if (id) {
    openModule(id);
  }
});

grid.addEventListener("click", e => {
  const favorite = e.target.closest("[data-favorite]");
  if (favorite) {
    const id = favorite.dataset.favorite;
    const state = catalogLibrary.toggleFavorite(id);
    favorite.classList.toggle("active", state);
    favorite.textContent = state ? "★" : "☆";
    renderQuickAccess();
    return;
  }

  const id = e.target.closest("[data-open]")?.dataset.open;
  if (id) openModule(id);
});

document.querySelector(".collection-hub")?.addEventListener("click",e=>{
  const favorite=e.target.closest("[data-collection-favorite]");

  if(favorite){
    catalogLibrary.toggleCollectionFavorite(
      favorite.dataset.collectionFavorite
    );
    renderCollectionHub();
    return;
  }

  const collection=
    e.target.closest("[data-collection]")?.dataset.collection;

  if(collection){
    catalogState.collection=collection;
    catalogState.category="all";
    $("#catalog-category").value="all";

    catalogLibrary.recordCollectionOpen(
      collection
    );

    renderCollectionHub();
    renderCatalog(manager.catalog||[]);

    document.querySelector(".catalog-tools")?.scrollIntoView({
      behavior:
        document.documentElement.classList.contains("reduced-motion")
          ?"auto"
          :"smooth"
    });
  }
});

$("#collection-clear")?.addEventListener("click",()=>{
  catalogState.collection="all";
  renderCollectionHub();
  renderCatalog(manager.catalog||[]);
});

document.querySelector(".area-hub")?.addEventListener("click",e=>{const area=e.target.closest("[data-area]")?.dataset.area;if(area){catalogState.category=area;$("#catalog-category").value=area;renderCatalog(manager.catalog||[]);document.querySelector(".catalog-tools")?.scrollIntoView({behavior:"smooth"})}});

document.querySelector(".quick-access")?.addEventListener("click", e => {
  const id = e.target.closest("[data-open]")?.dataset.open;
  if (id) openModule(id);
});

$("#active-activity-card").addEventListener("click", e => {
  const id = e.target.closest("[data-open-activity-module]")?.dataset.openActivityModule;
  if (id) openModule(id);
});

$("#back-button").addEventListener("click", closeModule);
$("#home-button").addEventListener("click", closeModule);

profile.value = graphics.requestedProfile;
profile.addEventListener("change", () => graphics.setProfile(profile.value));

$("#tools-toggle").addEventListener("click", () => {
  renderToolsPanel();
  openPanel("tools-panel");
});
$("#tools-close").addEventListener("click", () => closePanels());

$("#progress-toggle").addEventListener("click", () => {
  renderProgressPanel();
  openPanel("progress-panel");
});
$("#progress-close").addEventListener("click", () => closePanels());

$("#diagnostics-toggle").addEventListener("click", () => openPanel("diagnostics-panel"));
$("#diagnostics-close").addEventListener("click", () => closePanels());

$("#activity-select").addEventListener("change", renderActivityDetail);

$("#activity-detail").addEventListener("change", e => {
  const input = e.target.closest("[data-checkpoint]");
  if (!input) return;

  const activity = activities.getById($("#activity-select").value);
  if (!activity) return;

  activities.saveCheckpoint(activity.id, Number(input.dataset.checkpoint), input.checked);
});

$("#session-start").addEventListener("click", () => {
  const session = sessions.start({
    displayName: $("#session-name").value,
    groupName: $("#session-group").value,
    journeyId: $("#journey-select").value || null
  });

  toast(`Sessão ${session.id} iniciada.`);
  renderToolsPanel();
});

$("#session-finish").addEventListener("click", () => {
  const session = sessions.finish();
  if (!session) {
    toast("Nenhuma sessão para encerrar.");
    return;
  }

  toast("Sessão encerrada.");
  renderToolsPanel();
});

$("#open-selected-journey").addEventListener("click", async () => {
  const journey = journeys.getById($("#journey-select").value);
  if (!journey) {
    toast("Escolha uma jornada.");
    return;
  }

  closePanels();
  await startJourney(journey);
});

$("#open-selected-activity").addEventListener("click", async () => {
  const activity = activities.getById($("#activity-select").value);
  if (!activity) return;

  activities.activate(activity);
  renderActiveActivity();
  closePanels();
  await openModule(activity.moduleId);
});

$("#export-html").addEventListener("click", () => exportEvidence("html"));
$("#export-json").addEventListener("click", () => exportEvidence("json"));

$("#fullscreen-toggle").addEventListener("click", async () => {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  } catch {
    toast("Tela cheia não disponível neste navegador.");
  }
});

document.querySelectorAll("[data-accessibility]").forEach(input => {
  input.addEventListener("change", () => {
    accessibility.set(input.dataset.accessibility, input.checked);

    if (input.dataset.accessibility === "projector") {
      $("#projector-toggle").classList.toggle("active", input.checked);
    }
  });
});

$("#projector-toggle").addEventListener("click", () => {
  const enabled = accessibility.toggle("projector");
  $("#projector-toggle").classList.toggle("active", enabled);
  renderToolsPanel();
});

$("#activity-code-form").addEventListener("submit", async e => {
  e.preventDefault();

  const activity = activities.activateByCode($("#activity-code-input").value);

  if (!activity) {
    toast("Código de roteiro não encontrado.");
    return;
  }

  renderActiveActivity();
  await openModule(activity.moduleId);
});

$("#journey-code-form").addEventListener("submit", async e => {
  e.preventDefault();

  const journey = journeys.getByCode($("#journey-code-input").value);

  if (!journey) {
    toast("Código de jornada não encontrado.");
    return;
  }

  await startJourney(journey);
});

$("#journey-prev").addEventListener("click", async () => {
  const step = journeys.previous();
  renderJourney();
  if (step) await openJourneyStep(step);
});

$("#journey-next").addEventListener("click", async () => {
  const journey = journeys.getActiveJourney();
  const state = journeys.getState();

  if (!journey || !state) return;

  const atLast = state.stepIndex >= journey.steps.length - 1;
  const next = journeys.next();

  if (atLast) {
    journeys.finish();
    toast("Jornada concluída.");
    renderJourney();
    renderToolsPanel();
    return;
  }

  renderJourney();
  if (next) await openJourneyStep(next);
});

$("#assessment-open").addEventListener("click", openAssessment);
$("#assessment-close").addEventListener("click", closeAssessment);
$("#assessment-modal").addEventListener("click", e => {
  if (e.target.id === "assessment-modal") closeAssessment();
});
$("#assessment-form").addEventListener("submit", submitAssessment);


function renderPerformanceBudget(moduleId = null) {
  const panel = $("#diagnostics-panel");
  if (!panel) return;

  let box = panel.querySelector("[data-performance-budget]");

  if (!box) {
    box = document.createElement("div");
    box.dataset.performanceBudget = "";
    box.className = "performance-budget-card";
    panel.append(box);
  }

  if (!moduleId) {
    box.innerHTML = `
      <span class="eyebrow">Orçamento 3D</span>
      <strong>Nenhum laboratório aberto</strong>
      <small>Abra um módulo para ver o peso estimado do asset.</small>
    `;
    return;
  }

  const info = performanceBudget.summary(moduleId, graphics.activeProfile);

  if (!info) {
    box.innerHTML = `
      <span class="eyebrow">Orçamento 3D</span>
      <strong>Sem GLB registrado</strong>
      <small>Este módulo não possui asset 3D no orçamento atual.</small>
    `;
    return;
  }

  box.innerHTML = `
    <span class="eyebrow">Orçamento 3D · ${safe(graphics.activeProfile.toUpperCase())}</span>
    <strong>${safe(info.level)}</strong>
    <div class="budget-grid">
      <span>Maior asset <b>${safe(info.maxAssetLabel)}</b></span>
      <span>Faces máx. <b>${Number(info.maxSingleAssetFaces || 0).toLocaleString("pt-BR")}</b></span>
      <span>Draw calls est. <b>${Number(info.maxSingleAssetDrawCallsEstimate || 0).toLocaleString("pt-BR")}</b></span>
      <span>Assets refs. <b>${info.assetCount}</b></span>
      <span>Total ref. <b>${safe(info.referencedLabel)}</b></span>
    </div>
  `;
}


events.on("journey:started", ({ journey, state }) => {
  journeyPreloader.schedule(journey, state);
});

events.on("journey:stepChanged", ({ journey, state }) => {
  journeyPreloader.schedule(journey, state);
});

events.on("journey:finished", () => journeyPreloader.cancel());
events.on("journey:completed", () => journeyPreloader.cancel());

events.on("preload:complete", ({ moduleId }) => {
  console.debug("[Lab Enfermagem] pré-carregado:", moduleId);
});

events.on("catalog:favoritesChanged", () => {
  renderCatalog(manager.catalog || []);
  renderQuickAccess();
  if (!journeys.getActiveJourney()) {
    journeyPreloader.warmCatalog(
      catalogLibrary.getFavorites(manager.catalog || []).map(x => x.id)
    );
  }
});

events.on("catalog:recentChanged", renderQuickAccess);

events.on("performance:update", ({ fps, frameMs }) => {
  $("#metric-fps").textContent = fps;
  $("#metric-frame").textContent = `${frameMs} ms`;
});

events.on("graphics:profileChanged", ({ active, adaptive }) => {
  $("#metric-profile").textContent = active;
  if (adaptive) toast(`Qualidade ajustada para ${active}`);
  renderPerformanceBudget(manager.active?.manifest?.id || null);
});

events.on("module:started", m => { $("#metric-module").textContent = m.name; renderPerformanceBudget(m.id); });
events.on("module:closed", () => { $("#metric-module").textContent = "—"; renderPerformanceBudget(null); });
events.on("assessment:submitted", ({ percent }) => toast(`Revisão salva: ${percent}%`));

events.on("three:metrics", ({ calls, triangles }) => {
  const panel = $("#diagnostics-panel");
  let extra = panel.querySelector("[data-three-metrics]");

  if (!extra) {
    extra = document.createElement("div");
    extra.dataset.threeMetrics = "";
    extra.className = "three-metrics-extra";
    extra.innerHTML = `
      <span>Draw calls <b data-calls>—</b></span>
      <span>Triângulos <b data-triangles>—</b></span>
    `;
    panel.append(extra);
  }

  extra.querySelector("[data-calls]").textContent = calls;
  extra.querySelector("[data-triangles]").textContent =
    Number(triangles || 0).toLocaleString("pt-BR");
});

events.on("comparison:metrics", ({
  calls,
  triangles,
  mode,
  rendererCount,
  simultaneousModels,
  profile,
  systemA,
  systemB
}) => {
  const panel = $("#diagnostics-panel");
  let box = panel.querySelector("[data-comparison-metrics]");

  if (!box) {
    box = document.createElement("div");
    box.dataset.comparisonMetrics = "";
    box.className = "comparison-metrics-extra";
    box.innerHTML = `
      <span>Comparador <b data-compare-mode>—</b></span>
      <span>Perfil interno <b data-compare-profile>—</b></span>
      <span>Renderer/modelos <b data-compare-renderers>—</b></span>
      <span>A × B <b data-compare-systems>—</b></span>
      <span>Calls/triângulos <b data-compare-load>—</b></span>
    `;
    panel.append(box);
  }

  box.querySelector("[data-compare-mode]").textContent =
    mode === "overlay" ? "sobreposição" : "lado a lado";

  box.querySelector("[data-compare-profile]").textContent =
    String(profile || "—").toUpperCase();

  box.querySelector("[data-compare-renderers]").textContent =
    `${rendererCount || 1}/${simultaneousModels || 0}`;

  box.querySelector("[data-compare-systems]").textContent =
    `${systemA || "—"} × ${systemB || "—"}`;

  box.querySelector("[data-compare-load]").textContent =
    `${calls || 0} / ${Number(triangles || 0).toLocaleString("pt-BR")}`;
});

async function main() {
  $("#version-label").textContent = `v${APP_VERSION} · ${APP_STAGE}`;
  $("#metric-profile").textContent = graphics.activeProfile;

  performanceManager.start();

  try {
    const [modules, , , , structureIndex, collections, experienceGuides, demonstrationData] = await Promise.all([
      manager.loadCatalog(APP_CONFIG.catalogUrl),
      activities.loadCatalog("./data/activities.json"),
      journeys.loadCatalog("./data/journeys.json"),
      performanceBudget.load("./data/performance-budget.json"),
      assets.loadJson("./data/search-index-v0.38.json"),
      assets.loadJson("./data/catalog-collections-v0.38.json"),
      assets.loadJson("./data/experience-guides-v0.35.json"),
      assets.loadJson("./data/demonstration-sequences-v0.38.json")
    ]);

    catalogCollections=collections;
    immersiveExperience.setData(experienceGuides);
    demonstration.setData(demonstrationData);
    demonstration.setSequence(
      demonstrationData.sequences?.[0]?.id
    );

    catalogSearch.build({
      activities: activities.activities,
      structureIndex
    });
    populateCatalogCategories(modules);
    populateCatalogGenerations(modules);
    renderCatalog(modules);
    renderFeaturedExperiences();
    renderQuickAccess();

    const heroModules = $("#hero-module-count");
    const heroJourneys = $("#hero-journey-count");
    if (heroModules) heroModules.textContent = modules.length;
    if (heroJourneys) heroJourneys.textContent = journeys.journeys.length;
    renderCollectionHub();
    renderAreaHub();
    renderActiveActivity();
    renderToolsPanel();
    renderProgressPanel();
    renderJourney();
    renderPerformanceBudget(null);
    journeyPreloader.schedule(journeys.getActiveJourney(), journeys.getState());

    if (!journeys.getActiveJourney()) {
      const warmIds = [
        ...catalogLibrary.getFavorites(modules).map(x => x.id),
        ...catalogLibrary.getRecent(modules).map(x => x.module.id)
      ];
      journeyPreloader.warmCatalog(warmIds);
    }

    $("#projector-toggle").classList.toggle("active", accessibility.state.projector);
  } catch (error) {
    console.error(error);
    grid.innerHTML = `
      <article class="module-card">
        <h3>Catálogo indisponível</h3>
        <p>Use HTTP/HTTPS. No GitHub Pages funcionará normalmente.</p>
      </article>
    `;
  }
}

main();
