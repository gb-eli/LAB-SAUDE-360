const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));

export function renderAnatomyFallback({
  host,
  title,
  structures = [],
  note = "Representação 2D simplificada."
}) {
  if (!host) return;

  const items = structures.slice(0, 12);
  const count = Math.max(1, items.length);

  const nodes = items.map((item, index) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    const radius = count <= 6 ? 78 : 92;
    const x = 150 + Math.cos(angle) * radius;
    const y = 125 + Math.sin(angle) * radius;
    const tx = 150 + Math.cos(angle) * (radius + 32);
    const ty = 125 + Math.sin(angle) * (radius + 32);

    return `
      <line x1="150" y1="125" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" />
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" />
      <text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}">${escapeHtml(item.name)}</text>
    `;
  }).join("");

  host.innerHTML = `
    <div class="anatomy-fallback">
      <span class="eyebrow">Fallback leve 2D/SVG</span>
      <h3>${escapeHtml(title)}</h3>
      <svg viewBox="0 0 300 250" role="img" aria-label="${escapeHtml(title)} em esquema simplificado">
        <circle class="fallback-core" cx="150" cy="125" r="24"></circle>
        <text class="fallback-core-label" x="150" y="129">G3</text>
        <g class="fallback-links">${nodes}</g>
      </svg>
      <div class="fallback-list">
        ${items.map(item => `<span>${escapeHtml(item.name)}</span>`).join("")}
      </div>
      <p>${escapeHtml(note)}</p>
    </div>
  `;
}
