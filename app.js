const STORAGE_KEY = 'worldview-engine-state-v1';
const SEED_STATE = {
  repoName: '42ndWorldview',
  engineName: '42ndPsychology',
  version: '1.0.0',
  description: 'A static canonical psychology engine for compressing philosophy into portable logic.',
  meta: {
    objective: 'Discover the smallest stable set of canonical terms and rules that reproduces one psychology with high consistency across scenarios.',
    invariants: [
      'The core only stores canonical terms, validated rules, compact definitions, and explicit constraints.',
      'Raw language never enters core directly; it must pass intake, classification, reduction, and conflict checks.',
      'Logic is graded, not binary. A rule can be core, provisional, contested, weak, or rejected.',
      'Compression must not destroy precision. Smaller is better only if predictive power and consistency hold.',
      'Every accepted term or rule must improve precision, compression, contradiction handling, predictive power, or scenario coverage.'
    ],
    categories: [
      {
        key: 'belief_architecture',
        label: 'Belief Architecture',
        note: 'How the worldview stores principles, priorities, and generalizations.'
      },
      {
        key: 'epistemic_stability',
        label: 'Epistemic Stability',
        note: 'How the worldview filters evidence, error, uncertainty, and contradiction.'
      },
      {
        key: 'decision_policy',
        label: 'Decision Policy',
        note: 'How the worldview converts principles into action under constraints and tradeoffs.'
      }
    ]
  },
  terms: [
    {
      key: 'precision',
      label: 'precision',
      class: 'primitive',
      state: 'core',
      definition: 'Degree to which a statement cleanly distinguishes what it includes and excludes.',
      aliases: ['specificity'],
      improves: ['precision', 'compression'],
      notes: 'Higher precision reduces drift across LLMs.',
      compressionScore: 0.92
    },
    {
      key: 'compression',
      label: 'compression',
      class: 'primitive',
      state: 'core',
      definition: 'Reduction of logic into fewer canonical tokens without losing meaning or scenario performance.',
      aliases: ['compactness'],
      improves: ['compression'],
      notes: 'Compression is only good when fidelity stays high.',
      compressionScore: 0.96
    },
    {
      key: 'epistemic_stability',
      label: 'epistemic stability',
      class: 'primitive',
      state: 'core',
      definition: 'Resistance to contradiction, manipulation, drift, and overreaction when updating beliefs.',
      aliases: ['stability'],
      improves: ['contradiction handling', 'predictive power'],
      notes: 'A stable system updates, but does not thrash.',
      compressionScore: 0.88
    },
    {
      key: 'scope_condition',
      label: 'scope condition',
      class: 'derived',
      state: 'core',
      definition: 'Explicit statement of where a rule applies, where it weakens, and where it breaks.',
      aliases: ['domain limit'],
      improves: ['precision', 'contradiction handling'],
      notes: 'Lets narrow a useful rule instead of deleting it.',
      compressionScore: 0.84
    },
    {
      key: 'canonical_term',
      label: 'canonical term',
      class: 'derived',
      state: 'core',
      definition: 'A validated term admitted into core because it improves the engine more than its alternatives.',
      aliases: ['core term'],
      improves: ['compression', 'precision'],
      notes: 'Only canonical terms appear in the final logic box.',
      compressionScore: 0.8
    }
  ],
  rules: [
    {
      id: 'R1',
      state: 'core',
      scope: 'global',
      statement: 'Do not admit a new term into core if existing canonical terms can express the same logic with equal or greater precision.',
      confidence: 0.96,
      useCases: ['term intake', 'compression discipline'],
      failureModes: ['false synonym match', 'hidden nuance loss'],
      conflictPoints: ['novel primitive may be rejected too early'],
      linkedTerms: ['canonical_term', 'precision', 'compression']
    },
    {
      id: 'R2',
      state: 'core',
      scope: 'global',
      statement: 'Inferior logic should be weakened, scoped, split, translated, or sandboxed before outright deletion when it still contains recoverable signal.',
      confidence: 0.91,
      useCases: ['logic refinement', 'conflict resolution'],
      failureModes: ['keeping too much noise', 'wasting space on dead branches'],
      conflictPoints: ['some logic is harmful enough to reject early'],
      linkedTerms: ['scope_condition', 'epistemic_stability']
    },
    {
      id: 'R3',
      state: 'core',
      scope: 'global',
      statement: 'Compression is valid only if output consistency, scenario coverage, and contradiction resistance do not materially degrade.',
      confidence: 0.97,
      useCases: ['logic box rebuild', 'prompt optimization'],
      failureModes: ['over-compressed slogans', 'loss of edge cases'],
      conflictPoints: ['temporary drop may be acceptable during exploration'],
      linkedTerms: ['compression', 'precision', 'epistemic_stability']
    },
    {
      id: 'R4',
      state: 'provisional',
      scope: 'policy and moral scenarios',
      statement: 'When two rules conflict, prefer the one with tighter scope fit, higher contradiction resistance, and better historical scenario performance.',
      confidence: 0.81,
      useCases: ['scenario adjudication'],
      failureModes: ['performance metric can be gamed', 'history can bias future edge cases'],
      conflictPoints: ['novel scenarios may need fresh weighting'],
      linkedTerms: ['scope_condition', 'epistemic_stability', 'precision']
    }
  ],
  staging: [],
  history: []
};

let state = loadState();
let lastProposalVerdict = null;

const byId = (id) => document.getElementById(id);

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return clone(SEED_STATE);
  try {
    return JSON.parse(raw);
  } catch {
    return clone(SEED_STATE);
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function download(filename, text, type = 'text/plain') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function slugify(s) {
  return (s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function canonicalVocabulary() {
  const termLines = state.terms
    .filter(t => t.state === 'core')
    .sort((a, b) => a.label.localeCompare(b.label))
    .map(t => `${t.label}: ${t.definition}`);

  const ruleLines = state.rules
    .filter(r => r.state === 'core' || r.state === 'provisional')
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(r => `[${r.id}|${r.state}|${r.scope}] ${r.statement}`);

  return { termLines, ruleLines };
}

function buildLogicBox(mode = 'compact') {
  const { termLines, ruleLines } = canonicalVocabulary();
  const intro = [
    `ENGINE=${state.engineName}`,
    `VERSION=${state.version}`,
    `OBJECTIVE=${state.meta.objective}`,
    `USE=Apply only the canonical definitions and rules below. Do not import outside ideology unless required to interpret plain language. Resolve scenarios by preserving precision, compression fidelity, contradiction resistance, and scope fit.`
  ];
  const invariants = state.meta.invariants.map((x, i) => `I${i + 1}=${x}`);

  if (mode === 'compact') {
    return [
      ...intro,
      ...invariants,
      'TERMS_BEGIN',
      ...termLines,
      'TERMS_END',
      'RULES_BEGIN',
      ...ruleLines,
      'RULES_END',
      'OUTPUT_PROTOCOL=Given a scenario, identify applicable rules, note conflicts, choose the highest-fit rule-set, give conclusion, and mark uncertainty where the canonical system lacks coverage.'
    ].join('\n');
  }

  const categories = state.meta.categories.map(c => `- ${c.label}: ${c.note}`).join('\n');
  const allTerms = state.terms.map(t => `- ${t.label} [${t.class}/${t.state}]\n  definition: ${t.definition}\n  aliases: ${t.aliases.join(', ') || '(none)'}\n  notes: ${t.notes || '(none)'}`).join('\n');
  const allRules = state.rules.map(r => `- ${r.id} [${r.state}/${r.scope}] ${r.statement}\n  confidence: ${r.confidence}\n  failure modes: ${r.failureModes.join('; ') || '(none)'}\n  conflicts: ${r.conflictPoints.join('; ') || '(none)'}`).join('\n');

  return [
    `${state.engineName} Expanded Logic Box`,
    '',
    `Objective: ${state.meta.objective}`,
    '',
    'Categories:',
    categories,
    '',
    'Invariants:',
    ...state.meta.invariants.map(x => `- ${x}`),
    '',
    'Canonical Terms:',
    allTerms,
    '',
    'Rules:',
    allRules,
    '',
    'Scenario Protocol:',
    '1. Parse the scenario with only the canonical vocabulary as the decision lens.',
    '2. Map the scenario to the nearest terms and rules.',
    '3. Reject hidden assumptions that are not grounded in the logic box.',
    '4. Resolve conflict by scope fit, contradiction resistance, and confidence.',
    '5. Produce the conclusion and name missing coverage if any.'
  ].join('\n');
}

function interpreterState() {
  return JSON.stringify({
    repoName: state.repoName,
    engineName: state.engineName,
    version: state.version,
    meta: state.meta,
    terms: state.terms,
    rules: state.rules,
    staging: state.staging
  }, null, 2);
}

function normalizeStateShape(input) {
  return {
    ...clone(SEED_STATE),
    ...input,
    meta: {
      ...clone(SEED_STATE.meta),
      ...(input.meta || {})
    },
    terms: Array.isArray(input.terms) ? input.terms : [],
    rules: Array.isArray(input.rules) ? input.rules : [],
    staging: Array.isArray(input.staging) ? input.staging : [],
    history: Array.isArray(input.history) ? input.history : []
  };
}

function setProfileStatus(message, tone = 'neutral') {
  const el = byId('profileStatus');
  if (!el) return;
  el.textContent = message;
  el.classList.remove('status-ok', 'status-error');
  if (tone === 'ok') el.classList.add('status-ok');
  if (tone === 'error') el.classList.add('status-error');
}

function syncInterpreterFromState() {
  const box = byId('interpreterBox');
  if (document.activeElement === box) return;
  box.value = interpreterState();
}

function countCoreSignature(snapshot) {
  const coreTerms = (snapshot.terms || []).filter(t => t.state === 'core').length;
  const coreRules = (snapshot.rules || []).filter(r => r.state === 'core').length;
  return { coreTerms, coreRules };
}

function isProposalItem(item) {
  return item && (item.kind === 'term' || item.kind === 'rule');
}

function applyInterpreterJson(rawText) {
  try {
    const parsed = JSON.parse(rawText);
    const nextState = normalizeStateShape(parsed);
    const before = countCoreSignature(state);
    const after = countCoreSignature(nextState);
    state = nextState;
    persist();
    if (before.coreTerms === after.coreTerms && before.coreRules === after.coreRules) {
      setProfileStatus('Profile JSON valid. Loaded successfully. Core term/rule counts are unchanged, so Logic Box may look the same.', 'ok');
    } else {
      setProfileStatus(`Profile JSON valid. Core terms: ${before.coreTerms} → ${after.coreTerms}. Core rules: ${before.coreRules} → ${after.coreRules}.`, 'ok');
    }
    render();
  } catch {
    setProfileStatus('Invalid JSON: fix syntax to apply changes.', 'error');
  }
}

function buildJsonPrimer() {
  const schema = interpreterState();
  return [
    'You must respond with JSON only.',
    'Do not include markdown fences, commentary, explanations, or any text before/after JSON.',
    'Output must be parseable by JSON.parse exactly as-is.',
    'Use this exact object shape and keys:',
    schema
  ].join('\n\n');
}

function scoreState() {
  const termCount = state.terms.length;
  const ruleCount = state.rules.length;
  const coreTerms = state.terms.filter(t => t.state === 'core').length;
  const coreRules = state.rules.filter(r => r.state === 'core').length;
  const provisionalRules = state.rules.filter(r => r.state === 'provisional').length;
  const avgConfidence = state.rules.length ? state.rules.reduce((a, r) => a + (Number(r.confidence) || 0), 0) / state.rules.length : 0;
  const avgCompression = state.terms.length ? state.terms.reduce((a, t) => a + (Number(t.compressionScore) || 0), 0) / state.terms.length : 0;

  const warnings = [];
  const aliasMap = new Map();
  for (const term of state.terms) {
    for (const alias of term.aliases || []) {
      const k = alias.toLowerCase();
      if (!aliasMap.has(k)) aliasMap.set(k, []);
      aliasMap.get(k).push(term.label);
    }
  }
  for (const [alias, labels] of aliasMap.entries()) {
    if (labels.length > 1) warnings.push(`Alias collision: "${alias}" points to multiple terms: ${labels.join(', ')}`);
  }

  for (const rule of state.rules) {
    if ((rule.statement || '').trim().length < 30) warnings.push(`${rule.id} is too short and may be under-defined.`);
    if ((rule.failureModes || []).length === 0) warnings.push(`${rule.id} has no recorded failure modes.`);
  }

  return {
    metrics: [
      ['Terms', termCount],
      ['Rules', ruleCount],
      ['Core Terms', coreTerms],
      ['Core Rules', coreRules],
      ['Provisional Rules', provisionalRules],
      ['Avg Rule Confidence', avgConfidence.toFixed(2)],
      ['Avg Term Compression', avgCompression.toFixed(2)],
      ['Staging Items', state.staging.length]
    ],
    warnings
  };
}

function classifyTermCandidate(label, definition) {
  const normalized = label.toLowerCase().trim();
  const exact = state.terms.find(t => t.label.toLowerCase() === normalized || t.key === slugify(normalized));
  if (exact) return { class: 'alias', reason: `Existing term already covers this label: ${exact.label}` };

  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length > 3) return { class: 'compound', reason: 'Label is multi-part and likely reducible or overloaded.' };
  if (/\bor\b|\band\b|\//.test(normalized)) return { class: 'ambiguous', reason: 'Label contains merged alternatives or conjunctions.' };

  const overlap = state.terms.find(t => {
    const pool = [t.label, ...(t.aliases || [])].map(x => x.toLowerCase());
    return pool.some(a => normalized.includes(a) || a.includes(normalized));
  });
  if (overlap) return { class: 'derived', reason: `Candidate appears reducible to existing vocabulary around ${overlap.label}.` };

  if ((definition || '').split(/\s+/).length < 6) return { class: 'ambiguous', reason: 'Definition is too short to validate.' };
  return { class: 'primitive', reason: 'Looks genuinely new and sufficiently bounded.' };
}

function evaluateProposal() {
  const label = byId('proposalLabel').value.trim();
  const kind = byId('proposalKind').value;
  const proposedState = byId('proposalState').value;
  const scope = byId('proposalScope').value.trim() || 'unspecified';
  const definition = byId('proposalDefinition').value.trim();
  const rationale = byId('proposalRationale').value.trim();
  const notes = byId('proposalNotes').value.trim();

  if (!label || !definition) {
    return {
      ok: false,
      verdict: 'Proposal incomplete. A label and a definition/statement are required.',
      action: 'reject'
    };
  }

  const improvements = [];
  const risks = [];
  const blockers = [];
  let classification = null;

  if (kind === 'term') {
    classification = classifyTermCandidate(label, definition);
    if (classification.class === 'primitive') improvements.push('Potential new primitive with enough separation from current vocabulary.');
    if (classification.class === 'derived') risks.push('Candidate may be reducible to existing terms and could hurt compression.');
    if (classification.class === 'alias') blockers.push('Term already exists or is too close to an admitted term.');
    if (classification.class === 'compound' || classification.class === 'ambiguous') risks.push(classification.reason);
    if (definition.length > 80 && definition.length < 220) improvements.push('Definition length is compact enough to be portable.');
    if (/improve|precision|scope|contradiction|predict/i.test(rationale)) improvements.push('Rationale refers to engine goals.');
  } else {
    if (!/[.!?]$/.test(definition)) risks.push('Rule statement does not end cleanly and may be underspecified.');
    if (definition.split(/\s+/).length < 10) blockers.push('Rule statement is too short to be safely admitted.');
    if (/always|never/.test(definition.toLowerCase()) && !/unless|except|scope|condition/.test(definition.toLowerCase())) {
      risks.push('Absolute wording without scope conditions raises failure risk.');
    }
    const duplicates = state.rules.filter(r => similarity(r.statement, definition) > 0.78);
    if (duplicates.length) blockers.push(`Rule is too close to existing rule(s): ${duplicates.map(d => d.id).join(', ')}`);
    if (/scope|condition|fail|edge|conflict/i.test(notes)) improvements.push('Notes acknowledge boundaries or failure modes.');
  }

  if (!rationale) risks.push('No rationale provided, so value added is unclear.');
  if (proposedState === 'core' && risks.length) risks.push('Direct admission to core is too aggressive while unresolved risks remain.');

  let action = 'stage';
  let ok = true;
  if (blockers.length) { action = 'reject'; ok = false; }
  else if (risks.length > 2) { action = 'stage'; }
  else { action = kind === 'term' && classification?.class === 'primitive' ? 'apply' : 'stage'; }

  const verdict = [
    `Proposal: ${label}`,
    `Kind: ${kind}`,
    classification ? `Classification: ${classification.class} (${classification.reason})` : '',
    improvements.length ? `Strengths:\n- ${improvements.join('\n- ')}` : 'Strengths:\n- none logged',
    risks.length ? `Risks:\n- ${risks.join('\n- ')}` : 'Risks:\n- none logged',
    blockers.length ? `Blockers:\n- ${blockers.join('\n- ')}` : 'Blockers:\n- none logged',
    `Recommended action: ${action}`
  ].filter(Boolean).join('\n\n');

  return {
    ok,
    action,
    verdict,
    payload: { label, kind, proposedState, scope, definition, rationale, notes, classification }
  };
}

function similarity(a, b) {
  const sa = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
  const sb = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
  const inter = [...sa].filter(x => sb.has(x)).length;
  const union = new Set([...sa, ...sb]).size || 1;
  return inter / union;
}

function applyProposal(payload) {
  if (payload.kind === 'term') {
    state.terms.push({
      key: slugify(payload.label),
      label: payload.label,
      class: payload.classification?.class || 'derived',
      state: payload.proposedState,
      definition: payload.definition,
      aliases: [],
      improves: extractImproves(payload.rationale + ' ' + payload.notes),
      notes: payload.notes || payload.rationale || '',
      compressionScore: 0.7
    });
  } else {
    const nextId = `R${Math.max(0, ...state.rules.map(r => parseInt((r.id || 'R0').replace('R', ''), 10) || 0)) + 1}`;
    state.rules.push({
      id: nextId,
      state: payload.proposedState,
      scope: payload.scope,
      statement: payload.definition,
      confidence: payload.proposedState === 'core' ? 0.8 : 0.65,
      useCases: [],
      failureModes: payload.notes ? [payload.notes] : [],
      conflictPoints: [],
      linkedTerms: linkTerms(payload.definition)
    });
  }
  state.history.push({ ts: new Date().toISOString(), type: 'apply', payload });
  persist();
  render();
}

function stageProposal(payload) {
  state.staging.unshift({
    id: `S${Date.now()}`,
    ts: new Date().toISOString(),
    ...payload
  });
  state.history.push({ ts: new Date().toISOString(), type: 'stage', payload });
  persist();
  render();
}

function extractImproves(text) {
  const items = [];
  const pool = ['precision', 'compression', 'predictive power', 'contradiction handling', 'scenario coverage'];
  for (const item of pool) if (text.toLowerCase().includes(item)) items.push(item);
  return [...new Set(items)];
}

function linkTerms(text) {
  const lower = text.toLowerCase();
  return state.terms.filter(t => lower.includes(t.label.toLowerCase())).map(t => t.key);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderTerms() {
  const wrap = byId('termsTableWrap');
  const table = byId('termRowTemplate').content.firstElementChild.cloneNode(true);
  const tbody = table.querySelector('tbody');
  state.terms.forEach((term, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="mono">${escapeHtml(term.key)}</td>
      <td>${escapeHtml(term.label)}</td>
      <td><span class="badge">${escapeHtml(term.class)}</span></td>
      <td><span class="badge state-${escapeHtml(term.state)}">${escapeHtml(term.state)}</span></td>
      <td>${escapeHtml(term.definition)}</td>
      <td>${(term.aliases || []).map(a => `<span class="badge">${escapeHtml(a)}</span>`).join(' ')}</td>
      <td>${escapeHtml(String(term.compressionScore ?? ''))}</td>
      <td>
        <div class="small-actions">
          <button data-term-edit="${idx}">Edit</button>
          <button data-term-del="${idx}" class="danger">Delete</button>
        </div>
      </td>`;
    tbody.appendChild(tr);
  });
  wrap.innerHTML = '';
  wrap.appendChild(table);
}

function renderRules() {
  const wrap = byId('rulesTableWrap');
  const table = byId('ruleRowTemplate').content.firstElementChild.cloneNode(true);
  const tbody = table.querySelector('tbody');
  state.rules.forEach((rule, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="mono">${escapeHtml(rule.id)}</td>
      <td><span class="badge state-${escapeHtml(rule.state)}">${escapeHtml(rule.state)}</span></td>
      <td>${escapeHtml(rule.scope)}</td>
      <td>${escapeHtml(rule.statement)}</td>
      <td>${escapeHtml(String(rule.confidence))}</td>
      <td>${(rule.failureModes || []).map(f => `<span class="badge">${escapeHtml(f)}</span>`).join(' ')}</td>
      <td>
        <div class="small-actions">
          <button data-rule-edit="${idx}">Edit</button>
          <button data-rule-del="${idx}" class="danger">Delete</button>
        </div>
      </td>`;
    tbody.appendChild(tr);
  });
  wrap.innerHTML = '';
  wrap.appendChild(table);
}

function renderMetrics() {
  const { metrics, warnings } = scoreState();
  byId('stateMetrics').innerHTML = metrics.map(([label, value]) => `<div class="metric">${escapeHtml(label)}<strong>${escapeHtml(String(value))}</strong></div>`).join('');
  byId('warningsBox').innerHTML = warnings.length ? warnings.map(w => `<div class="warning-item">${escapeHtml(w)}</div>`).join('') : '<div class="hint">No structural warnings right now.</div>';
}

function renderStaging() {
  const wrap = byId('stagingWrap');
  if (!state.staging.length) {
    wrap.innerHTML = '<div class="hint">Staging is empty.</div>';
    return;
  }
  wrap.innerHTML = state.staging.map((item, idx) => {
    const title = item.label || item.type || 'staging item';
    const kind = item.kind || item.type || 'entry';
    const stateBadge = item.proposedState || item.state || 'unspecified';
    const definition = item.definition || item.statement || item.conclusion || item.scenario || '(no preview text)';
    const details = item.notes || item.rationale || item.uncertainty || '';
    const showApply = isProposalItem(item);
    return `
      <div class="staging-card">
        <div class="row">
          <strong>${escapeHtml(title)} <span class="badge">${escapeHtml(kind)}</span></strong>
          <span class="hint">${escapeHtml(item.ts || '')}</span>
        </div>
        <p><span class="badge state-${escapeHtml(stateBadge)}">${escapeHtml(stateBadge)}</span> <span class="badge">${escapeHtml(item.scope || 'unspecified')}</span></p>
        <p>${escapeHtml(definition)}</p>
        <p class="hint">${escapeHtml(details)}</p>
        <div class="small-actions">
          ${showApply ? `<button data-stage-apply="${idx}">Apply</button>` : ''}
          <button data-stage-remove="${idx}" class="danger">Remove</button>
        </div>
      </div>
    `;
  }).join('');
}

function buildScenarioPrompt() {
  const scenario = byId('scenarioInput').value.trim();
  const box = buildLogicBox(byId('logicFormatSelect').value);
  byId('scenarioPromptBox').value = `${box}\n\nSCENARIO_BEGIN\n${scenario || '[insert scenario]'}\nSCENARIO_END\n\nTASK=Use only the logic box above as the worldview lens. Identify the most relevant terms and rules, resolve conflicts, then answer the scenario. If coverage is missing, say exactly what is missing.`;
}

function tokenDiff(left, right) {
  const a = left.split(/(\s+)/);
  const b = right.split(/(\s+)/);
  const m = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      m[i][j] = a[i] === b[j] ? 1 + m[i + 1][j + 1] : Math.max(m[i + 1][j], m[i][j + 1]);
    }
  }
  let i = 0, j = 0;
  const out = [];
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ type: 'same', text: a[i] });
      i++; j++;
    } else if (m[i + 1][j] >= m[i][j + 1]) {
      out.push({ type: 'del', text: a[i++] });
    } else {
      out.push({ type: 'add', text: b[j++] });
    }
  }
  while (i < a.length) out.push({ type: 'del', text: a[i++] });
  while (j < b.length) out.push({ type: 'add', text: b[j++] });
  return out;
}

function renderDiff() {
  const left = byId('diffLeft').value;
  const right = byId('diffRight').value;
  const diff = tokenDiff(left, right);
  const adds = diff.filter(x => x.type === 'add').length;
  const dels = diff.filter(x => x.type === 'del').length;
  byId('diffMeta').textContent = `Adds: ${adds} | Deletes: ${dels}`;
  byId('diffOutput').innerHTML = diff.map(part => `<span class="diff-${part.type}">${escapeHtml(part.text)}</span>`).join('');
}

function editTerm(idx) {
  const term = state.terms[idx];
  const label = prompt('Label', term.label);
  if (label === null) return;
  const definition = prompt('Definition', term.definition);
  if (definition === null) return;
  term.label = label;
  term.definition = definition;
  term.key = slugify(label);
  persist();
  render();
}

function editRule(idx) {
  const rule = state.rules[idx];
  const statement = prompt('Rule statement', rule.statement);
  if (statement === null) return;
  const scope = prompt('Scope', rule.scope);
  if (scope === null) return;
  rule.statement = statement;
  rule.scope = scope;
  persist();
  render();
}

function render() {
  byId('logicBox').value = buildLogicBox(byId('logicFormatSelect').value);
  syncInterpreterFromState();
  byId('jsonPrimerBox').value = buildJsonPrimer();
  renderTerms();
  renderRules();
  renderMetrics();
  renderStaging();
  buildScenarioPrompt();
}

document.addEventListener('click', (e) => {
  const t = e.target;
  if (t.matches('[data-term-edit]')) editTerm(Number(t.dataset.termEdit));
  if (t.matches('[data-term-del]')) { state.terms.splice(Number(t.dataset.termDel), 1); persist(); render(); }
  if (t.matches('[data-rule-edit]')) editRule(Number(t.dataset.ruleEdit));
  if (t.matches('[data-rule-del]')) { state.rules.splice(Number(t.dataset.ruleDel), 1); persist(); render(); }
  if (t.matches('[data-stage-apply]')) {
    const idx = Number(t.dataset.stageApply);
    const item = state.staging[idx];
    if (!isProposalItem(item)) {
      alert('This staging item is reference material, not a term/rule proposal.');
      return;
    }
    applyProposal(item);
    state.staging.splice(idx, 1);
    persist();
    render();
  }
  if (t.matches('[data-stage-remove]')) { state.staging.splice(Number(t.dataset.stageRemove), 1); persist(); render(); }
});

byId('logicFormatSelect').addEventListener('change', render);
byId('rebuildBtn').addEventListener('click', render);
byId('copyLogicBtn').addEventListener('click', async () => navigator.clipboard.writeText(byId('logicBox').value));
byId('downloadLogicBtn').addEventListener('click', () => download('42ndWorldview-logic-box.txt', byId('logicBox').value));
byId('copyInterpreterBtn').addEventListener('click', async () => navigator.clipboard.writeText(byId('interpreterBox').value));
byId('scoreStateBtn').addEventListener('click', renderMetrics);
byId('runProposalBtn').addEventListener('click', () => {
  lastProposalVerdict = evaluateProposal();
  byId('proposalResult').textContent = lastProposalVerdict.verdict;
  byId('applyProposalBtn').disabled = !lastProposalVerdict || lastProposalVerdict.action !== 'apply';
  byId('stageProposalBtn').disabled = !lastProposalVerdict || (lastProposalVerdict.action !== 'stage' && lastProposalVerdict.action !== 'apply');
});
byId('applyProposalBtn').addEventListener('click', () => {
  if (!lastProposalVerdict?.payload) return;
  applyProposal(lastProposalVerdict.payload);
  byId('proposalResult').textContent = 'Applied to state.';
});
byId('stageProposalBtn').addEventListener('click', () => {
  if (!lastProposalVerdict?.payload) return;
  stageProposal(lastProposalVerdict.payload);
  byId('proposalResult').textContent = 'Moved to staging.';
});
byId('scenarioInput').addEventListener('input', buildScenarioPrompt);
byId('copyScenarioPromptBtn').addEventListener('click', async () => navigator.clipboard.writeText(byId('scenarioPromptBox').value));
byId('loadCurrentToLeftBtn').addEventListener('click', () => { byId('diffLeft').value = byId('logicBox').value; renderDiff(); });
byId('compareDiffBtn').addEventListener('click', renderDiff);
byId('swapDiffBtn').addEventListener('click', () => {
  const a = byId('diffLeft').value;
  byId('diffLeft').value = byId('diffRight').value;
  byId('diffRight').value = a;
  renderDiff();
});
byId('clearStagingBtn').addEventListener('click', () => { state.staging = []; persist(); render(); });
byId('exportStateBtn').addEventListener('click', () => download('42ndWorldview-state.json', JSON.stringify(state, null, 2), 'application/json'));
byId('importStateInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const text = await file.text();
  try {
    state = normalizeStateShape(JSON.parse(text));
    persist();
    setProfileStatus('State imported successfully.', 'ok');
    render();
  } catch {
    alert('Invalid JSON state file.');
    setProfileStatus('Invalid imported state JSON.', 'error');
  }
});
byId('resetToSeedBtn').addEventListener('click', () => {
  state = clone(SEED_STATE);
  persist();
  render();
});
byId('addTermBtn').addEventListener('click', () => {
  state.terms.push({
    key: `new_term_${Date.now()}`,
    label: 'new term',
    class: 'derived',
    state: 'provisional',
    definition: 'Define this term.',
    aliases: [],
    improves: [],
    notes: '',
    compressionScore: 0.5
  });
  persist();
  render();
});
byId('addRuleBtn').addEventListener('click', () => {
  const nextId = `R${Math.max(0, ...state.rules.map(r => parseInt((r.id || 'R0').replace('R', ''), 10) || 0)) + 1}`;
  state.rules.push({
    id: nextId,
    state: 'provisional',
    scope: 'unspecified',
    statement: 'Write the rule statement here.',
    confidence: 0.5,
    useCases: [],
    failureModes: [],
    conflictPoints: [],
    linkedTerms: []
  });
  persist();
  render();
});

byId('interpreterBox').addEventListener('input', () => {
  applyInterpreterJson(byId('interpreterBox').value);
});
byId('exportProfileBtn').addEventListener('click', () => download('42ndWorldview-profile.json', interpreterState(), 'application/json'));
byId('importProfileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  applyInterpreterJson(await file.text());
});
byId('copyJsonPrimerBtn').addEventListener('click', async () => navigator.clipboard.writeText(byId('jsonPrimerBox').value));
byId('loadCurrentProfileBtn').addEventListener('click', () => {
  byId('profileLeft').value = interpreterState();
});
byId('importCompareProfileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  byId('profileRight').value = await file.text();
});
byId('compareProfilesBtn').addEventListener('click', () => {
  const left = byId('profileLeft').value;
  const right = byId('profileRight').value;
  const diff = tokenDiff(left, right);
  const adds = diff.filter(x => x.type === 'add').length;
  const dels = diff.filter(x => x.type === 'del').length;
  byId('profileDiffMeta').textContent = `Adds: ${adds} | Deletes: ${dels}`;
  byId('profileDiffOutput').innerHTML = diff.map(part => `<span class="diff-${part.type}">${escapeHtml(part.text)}</span>`).join('');
});

render();
