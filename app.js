/* ──────────────────────────────────────────────
   STATE
   ────────────────────────────────────────────── */
const STORAGE = {
  sessions: 'dl_sessions',
  gear:     'dl_gear',
  apiKey:   'dl_api_key',
  activeTab:'dl_tab',
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
  draft:    null,    // current log draft
  plan:     null,    // current randomized/generated plan
};

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
};

function setTab(tab) {
  state.activeTab = tab;
  localStorage.setItem(STORAGE.activeTab, tab);
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
  const labels = {
    drills: 'Drills', log: 'Log Session', history: 'History',
    random: 'Random', generate: 'AI Generate', gear: 'Gear'
  };
  document.getElementById('topbar-tab').textContent = labels[tab];
  VIEWS[tab]();
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => setTab(btn.dataset.tab));
});

/* ──────────────────────────────────────────────
   VIEW: DRILLS
   ────────────────────────────────────────────── */
function renderDrills() {
  const view = document.getElementById('view');
  let html = `
    <h2 class="view-title">Drill Library</h2>
    <p class="view-sub">${DRILLS.length} drills · 10 categories</p>
  `;
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
  bindDrillCards();
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
        <div class="tags">
          ${d.tags.map(t => `<span class="tag">${t}</span>`).join('')}
        </div>
      </div>
    </div>
  `;
}

function bindDrillCards() {
  document.querySelectorAll('.drill-card').forEach(c => {
    c.addEventListener('click', () => c.classList.toggle('open'));
  });
}

/* ──────────────────────────────────────────────
   VIEW: LOG
   ────────────────────────────────────────────── */
function renderLog() {
  const view = document.getElementById('view');
  if (!state.draft) {
    state.draft = {
      id: uid(),
      date: today(),
      focus: '',
      duration: 45,
      partnerSolo: 'solo',
      performance: '',
      drillIds: [],
      notes: '',
    };
  }
  const d = state.draft;

  view.innerHTML = `
    <h2 class="view-title">Log Session</h2>
    <p class="view-sub">Capture today's practice</p>

    <label class="field">
      <span>Date</span>
      <input type="date" id="f-date" value="${d.date}">
    </label>

    <label class="field">
      <span>Focus / Theme</span>
      <input type="text" id="f-focus" placeholder="e.g. resets, third shots, hands" value="${escapeHtml(d.focus)}">
    </label>

    <div class="row">
      <label class="field">
        <span>Duration (min)</span>
        <input type="number" id="f-duration" min="5" max="240" value="${d.duration}">
      </label>
      <label class="field">
        <span>Mode</span>
        <select id="f-mode">
          <option value="solo"    ${d.partnerSolo==='solo'?'selected':''}>Solo</option>
          <option value="partner" ${d.partnerSolo==='partner'?'selected':''}>Partner</option>
          <option value="group"   ${d.partnerSolo==='group'?'selected':''}>Group / clinic</option>
        </select>
      </label>
    </div>

    <label class="field">
      <span>Performance</span>
      <div class="chips" id="f-perf">
        <div class="chip ${d.performance==='sharp'?'active':''}" data-v="sharp">Sharp</div>
        <div class="chip ${d.performance==='okay'?'active':''}"  data-v="okay">Okay</div>
        <div class="chip ${d.performance==='rough'?'active':''}" data-v="rough">Rough</div>
      </div>
    </label>

    <label class="field">
      <span>Drills worked (tap to add)</span>
      <select id="f-add-drill">
        <option value="">+ Add a drill from library</option>
        ${DRILLS.map(dr => `<option value="${dr.id}">${escapeHtml(dr.name)} — ${dr.category}</option>`).join('')}
      </select>
      <div id="f-drill-list" style="margin-top:8px"></div>
    </label>

    <label class="field">
      <span>Notes</span>
      <textarea id="f-notes" placeholder="What worked? What felt off? Body, conditions, partner level...">${escapeHtml(d.notes)}</textarea>
    </label>

    <div class="btn-row">
      <button class="btn btn-secondary" id="f-cancel">Reset</button>
      <button class="btn" id="f-save">Save Session</button>
    </div>
  `;

  renderDraftDrillList();

  // bind
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
    if (e.target.value) {
      d.drillIds.push(e.target.value);
      renderDraftDrillList();
      e.target.value = '';
    }
  };
  document.getElementById('f-save').onclick = saveSession;
  document.getElementById('f-cancel').onclick = () => {
    if (confirm('Reset this draft session?')) {
      state.draft = null;
      renderLog();
    }
  };
}

function renderDraftDrillList() {
  const ul = document.getElementById('f-drill-list');
  if (!state.draft.drillIds.length) {
    ul.innerHTML = `<p class="hint">No drills added yet.</p>`;
    return;
  }
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
    b.onclick = () => {
      state.draft.drillIds.splice(+b.dataset.rm, 1);
      renderDraftDrillList();
    };
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
   VIEW: HISTORY
   ────────────────────────────────────────────── */
function renderHistory() {
  const view = document.getElementById('view');
  if (!state.sessions.length) {
    view.innerHTML = `
      <h2 class="view-title">History</h2>
      <p class="view-sub">All logged sessions</p>
      <div class="empty">
        <div class="empty-icon">○</div>
        <div class="empty-text">No sessions yet. Log one to start.</div>
      </div>`;
    return;
  }

  // aggregate
  const last30 = state.sessions.filter(s => {
    const days = (Date.now() - new Date(s.date)) / 86400000;
    return days <= 30;
  });
  const totalMin = last30.reduce((a, s) => a + (s.duration || 0), 0);
  const sharpPct = last30.length
    ? Math.round(100 * last30.filter(s => s.performance === 'sharp').length / last30.length)
    : 0;

  view.innerHTML = `
    <h2 class="view-title">History</h2>
    <p class="view-sub">${state.sessions.length} session${state.sessions.length===1?'':'s'} logged</p>

    <div class="stat-grid">
      <div class="stat-box"><div class="v">${last30.length}</div><div class="k">Last 30d</div></div>
      <div class="stat-box"><div class="v">${totalMin}</div><div class="k">Minutes</div></div>
      <div class="stat-box"><div class="v">${sharpPct}%</div><div class="k">Sharp</div></div>
    </div>

    ${state.sessions.map(sessionCard).join('')}
  `;

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
  return `
    <div class="session-card">
      <div class="session-head">
        <div class="session-date">${fmtDate(s.date)}</div>
        <span class="session-stats">${s.duration} min · ${s.partnerSolo}</span>
      </div>
      <div class="session-focus">${escapeHtml(s.focus)}</div>
      <div style="margin-bottom:6px">${perfTag}</div>
      ${drills ? `<ul class="session-drills">${drills}</ul>` : ''}
      ${s.notes ? `<p class="session-notes">"${escapeHtml(s.notes)}"</p>` : ''}
      <button class="btn btn-secondary" style="margin-top:10px;font-size:13px;padding:8px" data-del="${s.id}">Delete</button>
    </div>
  `;
}

/* ──────────────────────────────────────────────
   VIEW: RANDOMIZE
   ────────────────────────────────────────────── */
function renderRandom() {
  const view = document.getElementById('view');
  view.innerHTML = `
    <h2 class="view-title">Randomize</h2>
    <p class="view-sub">Smart-shuffled practice from the library</p>

    <label class="field">
      <span>Target duration</span>
      <div class="chips" id="r-dur">
        <div class="chip active" data-v="30">30 min</div>
        <div class="chip" data-v="45">45 min</div>
        <div class="chip" data-v="60">60 min</div>
        <div class="chip" data-v="90">90 min</div>
      </div>
    </label>

    <label class="field">
      <span>Mode</span>
      <div class="chips" id="r-mode">
        <div class="chip active" data-v="any">Any</div>
        <div class="chip" data-v="solo">Solo only</div>
        <div class="chip" data-v="partner">Partner only</div>
      </div>
    </label>

    <button class="btn" id="r-roll">Roll Practice</button>

    <div id="r-out" style="margin-top:18px"></div>
  `;

  let dur = 30, mode = 'any';
  document.querySelectorAll('#r-dur .chip').forEach(c => {
    c.onclick = () => {
      document.querySelectorAll('#r-dur .chip').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      dur = +c.dataset.v;
    };
  });
  document.querySelectorAll('#r-mode .chip').forEach(c => {
    c.onclick = () => {
      document.querySelectorAll('#r-mode .chip').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      mode = c.dataset.v;
    };
  });

  document.getElementById('r-roll').onclick = () => {
    const plan = generateRandomPlan(dur, mode);
    state.plan = plan;
    document.getElementById('r-out').innerHTML = renderPlanBlock(plan, 'Randomized session');
    bindPlanActions();
  };
}

/**
 * Build a logical random practice.
 * Rules:
 *  - Always start with warm-up (~5 min)
 *  - End with cool-down (~5 min)
 *  - Mix categories — no two consecutive drills from the same category
 *  - No two consecutive high-intensity drills
 *  - Fill main block to roughly target duration
 */
function generateRandomPlan(targetMin, mode) {
  const filter = d => mode === 'any' || d.tags.includes(mode);

  const warmups   = DRILLS.filter(d => d.role === 'warmup'   && filter(d));
  const cooldowns = DRILLS.filter(d => d.role === 'cooldown' && filter(d));
  const main      = DRILLS.filter(d => d.role === 'main'     && filter(d));

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
    if (prev && prev.category === d.category) continue;       // no consecutive same-cat
    if (prev && prev.intensity === 'high' && d.intensity === 'high') continue;
    picks.push(d);
    totalMain += d.duration;
    if (totalMain >= mainBudget - 4) break;
  }

  if (cool) picks.push(cool);

  const total = picks.reduce((a, d) => a + d.duration, 0);
  return {
    focus: 'Random shuffle',
    reasoning: `${total}-min mixed practice. Warm-up → ${picks.length - 2} main drills → cool-down. No back-to-back high-intensity or same-category drills.`,
    drills: picks.map(d => ({ id: d.id, duration: d.duration }))
  };
}

function renderPlanBlock(plan, label) {
  const total = plan.drills.reduce((a, d) => a + d.duration, 0);
  return `
    <div class="session-plan-block">
      <div class="plan-focus">${escapeHtml(plan.focus)}</div>
      <p class="plan-reason">${escapeHtml(plan.reasoning)}</p>
      ${plan.drills.map(d => {
        const drill = DRILLS.find(x => x.id === d.id);
        return `<div class="plan-step">
          <span class="plan-step-name">${escapeHtml(drill?.name || '???')}</span>
          <span class="plan-step-time">${d.duration} min</span>
        </div>`;
      }).join('')}
      <div class="plan-step" style="border-top:1px solid var(--border);padding-top:12px;margin-top:6px">
        <span class="plan-step-name" style="color:var(--accent)">TOTAL</span>
        <span class="plan-step-time" style="color:var(--accent);font-weight:500">${total} min</span>
      </div>
    </div>
    <div class="btn-row">
      <button class="btn btn-secondary" id="plan-export">View Details</button>
      <button class="btn" id="plan-tolog">Send to Log</button>
    </div>
  `;
}

function bindPlanActions() {
  const exportBtn = document.getElementById('plan-export');
  const toLogBtn = document.getElementById('plan-tolog');
  if (exportBtn) exportBtn.onclick = () => {
    const lines = state.plan.drills.map(d => {
      const drill = DRILLS.find(x => x.id === d.id);
      return `• ${drill.name} (${d.duration} min)\n  ${drill.description}${drill.notes ? '\n  Note: ' + drill.notes : ''}`;
    }).join('\n\n');
    alert(`${state.plan.focus}\n\n${lines}`);
  };
  if (toLogBtn) toLogBtn.onclick = () => {
    state.draft = {
      id: uid(),
      date: today(),
      focus: state.plan.focus,
      duration: state.plan.drills.reduce((a, d) => a + d.duration, 0),
      partnerSolo: 'solo',
      performance: '',
      drillIds: state.plan.drills.map(d => d.id),
      notes: '',
    };
    setTab('log');
  };
}

/* ──────────────────────────────────────────────
   VIEW: GENERATE (AI)
   ────────────────────────────────────────────── */
function renderGenerate() {
  const view = document.getElementById('view');
  view.innerHTML = `
    <h2 class="view-title">AI Generate</h2>
    <p class="view-sub">Practice built from your last sessions</p>

    ${!state.apiKey ? `
      <div class="warn">
        <strong>API key required.</strong> This uses Anthropic's API. Your key is stored only in this browser's local storage. Get one at console.anthropic.com.
      </div>
    ` : ''}

    <label class="field">
      <span>Anthropic API Key</span>
      <input type="password" id="g-key" placeholder="sk-ant-..." value="${state.apiKey}">
      <p class="hint">Stored locally only. Never sent anywhere except Anthropic.</p>
    </label>

    <label class="field">
      <span>Target duration</span>
      <div class="chips" id="g-dur">
        <div class="chip" data-v="30">30 min</div>
        <div class="chip active" data-v="45">45 min</div>
        <div class="chip" data-v="60">60 min</div>
        <div class="chip" data-v="90">90 min</div>
      </div>
    </label>

    <label class="field">
      <span>Mode</span>
      <div class="chips" id="g-mode">
        <div class="chip active" data-v="any">Any</div>
        <div class="chip" data-v="solo">Solo only</div>
        <div class="chip" data-v="partner">Partner only</div>
      </div>
    </label>

    <button class="btn" id="g-go">Generate Session</button>

    <div id="g-out" style="margin-top:18px"></div>
  `;

  let dur = 45, mode = 'any';
  document.getElementById('g-key').oninput = e => {
    state.apiKey = e.target.value.trim();
    localStorage.setItem(STORAGE.apiKey, state.apiKey);
  };
  document.querySelectorAll('#g-dur .chip').forEach(c => {
    c.onclick = () => {
      document.querySelectorAll('#g-dur .chip').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      dur = +c.dataset.v;
    };
  });
  document.querySelectorAll('#g-mode .chip').forEach(c => {
    c.onclick = () => {
      document.querySelectorAll('#g-mode .chip').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      mode = c.dataset.v;
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

  const drillList = DRILLS.map(d => ({
    id: d.id, name: d.name, category: d.category,
    role: d.role, duration: d.duration, intensity: d.intensity,
    tags: d.tags
  }));

  const sessionsForPrompt = recent.map(s => ({
    date: s.date,
    focus: s.focus,
    performance: s.performance,
    drills: (s.drillIds || []).map(id => {
      const dr = DRILLS.find(x => x.id === id);
      return dr ? dr.name + ' (' + dr.category + ')' : id;
    }),
    notes: s.notes || ''
  }));

  const system = `You are a pickleball coaching assistant. Given a player's recent practice logs, identify their weak areas and build a focused practice session.

Rules:
- Always start with exactly ONE warmup drill (role: warmup).
- Always end with exactly ONE cooldown drill (role: cooldown).
- Pick 4-7 main drills (role: main) in between.
- Total duration should target ${targetMin} minutes (±5 min OK).
- Weight drills toward categories where recent performance was "rough" or "okay" or mentioned in notes as struggling.
- Don't put two high-intensity drills back-to-back.
- Don't put two drills from the same category back-to-back.
${mode !== 'any' ? `- Only include drills with "${mode}" in tags.` : ''}
- Use ONLY drills from the provided library; never invent drills.

Output ONLY a JSON object with this exact shape, no markdown, no preamble:
{
  "focus": "short string naming the focus area",
  "reasoning": "2-3 sentences explaining what weaknesses you saw and why this session targets them",
  "drills": [
    { "id": "drill_id_from_library", "duration": minutes_number }
  ]
}`;

  const userMsg = `Drill library:
${JSON.stringify(drillList)}

Recent sessions (newest first):
${JSON.stringify(sessionsForPrompt, null, 2)}

Build a ${targetMin}-minute session.`;

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
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`API ${res.status}: ${t.slice(0, 200)}`);
    }
    const data = await res.json();
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
    const cleaned = text.replace(/```json|```/g, '').trim();
    const plan = JSON.parse(cleaned);

    // validate
    plan.drills = plan.drills.filter(d => DRILLS.find(x => x.id === d.id));
    state.plan = plan;
    out.innerHTML = renderPlanBlock(plan, 'AI session');
    bindPlanActions();
  } catch (err) {
    out.innerHTML = `<div class="warn">Generation failed: ${escapeHtml(err.message)}</div>`;
  }
}

/* ──────────────────────────────────────────────
   VIEW: GEAR
   ────────────────────────────────────────────── */
const GEAR_TYPES = ['paddle', 'balls', 'ball-machine', 'rebounder', 'court', 'shoes', 'other'];

function renderGear() {
  const view = document.getElementById('view');
  view.innerHTML = `
    <h2 class="view-title">Gear</h2>
    <p class="view-sub">${state.gear.length} item${state.gear.length===1?'':'s'} tracked</p>

    <div class="card card-accent">
      <label class="field">
        <span>Add new gear</span>
        <input type="text" id="gear-name" placeholder="e.g. Slinger Bag, Selkirk Halo, Franklin X-40s">
      </label>
      <div class="row">
        <label class="field">
          <span>Type</span>
          <select id="gear-type">
            ${GEAR_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
          </select>
        </label>
        <label class="field">
          <span>Status</span>
          <select id="gear-status">
            <option value="active">Active</option>
            <option value="backup">Backup</option>
            <option value="retired">Retired</option>
          </select>
        </label>
      </div>
      <label class="field">
        <span>Notes</span>
        <textarea id="gear-notes" placeholder="weight, grip size, brand, court name..."></textarea>
      </label>
      <button class="btn" id="gear-add">Add Gear</button>
    </div>

    <div class="divider"></div>

    <div id="gear-list"></div>
  `;

  renderGearList();

  document.getElementById('gear-add').onclick = () => {
    const name = document.getElementById('gear-name').value.trim();
    if (!name) return alert('Name required.');
    state.gear.unshift({
      id: uid(),
      name,
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
  list.innerHTML = state.gear.map(g => `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">
        <div style="font-family:'Bebas Neue';font-size:20px">${escapeHtml(g.name)}</div>
        <span class="tag accent">${g.status}</span>
      </div>
      <div class="drill-meta" style="margin-bottom:6px">${g.type}</div>
      ${g.notes ? `<div class="session-notes">${escapeHtml(g.notes)}</div>` : ''}
      <button class="btn btn-secondary" style="margin-top:10px;font-size:13px;padding:8px" data-rm-gear="${g.id}">Remove</button>
    </div>
  `).join('');
  list.querySelectorAll('[data-rm-gear]').forEach(b => {
    b.onclick = () => {
      if (confirm('Remove this gear item?')) {
        state.gear = state.gear.filter(g => g.id !== b.dataset.rmGear);
        save(STORAGE.gear, state.gear);
        renderGearList();
      }
    };
  });
}

/* ──────────────────────────────────────────────
   INIT
   ────────────────────────────────────────────── */
setTab(state.activeTab);
