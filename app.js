const STORAGE_KEY = 'worldview-minimal-v2';

const SEED_PROFILE = {
  profileName: '42ndPsychology',
  description: 'Portable worldview profile for JSON-only LLM workflows.',
  terms: [
    { key: 'precision', definition: 'Clear boundaries on what a claim includes and excludes.' },
    { key: 'compression', definition: 'Keep the worldview short without losing meaning.' }
  ],
  rules: [
    { id: 'R1', statement: 'Respond in strict JSON only. No markdown, no prose outside JSON.' },
    { id: 'R2', statement: 'Keep controversial claims contextualized; do not generalize without evidence.' }
  ],
  notes: ''
};

let profile = loadProfile();

const byId = (id) => document.getElementById(id);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadProfile() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return clone(SEED_PROFILE);
    return JSON.parse(saved);
  } catch {
    return clone(SEED_PROFILE);
  }
}

function saveProfile() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

function jsonText(obj) {
  return JSON.stringify(obj, null, 2);
}

function setStatus(text, kind = 'ok') {
  const el = byId('profileStatus');
  el.textContent = text;
  el.className = `hint ${kind === 'ok' ? 'status-ok' : 'status-error'}`;
}

function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function buildPrompt() {
  const scenario = byId('scenarioBox').value.trim() || 'No scenario provided.';
  const schema = jsonText(profile);
  return [
    'You are a JSON generator.',
    'Output STRICT JSON only.',
    'Do not include markdown, code fences, comments, or any extra text.',
    'Return exactly one valid JSON object matching this structure:',
    schema,
    'Update values based on this scenario text:',
    scenario
  ].join('\n\n');
}

function countStrings(value) {
  if (typeof value === 'string') return 1;
  if (Array.isArray(value)) return value.reduce((n, v) => n + countStrings(v), 0);
  if (value && typeof value === 'object') {
    return Object.values(value).reduce((n, v) => n + countStrings(v), 0);
  }
  return 0;
}

function lineDiff(a, b) {
  const aLines = a.split('\n');
  const bLines = b.split('\n');
  const max = Math.max(aLines.length, bLines.length);
  const out = [];
  let adds = 0;
  let dels = 0;

  for (let i = 0; i < max; i += 1) {
    const left = aLines[i];
    const right = bLines[i];
    if (left === right) {
      if (left !== undefined) out.push(`  ${left}`);
      continue;
    }
    if (left !== undefined) {
      out.push(`- ${left}`);
      dels += 1;
    }
    if (right !== undefined) {
      out.push(`+ ${right}`);
      adds += 1;
    }
  }

  return { text: out.join('\n'), adds, dels };
}

function renderVisualizer() {
  const terms = Array.isArray(profile.terms) ? profile.terms.length : 0;
  const rules = Array.isArray(profile.rules) ? profile.rules.length : 0;
  const chars = jsonText(profile).length;
  const textFields = countStrings(profile);

  byId('visualizer').innerHTML = [
    ['Terms', terms],
    ['Rules', rules],
    ['JSON Size', `${chars} chars`],
    ['Text Fields', textFields]
  ].map(([k, v]) => `<div class="metric"><div class="k">${k}</div><div class="v">${v}</div></div>`).join('');
}

function applyProfileJson(text) {
  const parsed = safeParse(text);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    setStatus('Invalid JSON. State not updated.', 'error');
    return;
  }
  profile = parsed;
  saveProfile();
  setStatus('Valid JSON. Profile updated.', 'ok');
  byId('promptBox').value = buildPrompt();
  renderVisualizer();
}

function download(filename, content) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function render() {
  byId('profileBox').value = jsonText(profile);
  byId('promptBox').value = buildPrompt();
  renderVisualizer();
}

byId('profileBox').addEventListener('input', (e) => applyProfileJson(e.target.value));
byId('scenarioBox').addEventListener('input', () => {
  byId('promptBox').value = buildPrompt();
});

byId('copyProfileBtn').addEventListener('click', async () => {
  await navigator.clipboard.writeText(byId('profileBox').value);
});

byId('copyPromptBtn').addEventListener('click', async () => {
  await navigator.clipboard.writeText(byId('promptBox').value);
});

byId('exportProfileBtn').addEventListener('click', () => {
  download('42ndWorldview-profile.json', jsonText(profile));
});

byId('importProfileInput').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  byId('profileBox').value = text;
  applyProfileJson(text);
});

byId('importCompareInput').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  byId('compareBox').value = await file.text();
});

byId('compareBtn').addEventListener('click', () => {
  const left = byId('profileBox').value;
  const right = byId('compareBox').value;
  const parsedRight = safeParse(right);
  if (!parsedRight) {
    byId('diffMeta').textContent = 'Comparison JSON is invalid.';
    byId('diffBox').textContent = '';
    return;
  }
  const result = lineDiff(left, JSON.stringify(parsedRight, null, 2));
  byId('diffMeta').textContent = `Adds: ${result.adds} | Deletes: ${result.dels}`;
  byId('diffBox').textContent = result.text;
});

byId('resetBtn').addEventListener('click', () => {
  profile = clone(SEED_PROFILE);
  saveProfile();
  setStatus('Reset to default profile.', 'ok');
  byId('scenarioBox').value = '';
  byId('compareBox').value = '';
  byId('diffMeta').textContent = '';
  byId('diffBox').textContent = '';
  render();
});

render();
