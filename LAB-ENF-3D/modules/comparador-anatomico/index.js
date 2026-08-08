let context=null,root=null,data=null,presetData=null,semanticData=null,markerCategoriesData=null,engine=null,loader=null,cameras=null,THREE=null;
let graphicsUnsub=null,frameUnsub=null,presentationCleanup=null,comparisonPerformance=null,historyManager=null,semanticSync=null,annotationManager=null,markerManager=null,markerStyleManager=null,reportManager=null,packageManager=null,packageCompatibility=null,packageHistory=null,sessionPreviewManager=null,customPresetManager=null,metricsUnsub=null;
let mode="side-by-side",rotating=false,syncEnabled=true,lastStructureKey="A",markerLinesEnabled=true;
let presetLessonFilter="all",presetCompetencyFilter="all",editingMarkerId=null,editingCustomPresetId=null,customPresetQuery="",customPresetTagFilter="all",pendingPackageData=null,pendingPackageHistoryId=null,pendingPackageFilename="";
let historyUrls=[],historyItems=new Map();

const sides={
  A:{systemId:"skeleton",structureId:"",root:null,guard:null,center:null,scale:1,opacity:1,highlight:null},
  B:{systemId:"muscular",structureId:"",root:null,guard:null,center:null,scale:1,opacity:1,highlight:null}
};

const safe=(s="")=>String(s).replace(/[&<>"']/g,c=>({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
}[c]));

const systems=()=>data?.systems||{};
const system=id=>systems()[id]||null;
const presets=()=>presetData?.presets||[];

function systemOptions(selected){
  return Object.values(systems()).map(item=>
    `<option value="${safe(item.id)}" ${item.id===selected?"selected":""}>${safe(item.label)}</option>`
  ).join("");
}

function structureOptions(side){
  const cfg=system(side.systemId);
  const structures=cfg?.structures||[];

  return `
    <option value="">Sistema completo</option>
    ${structures.map(item=>
      `<option value="${safe(item.mesh)}" ${item.mesh===side.structureId?"selected":""}>${safe(item.name)}</option>`
    ).join("")}
  `;
}

function structureItem(side){
  const cfg=system(side.systemId);
  return (cfg?.structures||[]).find(x=>x.mesh===side.structureId)||null;
}

function uniquePresetValues(key){
  return [...new Set(
    presets()
      .map(item=>item[key])
      .filter(Boolean)
  )].sort((a,b)=>
    String(a).localeCompare(
      String(b),
      "pt-BR"
    )
  );
}

function filteredPresets(){
  return presets().filter(item=>
    (presetLessonFilter==="all"||item.lesson===presetLessonFilter) &&
    (presetCompetencyFilter==="all"||item.competency===presetCompetencyFilter)
  );
}

function presetButtons(){
  const themes=presetData?.themes||[];
  const filtered=filteredPresets();

  if(!filtered.length){
    return '<div class="compare-preset-empty">Nenhum preset corresponde aos filtros atuais.</div>';
  }

  return themes.map(theme=>{
    const items=filtered.filter(
      item=>item.theme===theme.id
    );

    if(!items.length)return "";

    return `
      <section class="compare-preset-theme">
        <span class="compare-preset-theme-title">${safe(theme.label)}</span>
        <div class="compare-preset-grid">
          ${items.map(item=>`
            <button class="compare-preset" data-preset="${safe(item.id)}">
              <strong>${safe(item.label)}</strong>
              <span>${safe(item.description||"Comparação orientada.")}</span>
              ${item.lesson ? `<em>${safe(item.lesson)}</em>` : ""}
              ${item.competency ? `<small>${safe(item.competency)}</small>` : ""}
            </button>
          `).join("")}
        </div>
      </section>
    `;
  }).join("");
}

function renderPresetFilters(){
  const lesson=root?.querySelector("[data-preset-lesson]");
  const competency=root?.querySelector("[data-preset-competency]");
  const host=root?.querySelector("[data-preset-list]");

  if(lesson){
    const current=presetLessonFilter;
    lesson.innerHTML=`
      <option value="all">Todas as aulas</option>
      ${uniquePresetValues("lesson").map(value=>`
        <option value="${safe(value)}">${safe(value)}</option>
      `).join("")}
    `;
    lesson.value=[...lesson.options].some(x=>x.value===current)?current:"all";
    presetLessonFilter=lesson.value;
  }

  if(competency){
    const current=presetCompetencyFilter;
    competency.innerHTML=`
      <option value="all">Todas as competências</option>
      ${uniquePresetValues("competency").map(value=>`
        <option value="${safe(value)}">${safe(value)}</option>
      `).join("")}
    `;
    competency.value=[...competency.options].some(x=>x.value===current)?current:"all";
    presetCompetencyFilter=competency.value;
  }

  if(host){
    host.innerHTML=presetButtons();
  }
}

function otherKey(key){
  return key==="A"?"B":"A";
}

function updateSyncStatus(message="Sincronização pronta.",kind="idle"){
  const node=root?.querySelector("[data-semantic-status]");
  if(!node)return;

  node.textContent=message;
  node.dataset.kind=kind;
}

function syncEquivalentFrom(sourceKey){
  if(!syncEnabled||!semanticSync)return false;

  const source=sides[sourceKey];
  const targetKey=otherKey(sourceKey);
  const target=sides[targetKey];

  if(!source.structureId){
    updateSyncStatus(
      "Selecione uma estrutura para sincronizar.",
      "idle"
    );
    return false;
  }

  const match=semanticSync.equivalentFor(
    source.systemId,
    source.structureId,
    target.systemId
  );

  if(!match){
    updateSyncStatus(
      "Sem equivalente automático no sistema oposto atual.",
      "none"
    );
    return false;
  }

  target.structureId=match.structureId;

  const select=root.querySelector(
    `[data-structure-select="${targetKey}"]`
  );

  if(select){
    select.value=target.structureId;
  }

  applyStructureFilter(targetKey);

  updateSyncStatus(
    `Sincronizado: ${match.name}.`,
    "success"
  );

  return true;
}

function relationLabel(relation){
  if(relation==="equivalent")return "Equivalente";
  if(relation==="shared-organ-reference")return "Mesmo órgão — referência";
  if(relation==="functional-reference")return "Relação funcional";
  return "Referência regional";
}

function renderSemanticSuggestions(sourceKey){
  const host=root?.querySelector("[data-semantic-suggestions]");
  if(!host||!semanticSync)return [];

  const source=sides[sourceKey];

  if(!source.structureId){
    host.innerHTML='<span class="compare-suggestion-empty">Selecione uma estrutura em A ou B para ver sugestões.</span>';
    return [];
  }

  const targetKey=otherKey(sourceKey);
  const target=sides[targetKey];
  const suggestions=semanticSync.suggestions(
    source.systemId,
    source.structureId,
    {
      preferredTargetSystemId:target.systemId,
      includeEquivalent:true,
      includeRelated:true
    }
  );

  if(!suggestions.length){
    host.innerHTML='<span class="compare-suggestion-empty">Nenhuma equivalência ou relação adicional mapeada para esta estrutura.</span>';
    return [];
  }

  host.innerHTML=suggestions.map((item,index)=>`
    <button class="compare-suggestion ${item.preferred?"preferred":""}" data-apply-suggestion="${index}" data-source-key="${sourceKey}">
      <strong>${safe(item.name)}</strong>
      <span>${safe(system(item.systemId)?.label||item.systemId)} · ${safe(relationLabel(item.relation))}</span>
    </button>
  `).join("");

  host._semanticSuggestions=suggestions;
  return suggestions;
}

async function applySemanticSuggestion(sourceKey,index){
  const host=root?.querySelector("[data-semantic-suggestions]");
  const suggestions=host?._semanticSuggestions||[];
  const candidate=suggestions[Number(index)];
  if(!candidate)return false;

  const targetKey=otherKey(sourceKey);

  setSideSelection(targetKey,{
    systemId:candidate.systemId,
    structureId:candidate.structureId
  });

  await loadSide(targetKey);

  updateSyncStatus(
    `${relationLabel(candidate.relation)}: ${candidate.name}.`,
    candidate.relation==="equivalent"
      ?"success"
      :"related"
  );

  renderSemanticSuggestions(sourceKey);
  return true;
}

async function findRelatedFrom(sourceKey){
  const suggestions=renderSemanticSuggestions(sourceKey);

  if(!suggestions.length){
    updateSyncStatus(
      "Nenhuma sugestão mapeada para a estrutura atual.",
      "none"
    );
    return false;
  }

  updateSyncStatus(
    `${suggestions.length} sugestão(ões) encontrada(s). Escolha uma abaixo.`,
    suggestions.some(x=>x.relation==="equivalent")
      ?"success"
      :"related"
  );

  return true;
}


function customPresetItems(){
  return customPresetManager?.search?.(
    customPresetQuery,
    {tag:customPresetTagFilter}
  )||[];
}

function customPresetCards(){
  const items=
    customPresetItems();

  if(!items.length){
    return '<span class="compare-custom-empty">Nenhum preset personalizado corresponde aos filtros atuais.</span>';
  }

  return items.map(item=>`
    <article class="compare-custom-preset">
      <button class="compare-custom-preset-main" data-custom-preset-apply="${safe(item.id)}">
        <strong>${safe(item.label)}</strong>
        <span>${safe(item.lesson||"Sem aula informada")}</span>
        <small>${safe(item.competency||"Sem competência informada")}</small>
        ${item.tags?.length?`
          <span class="compare-custom-tags">
            ${item.tags.map(tag=>`<b>#${safe(tag)}</b>`).join("")}
          </span>
        `:""}
      </button>
      <div class="compare-custom-preset-card-actions">
        <button data-custom-preset-edit="${safe(item.id)}" aria-label="Editar preset ${safe(item.label)}">✎</button>
        <button data-custom-preset-duplicate="${safe(item.id)}" aria-label="Duplicar preset ${safe(item.label)}">⧉</button>
        <button data-custom-preset-delete="${safe(item.id)}" aria-label="Excluir preset ${safe(item.label)}">×</button>
      </div>
    </article>
  `).join("");
}

function renderCustomPresetFilters(){
  const tagSelect=
    root?.querySelector(
      "[data-custom-preset-tag-filter]"
    );

  if(tagSelect){
    const tags=
      customPresetManager?.allTags?.()||[];

    tagSelect.innerHTML=`
      <option value="all">Todas as tags</option>
      ${tags.map(tag=>`
        <option value="${safe(tag)}">#${safe(tag)}</option>
      `).join("")}
    `;

    const exists=
      [...tagSelect.options]
        .some(option=>
          option.value===customPresetTagFilter
        );

    tagSelect.value=
      exists
        ?customPresetTagFilter
        :"all";

    customPresetTagFilter=
      tagSelect.value;
  }

  const query=
    root?.querySelector(
      "[data-custom-preset-search]"
    );

  if(query&&query.value!==customPresetQuery){
    query.value=customPresetQuery;
  }
}

function renderCustomPresets(message=""){
  renderCustomPresetFilters();

  const host=
    root?.querySelector(
      "[data-custom-presets]"
    );

  if(host){
    host.innerHTML=
      customPresetCards();
  }

  const status=
    root?.querySelector(
      "[data-custom-preset-status]"
    );

  if(status){
    const total=
      customPresetManager?.list?.().length||0;

    const shown=
      customPresetItems().length;

    status.textContent=
      message||
      `${shown}/${total} preset(s) visível(is).`;
  }
}

function clearCustomPresetForm(){
  editingCustomPresetId=null;

  for(const selector of [
    "[data-custom-preset-name]",
    "[data-custom-preset-lesson]",
    "[data-custom-preset-competency]",
    "[data-custom-preset-tags]"
  ]){
    const input=root?.querySelector(selector);
    if(input)input.value="";
  }

  const updateState=
    root?.querySelector(
      "[data-custom-preset-update-state]"
    );

  if(updateState){
    updateState.checked=false;
  }

  const save=
    root?.querySelector(
      "[data-custom-preset-save]"
    );

  if(save){
    save.textContent=
      "Salvar comparação atual";
  }

  const cancel=
    root?.querySelector(
      "[data-custom-preset-cancel]"
    );

  if(cancel){
    cancel.hidden=true;
  }
}

function saveCustomPreset(){
  if(!customPresetManager)return;

  const label=
    root.querySelector("[data-custom-preset-name]")?.value||"";

  const lesson=
    root.querySelector("[data-custom-preset-lesson]")?.value||"";

  const competency=
    root.querySelector("[data-custom-preset-competency]")?.value||"";

  const tags=
    root.querySelector("[data-custom-preset-tags]")?.value||"";

  try{
    const wasEditing=
      Boolean(editingCustomPresetId);

    const existing=
      wasEditing
        ?customPresetManager?.get?.(
            editingCustomPresetId
          )
        :null;

    const updateState=
      Boolean(
        root.querySelector(
          "[data-custom-preset-update-state]"
        )?.checked
      );

    const item=
      customPresetManager.save({
        id:editingCustomPresetId,
        label,
        lesson,
        competency,
        tags,
        state:
          !wasEditing||updateState
            ?currentWorkspaceState()
            :(existing?.state||currentWorkspaceState())
      });

    clearCustomPresetForm();

    renderCustomPresets(
      wasEditing
        ?`Preset “${item.label}” atualizado.`
        :`Preset “${item.label}” salvo localmente.`
    );
  }catch(error){
    renderCustomPresets(
      error.message||String(error)
    );
  }
}

function editCustomPreset(id){
  const item=
    customPresetManager?.get?.(id);

  if(!item)return;

  editingCustomPresetId=id;

  const values={
    "[data-custom-preset-name]":
      item.label||"",
    "[data-custom-preset-lesson]":
      item.lesson||"",
    "[data-custom-preset-competency]":
      item.competency||"",
    "[data-custom-preset-tags]":
      (item.tags||[]).join(", ")
  };

  for(const [selector,value] of Object.entries(values)){
    const input=root?.querySelector(selector);
    if(input)input.value=value;
  }

  const save=
    root?.querySelector(
      "[data-custom-preset-save]"
    );

  if(save){
    save.textContent=
      "Atualizar preset";
  }

  const cancel=
    root?.querySelector(
      "[data-custom-preset-cancel]"
    );

  if(cancel){
    cancel.hidden=false;
  }

  const updateState=
    root?.querySelector(
      "[data-custom-preset-update-state]"
    );

  if(updateState){
    updateState.checked=false;
  }

  renderCustomPresets(
    `Editando “${item.label}”. Os dados A/B originais serão preservados, a menos que “Atualizar estado A/B” seja marcado.`
  );
}

function duplicateCustomPreset(id){
  try{
    const item=
      customPresetManager?.duplicate?.(id);

    renderCustomPresets(
      item
        ?`Preset duplicado como “${item.label}”.`
        :"Não foi possível duplicar o preset."
    );
  }catch(error){
    renderCustomPresets(
      error.message||String(error)
    );
  }
}

async function applyCustomPreset(id){
  const item=
    customPresetManager?.get?.(id);

  if(!item)return;

  const state=item.state||{};

  if(validSelection(state.systemA,state.structureA)){
    setSideSelection("A",{
      systemId:state.systemA,
      structureId:state.structureA||""
    });
  }

  if(validSelection(state.systemB,state.structureB)){
    setSideSelection("B",{
      systemId:state.systemB,
      structureId:state.structureB||""
    });
  }

  sides.A.opacity=
    Math.min(1,Math.max(.12,Number(state.opacityA)||1));

  sides.B.opacity=
    Math.min(1,Math.max(.12,Number(state.opacityB)||1));

  mode=
    state.mode==="overlay"
      ?"overlay"
      :"side-by-side";

  syncEnabled=
    Boolean(state.semanticSync);

  markerLinesEnabled=
    state.markerLines !== false;

  const syncToggle=
    root.querySelector("[data-semantic-sync]");
  if(syncToggle)syncToggle.checked=syncEnabled;

  const lineToggle=
    root.querySelector("[data-marker-lines]");
  if(lineToggle)lineToggle.checked=markerLinesEnabled;

  root.querySelector(".compare-main-stage")
    ?.classList.toggle(
      "hide-marker-lines",
      !markerLinesEnabled
    );

  await reloadBoth();
  setMode(mode,{keepOpacity:true});

  root.querySelector("[data-active-preset]").textContent=
    item.label;

  renderCustomPresets(
    `Preset “${item.label}” aplicado.`
  );
}

function exportCustomPresets(){
  if(!customPresetManager)return;

  const payload=
    customPresetManager.exportData();

  const blob=
    new Blob(
      [JSON.stringify(payload,null,2)],
      {type:"application/json;charset=utf-8"}
    );

  downloadBlob(
    blob,
    "presets-comparador-enfermagem.json"
  );

  renderCustomPresets(
    "Presets personalizados exportados."
  );
}

async function importCustomPresets(file){
  if(!file||!customPresetManager)return;

  const data=
    JSON.parse(await file.text());

  customPresetManager.importData(data);

  renderCustomPresets(
    "Presets personalizados importados."
  );
}

function renderMarkerStyleEditor(categoryId=null){
  const category=
    categoryId||
    root?.querySelector("[data-style-category]")?.value||
    "structure";

  const style=
    markerStyleManager?.get?.(category);

  if(!style)return;

  const select=
    root?.querySelector("[data-style-category]");

  if(select){
    select.innerHTML=
      markerCategoryOptions(category);
    select.value=category;
  }

  const color=
    root?.querySelector("[data-style-color]");

  if(color){
    color.value=style.color;
  }

  const icon=
    root?.querySelector("[data-style-icon]");

  if(icon){
    icon.value=style.icon||"●";
  }

  const preview=
    root?.querySelector("[data-style-preview]");

  if(preview){
    preview.style.setProperty(
      "--preview-color",
      style.color
    );
    preview.innerHTML=
      `<b>${safe(style.icon||"●")}</b><span>${safe(style.label||category)}</span>`;
  }
}

function saveMarkerStyle(){
  if(!markerStyleManager)return;

  const category=
    root.querySelector("[data-style-category]")?.value||"structure";

  const color=
    root.querySelector("[data-style-color]")?.value||"#63e6be";

  const icon=
    root.querySelector("[data-style-icon]")?.value||"●";

  markerStyleManager.set(
    category,
    {color,icon}
  );

  markerManager?.renderAll();
  renderMarkerStyleEditor(category);
  updateMarkerUi("Estilo da categoria salvo localmente.");
}

function resetMarkerStyle(){
  if(!markerStyleManager)return;

  const category=
    root.querySelector("[data-style-category]")?.value||"structure";

  markerStyleManager.reset(category);
  markerManager?.renderAll();
  renderMarkerStyleEditor(category);
  updateMarkerUi("Estilo da categoria restaurado.");
}

function markerCategoryOptions(selected="structure"){
  return (markerManager?.categories?.()||markerCategoriesData?.categories||[
    {id:"structure",label:"Estrutura"},
    {id:"attention",label:"Atenção"},
    {id:"relation",label:"Relação"},
    {id:"question",label:"Dúvida"}
  ]).map(item=>
    `<option value="${safe(item.id)}" ${item.id===selected?"selected":""}>${safe(item.label)}</option>`
  ).join("");
}

function openMarkerEditor(marker){
  if(!marker)return;

  editingMarkerId=marker.id;

  const panel=root?.querySelector("[data-marker-editor]");
  const text=root?.querySelector("[data-marker-edit-text]");
  const category=root?.querySelector("[data-marker-edit-category]");

  if(!panel||!text||!category)return;

  panel.hidden=false;
  text.value=marker.text||"";
  category.innerHTML=
    markerCategoryOptions(marker.category||"structure");
  category.value=marker.category||"structure";
  text.focus();
}

function closeMarkerEditor(){
  editingMarkerId=null;
  const panel=root?.querySelector("[data-marker-editor]");
  if(panel)panel.hidden=true;
}

function saveMarkerEditor(){
  if(!editingMarkerId)return;

  const text=root?.querySelector("[data-marker-edit-text]")?.value||"";
  const category=root?.querySelector("[data-marker-edit-category]")?.value||"structure";

  const updated=markerManager?.update(
    editingMarkerId,
    {text,category}
  );

  if(updated){
    updateMarkerUi("Marcador atualizado.");
    closeMarkerEditor();
  }
}

function repositionEditingMarker(){
  if(!editingMarkerId)return;

  if(markerManager?.armReposition(editingMarkerId)){
    updateMarkerUi(
      "Reposicionamento ativo: clique na nova estrutura/ponto da cena."
    );
    closeMarkerEditor();
  }
}

function deleteEditingMarker(){
  if(!editingMarkerId)return;

  markerManager?.remove(editingMarkerId);
  closeMarkerEditor();
  updateMarkerUi("Marcador excluído.");
}

function annotationValue(){
  return annotationManager?.normalize(
    root?.querySelector("[data-comparison-annotation]")?.value||""
  )||"";
}

function updateAnnotationCount(){
  const input=root?.querySelector("[data-comparison-annotation]");
  const counter=root?.querySelector("[data-annotation-count]");

  if(!input||!counter)return;

  counter.textContent=
    `${input.value.length}/${annotationManager?.maxLength||420}`;
}

function wrapCanvasText(ctx,text,x,y,maxWidth,lineHeight,maxLines=3){
  const words=String(text||"").split(/\s+/).filter(Boolean);
  let line="";
  let lines=0;

  for(const word of words){
    const candidate=line?`${line} ${word}`:word;

    if(ctx.measureText(candidate).width>maxWidth&&line){
      ctx.fillText(line,x,y+lines*lineHeight);
      lines+=1;
      line=word;

      if(lines>=maxLines-1)break;
    }else{
      line=candidate;
    }
  }

  if(line&&lines<maxLines){
    ctx.fillText(line,x,y+lines*lineHeight);
    lines+=1;
  }

  return lines;
}

async function buildExportBlob(){
  if(!engine?.renderer)return null;

  engine.renderer.render(
    engine.scene,
    engine.camera
  );

  const source=engine.canvas;
  const width=source.width;
  const header=Math.max(112,Math.round(width*.085));
  const annotation=annotationValue();
  const footer=annotation
    ?Math.max(118,Math.round(width*.09))
    :Math.max(72,Math.round(width*.055));

  const canvas=document.createElement("canvas");
  canvas.width=width;
  canvas.height=source.height+header+footer;

  const ctx2d=canvas.getContext("2d");
  if(!ctx2d)return null;

  ctx2d.fillStyle="#07131f";
  ctx2d.fillRect(0,0,canvas.width,canvas.height);
  ctx2d.drawImage(source,0,header,width,source.height);

  const exportMarkers=
    markerManager?.exportMarkers(
      width,
      source.height
    )||[];

  for(const marker of exportMarkers){
    const markerX=marker.x;
    const markerY=header+marker.y;
    const fallbackColors={
      structure:marker.side==="A"?"#63e6be":"#ff8da1",
      attention:"#ffd166",
      relation:"#74c0fc",
      question:"#c0a7ff"
    };

    const markerColor=
      marker.categoryStyle?.color||
      fallbackColors[marker.category]||
      fallbackColors.structure;

    const [rawDx,rawDy]=
      Array.isArray(marker.labelOffset)
        ?marker.labelOffset
        :[18,-24];

    const canvasRect=
      engine.canvas.getBoundingClientRect();

    const dx=
      rawDx*
      (width/(canvasRect.width||width));

    const dy=
      rawDy*
      (source.height/(canvasRect.height||source.height));

    if(markerLinesEnabled){
      ctx2d.strokeStyle=markerColor;
      ctx2d.lineWidth=2;
      ctx2d.beginPath();
      ctx2d.moveTo(markerX,markerY);
      ctx2d.lineTo(markerX+dx,markerY+dy);
      ctx2d.stroke();
    }

    ctx2d.fillStyle=markerColor;
    ctx2d.beginPath();
    ctx2d.arc(markerX,markerY,7,0,Math.PI*2);
    ctx2d.fill();

    const icon=
      marker.categoryStyle?.icon||"";

    const label=
      `${icon ? `${icon} ` : ""}${String(marker.text||"")}`
        .slice(0,72);
    const labelFont=Math.max(12,Math.round(width*.011));
    ctx2d.font=`600 ${labelFont}px sans-serif`;

    const textWidth=Math.min(
      width*.36,
      ctx2d.measureText(label).width+18
    );

    const labelX=Math.max(
      8,
      Math.min(
        width-textWidth-8,
        markerX+dx
      )
    );

    const labelY=Math.max(
      header+8,
      Math.min(
        header+source.height-labelFont-20,
        markerY+dy
      )
    );

    ctx2d.fillStyle="rgba(7,19,31,.88)";
    ctx2d.fillRect(
      labelX,
      labelY,
      textWidth,
      labelFont+12
    );

    ctx2d.strokeStyle=markerColor;
    ctx2d.lineWidth=2;
    ctx2d.strokeRect(
      labelX,
      labelY,
      textWidth,
      labelFont+12
    );

    ctx2d.fillStyle="#f3f7fa";
    ctx2d.fillText(
      label,
      labelX+8,
      labelY+6,
      Math.max(10,textWidth-16)
    );
  }

  const itemA=structureItem(sides.A);
  const itemB=structureItem(sides.B);
  const labelA=itemA?.name||system(sides.A.systemId)?.label||"A";
  const labelB=itemB?.name||system(sides.B.systemId)?.label||"B";
  const pad=Math.max(24,Math.round(width*.025));
  const fontBase=Math.max(18,Math.round(width*.018));

  ctx2d.textBaseline="top";
  ctx2d.font=`700 ${fontBase}px sans-serif`;
  ctx2d.fillStyle="#f3f7fa";
  ctx2d.fillText("Comparação Anatômica G3",pad,Math.round(header*.18));

  const legendY=Math.round(header*.56);
  const box=Math.max(14,Math.round(fontBase*.72));

  ctx2d.fillStyle="#63e6be";
  ctx2d.fillRect(pad,legendY,box,box);
  ctx2d.fillStyle="#d9e5ed";
  ctx2d.font=`600 ${Math.max(15,Math.round(fontBase*.78))}px sans-serif`;
  ctx2d.fillText(`A — ${labelA}`,pad+box+10,legendY-2);

  const mid=Math.round(width*.52);
  ctx2d.fillStyle="#ff8da1";
  ctx2d.fillRect(mid,legendY,box,box);
  ctx2d.fillStyle="#d9e5ed";
  ctx2d.fillText(`B — ${labelB}`,mid+box+10,legendY-2);

  const footerY=header+source.height;
  ctx2d.fillStyle="#0b1c2a";
  ctx2d.fillRect(0,footerY,width,footer);

  ctx2d.fillStyle="#9db1c2";
  ctx2d.font=`500 ${Math.max(13,Math.round(fontBase*.66))}px sans-serif`;

  const modeLabel=mode==="overlay"?"Sobreposição A/B":"Lado a lado";
  const profile=comparisonPerformance?.resolveProfile?.()?.toUpperCase?.()||"—";
  ctx2d.fillText(
    `${modeLabel} · Perfil ${profile} · ${new Date().toLocaleString("pt-BR")}`,
    pad,
    footerY+Math.round(footer*.16)
  );

  if(annotation){
    ctx2d.fillStyle="#f3f7fa";
    ctx2d.font=`600 ${Math.max(13,Math.round(fontBase*.68))}px sans-serif`;
    ctx2d.fillText("Anotação:",pad,footerY+Math.round(footer*.43));

    ctx2d.fillStyle="#c7d4dc";
    ctx2d.font=`400 ${Math.max(12,Math.round(fontBase*.62))}px sans-serif`;
    wrapCanvasText(
      ctx2d,
      annotation,
      pad+Math.round(fontBase*4.3),
      footerY+Math.round(footer*.41),
      width-pad*2-Math.round(fontBase*4.3),
      Math.max(16,Math.round(fontBase*.82)),
      3
    );
  }

  return new Promise(resolve=>
    canvas.toBlob(resolve,"image/png")
  );
}

function updateSideInfo(key){
  const side=sides[key];
  const cfg=system(side.systemId);
  const item=structureItem(side);

  root.querySelector(`[data-system-label="${key}"]`).textContent=cfg?.label||"—";
  root.querySelector(`[data-structure-description="${key}"]`).innerHTML=item
    ? `<strong>${safe(item.name)}</strong><span>${safe(item.description||"Estrutura selecionada para comparação.")}</span>`
    : `<strong>Sistema completo</strong><span>Selecione uma estrutura específica para isolar e destacar esse elemento.</span>`;
}

function populateStructureSelect(key){
  const select=root.querySelector(`[data-structure-select="${key}"]`);
  const side=sides[key];
  select.innerHTML=structureOptions(side);
  select.disabled=!(system(side.systemId)?.structures||[]).length;
  updateSideInfo(key);
}

function refreshHighlight(key){
  const side=sides[key];
  side.highlight?.clear();

  if(side.root&&side.structureId){
    side.highlight?.highlight(
      side.root,
      side.structureId,
      {color:key==="A"?0x63e6be:0xff8da1}
    );
  }
}

function applyStructureFilter(key){
  const side=sides[key];
  if(!side.root)return;

  side.root.traverse(child=>{
    if(!child.isMesh)return;
    child.visible=!side.structureId||child.name===side.structureId;
  });

  refreshHighlight(key);
  updateSideInfo(key);
}

function applyOpacity(key){
  const side=sides[key];
  if(!side.root)return;

  side.root.traverse(child=>{
    if(!child.isMesh)return;

    const materials=Array.isArray(child.material)
      ?child.material
      :[child.material];

    for(const material of materials){
      if(!material)continue;

      const base=
        material.userData.compareBaseOpacity ??
        material.opacity ??
        1;

      material.userData.compareBaseOpacity=base;
      material.transparent=side.opacity<1||base<1;
      material.opacity=Math.min(1,base*side.opacity);
      material.depthWrite=material.opacity>=.98;
      material.needsUpdate=true;
    }
  });

  const label=root.querySelector(`[data-opacity-value="${key}"]`);
  if(label)label.textContent=`${Math.round(side.opacity*100)}%`;
}

function applyComparisonRendererProfile(){
  if(!engine?.renderer||!comparisonPerformance)return;

  const factor=comparisonPerformance.renderScaleFactor();
  const settings=context.graphics.settings;
  const maxPixel=settings.maxPixelRatio||1;
  const base=Math.min(window.devicePixelRatio||1,maxPixel);

  engine.renderer.setPixelRatio(
    Math.max(.55,base*factor)
  );
  engine.resize();

  const summary=comparisonPerformance.summary();

  root.querySelector("[data-comparison-profile]").textContent=
    `${String(summary.comparisonProfile).toUpperCase()} · 1 renderer`;
}

function applyLayout(){
  for(const [key,side] of Object.entries(sides)){
    if(!side.root||!side.center)continue;

    const layoutScale=
      mode==="overlay"
        ?0.92
        :0.62;

    const scale=side.scale*layoutScale;
    const xOffset=
      mode==="overlay"
        ?0
        :(key==="A"?-1.72:1.72);

    side.root.scale.setScalar(scale);
    side.root.position.set(
      -side.center.x*scale+xOffset,
      -side.center.y*scale,
      -side.center.z*scale+.35
    );
  }

  root.classList.toggle(
    "overlay-mode",
    mode==="overlay"
  );

  root.querySelectorAll("[data-mode]").forEach(btn=>
    btn.classList.toggle(
      "active",
      btn.dataset.mode===mode
    )
  );

  for(const key of ["A","B"]){
    refreshHighlight(key);
  }

  const note=root.querySelector("[data-mode-note]");

  if(note){
    note.textContent=
      mode==="overlay"
        ?"Sobreposição ativa: ajuste as opacidades de A e B para observar coincidências e diferenças espaciais."
        :"Lado a lado: os dois modelos são normalizados visualmente e posicionados em paralelo.";
  }
}

async function loadSide(key){
  const side=sides[key];
  const cfg=system(side.systemId);
  if(!cfg)return;

  const token=side.guard.begin();
  const url=comparisonPerformance.chooseVariant(
    cfg.variants
  );

  const gltf=await loader.load(url);

  if(!side.guard.isCurrent(token)){
    side.guard.disposeObject(gltf.scene);
    return;
  }

  side.highlight?.clear();

  if(side.root){
    engine.scene.remove(side.root);
    engine.disposeObject(side.root);
  }

  side.root=gltf.scene;

  const {applyAnatomyMaterialPreset}=
    await import("../../engines/AnatomyMaterialPreset.js");

  applyAnatomyMaterialPreset({
    root:side.root,
    engine,
    THREE,
    system:cfg.materialSystem||"skeleton"
  });

  const box=new THREE.Box3().setFromObject(side.root);
  side.center=box.getCenter(new THREE.Vector3());

  const size=box.getSize(new THREE.Vector3());
  side.scale=
    4.4/Math.max(size.x,size.y,size.z);

  engine.scene.add(side.root);

  applyLayout();
  applyStructureFilter(key);
  applyOpacity(key);

  root.querySelector(`[data-system-meta="${key}"]`).textContent=
    `${comparisonPerformance.resolveProfile().toUpperCase()} · ${url.split("/").pop()}`;
}

async function reloadBoth(){
  await Promise.allSettled([
    loadSide("A"),
    loadSide("B")
  ]);

  applyComparisonRendererProfile();
}

function setMode(next,{keepOpacity=false}={}){
  mode=
    next==="overlay"
      ?"overlay"
      :"side-by-side";

  if(!keepOpacity){
    if(mode==="overlay"){
      if(sides.A.opacity>=.98)sides.A.opacity=.72;
      if(sides.B.opacity>=.98)sides.B.opacity=.58;
    }else{
      sides.A.opacity=1;
      sides.B.opacity=1;
    }
  }

  for(const key of ["A","B"]){
    const range=root.querySelector(
      `[data-opacity="${key}"]`
    );

    if(range)range.value=sides[key].opacity;
    applyOpacity(key);
  }

  applyLayout();
}

function setSideSelection(key,{systemId,structureId=""}){
  const side=sides[key];
  side.systemId=systemId;
  side.structureId=structureId||"";

  const systemSelect=root.querySelector(
    `[data-system-select="${key}"]`
  );

  systemSelect.value=side.systemId;
  populateStructureSelect(key);

  const structureSelect=root.querySelector(
    `[data-structure-select="${key}"]`
  );

  if(
    [...structureSelect.options]
      .some(option=>option.value===side.structureId)
  ){
    structureSelect.value=side.structureId;
  }else{
    side.structureId="";
    structureSelect.value="";
  }
}

async function applyPreset(id){
  const preset=presets().find(x=>x.id===id);
  if(!preset)return;

  setSideSelection("A",preset.A);
  setSideSelection("B",preset.B);

  sides.A.opacity=
    Number.isFinite(preset.opacityA)
      ?preset.opacityA
      :1;

  sides.B.opacity=
    Number.isFinite(preset.opacityB)
      ?preset.opacityB
      :1;

  mode=
    preset.mode==="overlay"
      ?"overlay"
      :"side-by-side";

  await reloadBoth();
  setMode(mode,{keepOpacity:true});

  if(preset.view){
    cameras?.go(preset.view);
  }

  root.querySelectorAll("[data-preset]").forEach(btn=>
    btn.classList.toggle(
      "active",
      btn.dataset.preset===id
    )
  );

  root.querySelector("[data-active-preset]").textContent=
    preset.label;
}

function swapSides(){
  const snapshotA={
    systemId:sides.A.systemId,
    structureId:sides.A.structureId
  };

  const snapshotB={
    systemId:sides.B.systemId,
    structureId:sides.B.structureId
  };

  setSideSelection("A",snapshotB);
  setSideSelection("B",snapshotA);

  reloadBoth();
}

function defaultExportBase(){
  const labelA=
    structureItem(sides.A)?.name ||
    system(sides.A.systemId)?.label ||
    "A";

  const labelB=
    structureItem(sides.B)?.name ||
    system(sides.B.systemId)?.label ||
    "B";

  return `comparacao-anatomica-${labelA}-${labelB}`;
}

function exportBaseName(){
  const custom=
    root?.querySelector("[data-export-name]")?.value||"";

  const source=(
    custom.trim() ||
    defaultExportBase()
  ).replace(/\.(png|html?)$/i,"");

  return reportManager?.sanitizeFilename(source)
    || source
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"")
      .replace(/[^a-zA-Z0-9._-]+/g,"-")
      .replace(/-+/g,"-")
      .toLowerCase();
}

function captureFilename(extension="png"){
  return `${exportBaseName()}.${extension}`;
}
function downloadBlob(blob,filename){
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download=filename;
  a.click();

  setTimeout(()=>{
    URL.revokeObjectURL(url);
  },1200);
}

function clearHistoryUrls(){
  historyUrls.forEach(url=>
    URL.revokeObjectURL(url)
  );
  historyUrls=[];
  historyItems.clear();
}

async function renderHistory(){
  const host=root?.querySelector(
    "[data-comparison-history]"
  );

  if(!host||!historyManager)return;

  clearHistoryUrls();

  try{
    const items=await historyManager.list();

    if(!items.length){
      host.innerHTML=
        '<div class="compare-history-empty">As últimas vistas PNG salvas localmente aparecerão aqui.</div>';
      return;
    }

    host.innerHTML=items.map(item=>{
      const url=URL.createObjectURL(item.blob);
      historyUrls.push(url);
      historyItems.set(item.id,item);

      const meta=item.metadata||{};
      const created=new Date(item.createdAt);

      return `
        <article class="compare-history-item">
          <img src="${url}" alt="Vista anatômica salva">
          <div>
            <strong>${safe(meta.label||"Comparação anatômica")}</strong>
            <span>${safe(Number.isNaN(created.getTime())?"":created.toLocaleString("pt-BR"))}</span>
            ${meta.annotation ? `<small>${safe(meta.annotation)}</small>` : ""}
          </div>
          <div class="compare-history-actions">
            <button data-history-download="${safe(item.id)}">PNG</button>
            <button data-history-html="${safe(item.id)}">Ficha HTML</button>
            <button data-history-delete="${safe(item.id)}">Excluir</button>
          </div>
        </article>
      `;
    }).join("");
  }catch(error){
    console.warn("Histórico do comparador indisponível.",error);
    host.innerHTML=
      '<div class="compare-history-empty">Histórico local indisponível neste navegador.</div>';
  }
}

async function exportPng(){
  const blob=await buildExportBlob();
  if(!blob)return;

  const filename=captureFilename();
  const itemA=structureItem(sides.A);
  const itemB=structureItem(sides.B);
  const annotation=annotationValue();

  await historyManager?.save({
    blob,
    metadata:{
      filename,
      reportTitle:root?.querySelector("[data-export-name]")?.value?.trim()||null,
      label:`${itemA?.name||system(sides.A.systemId)?.label||"A"} × ${itemB?.name||system(sides.B.systemId)?.label||"B"}`,
      labelA:itemA?.name||system(sides.A.systemId)?.label||"A",
      labelB:itemB?.name||system(sides.B.systemId)?.label||"B",
      systemLabelA:system(sides.A.systemId)?.label||sides.A.systemId,
      systemLabelB:system(sides.B.systemId)?.label||sides.B.systemId,
      systemA:sides.A.systemId,
      structureA:sides.A.structureId||null,
      systemB:sides.B.systemId,
      structureB:sides.B.structureId||null,
      mode,
      opacityA:sides.A.opacity,
      opacityB:sides.B.opacity,
      annotation:annotation||null,
      markers:markerManager?.visibleList?.()||[],
      embeddedLegend:true,
      semanticSync:syncEnabled,
      comparisonProfile:
        comparisonPerformance?.resolveProfile?.()||null
    }
  });

  downloadBlob(blob,filename);
  await renderHistory();
}

function comparisonSnapshot(){
  const itemA=structureItem(sides.A);
  const itemB=structureItem(sides.B);

  return {
    labelA:itemA?.name||system(sides.A.systemId)?.label||"A",
    labelB:itemB?.name||system(sides.B.systemId)?.label||"B",
    systemLabelA:system(sides.A.systemId)?.label||sides.A.systemId,
    systemLabelB:system(sides.B.systemId)?.label||sides.B.systemId,
    mode,
    modeLabel:mode==="overlay"?"Sobreposição A/B":"Lado a lado",
    profile:comparisonPerformance?.resolveProfile?.()?.toUpperCase?.()||"—",
    semanticSync:syncEnabled,
    annotation:annotationValue(),
    markers:markerManager?.visibleList?.()||[],
    createdAt:new Date().toLocaleString("pt-BR")
  };
}

async function exportHtmlReport(){
  if(!reportManager)return;

  const blob=await buildExportBlob();
  if(!blob)return;

  const imageDataUrl=
    await reportManager.blobToDataUrl(blob);

  const snapshot=comparisonSnapshot();
  const title=
    root?.querySelector("[data-export-name]")?.value?.trim()
    ||"Ficha Comparativa Anatômica";

  const html=reportManager.buildHtml({
    title,
    imageDataUrl,
    snapshot
  });

  reportManager.downloadHtml(
    html,
    captureFilename("html")
  );
}

async function exportHistoryHtml(item){
  if(!item?.blob||!reportManager)return;

  const meta=item.metadata||{};
  const imageDataUrl=
    await reportManager.blobToDataUrl(item.blob);

  const labelParts=
    String(meta.label||"Comparação anatômica")
      .split(" × ");

  const snapshot={
    labelA:meta.labelA||labelParts[0]||"A",
    labelB:meta.labelB||labelParts[1]||"B",
    systemLabelA:meta.systemLabelA||meta.systemA||"",
    systemLabelB:meta.systemLabelB||meta.systemB||"",
    mode:meta.mode||"side-by-side",
    modeLabel:
      meta.mode==="overlay"
        ?"Sobreposição A/B"
        :"Lado a lado",
    profile:
      String(meta.comparisonProfile||"—")
        .toUpperCase(),
    semanticSync:Boolean(meta.semanticSync),
    annotation:meta.annotation||"",
    markers:
      Array.isArray(meta.markers)
        ?meta.markers
        :[],
    createdAt:
      new Date(item.createdAt)
        .toLocaleString("pt-BR")
  };

  const title=
    meta.reportTitle||
    meta.filename?.replace(/\\.png$/i,"")||
    "Ficha Comparativa Anatômica";

  const html=
    reportManager.buildHtml({
      title,
      imageDataUrl,
      snapshot
    });

  reportManager.downloadHtml(
    html,
    `${reportManager.sanitizeFilename(title)}.html`
  );
}




function renderPackageHistory(message=""){
  const host=
    root?.querySelector(
      "[data-package-history]"
    );

  if(!host||!packageHistory)return;

  const items=
    packageHistory.list();

  host.innerHTML=items.length
    ?items.map(item=>`
      <article class="compare-package-history-item">
        <strong>${safe(item.filename)}</strong>
        <span>v${safe(item.sourceAppVersion||"?")} · ${item.markers} marcador(es)</span>
        <small>${item.compatible?"Compatível":"Com incompatibilidades"}${item.applied?" · aplicado":""} · ${safe(new Date(item.checkedAt).toLocaleString("pt-BR"))}</small>
      </article>
    `).join("")
    :'<span class="compare-custom-empty">Nenhum pacote analisado ainda.</span>';

  const status=
    root?.querySelector(
      "[data-package-history-status]"
    );

  if(status&&message){
    status.textContent=message;
  }
}


function sessionPreviewHtml(preview){
  if(!preview)return "";

  const c=preview.current||{};
  const i=preview.incoming||{};
  const changes=preview.changes||[];

  const categoryLabels={
    structure:"Estrutura",
    attention:"Atenção",
    relation:"Relação",
    question:"Dúvida"
  };

  const markerParts=
    Object.entries(
      preview.markers?.categories||{}
    )
      .map(([key,value])=>
        `${safe(categoryLabels[key]||key)}: ${value}`
      )
      .join(" · ");

  const row=(label,current,incoming,changed=true)=>`
    <div class="compare-session-preview-row ${changed?"changed":"same"}">
      <span>${safe(label)}</span>
      <b>${safe(current??"—")}</b>
      <strong>→</strong>
      <b>${safe(incoming??"—")}</b>
    </div>
  `;

  const lookup=new Map(
    changes.map(item=>[
      item.key,
      item
    ])
  );

  const rows=[
    row(
      "Sistema A",
      c.systemLabelA,
      i.systemLabelA,
      lookup.has("systemA")
    ),
    row(
      "Estrutura A",
      c.structureLabelA,
      i.structureLabelA,
      lookup.has("structureA")
    ),
    row(
      "Sistema B",
      c.systemLabelB,
      i.systemLabelB,
      lookup.has("systemB")
    ),
    row(
      "Estrutura B",
      c.structureLabelB,
      i.structureLabelB,
      lookup.has("structureB")
    ),
    row(
      "Modo",
      c.modeLabel,
      i.modeLabel,
      lookup.has("mode")
    ),
    row(
      "Opacidade A",
      c.opacityLabelA,
      i.opacityLabelA,
      lookup.has("opacityA")
    ),
    row(
      "Opacidade B",
      c.opacityLabelB,
      i.opacityLabelB,
      lookup.has("opacityB")
    ),
    row(
      "Sincronização",
      c.semanticSync?"Ativa":"Desativada",
      i.semanticSync?"Ativa":"Desativada",
      lookup.has("semanticSync")
    ),
    row(
      "Linhas-guia",
      c.markerLines?"Ativas":"Ocultas",
      i.markerLines?"Ativas":"Ocultas",
      lookup.has("markerLines")
    )
  ].join("");

  return `
    <section class="compare-session-preview">
      <div class="compare-section-head">
        <div>
          <span class="eyebrow">Prévia sem alterar a cena</span>
          <strong>Estado atual × sessão importada</strong>
        </div>
        <span class="compare-preview-change-count">${preview.changedCount} mudança(s)</span>
      </div>

      <div class="compare-session-preview-columns">
        <span>Campo</span>
        <span>Atual</span>
        <span></span>
        <span>Sessão</span>
      </div>

      <div class="compare-session-preview-rows">
        ${rows}
      </div>

      <div class="compare-session-preview-meta">
        <span><b>${preview.markers?.count||0}</b> marcador(es) no pacote${markerParts?` · ${safe(markerParts)}`:""}</span>
        <span>${preview.annotation?"Com anotação":"Sem anotação"} · ${preview.hasMarkerStyles?"com estilos":"sem estilos"} · ${preview.customPresetCount||0} preset(s) local(is)</span>
        ${preview.exportName?`<span>Nome de exportação: <b>${safe(preview.exportName)}</b></span>`:""}
      </div>

      <small>A prévia acima é somente leitura. A comparação 3D atual permanece intacta até você tocar em “Aplicar pacote”.</small>
    </section>
  `;
}

function renderMarkerCategoryVisibility(){
  const host=
    root?.querySelector(
      "[data-marker-visibility]"
    );

  if(!host||!markerManager)return;

  host.innerHTML=
    markerManager.categories().map(item=>`
      <label class="compare-marker-visibility-item">
        <input
          type="checkbox"
          data-marker-category-visible="${safe(item.id)}"
          ${markerManager.isCategoryVisible(item.id)?"checked":""}
        >
        <span>${safe(item.icon||"●")}</span>
        <b>${safe(item.label)}</b>
      </label>
    `).join("");
}
function compatibilityHtml(result){
  const s=result?.summary||{};
  const issues=result?.issues||[];
  const warnings=result?.warnings||[];

  return `
    <div class="compare-compatibility-summary ${result?.compatible?"compatible":"incompatible"}">
      <strong>${result?.compatible?"Pacote compatível":"Pacote com incompatibilidades"}</strong>
      <span>Origem: v${safe(s.sourceAppVersion||"?")} · ${s.markers||0} marcador(es) · ${s.compatibleMarkers||0} compatível(is) · ${s.customPresetCount||0} preset(s) local(is)${s.hasMarkerStyles?" · estilos incluídos":""}</span>
    </div>
    ${issues.length?`
      <div class="compare-compatibility-list error">
        <b>Bloqueios</b>
        <ul>${issues.map(item=>`<li>${safe(item)}</li>`).join("")}</ul>
      </div>
    `:""}
    ${warnings.length?`
      <div class="compare-compatibility-list warning">
        <b>Avisos</b>
        <ul>${warnings.slice(0,8).map(item=>`<li>${safe(item)}</li>`).join("")}</ul>
      </div>
    `:""}
  `;
}

function showPackageCompatibility(payload){
  pendingPackageData=payload;

  const panel=
    root?.querySelector(
      "[data-package-compatibility]"
    );

  const body=
    root?.querySelector(
      "[data-package-compatibility-body]"
    );

  if(!panel||!body)return null;

  const result=
    packageCompatibility?.inspect?.(payload);

  const preview=
    sessionPreviewManager?.buildPreview?.({
      currentState:currentWorkspaceState(),
      packageData:payload
    });

  panel.hidden=false;
  panel.dataset.compatible=
    result?.compatible?"true":"false";
  body.innerHTML=
    compatibilityHtml(result)+
    sessionPreviewHtml(preview);

  const apply=
    panel.querySelector(
      "[data-package-apply]"
    );

  if(apply){
    apply.disabled=
      !result?.compatible;
  }

  return result;
}

function closePackageCompatibility(){
  pendingPackageData=null;
  pendingPackageHistoryId=null;
  pendingPackageFilename="";
  const panel=
    root?.querySelector(
      "[data-package-compatibility]"
    );
  if(panel)panel.hidden=true;
}

function currentWorkspaceState(){
  return {
    systemA:sides.A.systemId,
    structureA:sides.A.structureId||null,
    systemB:sides.B.systemId,
    structureB:sides.B.structureId||null,
    mode,
    opacityA:sides.A.opacity,
    opacityB:sides.B.opacity,
    semanticSync:syncEnabled,
    markerLines:markerLinesEnabled
  };
}

function exportWorkspacePackage(){
  if(!packageManager)return;

  const exportName=
    root?.querySelector("[data-export-name]")?.value||"";

  const payload=packageManager.build({
    appVersion:"0.34.0",
    annotation:annotationValue(),
    markers:markerManager?.list?.()||[],
    exportName,
    state:currentWorkspaceState(),
    markerStyles:
      markerStyleManager?.exportData?.()||null,
    customPresets:
      customPresetManager?.exportData?.()||null,
    presetFilters:{
      lesson:presetLessonFilter,
      competency:presetCompetencyFilter
    },
    markerVisibility:
      markerManager?.visibleCategories?.()||null
  });

  packageManager.download(
    payload,
    `${reportManager?.sanitizeFilename(exportName||"comparador-anotacoes")||"comparador-anotacoes"}.json`
  );

  updateMarkerUi(
    "Pacote local de anotações exportado."
  );
}

function validSelection(systemId,structureId){
  const cfg=system(systemId);
  if(!cfg)return false;
  if(!structureId)return true;

  return (cfg.structures||[]).some(
    item=>item.mesh===structureId
  );
}

async function applyWorkspacePackage(payload){
  if(!payload||!packageManager)return;

  packageManager.validate(payload);

  const state=payload.state||{};

  if(validSelection(state.systemA,state.structureA)){
    setSideSelection("A",{
      systemId:state.systemA,
      structureId:state.structureA||""
    });
  }

  if(validSelection(state.systemB,state.structureB)){
    setSideSelection("B",{
      systemId:state.systemB,
      structureId:state.structureB||""
    });
  }

  sides.A.opacity=Math.min(
    1,
    Math.max(.12,Number(state.opacityA)||1)
  );

  sides.B.opacity=Math.min(
    1,
    Math.max(.12,Number(state.opacityB)||1)
  );

  mode=
    state.mode==="overlay"
      ?"overlay"
      :"side-by-side";

  syncEnabled=Boolean(state.semanticSync);
  markerLinesEnabled=
    state.markerLines !== false;

  const lineToggle=
    root.querySelector("[data-marker-lines]");

  if(lineToggle){
    lineToggle.checked=markerLinesEnabled;
  }

  root.querySelector(".compare-main-stage")
    ?.classList.toggle(
      "hide-marker-lines",
      !markerLinesEnabled
    );

  const syncToggle=
    root.querySelector("[data-semantic-sync]");

  if(syncToggle){
    syncToggle.checked=syncEnabled;
  }

  const annotation=
    root.querySelector("[data-comparison-annotation]");

  if(annotation){
    annotation.value=
      annotationManager?.save(
        payload.annotation||""
      )||"";
    updateAnnotationCount();
  }

  const exportName=
    root.querySelector("[data-export-name]");

  if(exportName){
    exportName.value=
      String(payload.exportName||"")
        .slice(0,80);
  }

  if(payload.markerStyles){
    try{
      markerStyleManager?.importData?.(
        payload.markerStyles
      );
    }catch(error){
      console.warn(
        "Estilos do pacote não puderam ser aplicados.",
        error
      );
    }
  }

  if(payload.customPresets){
    try{
      customPresetManager?.importData?.(
        payload.customPresets
      );
    }catch(error){
      console.warn(
        "Presets do pacote não puderam ser aplicados.",
        error
      );
    }
  }

  if(payload.presetFilters){
    presetLessonFilter=
      payload.presetFilters.lesson||"all";
    presetCompetencyFilter=
      payload.presetFilters.competency||"all";
  }

  if(Array.isArray(payload.markerVisibility)){
    const visibleSet=
      new Set(payload.markerVisibility);

    for(const category of markerManager?.categories?.()||[]){
      markerManager?.setCategoryVisible?.(
        category.id,
        visibleSet.has(category.id)
      );
    }
  }

  await reloadBoth();
  setMode(mode,{keepOpacity:true});

  markerManager?.replaceAll(
    payload.markers||[]
  );

  markerManager?.renderAll();
  renderMarkerStyleEditor();
  renderMarkerCategoryVisibility();
  renderCustomPresets();
  renderPresetFilters();

  if(pendingPackageHistoryId){
    packageHistory?.markApplied?.(
      pendingPackageHistoryId
    );
    renderPackageHistory(
      "Pacote aplicado e registrado no histórico."
    );
  }

  updateMarkerUi(
    "Pacote aplicado. Revise os marcadores e a comparação."
  );

  renderSemanticSuggestions(
    lastStructureKey
  );

  closePackageCompatibility();
}

function updateMarkerUi(message=""){
  const count=root?.querySelector("[data-marker-count]");
  const status=root?.querySelector("[data-marker-status]");
  const stage=root?.querySelector(".compare-main-stage");

  if(count){
    count.textContent=
      `${markerManager?.list?.().length||0}/8`;
  }

  stage?.classList.toggle(
    "marker-armed",
    Boolean(markerManager?.isArmed?.())
  );

  if(status&&message){
    status.textContent=message;
  }
}

function onChange(e){
  const lesson=e.target.closest("[data-preset-lesson]");
  if(lesson){
    presetLessonFilter=lesson.value;
    const host=root.querySelector("[data-preset-list]");
    if(host)host.innerHTML=presetButtons();
    return;
  }

  const competency=e.target.closest("[data-preset-competency]");
  if(competency){
    presetCompetencyFilter=competency.value;
    const host=root.querySelector("[data-preset-list]");
    if(host)host.innerHTML=presetButtons();
    return;
  }

  const packageInput=e.target.closest("[data-package-input]");
  if(packageInput&&packageInput.files?.[0]){
    const file=packageInput.files[0];

    packageManager.readFile(
      file,
      {validate:false}
    )
      .then(payload=>{
        const result=
          showPackageCompatibility(payload);

        pendingPackageFilename=
          file.name||"pacote.json";

        const record=
          packageHistory?.record?.({
            filename:pendingPackageFilename,
            sourceAppVersion:
              result?.summary?.sourceAppVersion||null,
            compatible:Boolean(result?.compatible),
            applied:false,
            markers:result?.summary?.markers||0,
            issues:result?.issues?.length||0,
            warnings:result?.warnings?.length||0
          });

        pendingPackageHistoryId=
          record?.id||null;

        renderPackageHistory(
          "Pacote analisado; revise a compatibilidade antes de aplicar."
        );
      })
      .catch(error=>{
        console.error(error);
        updateMarkerUi(
          `Falha ao analisar pacote: ${error.message||error}`
        );
      })
      .finally(()=>{
        packageInput.value="";
      });
    return;
  }

  const customPresetInput=e.target.closest("[data-custom-preset-input]");
  if(customPresetInput&&customPresetInput.files?.[0]){
    importCustomPresets(customPresetInput.files[0])
      .catch(error=>{
        console.error(error);
        renderCustomPresets(
          `Falha ao importar presets: ${error.message||error}`
        );
      })
      .finally(()=>{
        customPresetInput.value="";
      });
    return;
  }

  const customTagFilter=
    e.target.closest("[data-custom-preset-tag-filter]");

  if(customTagFilter){
    customPresetTagFilter=
      customTagFilter.value||"all";
    renderCustomPresets();
    return;
  }

  const markerCategoryVisible=
    e.target.closest("[data-marker-category-visible]");

  if(markerCategoryVisible){
    const category=
      markerCategoryVisible.dataset.markerCategoryVisible;

    markerManager?.setCategoryVisible?.(
      category,
      Boolean(markerCategoryVisible.checked)
    );

    renderMarkerCategoryVisibility();

    updateMarkerUi(
      markerCategoryVisible.checked
        ?`Categoria ${category} visível.`
        :`Categoria ${category} ocultada.`
    );
    return;
  }

  const styleCategory=e.target.closest("[data-style-category]");
  if(styleCategory){
    renderMarkerStyleEditor(styleCategory.value);
    return;
  }

  const markerLines=e.target.closest("[data-marker-lines]");
  if(markerLines){
    markerLinesEnabled=Boolean(markerLines.checked);
    root.querySelector(".compare-main-stage")
      ?.classList.toggle(
        "hide-marker-lines",
        !markerLinesEnabled
      );
    updateMarkerUi(
      markerLinesEnabled
        ?"Linhas-guia ativadas."
        :"Linhas-guia ocultadas."
    );
    return;
  }

  const syncToggle=e.target.closest("[data-semantic-sync]");
  if(syncToggle){
    syncEnabled=Boolean(syncToggle.checked);
    updateSyncStatus(
      syncEnabled
        ?"Sincronização automática ligada."
        :"Sincronização automática desligada.",
      syncEnabled?"success":"idle"
    );
    return;
  }

  const systemSelect=e.target.closest(
    "[data-system-select]"
  );

  if(systemSelect){
    const key=systemSelect.dataset.systemSelect;
    sides[key].systemId=systemSelect.value;
    sides[key].structureId="";
    populateStructureSelect(key);
    loadSide(key);

    root.querySelector("[data-active-preset]").textContent="Personalizado";
    root.querySelectorAll("[data-preset]").forEach(btn=>btn.classList.remove("active"));
    updateSyncStatus("Sistema alterado; selecione uma estrutura.","idle");
    return;
  }

  const structureSelect=e.target.closest(
    "[data-structure-select]"
  );

  if(structureSelect){
    const key=structureSelect.dataset.structureSelect;
    lastStructureKey=key;
    sides[key].structureId=structureSelect.value;
    applyStructureFilter(key);

    if(sides[key].structureId){
      syncEquivalentFrom(key);
      renderSemanticSuggestions(key);
    }else{
      updateSyncStatus("Selecione uma estrutura para sincronizar.","idle");
      renderSemanticSuggestions(key);
    }

    root.querySelector("[data-active-preset]").textContent="Personalizado";
    root.querySelectorAll("[data-preset]").forEach(btn=>btn.classList.remove("active"));
  }
}
function onInput(e){
  const customSearch=
    e.target.closest("[data-custom-preset-search]");

  if(customSearch){
    customPresetQuery=
      customSearch.value||"";
    renderCustomPresets();
    return;
  }

  const annotation=e.target.closest("[data-comparison-annotation]");
  if(annotation){
    const normalized=annotationManager?.save(annotation.value)||annotation.value;

    if(normalized!==annotation.value&&normalized.length>=420){
      annotation.value=normalized;
    }

    updateAnnotationCount();
    return;
  }

  const opacity=e.target.closest("[data-opacity]");
  if(!opacity)return;

  const key=opacity.dataset.opacity;
  sides[key].opacity=Number(opacity.value);
  applyOpacity(key);
}
async function onClick(e){
  const preset=e.target.closest("[data-preset]");
  if(preset){
    await applyPreset(preset.dataset.preset);
    return;
  }

  const historyDownload=e.target.closest(
    "[data-history-download]"
  );

  if(historyDownload){
    const item=historyItems.get(
      historyDownload.dataset.historyDownload
    );

    if(item)await historyManager.download(item);
    return;
  }

  const historyHtml=e.target.closest(
    "[data-history-html]"
  );

  if(historyHtml){
    const item=historyItems.get(
      historyHtml.dataset.historyHtml
    );

    if(item)await exportHistoryHtml(item);
    return;
  }

  const historyDelete=e.target.closest(
    "[data-history-delete]"
  );

  if(historyDelete){
    await historyManager.remove(
      historyDelete.dataset.historyDelete
    );

    await renderHistory();
    return;
  }

  if(e.target.closest("[data-history-clear]")){
    await historyManager.clear();
    await renderHistory();
    return;
  }

  const suggestion=e.target.closest("[data-apply-suggestion]");
  if(suggestion){
    await applySemanticSuggestion(
      suggestion.dataset.sourceKey,
      suggestion.dataset.applySuggestion
    );
    return;
  }

  if(e.target.closest("[data-find-equivalent]")){
    await findRelatedFrom(lastStructureKey);
    return;
  }

  if(e.target.closest("[data-marker-arm]")){
    const input=root.querySelector("[data-marker-text]");
    const category=root.querySelector("[data-marker-category]")?.value||"structure";
    const text=input?.value||"";

    if(!markerManager?.arm(text,category)){
      updateMarkerUi("Digite um texto antes de adicionar o marcador.");
      input?.focus();
      return;
    }

    updateMarkerUi("Clique sobre uma estrutura visível na cena para posicionar o marcador.");
    return;
  }

  if(e.target.closest("[data-marker-clear]")){
    markerManager?.disarm();
    markerManager?.clear();
    closeMarkerEditor();
    updateMarkerUi("Marcadores removidos.");
    return;
  }

  if(e.target.closest("[data-marker-edit-save]")){
    saveMarkerEditor();
    return;
  }

  if(e.target.closest("[data-marker-edit-reposition]")){
    repositionEditingMarker();
    return;
  }

  if(e.target.closest("[data-marker-edit-delete]")){
    deleteEditingMarker();
    return;
  }

  if(e.target.closest("[data-marker-edit-cancel]")){
    closeMarkerEditor();
    return;
  }

  if(e.target.closest("[data-package-export]")){
    exportWorkspacePackage();
    return;
  }

  if(e.target.closest("[data-package-import]")){
    root.querySelector("[data-package-input]")?.click();
    return;
  }

  if(e.target.closest("[data-package-apply]")){
    if(pendingPackageData){
      await applyWorkspacePackage(
        pendingPackageData
      );
    }
    return;
  }

  if(e.target.closest("[data-package-cancel]")){
    closePackageCompatibility();
    return;
  }

  if(e.target.closest("[data-marker-auto-layout]")){
    const count=
      markerManager?.autoLayout?.()||0;
    updateMarkerUi(
      `${count} marcador(es) organizados automaticamente.`
    );
    return;
  }

  if(e.target.closest("[data-marker-reset-layout]")){
    markerManager?.resetLabelOffsets?.();
    updateMarkerUi(
      "Posições visuais das etiquetas restauradas."
    );
    return;
  }

  if(e.target.closest("[data-style-save]")){
    saveMarkerStyle();
    return;
  }

  if(e.target.closest("[data-style-reset]")){
    resetMarkerStyle();
    return;
  }

  if(e.target.closest("[data-custom-preset-save]")){
    saveCustomPreset();
    return;
  }

  if(e.target.closest("[data-custom-preset-cancel]")){
    clearCustomPresetForm();
    renderCustomPresets(
      "Edição cancelada."
    );
    return;
  }

  const customEdit=
    e.target.closest("[data-custom-preset-edit]");

  if(customEdit){
    editCustomPreset(
      customEdit.dataset.customPresetEdit
    );
    return;
  }

  const customDuplicate=
    e.target.closest("[data-custom-preset-duplicate]");

  if(customDuplicate){
    duplicateCustomPreset(
      customDuplicate.dataset.customPresetDuplicate
    );
    return;
  }

  const customApply=
    e.target.closest("[data-custom-preset-apply]");
  if(customApply){
    await applyCustomPreset(
      customApply.dataset.customPresetApply
    );
    return;
  }

  const customDelete=
    e.target.closest("[data-custom-preset-delete]");
  if(customDelete){
    const id=
      customDelete.dataset.customPresetDelete;

    customPresetManager?.remove(id);

    if(editingCustomPresetId===id){
      clearCustomPresetForm();
    }

    renderCustomPresets(
      "Preset personalizado removido."
    );
    return;
  }

  if(e.target.closest("[data-custom-preset-export]")){
    exportCustomPresets();
    return;
  }

  if(e.target.closest("[data-custom-preset-import]")){
    root.querySelector(
      "[data-custom-preset-input]"
    )?.click();
    return;
  }

  if(e.target.closest("[data-export-html]")){
    await exportHtmlReport();
    return;
  }

  if(e.target.closest("[data-annotation-clear]")){
    annotationManager?.clear();
    const input=root.querySelector("[data-comparison-annotation]");
    if(input)input.value="";
    updateAnnotationCount();
    return;
  }

  const view=e.target.closest("[data-view]");
  if(view){
    cameras?.go(view.dataset.view);
    return;
  }

  const modeButton=e.target.closest("[data-mode]");
  if(modeButton){
    setMode(modeButton.dataset.mode);
    root.querySelector("[data-active-preset]").textContent="Personalizado";
    root.querySelectorAll("[data-preset]").forEach(btn=>btn.classList.remove("active"));
    return;
  }

  const tool=e.target.closest("[data-tool]");
  if(!tool)return;

  const action=tool.dataset.tool;

  if(action==="rotate"){
    rotating=!rotating;
    tool.classList.toggle("active",rotating);
  }

  if(action==="swap"){
    swapSides();
    root.querySelector("[data-active-preset]").textContent="Personalizado";
    root.querySelectorAll("[data-preset]").forEach(btn=>btn.classList.remove("active"));
  }

  if(action==="reset"){
    rotating=false;

    root.querySelector(
      '[data-tool="rotate"]'
    )?.classList.remove("active");

    cameras?.go("front");
    setMode("side-by-side");

    for(const key of ["A","B"]){
      sides[key].structureId="";
      populateStructureSelect(key);
      applyStructureFilter(key);
    }

    root.querySelector("[data-active-preset]").textContent="Personalizado";
    root.querySelectorAll("[data-preset]").forEach(btn=>btn.classList.remove("active"));
    renderSemanticSuggestions(lastStructureKey);
  }

  if(action==="export"){
    await exportPng();
  }
}

async function mount3D(){
  const imports=await Promise.all([
    import("../../engines/ThreeEngine.js"),
    import("../../engines/CameraController.js"),
    import("../../engines/GLBAssetLoader.js"),
    import("../../engines/AsyncLoadGuard.js"),
    import("../../services/ComparisonPerformanceManager.js"),
    import("../../services/ComparisonHistoryManager.js"),
    import("../../engines/AnatomyHighlightManager.js"),
    import("../../services/ComparisonSemanticSyncManager.js"),
    import("../../services/ComparisonMarkerManager.js"),
    import("../../services/ComparisonReportManager.js"),
    import("../../services/ComparisonWorkspacePackageManager.js"),
    import("../../services/ComparisonMarkerStyleManager.js"),
    import("../../services/CustomComparisonPresetManager.js"),
    import("../../services/ComparisonPackageCompatibilityManager.js"),
    import("../../services/ComparisonPackageHistoryManager.js"),
    import("../../services/ComparisonSessionPreviewManager.js")
  ]);

  const {ThreeEngine,THREE:ThreeNS}=imports[0];
  THREE=ThreeNS;

  const {CameraController}=imports[1];
  const {GLBAssetLoader}=imports[2];
  const {AsyncLoadGuard}=imports[3];
  const {ComparisonPerformanceManager}=imports[4];
  const {ComparisonHistoryManager}=imports[5];
  const {AnatomyHighlightManager}=imports[6];
  const {ComparisonSemanticSyncManager}=imports[7];
  const {ComparisonMarkerManager}=imports[8];
  const {ComparisonReportManager}=imports[9];
  const {ComparisonWorkspacePackageManager}=imports[10];
  const {ComparisonMarkerStyleManager}=imports[11];
  const {CustomComparisonPresetManager}=imports[12];
  const {ComparisonPackageCompatibilityManager}=imports[13];
  const {ComparisonPackageHistoryManager}=imports[14];
  const {ComparisonSessionPreviewManager}=imports[15];

  comparisonPerformance=
    new ComparisonPerformanceManager({
      graphics:context.graphics
    });

  historyManager=
    new ComparisonHistoryManager({
      maxItems:8
    });

  semanticSync=
    new ComparisonSemanticSyncManager(
      semanticData
    );

  engine=new ThreeEngine({
    host:root.querySelector(".compare-main-host"),
    graphics:context.graphics,
    events:context.events,
    background:0x07131f,
    camera:{fov:34,near:.05,far:80},
    rendererOptions:{
      preserveDrawingBuffer:true
    }
  });

  const {
    applyAnatomyPresentation,
    registerAnatomyViews
  }=await import("../../engines/AnatomyPresentationPreset.js");

  presentationCleanup=applyAnatomyPresentation({
    engine,
    THREE,
    events:context.events,
    mood:"comparison"
  });

  cameras=new CameraController(engine);

  registerAnatomyViews(cameras,{
    distance:8.2,
    target:[0,0,.45],
    top:true
  });

  cameras.go("front",{animate:false});

  loader=new GLBAssetLoader({
    events:context.events
  });

  sides.A.guard=new AsyncLoadGuard();
  sides.B.guard=new AsyncLoadGuard();

  sides.A.highlight=new AnatomyHighlightManager({
    engine,
    THREE,
    color:0x63e6be
  });

  sides.B.highlight=new AnatomyHighlightManager({
    engine,
    THREE,
    color:0xff8da1
  });

  reportManager=
    new ComparisonReportManager();

  packageManager=
    new ComparisonWorkspacePackageManager({
      packageVersion:1
    });

  markerStyleManager=
    new ComparisonMarkerStyleManager({
      storage:context.storage,
      definitions:markerCategoriesData?.categories||[]
    });

  customPresetManager=
    new CustomComparisonPresetManager({
      storage:context.storage,
      maxItems:20
    });

  packageCompatibility=
    new ComparisonPackageCompatibilityManager({
      systems:systems(),
      markerCategories:markerCategoriesData?.categories||[],
      packageVersion:1
    });

  packageHistory=
    new ComparisonPackageHistoryManager({
      storage:context.storage,
      maxItems:8
    });

  sessionPreviewManager=
    new ComparisonSessionPreviewManager({
      systems:systems()
    });

  markerManager=
    new ComparisonMarkerManager({
      engine,
      THREE,
      stage:root.querySelector(".compare-main-stage"),
      storage:context.storage,
      getSides:()=>sides,
      categories:markerCategoriesData?.categories||null,
      getCategoryStyle:(categoryId,marker)=>{
        const style=
          markerStyleManager?.get?.(categoryId);

        if(
          categoryId==="structure" &&
          !markerStyleManager?.hasOverride?.(categoryId) &&
          marker?.side==="B"
        ){
          return {
            ...style,
            color:"#ff8da1"
          };
        }

        return style;
      },
      maxMarkers:8,
      onChange:({type,marker})=>{
        const input=root.querySelector("[data-marker-text]");

        if(type==="added"&&input){
          input.value="";
        }

        if(type==="editRequested"){
          openMarkerEditor(marker);
          return;
        }

        updateMarkerUi(
          type==="added"
            ?"Marcador adicionado à cena."
            :type==="repositioned"
              ?"Marcador reposicionado."
              :type==="dragged"
                ?"Etiqueta reposicionada visualmente."
                :type==="autoLayout"
                  ?"Etiquetas organizadas automaticamente."
                  :type==="updated"
                    ?"Marcador atualizado."
                    :type==="removed"
                      ?"Marcador removido."
                      :"Marcadores atualizados."
        );
      }
    });

  frameUnsub=engine.onFrame(({delta})=>{
    markerManager?.renderAll();
    if(
      !rotating ||
      document.documentElement.classList.contains(
        "reduced-motion"
      )
    )return;

    for(const side of Object.values(sides)){
      if(side.root){
        side.root.rotation.y+=delta*.22;
      }
    }
  });

  metricsUnsub=context.events.on(
    "three:metrics",
    metrics=>{
      context.events.emit(
        "comparison:metrics",
        {
          ...metrics,
          mode,
          rendererCount:1,
          simultaneousModels:
            Number(Boolean(sides.A.root))+
            Number(Boolean(sides.B.root)),
          profile:
            comparisonPerformance.resolveProfile(),
          systemA:sides.A.systemId,
          systemB:sides.B.systemId
        }
      );
    }
  );

  await reloadBoth();

  graphicsUnsub=context.events.on(
    "graphics:profileChanged",
    reloadBoth
  );

  applyComparisonRendererProfile();
  engine.start();
}

export default{
  async mount(ctx){
    context=ctx;

    const {ComparisonAnnotationManager}=
      await import("../../services/ComparisonAnnotationManager.js");

    annotationManager=
      new ComparisonAnnotationManager({
        storage:context.storage,
        maxLength:420
      });

    [data,presetData,semanticData,markerCategoriesData]=await Promise.all([
      context.assets.loadJson(
        "./modules/comparador-anatomico/data/systems.json"
      ),
      context.assets.loadJson(
        "./modules/comparador-anatomico/data/presets.json"
      ),
      context.assets.loadJson(
        "./modules/comparador-anatomico/data/semantic-links.json"
      ),
      context.assets.loadJson(
        "./modules/comparador-anatomico/data/marker-categories.json"
      )
    ]);

    root=document.createElement("section");
    root.className="compare-anatomy-lab";

    root.innerHTML=`
      <header class="compare-anatomy-header">
        <div>
          <span class="eyebrow">Comparação estrutural · G3 · v0.34</span>
          <h2>Comparador Anatômico G3</h2>
          <p>Edite e pesquise presets com tags, oculte categorias de marcadores, use layout sensível a zoom/bordas e visualize uma sessão importada sem alterar a cena atual.</p>
        </div>

        <div class="compare-profile">
          <span>Perfil da comparação</span>
          <strong data-comparison-profile>—</strong>
          <small>Preset: <b data-active-preset>Personalizado</b></small>
        </div>
      </header>

      <section class="compare-presets">
        <div class="compare-section-head">
          <div>
            <span class="eyebrow">Presets pedagógicos</span>
            <strong>Comparações prontas</strong>
          </div>
        </div>
        <div class="compare-preset-filters">
          <label>Aula
            <select data-preset-lesson></select>
          </label>
          <label>Competência
            <select data-preset-competency></select>
          </label>
        </div>
        <div class="compare-preset-themes" data-preset-list>
          ${presetButtons()}
        </div>
      </section>

      <section class="compare-custom-presets-section">
        <div class="compare-section-head">
          <div>
            <span class="eyebrow">Presets personalizados</span>
            <strong>Salvar e reutilizar comparações locais</strong>
          </div>
          <div class="compare-custom-actions">
            <button data-custom-preset-export>Exportar presets</button>
            <button data-custom-preset-import>Importar presets</button>
            <input data-custom-preset-input type="file" accept="application/json,.json" hidden>
          </div>
        </div>

        <div class="compare-custom-preset-filters">
          <input data-custom-preset-search type="search" placeholder="Buscar presets personalizados">
          <select data-custom-preset-tag-filter>
            <option value="all">Todas as tags</option>
          </select>
        </div>

        <div class="compare-custom-preset-form">
          <input data-custom-preset-name maxlength="80" placeholder="Nome do preset">
          <input data-custom-preset-lesson maxlength="120" placeholder="Aula/contexto">
          <input data-custom-preset-competency maxlength="180" placeholder="Competência/objetivo">
          <input data-custom-preset-tags maxlength="180" placeholder="Tags separadas por vírgula">
          <label class="compare-custom-update-state">
            <input data-custom-preset-update-state type="checkbox">
            <span>Atualizar estado A/B ao editar</span>
          </label>
          <button data-custom-preset-save>Salvar comparação atual</button>
          <button data-custom-preset-cancel hidden>Cancelar edição</button>
        </div>

        <div class="compare-custom-presets" data-custom-presets>
          <span class="compare-custom-empty">Nenhum preset personalizado salvo.</span>
        </div>
        <small data-custom-preset-status>Presets personalizados ficam somente neste navegador, salvo exportação manual.</small>
      </section>

      <div class="compare-select-grid">
        ${["A","B"].map(key=>`
          <section class="compare-selector-panel compare-${key.toLowerCase()}">
            <span class="compare-letter">${key}</span>

            <label>
              Sistema
              <select data-system-select="${key}">
                ${systemOptions(sides[key].systemId)}
              </select>
            </label>

            <label>
              Estrutura específica
              <select data-structure-select="${key}">
                ${structureOptions(sides[key])}
              </select>
            </label>

            <div class="compare-side-info">
              <strong data-system-label="${key}">—</strong>
              <small data-system-meta="${key}">—</small>
              <div data-structure-description="${key}"></div>
            </div>

            <label class="compare-opacity">
              Opacidade ${key}
              <input data-opacity="${key}" type="range" min=".12" max="1" step=".02" value="1">
              <span data-opacity-value="${key}">100%</span>
            </label>
          </section>
        `).join("")}
      </div>

      <section class="compare-semantic-tools">
        <div>
          <span class="eyebrow">Sincronização semântica</span>
          <label class="compare-sync-toggle">
            <input data-semantic-sync type="checkbox" checked>
            <span>Sincronizar equivalentes automaticamente</span>
          </label>
        </div>
        <button data-find-equivalent>Encontrar equivalente/relacionado</button>
        <span class="compare-semantic-status" data-semantic-status data-kind="idle">Sincronização pronta.</span>
        <div class="compare-semantic-suggestions" data-semantic-suggestions>
          <span class="compare-suggestion-empty">Selecione uma estrutura em A ou B para ver sugestões.</span>
        </div>
      </section>

      <section class="compare-annotation">
        <div class="compare-section-head">
          <div>
            <span class="eyebrow">Anotação local</span>
            <strong>Texto da vista exportada</strong>
          </div>
          <button data-annotation-clear>Limpar anotação</button>
        </div>
        <textarea data-comparison-annotation maxlength="420" placeholder="Ex.: comparar a posição da tireoide nos dois modelos; observar que a escala é normalizada."></textarea>
        <div class="compare-annotation-meta">
          <span>Salvo localmente no navegador e incorporado ao próximo PNG.</span>
          <b data-annotation-count>0/420</b>
        </div>
      </section>

      <section class="compare-marker-tools">
        <div class="compare-section-head">
          <div>
            <span class="eyebrow">Marcadores sobre a cena</span>
            <strong>Texto ancorado em estruturas 3D</strong>
          </div>
          <div class="compare-marker-head-actions">
            <label><input data-marker-lines type="checkbox" checked> Linhas-guia</label>
            <button data-marker-auto-layout>Organizar etiquetas</button>
            <button data-marker-reset-layout>Resetar posições</button>
            <span data-marker-count>0/8</span>
          </div>
        </div>
        <div class="compare-marker-visibility" data-marker-visibility aria-label="Categorias visíveis"></div>

        <div class="compare-marker-row">
          <input data-marker-text maxlength="100" placeholder="Ex.: observar esta região">
          <select data-marker-category>
            <option value="structure">Estrutura</option>
            <option value="attention">Atenção</option>
            <option value="relation">Relação</option>
            <option value="question">Dúvida</option>
          </select>
          <button data-marker-arm>Adicionar marcador</button>
          <button data-marker-clear>Limpar marcadores</button>
        </div>
        <small data-marker-status>Digite um texto, escolha a categoria e clique em “Adicionar marcador”; depois toque diretamente no modelo 3D.</small>

        <div class="compare-marker-editor" data-marker-editor hidden>
          <span class="eyebrow">Editar marcador</span>
          <input data-marker-edit-text maxlength="100">
          <select data-marker-edit-category></select>
          <div>
            <button data-marker-edit-save>Salvar</button>
            <button data-marker-edit-reposition>Reposicionar</button>
            <button data-marker-edit-delete>Excluir</button>
            <button data-marker-edit-cancel>Cancelar</button>
          </div>
        </div>

        <div class="compare-marker-style">
          <span class="eyebrow">Estilo das categorias</span>
          <select data-style-category></select>
          <input data-style-color type="color" value="#63e6be" aria-label="Cor da categoria">
          <select data-style-icon aria-label="Ícone da categoria">
            <option value="●">● Ponto</option>
            <option value="◆">◆ Losango</option>
            <option value="⚑">⚑ Bandeira</option>
            <option value="↔">↔ Relação</option>
            <option value="?">? Dúvida</option>
            <option value="!">! Atenção</option>
            <option value="+">+ Mais</option>
          </select>
          <span class="compare-style-preview" data-style-preview></span>
          <button data-style-save>Salvar estilo</button>
          <button data-style-reset>Restaurar</button>
        </div>
      </section>

      <section class="compare-export-options">
        <label>
          <span class="eyebrow">Nome do arquivo</span>
          <input data-export-name maxlength="80" placeholder="Ex.: aula-sistema-locomotor">
        </label>
        <div>
          <button data-tool="export">Exportar + salvar PNG</button>
          <button data-export-html>Exportar ficha HTML</button>
          <button data-package-export>Exportar sessão JSON</button>
          <button data-package-import>Importar sessão JSON</button>
          <input data-package-input type="file" accept="application/json,.json" hidden>
        </div>
      </section>

      <section class="compare-package-history-section">
        <div class="compare-section-head">
          <div>
            <span class="eyebrow">Histórico de pacotes</span>
            <strong>Últimas sessões analisadas</strong>
          </div>
        </div>
        <div class="compare-package-history" data-package-history>
          <span class="compare-custom-empty">Nenhum pacote analisado ainda.</span>
        </div>
        <small data-package-history-status>O histórico registra somente metadados locais da análise/importação.</small>
      </section>

      <section class="compare-package-compatibility" data-package-compatibility hidden>
        <div class="compare-section-head">
          <div>
            <span class="eyebrow">Compatibilidade do pacote</span>
            <strong>Revisar antes de aplicar</strong>
          </div>
        </div>
        <div data-package-compatibility-body></div>
        <div class="compare-package-compatibility-actions">
          <button data-package-apply>Aplicar pacote</button>
          <button data-package-cancel>Cancelar</button>
        </div>
      </section>

      <div class="compare-toolbar">
        <button data-view="front">Frontal</button>
        <button data-view="side">Lateral</button>
        <button data-view="top">Superior</button>
        <button class="active" data-mode="side-by-side">Lado a lado</button>
        <button data-mode="overlay">Sobrepor A/B</button>
        <button data-tool="rotate">Auto rotação</button>
        <button data-tool="swap">Trocar A ↔ B</button>
        <button data-tool="reset">Resetar</button>
      </div>

      <div class="compare-main-stage">
        <div class="compare-main-host"></div>
        <div class="compare-stage-label label-a">A</div>
        <div class="compare-stage-label label-b">B</div>
      </div>

      <div class="compare-note" data-mode-note>
        Lado a lado: os dois modelos são normalizados visualmente e posicionados em paralelo.
      </div>

      <div class="compare-warning">
        O destaque, a sobreposição e o alinhamento são recursos visuais de ensino. Não representam escala anatômica relativa real, exame ou diagnóstico.
      </div>

      <section class="compare-history-section">
        <div class="compare-section-head">
          <div>
            <span class="eyebrow">Histórico local</span>
            <strong>Últimas vistas exportadas</strong>
          </div>
          <button data-history-clear>Limpar histórico</button>
        </div>

        <div class="compare-history-grid" data-comparison-history>
          <div class="compare-history-empty">As últimas vistas PNG salvas localmente aparecerão aqui.</div>
        </div>
      </section>
    `;

    root.addEventListener("click",onClick);
    root.addEventListener("change",onChange);
    root.addEventListener("input",onInput);

    context.host.append(root);

    populateStructureSelect("A");
    populateStructureSelect("B");
    renderPresetFilters();
    renderCustomPresets();
    renderMarkerStyleEditor();

    const annotationInput=root.querySelector("[data-comparison-annotation]");
    if(annotationInput){
      annotationInput.value=annotationManager.load();
      updateAnnotationCount();
    }

    try{
      await mount3D();
      await renderHistory();
      renderCustomPresets();
      renderMarkerStyleEditor();
      renderMarkerCategoryVisibility();
      renderPackageHistory();
      updateMarkerUi();
      renderSemanticSuggestions(lastStructureKey);
    }catch(error){
      console.error(error);

      root.querySelector(
        ".compare-main-stage"
      ).innerHTML=
        '<div class="compare-error">Comparação 3D indisponível neste dispositivo.</div>';
    }
  },

  async start(){
    engine?.start();
  },

  pause(){
    engine?.pause();
  },

  async destroy(){
    graphicsUnsub?.();
    frameUnsub?.();
    metricsUnsub?.();
    presentationCleanup?.();

    clearHistoryUrls();
    closeMarkerEditor();
    markerManager?.destroy();

    for(const side of Object.values(sides)){
      side.guard?.invalidate();
      side.highlight?.destroy();

      if(side.root&&engine){
        engine.scene.remove(side.root);
        engine.disposeObject(side.root);
      }

      side.root=null;
      side.guard=null;
      side.center=null;
      side.highlight=null;
      side.structureId="";
      side.opacity=1;
    }

    cameras?.destroy();
    loader?.destroy();
    engine?.destroy();

    root?.removeEventListener("click",onClick);
    root?.removeEventListener("change",onChange);
    root?.removeEventListener("input",onInput);
    root?.remove();

    context=root=data=presetData=semanticData=markerCategoriesData=engine=loader=cameras=THREE=
      comparisonPerformance=historyManager=semanticSync=annotationManager=markerManager=markerStyleManager=reportManager=packageManager=packageCompatibility=packageHistory=sessionPreviewManager=customPresetManager=null;
  }
};
