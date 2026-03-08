const STORAGE_KEY = 'worldview-minimal-v3';

const SEED_PROFILE = {
  profileName: 'MyWorldviewProfile',
  description: 'A portable worldview profile for strict JSON-only LLM output workflows.',
  worldview: {
    principles: [
      'Truth over comfort',
      'Context over slogans',
      'Dialogue over forced silence'
    ],
    boundaries: [
      'No calls for violence',
      'No doxxing or personal targeting',
      'No fabricated claims presented as facts'
    ]
  },
  analysisStyle: {
    tone: 'direct but fair',
    confidenceScale: 'low | medium | high',
    includeCounterarguments: true
  },
  notes: ''
};

const EXAMPLE_SCENARIOS = [
  `In today's world, at least in western civilization, global governance has manufactured a system where it punishes something that isn't politically correct. by labels and discrediting, etc. and it has gotten to a point where anything could be offensive, which could be weaponized, and false accusations are the career-enders.`,
  `Race jokes should not be mistaken for racist jokes, and the boundary between the two won't always be obvious. But speaking about it will always be better than silencing it, because discussion allows correction and growth.`,
  `Online discourse often rewards moral signaling over honest nuance. Build a structured profile from this tension and identify where convictions can stay principled without becoming hostile.`
];

let profile = loadProfile();

const byId = (id) => document.getElementById(id);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function deepMerge(base, override) {
  if (Array.isArray(base)) return Array.isArray(override) ? override : base;
  if (base && typeof base === 'object') {
    const out = { ...base };
    if (!override || typeof override !== 'object' || Array.isArray(override)) return out;
    Object.keys(override).forEach((key) => {
      out[key] = key in base ? deepMerge(base[key], override[key]) : override[key];
    });
    return out;
  }
  return override === undefined ? base : override;
}

function loadProfile() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return clone(SEED_PROFILE);
    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return clone(SEED_PROFILE);
    return deepMerge(SEED_PROFILE, parsed);
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
    'SYSTEM INSTRUCTION:',
    'Return STRICT JSON only.',
    'Do not include markdown, code fences, headings, or explanatory prose.',
    'Do not prepend or append any text outside JSON.',
    'Output exactly ONE JSON object matching this structure and keys:',
    schema,
    'TASK:',
    'Update values based on the scenario while preserving the same top-level key structure.',
    'SCENARIO:',
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

function flattenObject(value, path = '', out = {}) {
  if (Array.isArray(value)) {
    value.forEach((item, idx) => flattenObject(item, `${path}[${idx}]`, out));
    return out;
  }
  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([k, v]) => {
      const next = path ? `${path}.${k}` : k;
      flattenObject(v, next, out);
    });
    return out;
  }
  out[path] = value;
  return out;
}

function semanticDiff(leftObj, rightObj) {
  const leftFlat = flattenObject(leftObj);
  const rightFlat = flattenObject(rightObj);
  const keys = new Set([...Object.keys(leftFlat), ...Object.keys(rightFlat)]);

  const rows = [];
  let adds = 0;
  let dels = 0;
  let edits = 0;

  [...keys].sort().forEach((k) => {
    const hasL = Object.prototype.hasOwnProperty.call(leftFlat, k);
    const hasR = Object.prototype.hasOwnProperty.call(rightFlat, k);
    if (hasL && !hasR) {
      rows.push(`- ${k}: ${JSON.stringify(leftFlat[k])}`);
      dels += 1;
      return;
    }
    if (!hasL && hasR) {
      rows.push(`+ ${k}: ${JSON.stringify(rightFlat[k])}`);
      adds += 1;
      return;
    }
    if (JSON.stringify(leftFlat[k]) !== JSON.stringify(rightFlat[k])) {
      rows.push(`~ ${k}: ${JSON.stringify(leftFlat[k])} -> ${JSON.stringify(rightFlat[k])}`);
      edits += 1;
    }
  });

  return {
    text: rows.length ? rows.join('\n') : 'No differences.',
    adds,
    dels,
    edits
  };
}

function renderVisualizer() {
  const chars = jsonText(profile).length;
  const textFields = countStrings(profile);
  const principleCount = Array.isArray(profile?.worldview?.principles) ? profile.worldview.principles.length : 0;
  const boundaryCount = Array.isArray(profile?.worldview?.boundaries) ? profile.worldview.boundaries.length : 0;

  byId('visualizer').innerHTML = [
    ['Principles', principleCount],
    ['Boundaries', boundaryCount],
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
  setStatus('Valid JSON. Profile updated live.', 'ok');
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
  byId('scenarioBox').value = EXAMPLE_SCENARIOS[0];
  byId('promptBox').value = buildPrompt();
  renderVisualizer();
}

byId('profileBox').addEventListener('input', (e) => applyProfileJson(e.target.value));
byId('scenarioBox').addEventListener('input', () => {
  byId('promptBox').value = buildPrompt();
});

byId('loadExampleBtn').addEventListener('click', () => {
  const pick = EXAMPLE_SCENARIOS[Math.floor(Math.random() * EXAMPLE_SCENARIOS.length)];
  byId('scenarioBox').value = pick;
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
  const parsedLeft = safeParse(left);
  const parsedRight = safeParse(right);

  if (!parsedLeft) {
    byId('diffMeta').textContent = 'Current profile JSON is invalid.';
    byId('diffBox').textContent = '';
    return;
  }
  if (!parsedRight) {
    byId('diffMeta').textContent = 'Comparison JSON is invalid.';
    byId('diffBox').textContent = '';
    return;
  }

  const result = semanticDiff(parsedLeft, parsedRight);
  byId('diffMeta').textContent = `Adds: ${result.adds} | Deletes: ${result.dels} | Edits: ${result.edits}`;
  byId('diffBox').textContent = result.text;
});

byId('resetBtn').addEventListener('click', () => {
  profile = clone(SEED_PROFILE);
  saveProfile();
  setStatus('Reset to default profile.', 'ok');
  byId('scenarioBox').value = EXAMPLE_SCENARIOS[0];
  byId('compareBox').value = '';
  byId('diffMeta').textContent = '';
  byId('diffBox').textContent = '';
  render();
});

render();
