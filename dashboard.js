import { getCouple, getCheckins, getCompleted, getConflicts, getGoals, getMilestones } from './storage.js';
import { evaluate } from './prompts.js';

const MILESTONE_DEFS = [
  { id: 'first_checkin',   icon: '📋', label: 'First Check-In' },
  { id: 'five_checkins',   icon: '🔥', label: '5-Week Streak' },
  { id: 'ten_checkins',    icon: '⭐', label: '10 Check-Ins' },
  { id: 'first_exercise',  icon: '💪', label: 'First Exercise' },
  { id: 'five_exercises',  icon: '🏆', label: '5 Exercises Done' },
  { id: 'first_conflict',  icon: '🌿', label: 'First Reflection' },
];

export function initDashboard() {
  const couple     = getCouple();
  const checkins   = getCheckins();
  const completed  = getCompleted();
  const conflicts  = getConflicts();
  const goals      = getGoals();
  const milestones = getMilestones();

  // Greeting
  const greetEl = document.getElementById('greeting');
  if (greetEl && couple) {
    greetEl.textContent = `${couple.p1.name} & ${couple.p2.name}'s Dashboard`;
  }

  // Stats
  setInnerText('stat-checkins',  checkins.length);
  setInnerText('stat-exercises', completed.length);
  setInnerText('stat-conflicts', conflicts.length);

  // Coach nudge
  const nudge = evaluate();
  const nudgeWrap = document.getElementById('coach-nudge-wrap');
  if (nudgeWrap && nudge) {
    nudgeWrap.innerHTML = `
      <div class="coach-nudge">
        <div class="coach-nudge__icon">💬</div>
        <div class="coach-nudge__body">
          <div class="coach-nudge__title">${nudge.title}</div>
          <div class="coach-nudge__text">${nudge.text}</div>
          ${nudge.ctaHref
            ? `<a href="${nudge.ctaHref}" class="btn btn--primary btn--sm mt-2">${nudge.cta}</a>`
            : nudge.cta
            ? `<a href="exercises.html${nudge.ctaFilter ? '?filter=' + nudge.ctaFilter : ''}" class="btn btn--primary btn--sm mt-2">${nudge.cta}</a>`
            : ''}
        </div>
      </div>`;
    nudgeWrap.classList.remove('hidden');
  }

  // Connection trend chart
  renderTrendChart(checkins, couple);

  // Goal progress bars
  renderGoalBars(goals, checkins);

  // Milestones
  renderMilestones(milestones);

  // Recent check-ins list
  renderRecentCheckins(checkins.slice(-3).reverse(), couple);
}

function setInnerText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function renderTrendChart(checkins, couple) {
  const wrap = document.getElementById('trend-chart');
  if (!wrap) return;
  if (!checkins.length) {
    wrap.innerHTML = `<p class="text-muted text-sm">Complete your first check-in to see your connection trend.</p>`;
    return;
  }

  const last8 = checkins.slice(-8);
  const p1Name = couple?.p1?.name || 'P1';
  const p2Name = couple?.p2?.name || 'P2';

  wrap.innerHTML = `
    <div class="chart-wrap">
      ${last8.map((c, i) => {
        const p1s = c.p1?.connectionScore || 0;
        const p2s = c.p2?.connectionScore || 0;
        const label = `Wk ${checkins.length - last8.length + i + 1}`;
        return `
          <div class="chart-row">
            <span class="chart-label">${label}</span>
            <div style="flex:1; display:flex; flex-direction:column; gap:3px">
              <div class="chart-bar-bg" title="${p1Name}: ${p1s}/10">
                <div class="chart-bar-fill" style="width:${p1s * 10}%"></div>
              </div>
              <div class="chart-bar-bg" title="${p2Name}: ${p2s}/10">
                <div class="chart-bar-fill chart-bar-fill--secondary" style="width:${p2s * 10}%"></div>
              </div>
            </div>
            <span class="chart-val" style="color:var(--color-primary)">${p1s}</span>
            <span class="chart-val" style="color:var(--color-secondary)">${p2s}</span>
          </div>`;
      }).join('')}
      <div class="flex gap-2 mt-2" style="font-size:.78rem;color:var(--color-muted)">
        <span style="color:var(--color-primary)">■</span> ${p1Name}
        <span style="color:var(--color-secondary); margin-left:.5rem">■</span> ${p2Name}
      </div>
    </div>`;
}

function renderGoalBars(goals, checkins) {
  const wrap = document.getElementById('goal-bars');
  if (!wrap) return;
  if (!goals.areas?.length) {
    wrap.innerHTML = `<p class="text-muted text-sm">No goals set yet. <a href="goals.html">Set your focus areas →</a></p>`;
    return;
  }

  wrap.innerHTML = goals.areas.map(area => {
    const init = goals.initialScores?.[area] || 5;
    const curr = goals.currentScores?.[area]  || init;
    const pct  = (curr / 10) * 100;
    const diff = curr - init;
    const diffLabel = diff > 0 ? `<span class="text-success">+${diff}</span>` : diff < 0 ? `<span style="color:red">${diff}</span>` : '<span class="text-muted">—</span>';
    return `
      <div class="chart-row" style="margin-bottom:.85rem">
        <span class="chart-label" style="width:110px">${area}</span>
        <div class="chart-bar-bg" style="flex:1">
          <div class="chart-bar-fill" style="width:${pct}%"></div>
        </div>
        <span class="chart-val">${curr}</span>
        ${diffLabel}
      </div>`;
  }).join('');
}

function renderMilestones(earned) {
  const wrap = document.getElementById('milestones-wrap');
  if (!wrap) return;
  wrap.innerHTML = MILESTONE_DEFS.map(m => `
    <div class="milestone ${earned.includes(m.id) ? 'earned' : ''}">
      <span class="milestone__icon">${m.icon}</span>
      <span>${m.label}</span>
    </div>`).join('');
}

function renderRecentCheckins(checkins, couple) {
  const wrap = document.getElementById('recent-checkins');
  if (!wrap) return;
  if (!checkins.length) {
    wrap.innerHTML = `<p class="text-muted text-sm">No check-ins yet. <a href="checkin.html">Do your first one →</a></p>`;
    return;
  }
  wrap.innerHTML = checkins.map(c => {
    const date = new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const p1s  = c.p1?.connectionScore || '?';
    const p2s  = c.p2?.connectionScore || '?';
    const avg  = c.p1 && c.p2 ? Math.round((+p1s + +p2s) / 2) : '?';
    return `
      <div class="card" style="padding:1rem; margin-bottom:.65rem">
        <div class="flex justify-between items-center">
          <span class="fw-600 text-sm">${date}</span>
          <span class="badge badge--primary">Avg ${avg}/10</span>
        </div>
        <div class="flex gap-2 mt-1" style="font-size:.83rem; color:var(--color-muted)">
          <span>${couple?.p1?.name || 'P1'}: ${p1s}/10</span>
          <span>·</span>
          <span>${couple?.p2?.name || 'P2'}: ${p2s}/10</span>
          ${c.p1?.hadConflict || c.p2?.hadConflict ? '<span>· <span style="color:var(--color-warning)">⚡ Conflict flagged</span></span>' : ''}
        </div>
      </div>`;
  }).join('');
}
