const page = document.body.dataset.page;

const formatter = new Intl.NumberFormat("es-ES");
const currency = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const currencyDetailed = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const state = {
  mode: "simulado",
  targetMode: "target",
  filters: {
    placement: ["exterior", "interior"],
    gender: ["male", "female"],
    age: ["child", "young", "adult", "senior", "elder"],
    time: ["morning", "midday", "afternoon", "night"],
  },
  traffic: [
    { hour: "08:00", exterior: 120, interior: 35, source: "manual", confidence: "medium" },
    { hour: "09:00", exterior: 180, interior: 50, source: "estimado", confidence: "high" },
    { hour: "10:00", exterior: 140, interior: 65, source: "observado", confidence: "high" },
    { hour: "11:00", exterior: 165, interior: 72, source: "observado", confidence: "high" },
    { hour: "12:00", exterior: 210, interior: 95, source: "estimado", confidence: "medium" },
    { hour: "13:00", exterior: 245, interior: 110, source: "estimado", confidence: "medium" },
    { hour: "16:00", exterior: 185, interior: 88, source: "manual", confidence: "medium" },
    { hour: "18:00", exterior: 280, interior: 120, source: "observado", confidence: "high" },
    { hour: "21:00", exterior: 150, interior: 60, source: "estimado", confidence: "low" },
  ],
  segments: [
    { id: "child", label: "Child <14", description: "Familias, colegios y ocio infantil", pct: 8, source: "estimado", confidence: "medium" },
    { id: "young", label: "Young 15-30", description: "Moda, ocio, educacion y primeras compras", pct: 22, source: "historico", confidence: "high" },
    { id: "adult", label: "Adult 30-50", description: "Consumo urbano, retail y servicios", pct: 46, source: "observado", confidence: "high" },
    { id: "senior", label: "Senior 50-65", description: "Hogar, salud, viajes y fidelidad", pct: 18, source: "estimado", confidence: "medium" },
    { id: "elder", label: "Elder >65", description: "Proximidad, asistencia y compras recurrentes", pct: 6, source: "manual", confidence: "low" },
  ],
  times: [
    { id: "morning", label: "Morning", range: "08:00-12:00", weight: 0.28 },
    { id: "midday", label: "Midday", range: "12:00-16:00", weight: 0.31 },
    { id: "afternoon", label: "Afternoon", range: "16:00-20:00", weight: 0.29 },
    { id: "night", label: "Night", range: "20:00-00:00", weight: 0.12 },
  ],
  surfaces: [
    { id: "window", name: "Escaparate LED", type: "Window", zone: "exterior", visibility: 0.62, dwell: 4.2, status: "activo", icon: "panel-top" },
    { id: "door", name: "Puerta Xtanco", type: "Entrance", zone: "exterior", visibility: 0.54, dwell: 3.6, status: "activo", icon: "door-open" },
    { id: "metahuman", name: "Metahuman screen", type: "Screen", zone: "interior", visibility: 0.48, dwell: 8.5, status: "activo", icon: "bot" },
    { id: "vending", name: "Vending display", type: "Display", zone: "interior", visibility: 0.35, dwell: 12, status: "activo", icon: "badge-dollar-sign" },
  ],
  rules: [
    {
      title: "Cafe mañana",
      status: "activa",
      text: "SI zona = exterior Y hora = 08:00-12:00 Y target contiene Adult 30-50 ENTONCES reproducir Cafe mañana",
    },
    {
      title: "Retail mediodia",
      status: "programada",
      text: "SI surface = Escaparate LED Y franja = Midday ENTONCES alternar campaña Retail lunch con frecuencia max 6/h",
    },
  ],
};

const stepContent = {
  1: {
    title: "Selecciona circuito y Xpacio",
    body: "Empieza por el circuito comercial y el punto fisico. Target Model carga el baseline de trafico, superficies disponibles y ultimo estado sincronizado con Admira.",
    checklist: ["Comprueba exterior/interior.", "Revisa rango de fechas.", "Elige modo simulado u observado."],
  },
  2: {
    title: "Modela personas por hora",
    body: "Edita la tabla de trafico por hora. Exterior alimenta escaparates y puerta; interior alimenta pantallas, metahuman y vending.",
    checklist: ["Usa curva automatica como punto de partida.", "Marca la fuente del dato.", "Bloquea el baseline cuando sea vendible."],
  },
  3: {
    title: "Ajusta la tipologia",
    body: "Reparte la audiencia por edad, genero y metadata. El sistema recalcula audiencia util y cobertura en tiempo real.",
    checklist: ["Mantén el balance cerca del 100%.", "Distingue estimado de observado.", "Trabaja siempre con datos agregados."],
  },
  4: {
    title: "Calibra inventario visible",
    body: "Cada surface convierte paso de personas en impresiones. Visibilidad y dwell time determinan el valor publicitario.",
    checklist: ["Valida zona exterior/interior.", "Ajusta visibilidad por surface.", "Desactiva inventario no operativo."],
  },
  5: {
    title: "Simula la campaña",
    body: "Define CPM, duracion y frecuencia. La propuesta muestra alcance, impresiones servibles, valor y cobertura.",
    checklist: ["Comprueba el target activo.", "Ajusta CPM por demanda.", "Reserva solo el inventario disponible."],
  },
  6: {
    title: "Publica reglas en XpaceOS",
    body: "Las reglas activan contenidos por hora, zona y segmento. XpaceOS ejecuta la reproduccion y devuelve observados para auditar.",
    checklist: ["Publica en Admira.", "Activa reglas en XpaceOS.", "Compara estimado vs observado."],
  },
};

function qs(selector, root = document) {
  return root.querySelector(selector);
}

function qsa(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

function selectedValues(name) {
  const selected = qsa(`input[name="${name}"]:checked`).map((input) => input.value);
  if (selected.length) return selected;
  return state.filters[name] ?? [];
}

function syncFilter(name) {
  state.filters[name] = qsa(`input[name="${name}"]:checked`).map((input) => input.value);
}

function peopleDay() {
  return state.traffic.reduce((sum, item) => sum + item.exterior + item.interior, 0);
}

function placementShare() {
  const selected = selectedValues("placement");
  if (!selected.length) return 0;
  if (selected.length === 2) return 1;
  const totals = state.traffic.reduce(
    (acc, item) => {
      acc.exterior += item.exterior;
      acc.interior += item.interior;
      return acc;
    },
    { exterior: 0, interior: 0 },
  );
  const total = totals.exterior + totals.interior || 1;
  return selected.includes("exterior") ? totals.exterior / total : totals.interior / total;
}

function ageShare() {
  const selected = selectedValues("age");
  if (!selected.length) return 0;
  if (selected.length === state.segments.length) return 1;
  return (
    state.segments
      .filter((segment) => selected.includes(segment.id))
      .reduce((sum, segment) => sum + segment.pct, 0) / 100
  );
}

function timeShare() {
  const selected = selectedValues("time");
  if (!selected.length) return 0;
  if (selected.length === state.times.length) return 1;
  return state.times.filter((slot) => selected.includes(slot.id)).reduce((sum, slot) => sum + slot.weight, 0);
}

function genderShare() {
  const selected = selectedValues("gender");
  if (!selected.length) return 0;
  return selected.length === 2 ? 1 : 0.52;
}

function metadataShare() {
  const income = qs("#incomeSelect")?.value ?? "all";
  const phone = qs("#phoneSelect")?.value ?? "all";
  const incomeFactor = { all: 1, medium: 0.58, high: 0.34, premium: 0.16 }[income] ?? 1;
  const phoneFactor = { all: 1, ios: 0.42, android: 0.58, premium: 0.26 }[phone] ?? 1;
  return incomeFactor * phoneFactor;
}

function coverage() {
  if (state.targetMode === "whole") return 1;
  return Math.min(1, placementShare() * ageShare() * timeShare() * genderShare() * metadataShare());
}

function averageVisibility() {
  const placements = selectedValues("placement");
  const eligible = state.surfaces.filter((surface) => !placements.length || placements.includes(surface.zone));
  const list = eligible.length ? eligible : state.surfaces;
  return list.reduce((sum, surface) => sum + surface.visibility, 0) / list.length;
}

function campaignMetrics() {
  const cpm = Number(qs("#cpmInput")?.value ?? 8.5);
  const days = Number(qs("#daysInput")?.value ?? 7);
  const frequency = Number(qs("#frequencyInput")?.value ?? 6);
  const reach = peopleDay() * coverage() * days;
  const impressions = Math.round(reach * averageVisibility() * Math.min(1.35, 0.75 + frequency / 14));
  const value = (impressions / 1000) * cpm;
  const recommendedCpm = Math.max(5.25, cpm * (0.8 + coverage() * 0.65));
  return { cpm, days, frequency, reach, impressions, value, recommendedCpm };
}

function confidenceClass(value) {
  return value === "high" ? "high" : value === "medium" ? "medium" : "low";
}

function confidenceLabel(value) {
  return { high: "alta", medium: "media", low: "baja" }[value] ?? value;
}

function renderTraffic() {
  const tbody = qs("#trafficRows");
  if (!tbody) return;
  tbody.innerHTML = state.traffic
    .map(
      (item, index) => `
        <tr>
          <td>${item.hour}</td>
          <td><input class="traffic-input" type="number" min="0" value="${item.exterior}" data-index="${index}" data-field="exterior" aria-label="Exterior ${item.hour}" /></td>
          <td><input class="traffic-input" type="number" min="0" value="${item.interior}" data-index="${index}" data-field="interior" aria-label="Interior ${item.hour}" /></td>
          <td><strong>${formatter.format(item.exterior + item.interior)}</strong></td>
          <td><span class="source-pill">${item.source}</span></td>
          <td><span class="confidence-pill ${confidenceClass(item.confidence)}">${confidenceLabel(item.confidence)}</span></td>
        </tr>
      `,
    )
    .join("");

  qsa(".traffic-input").forEach((input) => {
    input.addEventListener("change", (event) => {
      const target = event.currentTarget;
      const index = Number(target.dataset.index);
      const field = target.dataset.field;
      state.traffic[index][field] = Math.max(0, Number(target.value));
      renderAll();
    });
  });
}

function renderChart() {
  const chart = qs("#trafficChart");
  const totalLabel = qs("#chartTotal");
  if (!chart) return;
  const max = Math.max(...state.traffic.map((item) => item.exterior + item.interior), 1);
  chart.innerHTML = state.traffic
    .map((item) => {
      const total = item.exterior + item.interior;
      const extPct = Math.max(4, (item.exterior / max) * 100);
      const intPct = Math.max(4, (item.interior / max) * 100);
      return `
        <div class="bar-column" title="${item.hour} · ${formatter.format(total)} personas">
          <div class="bar-stack">
            <div class="bar-int" style="height:${intPct}%"></div>
            <div class="bar-ext" style="height:${extPct}%"></div>
          </div>
          <span class="bar-label">${item.hour}</span>
        </div>
      `;
    })
    .join("");
  totalLabel.textContent = `${formatter.format(peopleDay())} personas`;
}

function renderSegments() {
  const tbody = qs("#segmentRows");
  const ageTiles = qs("#ageTiles");
  if (!tbody || !ageTiles) return;
  const total = peopleDay();
  tbody.innerHTML = state.segments
    .map(
      (segment, index) => `
        <tr>
          <td>
            <strong>${segment.label}</strong><br />
            <small>${segment.description}</small>
          </td>
          <td>
            <div class="segment-control">
              <input class="segment-range" type="range" min="0" max="70" value="${segment.pct}" data-index="${index}" aria-label="${segment.label}" />
              <strong>${segment.pct}%</strong>
            </div>
          </td>
          <td>${formatter.format(Math.round(total * (segment.pct / 100)))}</td>
          <td><span class="source-pill">${segment.source}</span></td>
          <td><span class="confidence-pill ${confidenceClass(segment.confidence)}">${confidenceLabel(segment.confidence)}</span></td>
        </tr>
      `,
    )
    .join("");

  ageTiles.innerHTML = state.segments
    .map(
      (segment) => `
        <label class="check-tile">
          <input type="checkbox" name="age" value="${segment.id}" ${state.filters.age.includes(segment.id) ? "checked" : ""} />
          <span>${segment.label}</span>
          <small>${segment.description}</small>
        </label>
      `,
    )
    .join("");

  qsa(".segment-range").forEach((input) => {
    input.addEventListener("change", (event) => {
      const target = event.currentTarget;
      state.segments[Number(target.dataset.index)].pct = Number(target.value);
      renderAll();
    });
  });

  qsa('input[name="age"]').forEach((input) => {
    input.addEventListener("change", () => {
      syncFilter("age");
      renderAll();
    });
  });
}

function renderTimes() {
  const timeTiles = qs("#timeTiles");
  if (!timeTiles) return;
  timeTiles.innerHTML = state.times
    .map(
      (slot) => `
        <label class="check-tile">
          <input type="checkbox" name="time" value="${slot.id}" ${state.filters.time.includes(slot.id) ? "checked" : ""} />
          <span>${slot.label}</span>
          <small>${slot.range}</small>
        </label>
      `,
    )
    .join("");
  qsa('input[name="time"]').forEach((input) => {
    input.addEventListener("change", () => {
      syncFilter("time");
      renderAll();
    });
  });
}

function renderSurfaces() {
  const container = qs("#surfaceCards");
  if (!container) return;
  const trafficTotals = state.traffic.reduce(
    (acc, item) => {
      acc.exterior += item.exterior;
      acc.interior += item.interior;
      return acc;
    },
    { exterior: 0, interior: 0 },
  );
  container.innerHTML = state.surfaces
    .map((surface) => {
      const base = trafficTotals[surface.zone] || 0;
      const impressions = Math.round(base * surface.visibility);
      return `
        <article class="surface-card">
          <div class="surface-top">
            <div>
              <p class="eyebrow">${surface.zone}</p>
              <h3>${surface.name}</h3>
            </div>
            <span class="surface-icon"><i data-lucide="${surface.icon}"></i></span>
          </div>
          <div class="surface-meta">
            <div><span>Tipo</span><strong>${surface.type}</strong></div>
            <div><span>Visibilidad</span><strong>${Math.round(surface.visibility * 100)}%</strong></div>
            <div><span>Dwell</span><strong>${surface.dwell}s</strong></div>
          </div>
          <div class="surface-meta">
            <div><span>Imp/dia</span><strong>${formatter.format(impressions)}</strong></div>
            <div><span>Estado</span><strong>${surface.status}</strong></div>
            <div><span>Player</span><strong>XOS-${surface.id.slice(0, 3).toUpperCase()}</strong></div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderRules() {
  const list = qs("#rulesList");
  if (!list) return;
  list.innerHTML = state.rules
    .map(
      (rule) => `
        <article class="rule-card">
          <div>
            <h3>${rule.title}</h3>
            <code>${rule.text}</code>
          </div>
          <span class="rule-status">${rule.status}</span>
        </article>
      `,
    )
    .join("");
}

function renderKpis() {
  const metrics = campaignMetrics();
  const total = peopleDay();
  const peak = state.traffic.reduce((best, item) => {
    const current = item.exterior + item.interior;
    return current > best.total ? { hour: item.hour, total: current } : best;
  }, { hour: "00:00", total: 0 });
  const segmentTotal = state.segments.reduce((sum, segment) => sum + segment.pct, 0);

  qs("#kpiPeopleDay").textContent = formatter.format(total);
  qs("#kpiPeopleDelta").textContent = total >= 2100 ? "+12% vs baseline" : "baseline ajustado";
  qs("#kpiPeakHour").textContent = `${peak.hour}`;
  qs("#kpiImpressions").textContent = formatter.format(metrics.impressions);
  qs("#kpiUsefulAudience").textContent = `${Math.round(coverage() * 100)}%`;
  qs("#kpiCpm").textContent = currencyDetailed.format(metrics.recommendedCpm);
  qs("#kpiRevenue").textContent = currency.format(metrics.value);
  qs("#targetCoverageBadge").textContent = `${Math.round(coverage() * 100)}%`;
  qs("#liveImpressions").textContent = formatter.format(Math.round(metrics.impressions / 420));
  qs("#segmentBalance").textContent = `${segmentTotal}%`;
  qs("#segmentBalance").style.color = Math.abs(segmentTotal - 100) <= 5 ? "var(--green)" : "var(--gold)";
  qs("#simReach").textContent = formatter.format(Math.round(metrics.reach));
  qs("#simImpressions").textContent = formatter.format(metrics.impressions);
  qs("#simValue").textContent = currencyDetailed.format(metrics.value);
  qs("#simCoverage").textContent = `${Math.round(coverage() * 100)}%`;
}

function wireGlobalControls() {
  qsa(".tabs button").forEach((button) => {
    button.addEventListener("click", () => {
      qsa(".tabs button").forEach((tab) => tab.classList.remove("is-active"));
      qsa(".tab-panel").forEach((panel) => panel.classList.remove("is-visible"));
      button.classList.add("is-active");
      qs(`[data-panel="${button.dataset.tab}"]`).classList.add("is-visible");
    });
  });

  qsa(".segmented-control button").forEach((button) => {
    button.addEventListener("click", () => {
      qsa(".segmented-control button").forEach((item) => item.classList.remove("is-selected"));
      button.classList.add("is-selected");
      state.mode = button.dataset.mode;
      qs("#modelStatus").textContent = `Modelo ${state.mode}`;
      showToast(`Modo ${state.mode} activo`);
    });
  });

  qsa(".target-toggle button").forEach((button) => {
    button.addEventListener("click", () => {
      qsa(".target-toggle button").forEach((item) => item.classList.remove("is-selected"));
      button.classList.add("is-selected");
      state.targetMode = button.dataset.targetMode;
      renderAll();
    });
  });

  qsa('input[name="placement"], input[name="gender"]').forEach((control) => {
    control.addEventListener("change", () => {
      syncFilter(control.name);
      renderAll();
    });
  });

  qsa("#incomeSelect, #phoneSelect, #cpmInput, #daysInput, #frequencyInput").forEach((control) => {
    control.addEventListener("input", renderAll);
    control.addEventListener("change", renderAll);
  });

  qsa("[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleAction(button.dataset.action));
  });
}

function handleAction(action) {
  if (action === "generate-curve") {
    state.traffic = state.traffic.map((item, index) => ({
      ...item,
      exterior: Math.round(item.exterior * [0.92, 1.08, 0.98, 1.05, 1.14, 1.2, 1.02, 1.18, 0.95][index]),
      interior: Math.round(item.interior * [0.9, 1.02, 1.05, 1.12, 1.18, 1.22, 1.08, 1.16, 0.98][index]),
      source: "estimado",
      confidence: index > 6 ? "medium" : "high",
    }));
    renderAll();
    showToast("Curva automatica generada con baseline comercial");
  }

  if (action === "copy-saturday") {
    state.traffic = state.traffic.map((item) => ({
      ...item,
      exterior: Math.round(item.exterior * 1.18),
      interior: Math.round(item.interior * 1.28),
      source: "plantilla",
      confidence: "medium",
    }));
    renderAll();
    showToast("Plantilla sabado aplicada");
  }

  if (action === "calibrate") {
    state.surfaces = state.surfaces.map((surface) => ({
      ...surface,
      visibility: Math.min(0.82, Number((surface.visibility + 0.03).toFixed(2))),
    }));
    renderAll();
    showToast("Visibilidad recalibrada en surfaces activas");
  }

  if (action === "reserve") {
    showToast("Inventario reservado como borrador de propuesta");
  }

  if (action === "add-rule") {
    state.rules.unshift({
      title: "Target activo",
      status: "borrador",
      text: `SI cobertura target = ${Math.round(coverage() * 100)}% Y placement seleccionado ENTONCES activar contenido con frecuencia ${qs("#frequencyInput").value}/h`,
    });
    renderAll();
    showToast("Regla creada en borrador");
  }

  if (action === "publish") {
    showToast("Modelo publicado como payload listo para Admira");
  }

  if (action === "export") {
    const payload = {
      xpacio: qs("#xpacioSearch")?.value,
      peopleDay: peopleDay(),
      coverage: coverage(),
      metrics: campaignMetrics(),
      segments: state.segments,
      traffic: state.traffic,
    };
    navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
    showToast("JSON del modelo copiado al portapapeles");
  }

  if (action === "toggle-mode") {
    const order = ["simulado", "observado", "comparativo"];
    const next = order[(order.indexOf(state.mode) + 1) % order.length];
    const button = qs(`.segmented-control button[data-mode="${next}"]`);
    button?.click();
  }
}

function showToast(message) {
  const toast = qs("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function renderAll() {
  renderTraffic();
  renderChart();
  renderSegments();
  renderTimes();
  renderSurfaces();
  renderRules();
  renderKpis();
  if (window.lucide) window.lucide.createIcons();
}

function initBackoffice() {
  renderAll();
  wireGlobalControls();
  if (window.lucide) window.lucide.createIcons();
}

function initTutorial() {
  const steps = qsa("#tutorialSteps li");
  const eyebrow = qs("#stepEyebrow");
  const title = qs("#stepTitle");
  const body = qs("#stepBody");
  const list = qs("#stepChecklist");

  steps.forEach((step) => {
    step.querySelector("button").addEventListener("click", () => {
      const id = step.dataset.step;
      const content = stepContent[id];
      steps.forEach((item) => item.classList.remove("is-active"));
      step.classList.add("is-active");
      eyebrow.textContent = `Paso ${String(id).padStart(2, "0")}`;
      title.textContent = content.title;
      body.textContent = content.body;
      list.innerHTML = content.checklist.map((item) => `<li>${item}</li>`).join("");
    });
  });

  if (window.lucide) window.lucide.createIcons();
}

window.addEventListener("DOMContentLoaded", () => {
  if (page === "backoffice") initBackoffice();
  if (page === "tutorial") initTutorial();
});

window.addEventListener("load", () => {
  if (window.lucide) window.lucide.createIcons();
});
