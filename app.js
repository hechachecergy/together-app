import { hasCouple, getCouple } from './storage.js';

/* ── Nav active link ────────────────────────────────────────────────── */
const page = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav__links a').forEach(a => {
  if (a.getAttribute('href') === page) a.classList.add('active');
});

/* ── Guard: redirect to onboarding if no couple saved ──────────────── */
const OPEN_PAGES = ['index.html', 'onboarding.html', ''];
if (!OPEN_PAGES.includes(page) && !hasCouple()) {
  location.href = 'onboarding.html';
}

/* ── Inject partner names wherever .js-p1name / .js-p2name appear ──── */
document.addEventListener('DOMContentLoaded', () => {
  const couple = getCouple();
  if (!couple) return;
  document.querySelectorAll('.js-p1name').forEach(el => el.textContent = couple.p1.name);
  document.querySelectorAll('.js-p2name').forEach(el => el.textContent = couple.p2.name);
});

/* ── Utility: format date ───────────────────────────────────────────── */
export function fmtDate(isoStr) {
  return new Date(isoStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ── Utility: week label ───────────────────────────────────────────── */
export function weekLabel(isoStr) {
  return 'Week of ' + new Date(isoStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
