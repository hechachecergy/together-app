import { addConflict, getCouple, earnMilestone, getMilestones } from './storage.js';

let currentPartner = 'p1';
let p1Data = null;
let p2Data = null;

const FEELINGS = ['Chest tightness','Racing heart','Shut down','Anger','Sadness','Fear','Shame','Overwhelm','Numbness','Frustration'];

export function initConflict() {
  const couple = getCouple();
  const toggle1 = document.getElementById('toggle-p1');
  const toggle2 = document.getElementById('toggle-p2');
  if (toggle1) { toggle1.textContent = couple?.p1?.name || 'Partner 1'; toggle1.addEventListener('click', () => switchPartner('p1')); }
  if (toggle2) { toggle2.textContent = couple?.p2?.name || 'Partner 2'; toggle2.addEventListener('click', () => switchPartner('p2')); }

  renderFeelingChips();
  document.getElementById('submit-partner')?.addEventListener('click', submitPartner);

  const timerBanner = document.getElementById('timer-banner');
  if (timerBanner) timerBanner.classList.add('hidden');

  renderPartnerUI();
}

function renderFeelingChips() {
  const grid = document.getElementById('feeling-grid');
  if (!grid) return;
  grid.innerHTML = '';
  FEELINGS.forEach(f => {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = f;
    chip.addEventListener('click', () => chip.classList.toggle('selected'));
    grid.appendChild(chip);
  });
}

function switchPartner(partner) {
  currentPartner = partner;
  document.getElementById('toggle-p1')?.classList.toggle('active', partner === 'p1');
  document.getElementById('toggle-p2')?.classList.toggle('active', partner === 'p2');
  renderFeelingChips();
  renderPartnerUI();
}

function renderPartnerUI() {
  const couple = getCouple();
  const name   = couple?.[currentPartner]?.name || currentPartner;
  const nameEl = document.getElementById('current-partner-name');
  if (nameEl) nameEl.textContent = name + ''s reflection';

  const form = document.getElementById('conflict-form');
  const submitted = document.getElementById('already-submitted');
  const saved = currentPartner === 'p1' ? p1Data : p2Data;
  if (saved) {
    form?.classList.add('hidden');
    submitted?.classList.remove('hidden');
    if (submitted) submitted.textContent = `${name} has already submitted their reflection.`;
  } else {
    form?.classList.remove('hidden');
    submitted?.classList.add('hidden');
    clearForm();
  }
}

function clearForm() {
  ['what-happened','what-needed','what-regret','next-time'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.querySelectorAll('.chip.selected').forEach(c => c.classList.remove('selected'));
}

function submitPartner() {
  const feelings = [...document.querySelectorAll('#feeling-grid .chip.selected')].map(c => c.textContent);
  const data = {
    whatHappened: document.getElementById('what-happened')?.value.trim() || '',
    feelings,
    whatNeeded:   document.getElementById('what-needed')?.value.trim() || '',
    whatRegret:   document.getElementById('what-regret')?.value.trim() || '',
    nextTime:     document.getElementById('next-time')?.value.trim() || '',
  };

  if (currentPartner === 'p1') p1Data = data;
  else                          p2Data = data;

  if (p1Data && p2Data) {
    addConflict({ p1: p1Data, p2: p2Data });
    checkMilestones();
    showResults();
  } else {
    const other = currentPartner === 'p1' ? 'p2' : 'p1';
    const otherName = getCouple()?.[other]?.name || 'your partner';
    switchPartner(other);
    const banner = document.getElementById('switch-banner');
    if (banner) {
      banner.textContent = `Done. Now hand it to ${otherName} — they'll fill out their side privately.`;
      banner.classList.remove('hidden');
    }
  }
}

function checkMilestones() {
  const earned = getMilestones();
  if (!earned.includes('first_conflict')) earnMilestone('first_conflict');
}

function showResults() {
  const couple = getCouple();
  const wrap   = document.getElementById('conflict-wrap');
  if (!wrap) return;

  const sharedFeelings = p1Data.feelings.filter(f => p2Data.feelings.includes(f));

  wrap.innerHTML = `
    <div class="success-screen">
      <div class="success-screen__icon">🌿</div>
      <h2 class="mb-1">Reflections complete.</h2>
      <p class="mb-3">Give yourselves 24 hours before discussing this. When you're ready, read each other's answers below — not to rebut, just to understand.</p>
    </div>

    ${sharedFeelings.length ? `
      <div class="coach-nudge mb-3">
        <div class="coach-nudge__icon">💡</div>
        <div class="coach-nudge__body">
          <div class="coach-nudge__title">You both felt: ${sharedFeelings.join(', ')}</div>
          <div class="coach-nudge__text">Shared feelings in a conflict are often a signal that you both wanted the same thing — you just expressed it differently.</div>
        </div>
      </div>` : ''}

    <div class="compare-grid mb-3">
      <div class="compare-col">
        <div class="compare-col__name">${couple?.p1?.name || 'Partner 1'}</div>
        ${p1Data.whatHappened ? `<p><strong>What happened:</strong> "${p1Data.whatHappened}"</p>` : ''}
        ${p1Data.feelings.length ? `<p class="mt-1"><strong>Felt:</strong> ${p1Data.feelings.join(', ')}</p>` : ''}
        ${p1Data.whatNeeded ? `<p class="mt-1"><strong>Needed:</strong> "${p1Data.whatNeeded}"</p>` : ''}
        ${p1Data.nextTime   ? `<p class="mt-1"><strong>Next time:</strong> "${p1Data.nextTime}"</p>` : ''}
      </div>
      <div class="compare-col">
        <div class="compare-col__name">${couple?.p2?.name || 'Partner 2'}</div>
        ${p2Data.whatHappened ? `<p><strong>What happened:</strong> "${p2Data.whatHappened}"</p>` : ''}
        ${p2Data.feelings.length ? `<p class="mt-1"><strong>Felt:</strong> ${p2Data.feelings.join(', ')}</p>` : ''}
        ${p2Data.whatNeeded ? `<p class="mt-1"><strong>Needed:</strong> "${p2Data.whatNeeded}"</p>` : ''}
        ${p2Data.nextTime   ? `<p class="mt-1"><strong>Next time:</strong> "${p2Data.nextTime}"</p>` : ''}
      </div>
    </div>

    <div class="card card--accent">
      <h4 class="mb-1">Suggested next step</h4>
      <p class="mb-2">Try the <strong>Repair Attempt Practice</strong> exercise together — it gives you both a toolkit of small gestures to use before the next conflict escalates.</p>
      <a href="exercises.html?open=ex_005" class="btn btn--primary btn--sm">Open exercise →</a>
    </div>

    <div class="mt-3 flex gap-2">
      <a href="dashboard.html" class="btn btn--secondary">Dashboard</a>
      <a href="exercises.html" class="btn btn--ghost">Browse all exercises</a>
    </div>`;
}
