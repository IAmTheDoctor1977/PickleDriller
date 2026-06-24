/* ──────────────────────────────────────────────
   STATE
   ────────────────────────────────────────────── */
const STORAGE = {
  sessions: 'dl_sessions',
  gear:     'dl_gear',
  apiKey:   'dl_api_key',
  activeTab:'dl_tab',
  assess:   'dl_assessment',
  schedule: 'dl_schedule',
};

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

const state = {
  sessions: load(STORAGE.sessions, []),
  gear:     load(STORAGE.gear,     []),
  apiKey:   localStorage.getItem(STORAGE.apiKey) || '',
  activeTab:localStorage.getItem(STORAGE.activeTab) || 'drills',
  draft:    null,
  plan:     null,
  assess:   load(STORAGE.assess, null),
  schedule: load(STORAGE.schedule, null),
};

// Migrate older single-format assess data to new doubles/singles structure
if (state.assess && state.assess.results && !state.assess.doubles) {
  state.assess = {
    format: 'doubles',
    doubles: {
      results: state.assess.results,
      level: state.assess.level,
      breakdown: state.assess.breakdown,
      computedAt: state.assess.computedAt,
    },
    singles: { results: {}, level: null, breakdown: null, computedAt: null },
  };
  save(STORAGE.assess, state.assess);
}
if (!state.assess) {
  state.assess = {
    format: 'doubles',
    doubles: { results: {}, level: null, breakdown: null, computedAt: null },
    singles: { results: {}, level: null, breakdown: null, computedAt: null },
  };
}

function uid() { return Math.random().toString(36).slice(2, 10); }
function today() { return new Date().toISOString().slice(0, 10); }
function fmtDate(iso) {
  const d = new Date(iso + 'T00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
function escapeHtml(s) {
  return (s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* ──────────────────────────────────────────────
   ROUTING
   ────────────────────────────────────────────── */
const VIEWS = {
  drills:   renderDrills,
  log:      renderLog,
  history:  renderHistory,
  random:   renderRandom,
  generate: renderGenerate,
  gear:     renderGear,
  assess:   renderAssess,
  schedule: renderSchedule,
};

function setTab(tab) {
  state.activeTab = tab;
  localStorage.setItem(STORAGE.activeTab, tab);
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
  const labels = {
    drills: 'Drills', log: 'Log Session', history: 'History',
    random: 'Random', generate: 'AI Generate', gear: 'Gear',
    assess: 'Assessment', schedule: 'Weekly Schedule'
  };
  document.getElementById('topbar-tab').textContent = labels[tab];
  VIEWS[tab]();
  window.scrollTo(0, 0);
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => setTab(btn.dataset.tab));
});

/* ──────────────────────────────────────────────
   DRILLS
   ────────────────────────────────────────────── */
function renderDrills() {
  const view = document.getElementById('view');
  let html = `<h2 class="view-title">Drill Library</h2>
    <p class="view-sub">${DRILLS.length} drills · 10 categories</p>`;
  CATEGORIES.forEach(cat => {
    const items = DRILLS.filter(d => d.category === cat.id);
    if (!items.length) return;
    html += `<section class="cat-section">
      <div class="cat-header">
        <h3 class="cat-title">${cat.label}</h3>
        <span class="cat-count">${items.length} drills</span>
      </div>
      ${items.map(drillCard).join('')}
    </section>`;
  });
  view.innerHTML = html;
  document.querySelectorAll('.drill-card').forEach(c => {
    c.addEventListener('click', () => c.classList.toggle('open'));
  });
}

function drillCard(d) {
  return `
    <div class="drill-card" data-id="${d.id}">
      <div class="drill-head">
        <div>
          <div class="drill-name">${escapeHtml(d.name)}</div>
          <div class="drill-meta">${d.duration} min · ${d.equipment.join(' / ')}</div>
        </div>
        <span class="tag intensity-${d.intensity}">${d.intensity}</span>
      </div>
      <div class="drill-body">
        <p>${escapeHtml(d.description)}</p>
        ${d.notes ? `<div class="drill-notes">${escapeHtml(d.notes)}</div>` : ''}
        <div class="tags">${d.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
      </div>
    </div>`;
}

/* ──────────────────────────────────────────────
   LOG
   ────────────────────────────────────────────── */
function renderLog() {
  const view = document.getElementById('view');
  if (!state.draft) {
    state.draft = {
      id: uid(), date: today(), focus: '', duration: 45,
      partnerSolo: 'solo', performance: '', drillIds: [], notes: '',
    };
  }
  const d = state.draft;
  view.innerHTML = `
    <h2 class="view-title">Log Session</h2>
    <p class="view-sub">Capture today's practice</p>
    <label class="field"><span>Date</span>
      <input type="date" id="f-date" value="${d.date}"></label>
    <label class="field"><span>Focus / Theme</span>
      <input type="text" id="f-focus" placeholder="e.g. resets, third shots, hands" value="${escapeHtml(d.focus)}"></label>
    <div class="row">
      <label class="field"><span>Duration (min)</span>
        <input type="number" id="f-duration" min="5" max="240" value="${d.duration}"></label>
      <label class="field"><span>Mode</span>
        <select id="f-mode">
          <option value="solo" ${d.partnerSolo==='solo'?'selected':''}>Solo</option>
          <option value="partner" ${d.partnerSolo==='partner'?'selected':''}>Partner</option>
          <option value="group" ${d.partnerSolo==='group'?'selected':''}>Group / clinic</option>
        </select></label>
    </div>
    <label class="field"><span>Performance</span>
      <div class="chips" id="f-perf">
        <div class="chip ${d.performance==='sharp'?'active':''}" data-v="sharp">Sharp</div>
        <div class="chip ${d.performance==='okay'?'active':''}" data-v="okay">Okay</div>
        <div class="chip ${d.performance==='rough'?'active':''}" data-v="rough">Rough</div>
      </div></label>
    <label class="field"><span>Drills worked (tap to add)</span>
      <select id="f-add-drill">
        <option value="">+ Add a drill from library</option>
        ${DRILLS.map(dr => `<option value="${dr.id}">${escapeHtml(dr.name)} — ${dr.category}</option>`).join('')}
      </select>
      <div id="f-drill-list" style="margin-top:8px"></div></label>
    <label class="field"><span>Notes</span>
      <textarea id="f-notes" placeholder="What worked? What felt off?">${escapeHtml(d.notes)}</textarea></label>
    <div class="btn-row">
      <button class="btn btn-secondary" id="f-cancel">Reset</button>
      <button class="btn" id="f-save">Save Session</button>
    </div>`;
  renderDraftDrillList();
  document.getElementById('f-date').onchange = e => d.date = e.target.value;
  document.getElementById('f-focus').oninput = e => d.focus = e.target.value;
  document.getElementById('f-duration').onchange = e => d.duration = +e.target.value;
  document.getElementById('f-mode').onchange = e => d.partnerSolo = e.target.value;
  document.getElementById('f-notes').oninput = e => d.notes = e.target.value;
  document.querySelectorAll('#f-perf .chip').forEach(c => {
    c.onclick = () => {
      d.performance = c.dataset.v;
      document.querySelectorAll('#f-perf .chip').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
    };
  });
  document.getElementById('f-add-drill').onchange = e => {
    if (e.target.value) { d.drillIds.push(e.target.value); renderDraftDrillList(); e.target.value = ''; }
  };
  document.getElementById('f-save').onclick = saveSession;
  document.getElementById('f-cancel').onclick = () => {
    if (confirm('Reset this draft?')) { state.draft = null; renderLog(); }
  };
}

function renderDraftDrillList() {
  const ul = document.getElementById('f-drill-list');
  if (!state.draft.drillIds.length) { ul.innerHTML = `<p class="hint">No drills added yet.</p>`; return; }
  ul.innerHTML = state.draft.drillIds.map((id, i) => {
    const d = DRILLS.find(x => x.id === id);
    return `<div class="card" style="margin-bottom:6px;padding:10px 12px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-family:'Bebas Neue';font-size:16px">${escapeHtml(d?.name || 'Unknown')}</div>
        <div class="drill-meta">${d?.duration} min · ${d?.category}</div>
      </div>
      <button class="btn btn-secondary" style="width:auto;padding:6px 10px;font-size:14px" data-rm="${i}">Remove</button>
    </div>`;
  }).join('');
  ul.querySelectorAll('[data-rm]').forEach(b => {
    b.onclick = () => { state.draft.drillIds.splice(+b.dataset.rm, 1); renderDraftDrillList(); };
  });
}

function saveSession() {
  const d = state.draft;
  if (!d.focus.trim()) return alert('Add a focus theme.');
  if (!d.performance) return alert('Rate performance.');
  state.sessions.unshift({ ...d, savedAt: new Date().toISOString() });
  save(STORAGE.sessions, state.sessions);
  state.draft = null;
  setTab('history');
}

/* ──────────────────────────────────────────────
   HISTORY
   ────────────────────────────────────────────── */
function renderHistory() {
  const view = document.getElementById('view');
  if (!state.sessions.length) {
    view.innerHTML = `<h2 class="view-title">History</h2>
      <p class="view-sub">All logged sessions</p>
      <div class="empty"><div class="empty-icon">○</div>
        <div class="empty-text">No sessions yet. Log one to start.</div></div>`;
    return;
  }
  const last30 = state.sessions.filter(s => (Date.now() - new Date(s.date)) / 86400000 <= 30);
  const totalMin = last30.reduce((a, s) => a + (s.duration || 0), 0);
  const sharpPct = last30.length ? Math.round(100 * last30.filter(s => s.performance === 'sharp').length / last30.length) : 0;
  view.innerHTML = `<h2 class="view-title">History</h2>
    <p class="view-sub">${state.sessions.length} session${state.sessions.length===1?'':'s'} logged</p>
    <div class="stat-grid">
      <div class="stat-box"><div class="v">${last30.length}</div><div class="k">Last 30d</div></div>
      <div class="stat-box"><div class="v">${totalMin}</div><div class="k">Minutes</div></div>
      <div class="stat-box"><div class="v">${sharpPct}%</div><div class="k">Sharp</div></div>
    </div>
    ${state.sessions.map(sessionCard).join('')}`;
  view.querySelectorAll('[data-del]').forEach(b => {
    b.onclick = () => {
      if (confirm('Delete this session?')) {
        state.sessions = state.sessions.filter(s => s.id !== b.dataset.del);
        save(STORAGE.sessions, state.sessions);
        renderHistory();
      }
    };
  });
}

function sessionCard(s) {
  const drills = (s.drillIds || []).map(id => {
    const d = DRILLS.find(x => x.id === id);
    return d ? `<li>${escapeHtml(d.name)} <span class="drill-meta">· ${d.duration} min</span></li>` : '';
  }).join('');
  const perfTag = s.performance ? `<span class="tag intensity-${s.performance==='sharp'?'low':s.performance==='okay'?'medium':'medium-high'}">${s.performance}</span>` : '';
  return `<div class="session-card">
    <div class="session-head">
      <div class="session-date">${fmtDate(s.date)}</div>
      <span class="session-stats">${s.duration} min · ${s.partnerSolo}</span>
    </div>
    <div class="session-focus">${escapeHtml(s.focus)}</div>
    <div style="margin-bottom:6px">${perfTag}</div>
    ${drills ? `<ul class="session-drills">${drills}</ul>` : ''}
    ${s.notes ? `<p class="session-notes">"${escapeHtml(s.notes)}"</p>` : ''}
    <button class="btn btn-secondary" style="margin-top:10px;font-size:13px;padding:8px" data-del="${s.id}">Delete</button>
  </div>`;
}

/* ──────────────────────────────────────────────
   RANDOMIZE
   ────────────────────────────────────────────── */
function renderRandom() {
  const view = document.getElementById('view');
  view.innerHTML = `<h2 class="view-title">Randomize</h2>
    <p class="view-sub">Smart-shuffled practice</p>
    <label class="field"><span>Target duration</span>
      <div class="chips" id="r-dur">
        <div class="chip active" data-v="30">30 min</div>
        <div class="chip" data-v="45">45 min</div>
        <div class="chip" data-v="60">60 min</div>
        <div class="chip" data-v="90">90 min</div>
      </div></label>
    <label class="field"><span>Mode</span>
      <div class="chips" id="r-mode">
        <div class="chip active" data-v="any">Any</div>
        <div class="chip" data-v="solo">Solo</div>
        <div class="chip" data-v="wall">Wall</div>
        <div class="chip" data-v="machine">Machine</div>
        <div class="chip" data-v="partner">Partner</div>
      </div></label>
    <button class="btn" id="r-roll">Roll Practice</button>
    <div id="r-out" style="margin-top:18px"></div>`;
  let dur = 30, mode = 'any';
  document.querySelectorAll('#r-dur .chip').forEach(c => {
    c.onclick = () => {
      document.querySelectorAll('#r-dur .chip').forEach(x => x.classList.remove('active'));
      c.classList.add('active'); dur = +c.dataset.v;
    };
  });
  document.querySelectorAll('#r-mode .chip').forEach(c => {
    c.onclick = () => {
      document.querySelectorAll('#r-mode .chip').forEach(x => x.classList.remove('active'));
      c.classList.add('active'); mode = c.dataset.v;
    };
  });
  document.getElementById('r-roll').onclick = () => {
    const plan = generateRandomPlan(dur, mode);
    state.plan = plan;
    document.getElementById('r-out').innerHTML = renderPlanBlock(plan);
    bindPlanActions();
  };
}

function modeFilter(d, mode, excludeIds = new Set()) {
  if (excludeIds.has(d.id)) return false;
  if (mode === 'any') return true;
  if (mode === 'partner') return d.tags.includes('partner');
  // All solo-family modes require the solo tag
  if (!d.tags.includes('solo')) return false;
  const hasNone = d.equipment.includes('none');
  if (mode === 'solo')    return d.equipment.some(e => e !== 'partner');
  if (mode === 'wall')    return d.equipment.includes('wall') || hasNone;
  if (mode === 'machine') return d.equipment.includes('ball-machine') || hasNone;
  return true;
}

function generateRandomPlan(targetMin, mode, excludeIds = new Set()) {
  const filter = d => modeFilter(d, mode, excludeIds);
  const warmups = DRILLS.filter(d => d.role === 'warmup' && filter(d));
  const cooldowns = DRILLS.filter(d => d.role === 'cooldown' && filter(d));
  const main = DRILLS.filter(d => d.role === 'main' && filter(d));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const picks = [];
  const warm = pick(warmups);
  if (warm) picks.push(warm);
  let acc = warm?.duration || 0;
  const cool = pick(cooldowns);
  const coolDur = cool?.duration || 0;
  const mainBudget = targetMin - acc - coolDur;
  const pool = [...main].sort(() => Math.random() - 0.5);
  let totalMain = 0;
  for (const d of pool) {
    if (totalMain + d.duration > mainBudget + 4) continue;
    const prev = picks[picks.length - 1];
    if (prev && prev.category === d.category) continue;
    if (prev && prev.intensity === 'high' && d.intensity === 'high') continue;
    picks.push(d);
    totalMain += d.duration;
    if (totalMain >= mainBudget - 4) break;
  }
  if (cool) picks.push(cool);
  const total = picks.reduce((a, d) => a + d.duration, 0);
  return {
    focus: 'Random shuffle',
    reasoning: `${total}-min mixed practice. Warm-up → ${picks.length - 2} main drills → cool-down. No back-to-back high-intensity or same-category.`,
    drills: picks.map(d => ({ id: d.id, duration: d.duration }))
  };
}

function renderPlanBlock(plan) {
  const total = plan.drills.reduce((a, d) => a + d.duration, 0);
  return `<div class="session-plan-block">
    <div class="plan-focus">${escapeHtml(plan.focus)}</div>
    <p class="plan-reason">${escapeHtml(plan.reasoning)}</p>
    ${plan.drills.map((d, i) => {
      const drill = DRILLS.find(x => x.id === d.id);
      if (!drill) return '';
      const roleLabel = drill.role === 'warmup' ? 'WARM-UP' : drill.role === 'cooldown' ? 'COOL-DOWN' : `STEP ${i}`;
      return `<div class="plan-drill">
        <div class="plan-drill-head">
          <div>
            <div class="plan-drill-tag">${roleLabel} · ${drill.category}</div>
            <div class="plan-step-name">${escapeHtml(drill.name)}</div>
          </div>
          <span class="plan-step-time">${d.duration} min</span>
        </div>
        <p class="plan-drill-desc">${escapeHtml(drill.description)}</p>
        ${drill.notes ? `<div class="plan-drill-notes">${escapeHtml(drill.notes)}</div>` : ''}
        <div class="tags">
          <span class="tag intensity-${drill.intensity}">${drill.intensity}</span>
          ${drill.equipment.map(e => `<span class="tag">${e}</span>`).join('')}
        </div>
      </div>`;
    }).join('')}
    <div class="plan-total">
      <span class="plan-step-name" style="color:var(--accent)">TOTAL</span>
      <span class="plan-step-time" style="color:var(--accent);font-weight:500">${total} min</span>
    </div>
  </div>
  <div class="btn-row">
    <button class="btn btn-secondary" id="plan-copy">Copy as Text</button>
    <button class="btn" id="plan-tolog">Send to Log</button>
  </div>`;
}

function bindPlanActions() {
  const copyBtn = document.getElementById('plan-copy');
  const toLogBtn = document.getElementById('plan-tolog');
  if (copyBtn) copyBtn.onclick = async () => {
    const lines = state.plan.drills.map((d, i) => {
      const drill = DRILLS.find(x => x.id === d.id);
      return `${i+1}. ${drill.name} (${d.duration} min)\n   ${drill.description}${drill.notes ? '\n   Note: ' + drill.notes : ''}`;
    }).join('\n\n');
    const text = `${state.plan.focus}\n${state.plan.reasoning}\n\n${lines}`;
    try {
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => copyBtn.textContent = 'Copy as Text', 1500);
    } catch { alert(text); }
  };
  if (toLogBtn) toLogBtn.onclick = () => {
    state.draft = {
      id: uid(), date: today(),
      focus: state.plan.focus,
      duration: state.plan.drills.reduce((a, d) => a + d.duration, 0),
      partnerSolo: 'solo', performance: '',
      drillIds: state.plan.drills.map(d => d.id), notes: '',
    };
    setTab('log');
  };
}

/* ──────────────────────────────────────────────
   GENERATE (AI)
   ────────────────────────────────────────────── */
function renderGenerate() {
  const view = document.getElementById('view');
  view.innerHTML = `<h2 class="view-title">AI Generate</h2>
    <p class="view-sub">Practice built from your last sessions</p>
    ${!state.apiKey ? `<div class="warn"><strong>API key required.</strong> Uses Anthropic's API. Your key is stored only in this browser. Get one at console.anthropic.com.</div>` : ''}
    <label class="field"><span>Anthropic API Key</span>
      <input type="password" id="g-key" placeholder="sk-ant-..." value="${state.apiKey}">
      <p class="hint">Stored locally only.</p></label>
    <label class="field"><span>Target duration</span>
      <div class="chips" id="g-dur">
        <div class="chip" data-v="30">30 min</div>
        <div class="chip active" data-v="45">45 min</div>
        <div class="chip" data-v="60">60 min</div>
        <div class="chip" data-v="90">90 min</div>
      </div></label>
    <label class="field"><span>Mode</span>
      <div class="chips" id="g-mode">
        <div class="chip active" data-v="any">Any</div>
        <div class="chip" data-v="solo">Solo</div>
        <div class="chip" data-v="wall">Wall</div>
        <div class="chip" data-v="machine">Machine</div>
        <div class="chip" data-v="partner">Partner</div>
      </div></label>
    <button class="btn" id="g-go">Generate Session</button>
    <div id="g-out" style="margin-top:18px"></div>`;
  let dur = 45, mode = 'any';
  document.getElementById('g-key').oninput = e => {
    state.apiKey = e.target.value.trim();
    localStorage.setItem(STORAGE.apiKey, state.apiKey);
  };
  document.querySelectorAll('#g-dur .chip').forEach(c => {
    c.onclick = () => {
      document.querySelectorAll('#g-dur .chip').forEach(x => x.classList.remove('active'));
      c.classList.add('active'); dur = +c.dataset.v;
    };
  });
  document.querySelectorAll('#g-mode .chip').forEach(c => {
    c.onclick = () => {
      document.querySelectorAll('#g-mode .chip').forEach(x => x.classList.remove('active'));
      c.classList.add('active'); mode = c.dataset.v;
    };
  });
  document.getElementById('g-go').onclick = () => generateAIPlan(dur, mode);
}

async function generateAIPlan(targetMin, mode) {
  if (!state.apiKey) return alert('Add your Anthropic API key first.');
  const out = document.getElementById('g-out');
  out.innerHTML = `<div class="hint"><span class="spinner"></span>Analyzing your sessions…</div>`;
  const recent = state.sessions.slice(0, 10);
  if (!recent.length) {
    out.innerHTML = `<div class="warn">No session history yet. Log a couple of sessions first, or use Randomize.</div>`;
    return;
  }
  const drillList = DRILLS.filter(d => modeFilter(d, mode)).map(d => ({
    id: d.id, name: d.name, category: d.category,
    role: d.role, duration: d.duration, intensity: d.intensity, tags: d.tags
  }));
  const sessionsForPrompt = recent.map(s => ({
    date: s.date, focus: s.focus, performance: s.performance,
    drills: (s.drillIds || []).map(id => {
      const dr = DRILLS.find(x => x.id === id);
      return dr ? dr.name + ' (' + dr.category + ')' : id;
    }),
    notes: s.notes || ''
  }));
  const modeNote = {
    'any':     'Any drills are allowed.',
    'solo':    'Solo session — only drills the player can do alone (wall, ball machine, or no-equipment).',
    'wall':    'Wall-only session — every drill must be doable against a wall.',
    'machine': 'Ball-machine session — every drill must be doable with a ball machine.',
    'partner': 'Partner session — every drill requires a partner.',
  }[mode] || '';
  const system = `You are a pickleball coaching assistant. Given a player's recent practice logs, identify their weak areas and build a focused practice session.

Mode: ${modeNote}

Rules:
- Start with exactly ONE warmup drill (role: warmup).
- End with exactly ONE cooldown drill (role: cooldown).
- 4-7 main drills (role: main) in between.
- Total duration targets ${targetMin} minutes (±5 OK).
- Weight drills toward categories where recent performance was "rough"/"okay" or notes show struggle.
- No two high-intensity drills back-to-back. No two same-category back-to-back.
- Use ONLY drills from the provided library (it has been pre-filtered for the selected mode).

Output ONLY JSON, no markdown:
{
  "focus": "string",
  "reasoning": "2-3 sentences",
  "drills": [{ "id": "drill_id", "duration": minutes }]
}`;
  const userMsg = `Drill library:\n${JSON.stringify(drillList)}\n\nRecent sessions:\n${JSON.stringify(sessionsForPrompt, null, 2)}\n\nBuild a ${targetMin}-minute session.`;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': state.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system,
        messages: [{ role: 'user', content: userMsg }]
      })
    });
    if (!res.ok) { const t = await res.text(); throw new Error(`API ${res.status}: ${t.slice(0,200)}`); }
    const data = await res.json();
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
    const plan = JSON.parse(text.replace(/```json|```/g, '').trim());
    plan.drills = plan.drills.filter(d => DRILLS.find(x => x.id === d.id));
    state.plan = plan;
    out.innerHTML = renderPlanBlock(plan);
    bindPlanActions();
  } catch (err) {
    out.innerHTML = `<div class="warn">Generation failed: ${escapeHtml(err.message)}</div>`;
  }
}

/* ──────────────────────────────────────────────
   GEAR
   ────────────────────────────────────────────── */
const GEAR_TYPES = ['paddle', 'balls', 'ball-machine', 'rebounder', 'court', 'shoes', 'other'];

function renderGear() {
  const view = document.getElementById('view');
  view.innerHTML = `<h2 class="view-title">Gear</h2>
    <p class="view-sub">${state.gear.length} item${state.gear.length===1?'':'s'} tracked</p>
    <div class="card card-accent">
      <label class="field"><span>Add new gear</span>
        <input type="text" id="gear-name" placeholder="e.g. Slinger Bag, Selkirk Halo"></label>
      <div class="row">
        <label class="field"><span>Type</span>
          <select id="gear-type">${GEAR_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}</select></label>
        <label class="field"><span>Status</span>
          <select id="gear-status">
            <option value="active">Active</option>
            <option value="backup">Backup</option>
            <option value="retired">Retired</option>
          </select></label>
      </div>
      <label class="field"><span>Notes</span>
        <textarea id="gear-notes" placeholder="weight, grip size, brand, court name..."></textarea></label>
      <button class="btn" id="gear-add">Add Gear</button>
    </div>
    <div class="divider"></div>
    <div id="gear-list"></div>`;
  renderGearList();
  document.getElementById('gear-add').onclick = () => {
    const name = document.getElementById('gear-name').value.trim();
    if (!name) return alert('Name required.');
    state.gear.unshift({
      id: uid(), name,
      type: document.getElementById('gear-type').value,
      status: document.getElementById('gear-status').value,
      notes: document.getElementById('gear-notes').value.trim(),
    });
    save(STORAGE.gear, state.gear);
    document.getElementById('gear-name').value = '';
    document.getElementById('gear-notes').value = '';
    renderGearList();
  };
}

function renderGearList() {
  const list = document.getElementById('gear-list');
  if (!state.gear.length) {
    list.innerHTML = `<div class="empty"><div class="empty-icon">○</div><div class="empty-text">No gear added yet</div></div>`;
    return;
  }
  list.innerHTML = state.gear.map(g => `<div class="card">
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">
      <div style="font-family:'Bebas Neue';font-size:20px">${escapeHtml(g.name)}</div>
      <span class="tag accent">${g.status}</span>
    </div>
    <div class="drill-meta" style="margin-bottom:6px">${g.type}</div>
    ${g.notes ? `<div class="session-notes">${escapeHtml(g.notes)}</div>` : ''}
    <button class="btn btn-secondary" style="margin-top:10px;font-size:13px;padding:8px" data-rm-gear="${g.id}">Remove</button>
  </div>`).join('');
  list.querySelectorAll('[data-rm-gear]').forEach(b => {
    b.onclick = () => {
      if (confirm('Remove this gear?')) {
        state.gear = state.gear.filter(g => g.id !== b.dataset.rmGear);
        save(STORAGE.gear, state.gear);
        renderGearList();
      }
    };
  });
}

/* ──────────────────────────────────────────────
   ASSESSMENT (doubles + singles)
   ────────────────────────────────────────────── */
function getActiveAssess() { return state.assess[state.assess.format]; }
function getActiveSkills() { return SKILLS_BY_FORMAT[state.assess.format]; }

function renderAssess() {
  const view = document.getElementById('view');
  const skills = getActiveSkills();
  const a = getActiveAssess();
  const results = a.results || {};
  const totalAnswered = Object.values(results).filter(r => r && r.state).length;

  view.innerHTML = `<h2 class="view-title">Skill Assessment</h2>
    <p class="view-sub">${skills.length} skills · 3.0 → 4.5 · ${totalAnswered} marked</p>

    <div class="format-toggle">
      <div class="fmt-chip ${state.assess.format==='doubles'?'active':''}" data-fmt="doubles">Doubles</div>
      <div class="fmt-chip ${state.assess.format==='singles'?'active':''}" data-fmt="singles">Singles</div>
    </div>

    ${a.level ? renderAssessResult() : ''}

    <div class="card" style="margin-bottom:18px">
      <p style="font-size:13px;line-height:1.5;color:var(--muted)">
        Each skill has an observable test. Self-assess or have a coach mark each.
        Mark <strong style="color:var(--success)">Reliable</strong> when you consistently meet criteria,
        <strong style="color:#b88521">Inconsistent</strong> when sometimes,
        or <strong style="color:var(--danger)">Not Yet</strong> if you can't.
      </p>
    </div>

    <div id="skill-sections"></div>

    <div class="btn-row" style="margin-top:24px">
      <button class="btn btn-secondary" id="assess-reset">Reset All</button>
      <button class="btn" id="assess-compute">Compute Level</button>
    </div>`;

  renderSkillSections();

  // Format toggle
  document.querySelectorAll('.fmt-chip').forEach(c => {
    c.onclick = () => {
      state.assess.format = c.dataset.fmt;
      save(STORAGE.assess, state.assess);
      renderAssess();
    };
  });

  document.getElementById('assess-compute').onclick = computeAndShowLevel;
  document.getElementById('assess-reset').onclick = () => {
    if (confirm(`Clear all ${state.assess.format} marks and results?`)) {
      state.assess[state.assess.format] = { results: {}, computedAt: null, level: null, breakdown: null };
      save(STORAGE.assess, state.assess);
      renderAssess();
    }
  };
}

function renderSkillSections() {
  const container = document.getElementById('skill-sections');
  const a = getActiveAssess();
  const skills = getActiveSkills();
  const results = a.results || {};
  let html = '';
  LEVELS.forEach(level => {
    const items = skills.filter(s => s.level === level);
    const answered = items.filter(s => results[s.id]?.state).length;
    html += `<section class="level-section">
      <div class="level-header">
        <div class="level-title">${level}</div>
        <div class="level-progress">${answered}/${items.length} marked</div>
      </div>
      ${items.map(skillCard).join('')}
    </section>`;
  });
  container.innerHTML = html;

  container.querySelectorAll('.skill-chip').forEach(chip => {
    chip.onclick = () => {
      const skillId = chip.closest('.skill-card').dataset.id;
      const newState = chip.dataset.state;
      const a = getActiveAssess();
      if (!a.results) a.results = {};
      const cur = a.results[skillId] || {};
      cur.state = cur.state === newState ? null : newState;
      a.results[skillId] = cur;
      save(STORAGE.assess, state.assess);
      const card = chip.closest('.skill-card');
      card.querySelectorAll('.skill-chip').forEach(c => {
        c.classList.remove('active-no', 'active-inc', 'active-yes');
        if (c.dataset.state === cur.state) {
          c.classList.add('active-' + (cur.state === 'reliable' ? 'yes' : cur.state === 'inconsistent' ? 'inc' : 'no'));
        }
      });
      renderLevelProgressCounts();
    };
  });

  container.querySelectorAll('.skill-notes-toggle').forEach(btn => {
    btn.onclick = () => btn.closest('.skill-card').classList.toggle('notes-open');
  });

  container.querySelectorAll('.skill-notes-input textarea').forEach(ta => {
    ta.oninput = () => {
      const skillId = ta.closest('.skill-card').dataset.id;
      const a = getActiveAssess();
      if (!a.results[skillId]) a.results[skillId] = {};
      a.results[skillId].notes = ta.value;
      save(STORAGE.assess, state.assess);
    };
  });
}

function renderLevelProgressCounts() {
  const a = getActiveAssess();
  const skills = getActiveSkills();
  const results = a.results || {};
  LEVELS.forEach((level, i) => {
    const items = skills.filter(s => s.level === level);
    const answered = items.filter(s => results[s.id]?.state).length;
    const sections = document.querySelectorAll('.level-progress');
    if (sections[i]) sections[i].textContent = `${answered}/${items.length} marked`;
  });
}

function skillCard(s) {
  const a = getActiveAssess();
  const result = a.results?.[s.id] || {};
  const st = result.state;
  const notesOpen = result.notes ? 'notes-open' : '';
  return `<div class="skill-card ${notesOpen}" data-id="${s.id}">
    <div class="skill-head">
      <div class="skill-name">${escapeHtml(s.name)}</div>
      <div class="skill-cat">${s.category}</div>
    </div>
    <p class="skill-test">${escapeHtml(s.test)}</p>
    <div class="skill-criteria">PASS: ${escapeHtml(s.criteria)}</div>
    <div class="skill-chips">
      <div class="skill-chip ${st==='not-yet'?'active-no':''}" data-state="not-yet">Not Yet</div>
      <div class="skill-chip ${st==='inconsistent'?'active-inc':''}" data-state="inconsistent">Inconsistent</div>
      <div class="skill-chip ${st==='reliable'?'active-yes':''}" data-state="reliable">Reliable</div>
    </div>
    <button class="skill-notes-toggle">+ Notes</button>
    <div class="skill-notes-input">
      <textarea placeholder="Score, observations, conditions...">${escapeHtml(result.notes || '')}</textarea>
    </div>
  </div>`;
}

function scoreForState(s) {
  if (s === 'reliable') return PASS_FULL;
  if (s === 'inconsistent') return PASS_HALF;
  return PASS_NONE;
}

function computeAndShowLevel() {
  const a = getActiveAssess();
  const skills = getActiveSkills();
  const results = a.results || {};
  const totalAnswered = Object.values(results).filter(r => r?.state).length;
  if (totalAnswered < skills.length * 0.5) {
    if (!confirm(`You've only marked ${totalAnswered} of ${skills.length}. Compute anyway?`)) return;
  }
  const breakdown = {};
  LEVELS.forEach(level => {
    const items = skills.filter(s => s.level === level);
    const sum = items.reduce((acc, s) => acc + scoreForState(results[s.id]?.state), 0);
    breakdown[level] = {
      pct: sum / items.length,
      reliableCount: items.filter(s => results[s.id]?.state === 'reliable').length,
      total: items.length,
      passed: items.filter(s => results[s.id]?.state === 'reliable').map(s => s.name),
      failed: items.filter(s => results[s.id]?.state !== 'reliable').map(s => ({ name: s.name, state: results[s.id]?.state || 'not-marked' })),
    };
  });
  let determined = null;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    const level = LEVELS[i];
    const meets = breakdown[level].pct >= LEVEL_THRESHOLD;
    const prereqs = LEVELS.slice(0, i).every(l => breakdown[l].pct >= PREREQ_THRESHOLD);
    if (meets && prereqs) { determined = level; break; }
  }
  if (!determined) determined = breakdown['3.0'].pct >= 0.5 ? '3.0' : 'Below 3.0';

  a.level = determined;
  a.breakdown = breakdown;
  a.computedAt = new Date().toISOString();
  save(STORAGE.assess, state.assess);
  renderAssess();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderAssessResult() {
  const a = getActiveAssess();
  const b = a.breakdown;
  const level = a.level;
  if (!b) return '';

  const determinedIdx = LEVELS.indexOf(level);
  const strengths = [];
  const weaknesses = [];

  LEVELS.forEach((lvl, i) => {
    const data = b[lvl];
    if (i > determinedIdx) {
      data.passed.forEach(name => strengths.push(`${name} (${lvl})`));
    }
    if (i <= determinedIdx) {
      data.failed.forEach(f => {
        if (f.state !== 'reliable') weaknesses.push(`${f.name} (${lvl})`);
      });
    }
  });

  const computedDate = new Date(a.computedAt).toLocaleString();
  const explanation = buildExplanation(level, b);
  const fmtLabel = state.assess.format === 'doubles' ? 'DOUBLES' : 'SINGLES';

  return `<div class="result-block">
    <div class="result-subtitle">${fmtLabel} LEVEL · ${computedDate}</div>
    <div class="result-level">${escapeHtml(level)}</div>
    <p class="result-explanation">${escapeHtml(explanation)}</p>

    <div class="result-bars">
      ${LEVELS.map(lvl => {
        const pct = Math.round(b[lvl].pct * 100);
        return `<div class="level-bar">
          <span class="level-bar-label">${lvl}</span>
          <div class="level-bar-track"><div class="level-bar-fill" style="width:${pct}%"></div></div>
          <span class="level-bar-pct">${pct}%</span>
        </div>`;
      }).join('')}
    </div>

    ${strengths.length ? `
      <div class="result-list-title">Strengths (above your level)</div>
      <ul class="result-list">${strengths.slice(0, 8).map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
    ` : ''}
    ${weaknesses.length ? `
      <div class="result-list-title">Work on (at or below your level)</div>
      <ul class="result-list">${weaknesses.slice(0, 8).map(w => `<li>${escapeHtml(w)}</li>`).join('')}</ul>
    ` : ''}
  </div>`;
}

function buildExplanation(level, b) {
  if (level === 'Below 3.0') {
    return "You're still building foundational skills. Focus on the 3.0 fundamentals and re-assess in 4–6 weeks.";
  }
  const idx = LEVELS.indexOf(level);
  const nextLevel = LEVELS[idx + 1];
  const thisPct = Math.round(b[level].pct * 100);
  const nextPct = nextLevel ? Math.round(b[nextLevel].pct * 100) : null;
  let msg = `You meet ${thisPct}% of ${level} criteria reliably`;
  if (idx > 0) msg += ` and have solid ${LEVELS.slice(0, idx).join('/')} foundations`;
  msg += '. ';
  if (nextLevel) {
    msg += `You're at ${nextPct}% of ${nextLevel} skills — `;
    if (nextPct >= 60) msg += `knocking on ${nextLevel}'s door. Push the "Work on" items.`;
    else if (nextPct >= 30) msg += `selective ${nextLevel} skills but need broader development to move up.`;
    else msg += `consolidate ${level} first before chasing ${nextLevel}.`;
  } else {
    msg += `Top of this assessment scale.`;
  }
  return msg;
}

/* ──────────────────────────────────────────────
   WEEKLY SCHEDULE
   ────────────────────────────────────────────── */
function getMondayOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;  // Sun = -6, Mon = 0, Tue = -1, etc.
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function formatWeekRange(monIso) {
  const mon = new Date(monIso + 'T00:00');
  const sun = new Date(mon);
  sun.setDate(sun.getDate() + 6);
  const fmt = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${fmt(mon)} – ${fmt(sun)}`;
}

function buildScheduleForWeek() {
  // Day 1: Solo, 45 min
  const day1Plan = generateRandomPlan(45, 'solo');
  const day1Ids = new Set(day1Plan.drills.map(d => d.id));
  // Day 2: Partner, 60 min
  const day2Plan = generateRandomPlan(60, 'partner');
  // Day 3: Solo, 45 min, avoiding Day 1's drills
  const day3Plan = generateRandomPlan(45, 'solo', day1Ids);
  day1Plan.focus = 'Solo (wall/machine)';
  day2Plan.focus = 'Partner practice';
  day3Plan.focus = 'Solo (wall/machine)';
  return {
    weekStart: getMondayOfWeek(),
    days: [
      { num: 1, mode: 'solo',    duration: 45, plan: day1Plan, completed: false },
      { num: 2, mode: 'partner', duration: 60, plan: day2Plan, completed: false },
      { num: 3, mode: 'solo',    duration: 45, plan: day3Plan, completed: false },
    ]
  };
}

function renderSchedule() {
  const view = document.getElementById('view');

  // Empty state
  if (!state.schedule || !state.schedule.days) {
    view.innerHTML = `<h2 class="view-title">Weekly Schedule</h2>
      <p class="view-sub">3 days · 2 solo + 1 partner</p>
      <div class="card">
        <p style="font-size:14px;line-height:1.55;margin-bottom:12px">
          Build a focused 3-day week:
        </p>
        <ul style="font-size:13px;color:var(--muted);padding-left:18px;line-height:1.6;margin-bottom:12px">
          <li><strong style="color:var(--fg)">Day 1</strong> — Solo (wall/machine), 45 min</li>
          <li><strong style="color:var(--fg)">Day 2</strong> — Partner practice, 60 min</li>
          <li><strong style="color:var(--fg)">Day 3</strong> — Solo (wall/machine), 45 min (different drills from Day 1)</li>
        </ul>
        <p style="font-size:12.5px;color:var(--muted);line-height:1.5;margin-bottom:14px">
          Each day uses the smart shuffle: warm-up first, mixed categories, no back-to-back high-intensity, cool-down last. Regenerate any day individually.
        </p>
        <button class="btn" id="sch-build">Build This Week's Plan</button>
      </div>`;
    document.getElementById('sch-build').onclick = () => {
      state.schedule = buildScheduleForWeek();
      save(STORAGE.schedule, state.schedule);
      renderSchedule();
    };
    return;
  }

  const sch = state.schedule;
  const done = sch.days.filter(d => d.completed).length;
  const totalMin = sch.days.reduce((a, d) => a + d.plan.drills.reduce((b, x) => b + x.duration, 0), 0);

  view.innerHTML = `<h2 class="view-title">Weekly Schedule</h2>
    <p class="view-sub">${done}/3 done · ${totalMin} min planned</p>
    <div class="week-header">
      <div class="week-range">${formatWeekRange(sch.weekStart)}</div>
      <div class="week-progress">${done}/3 COMPLETE</div>
    </div>
    ${sch.days.map(scheduleDayCard).join('')}
    <button class="btn btn-secondary" id="sch-newweek" style="margin-top:14px">Start New Week</button>`;

  // Action button handlers
  view.querySelectorAll('[data-act]').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const act = btn.dataset.act;
      const dayNum = +btn.dataset.day;
      const day = state.schedule.days.find(d => d.num === dayNum);
      if (!day) return;

      if (act === 'regen') {
        if (!confirm(`Regenerate Day ${dayNum}'s session?`)) return;
        // Exclude other days' drills to maintain variety
        const otherIds = new Set();
        state.schedule.days.filter(d => d.num !== dayNum).forEach(d => {
          d.plan.drills.forEach(x => otherIds.add(x.id));
        });
        day.plan = generateRandomPlan(day.duration, day.mode, otherIds);
        day.plan.focus = day.mode === 'solo' ? 'Solo (wall/machine)' : 'Partner practice';
        day.completed = false;
        save(STORAGE.schedule, state.schedule);
        renderSchedule();
      } else if (act === 'log') {
        state.draft = {
          id: uid(), date: today(),
          focus: `Day ${dayNum} — ${day.plan.focus}`,
          duration: day.plan.drills.reduce((a, x) => a + x.duration, 0),
          partnerSolo: day.mode,
          performance: '',
          drillIds: day.plan.drills.map(x => x.id),
          notes: '',
        };
        setTab('log');
      } else if (act === 'complete') {
        day.completed = !day.completed;
        save(STORAGE.schedule, state.schedule);
        renderSchedule();
      }
    };
  });

  document.getElementById('sch-newweek').onclick = () => {
    if (!confirm('Start a new week? Current schedule will be replaced.')) return;
    state.schedule = buildScheduleForWeek();
    save(STORAGE.schedule, state.schedule);
    renderSchedule();
  };
}

function scheduleDayCard(day) {
  const total = day.plan.drills.reduce((a, x) => a + x.duration, 0);
  const body = day.plan.drills.map(x => {
    const d = DRILLS.find(z => z.id === x.id);
    if (!d) return '';
    return `<div class="sch-mini-drill">
      <div class="sch-mini-drill-head">
        <span class="sch-mini-drill-name">${escapeHtml(d.name)}</span>
        <span class="sch-mini-drill-time">${x.duration} min · ${d.intensity}</span>
      </div>
      <div class="sch-mini-drill-desc">${escapeHtml(d.description)}</div>
      ${d.notes ? `<div class="sch-mini-drill-notes">${escapeHtml(d.notes)}</div>` : ''}
    </div>`;
  }).join('');

  return `<div class="sch-day ${day.completed ? 'completed' : ''}" data-day="${day.num}">
    <div class="sch-day-head">
      <div>
        <div class="sch-day-label">Day ${day.num}</div>
        <div class="sch-day-mode">${day.mode === 'solo' ? 'Solo · Wall / Machine' : 'Partner Practice'}</div>
      </div>
      <div class="sch-day-time">${total} min</div>
    </div>
    <div class="sch-day-focus">${escapeHtml(day.plan.focus)}</div>
    <div class="sch-day-body">${body}</div>
    <div class="sch-day-actions">
      <button class="btn btn-small-secondary" data-act="regen" data-day="${day.num}">Regen</button>
      <button class="btn btn-small-secondary" data-act="log" data-day="${day.num}">Log</button>
      <button class="btn ${day.completed ? '' : 'complete'}" data-act="complete" data-day="${day.num}">${day.completed ? 'Undo' : 'Done'}</button>
    </div>
  </div>`;
}

/* ──────────────────────────────────────────────
   INIT
   ────────────────────────────────────────────── */
setTab(state.activeTab);
