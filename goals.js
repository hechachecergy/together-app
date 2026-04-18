import { saveGoals, getGoals } from './storage.js';

const AREAS = [
  { id: 'Communication', icon: '💬' },
  { id: 'Conflict',      icon: '⚡' },
  { id: 'Intimacy',      icon: '❤️' },
  { id: 'Trust',         icon: '🔒' },
  { id: 'Teamwork',      icon: '🤝' },
  { id: 'Fun',           icon: '🎉' },
  { id: 'Family',        icon: '🏠' },
  { id: 'Finances',      icon: '💰' },
];

let step        = 1;
let selected    = [];
let sliderVals  = {};

export function initGoals() {
  renderStep();
}

function renderStep() {
  const wrap = document.getElementById('goals-content');
  if (!wrap) return;

  const progress = document.getElementById('progress-fill');
  const stepLabel = document.getElementById('step-label');
  if (progress)  progress.style.width = `${(step / 3) * 100}%`;
  if (stepLabel) stepLabel.textContent = `Step ${step} of 3`;

  if (step === 1) renderAreaPicker(wrap);
  if (step === 2) renderSliders(wrap);
  if (step === 3) renderIntentions(wrap);
}

function renderAreaPicker(wrap) {
  wrap.innerHTML = `
    <h2 class="mb-1">Pick your focus areas</h2>
    <p class="mb-3">Choose up to 3 areas you most want to improve. <span class="text-primary fw-600">${selected.length}/3 selected</span></p>
    <div class="goal-area-grid" id="area-grid"></div>
    <div class="mt-4">
      <button class="btn btn--primary btn--lg btn--full" id="next-btn" ${selected.length === 0 ? 'disabled' : ''}>
        Continue →
      </button>
    </div>`;

  const grid = document.getElementById('area-grid');
  AREAS.forEach(a => {
    const card = document.createElement('div');
    card.className = 'goal-area-card' + (selected.includes(a.id) ? ' selected' : '');
    card.dataset.id = a.id;
    card.innerHTML = `<span class="goal-area-card__icon">${a.icon}</span>${a.id}`;
    card.addEventListener('click', () => toggleArea(a.id));
    grid.appendChild(card);
  });

  document.getElementById('next-btn').addEventListener('click', () => { step = 2; renderStep(); });
}

function toggleArea(id) {
  if (selected.includes(id)) {
    selected = selected.filter(s => s !== id);
  } else if (selected.length < 3) {
    selected.push(id);
  }
  renderAreaPicker(document.getElementById('goals-content'));
}

function renderSliders(wrap) {
  wrap.innerHTML = `
    <h2 class="mb-1">Rate where you are now</h2>
    <p class="mb-3">How satisfied are you in each area today? Be honest — this is your starting point, not a test.</p>
    <div id="sliders-wrap"></div>
    <div class="mt-4 flex gap-2">
      <button class="btn btn--ghost" id="back-btn">← Back</button>
      <button class="btn btn--primary btn--lg" style="flex:1" id="next-btn">Continue →</button>
    </div>`;

  const sw = document.getElementById('sliders-wrap');
  selected.forEach(area => {
    const val = sliderVals[area] || 5;
    const div = document.createElement('div');
    div.className = 'form-group';
    div.innerHTML = `
      <label>${area} <span class="label-hint">— how satisfied are you right now?</span></label>
      <div class="slider-wrap">
        <input type="range" min="1" max="10" value="${val}" id="slider-${area}">
        <div class="slider-labels"><span>Not great</span><span>Really strong</span></div>
        <div class="slider-value" id="val-${area}">${val}</div>
      </div>`;
    sw.appendChild(div);

    div.querySelector(`#slider-${area}`).addEventListener('input', e => {
      sliderVals[area] = +e.target.value;
      document.getElementById(`val-${area}`).textContent = e.target.value;
    });
  });

  document.getElementById('back-btn').addEventListener('click', () => { step = 1; renderStep(); });
  document.getElementById('next-btn').addEventListener('click', () => { step = 3; renderStep(); });
}

function renderIntentions(wrap) {
  const couple = JSON.parse(localStorage.getItem('tg_couple')) || {};
  const p1 = couple.p1?.name || 'Partner 1';
  const p2 = couple.p2?.name || 'Partner 2';

  wrap.innerHTML = `
    <h2 class="mb-1">Set your intention</h2>
    <p class="mb-3">In one sentence each — what does a better relationship look like to you in 3 months?</p>
    <div class="form-group">
      <label>${p1}'s intention</label>
      <textarea id="int-p1" placeholder="e.g. We talk without it turning into a fight, and I feel genuinely heard." rows="3"></textarea>
    </div>
    <div class="form-group">
      <label>${p2}'s intention</label>
      <textarea id="int-p2" placeholder="e.g. We make time for each other and I feel like we're a team again." rows="3"></textarea>
    </div>
    <div class="mt-4 flex gap-2">
      <button class="btn btn--ghost" id="back-btn">← Back</button>
      <button class="btn btn--primary btn--lg" style="flex:1" id="save-btn">Save Our Goals ✓</button>
    </div>`;

  document.getElementById('back-btn').addEventListener('click', () => { step = 2; renderStep(); });
  document.getElementById('save-btn').addEventListener('click', () => {
    const goals = {
      areas:         selected,
      initialScores: { ...sliderVals },
      currentScores: { ...sliderVals },
      intentions: {
        p1: document.getElementById('int-p1').value.trim(),
        p2: document.getElementById('int-p2').value.trim(),
      },
      savedAt: new Date().toISOString(),
    };
    saveGoals(goals);
    showSuccess(wrap);
  });
}

function showSuccess(wrap) {
  wrap.innerHTML = `
    <div class="success-screen">
      <div class="success-screen__icon">🎯</div>
      <h2 class="mb-2">Goals saved.</h2>
      <p class="mb-4">The app will now tailor exercises and check-in prompts to your focus areas. You can update these any time from the dashboard.</p>
      <a href="dashboard.html" class="btn btn--primary btn--lg">Go to your dashboard →</a>
    </div>`;
}
