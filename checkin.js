import { addCheckin, getCouple, getCheckins, earnMilestone, getMilestones } from './storage.js';
import { evaluate } from './prompts.js';

let currentPartner = 'p1';
let p1Data = null;
let p2Data = null;

export function initCheckin() {
  const couple  = getCouple();
  const p1Name  = couple?.p1?.name || 'Partner 1';
  const p2Name  = couple?.p2?.name || 'Partner 2';
  const toggle1 = document.getElementById('toggle-p1');
  const toggle2 = document.getElementById('toggle-p2');
  if (toggle1) { toggle1.textContent = p1Name; toggle1.addEventListener('click', () => switchPartner('p1')); }
  if (toggle2) { toggle2.textContent = p2Name; toggle2.addEventListener('click', () => switchPartner('p2')); }

  const weekEl = document.getElementById('checkin-week');
  if (weekEl) weekEl.textContent = 'Week of ' + new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const conflictToggle = document.getElementById('conflict-toggle');
  if (conflictToggle) {
    conflictToggle.addEventListener('change', () => {
      const box = document.getElementById('conflict-detail-box');
      if (box) box.classList.toggle('hidden', !conflictToggle.checked);
    });
  }

  const scoreSlider = document.getElementById('connection-score');
  if (scoreSlider) {
    scoreSlider.addEventListener('input', e => {
      const el = document.getElementById('score-display');
      if (el) el.textContent = e.target.value;
    });
  }

  const submitBtn = document.getElementById('submit-partner');
  if (submitBtn) submitBtn.addEventListener('click', submitPartner);

  renderPartnerUI();
}

function switchPartner(partner) {
  currentPartner = partner;
  document.getElementById('toggle-p1')?.classList.toggle('active', partner === 'p1');
  document.getElementById('toggle-p2')?.classList.toggle('active', partner === 'p2');
  renderPartnerUI();
}

function renderPartnerUI() {
  const couple   = getCouple();
  const name     = couple?.[currentPartner]?.name || currentPartner;
  const nameEl   = document.getElementById('current-partner-name');
  const statusEl = document.getElementById('partner-status');
  if (nameEl)   nameEl.textContent = name + ''s check-in';
  if (statusEl) {
    const p1done = !!p1Data;
    const p2done = !!p2Data;
    statusEl.textContent = `${couple?.p1?.name || 'P1'}: ${p1done ? '✓' : 'pending'} · ${couple?.p2?.name || 'P2'}: ${p2done ? '✓' : 'pending'}`;
  }

  const form = document.getElementById('checkin-form');
  if (!form) return;
  const saved = currentPartner === 'p1' ? p1Data : p2Data;
  if (saved) {
    form.classList.add('hidden');
    document.getElementById('already-submitted')?.classList.remove('hidden');
    return;
  }
  form.classList.remove('hidden');
  document.getElementById('already-submitted')?.classList.add('hidden');

  // Reset form fields
  const slider = document.getElementById('connection-score');
  const display = document.getElementById('score-display');
  const conflictToggle = document.getElementById('conflict-toggle');
  const conflictBox    = document.getElementById('conflict-detail-box');
  const bestMoment  = document.getElementById('best-moment');
  const needMore    = document.getElementById('need-more');
  const appreciation = document.getElementById('appreciation');
  const conflictDesc = document.getElementById('conflict-desc');
  if (slider)   { slider.value = 7; }
  if (display)  { display.textContent = '7'; }
  if (conflictToggle) { conflictToggle.checked = false; }
  if (conflictBox)    { conflictBox.classList.add('hidden'); }
  if (bestMoment)     { bestMoment.value = ''; }
  if (needMore)       { needMore.value = ''; }
  if (appreciation)   { appreciation.value = ''; }
  if (conflictDesc)   { conflictDesc.value = ''; }
}

function submitPartner() {
  const data = {
    connectionScore: +document.getElementById('connection-score')?.value || 7,
    bestMoment:      document.getElementById('best-moment')?.value.trim() || '',
    hadConflict:     document.getElementById('conflict-toggle')?.checked || false,
    conflictDesc:    document.getElementById('conflict-desc')?.value.trim() || '',
    needMore:        document.getElementById('need-more')?.value || '',
    appreciation:    document.getElementById('appreciation')?.value.trim() || '',
  };

  if (currentPartner === 'p1') { p1Data = data; }
  else                         { p2Data = data; }

  if (p1Data && p2Data) {
    const entry = { p1: p1Data, p2: p2Data };
    const all   = addCheckin(entry);
    checkMilestones(all.length);
    showResults(p1Data, p2Data);
  } else {
    // Prompt to switch to other partner
    const other = currentPartner === 'p1' ? 'p2' : 'p1';
    const couple = getCouple();
    const otherName = couple?.[other]?.name || (other === 'p1' ? 'Partner 1' : 'Partner 2');
    switchPartner(other);
    const banner = document.getElementById('switch-banner');
    if (banner) {
      banner.textContent = `Great! Now hand the phone to ${otherName} for their turn.`;
      banner.classList.remove('hidden');
    }
  }
}

function checkMilestones(count) {
  const earned = getMilestones();
  if (count === 1 && !earned.includes('first_checkin'))  earnMilestone('first_checkin');
  if (count === 5 && !earned.includes('five_checkins'))  earnMilestone('five_checkins');
  if (count === 10 && !earned.includes('ten_checkins'))  earnMilestone('ten_checkins');
}

function showResults(p1, p2) {
  const couple = getCouple();
  const wrap   = document.getElementById('checkin-wrap');
  if (!wrap) return;

  const nudge = evaluate();
  const nudgeHtml = nudge ? `
    <div class="coach-nudge mt-3">
      <div class="coach-nudge__icon">💬</div>
      <div class="coach-nudge__body">
        <div class="coach-nudge__title">${nudge.title}</div>
        <div class="coach-nudge__text">${nudge.text}</div>
        ${nudge.ctaHref ? `<a href="${nudge.ctaHref}" class="btn btn--primary btn--sm mt-2">${nudge.cta}</a>` :
          nudge.cta ? `<a href="exercises.html${nudge.ctaFilter ? '?filter=' + nudge.ctaFilter : ''}" class="btn btn--primary btn--sm mt-2">${nudge.cta}</a>` : ''}
      </div>
    </div>` : '';

  wrap.innerHTML = `
    <div class="success-screen">
      <div class="success-screen__icon">✅</div>
      <h2 class="mb-1">Check-in complete.</h2>
      <p class="mb-3">Here's what you both said this week.</p>
    </div>
    <div class="compare-grid mb-3">
      <div class="compare-col">
        <div class="compare-col__name">${couple?.p1?.name || 'Partner 1'}</div>
        <p><strong>Connection:</strong> ${p1.connectionScore}/10</p>
        ${p1.bestMoment   ? `<p class="mt-1"><strong>Best moment:</strong> "${p1.bestMoment}"</p>` : ''}
        ${p1.appreciation ? `<p class="mt-1"><strong>Appreciation:</strong> "${p1.appreciation}"</p>` : ''}
        ${p1.needMore     ? `<p class="mt-1"><strong>Needs more:</strong> ${p1.needMore}</p>` : ''}
      </div>
      <div class="compare-col">
        <div class="compare-col__name">${couple?.p2?.name || 'Partner 2'}</div>
        <p><strong>Connection:</strong> ${p2.connectionScore}/10</p>
        ${p2.bestMoment   ? `<p class="mt-1"><strong>Best moment:</strong> "${p2.bestMoment}"</p>` : ''}
        ${p2.appreciation ? `<p class="mt-1"><strong>Appreciation:</strong> "${p2.appreciation}"</p>` : ''}
        ${p2.needMore     ? `<p class="mt-1"><strong>Needs more:</strong> ${p2.needMore}</p>` : ''}
      </div>
    </div>
    ${nudgeHtml}
    <div class="mt-4 flex gap-2">
      <a href="dashboard.html" class="btn btn--secondary">View dashboard</a>
      <a href="exercises.html" class="btn btn--primary">Browse exercises →</a>
    </div>`;
}
