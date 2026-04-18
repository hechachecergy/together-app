import { markComplete, isCompleted, earnMilestone, getMilestones, getCompleted } from './storage.js';
import { getRecommendedExerciseTags } from './prompts.js';

let allExercises = [];
let activeFilter = 'all';

export async function initExercises() {
  const res  = await fetch('data/exercises.json');
  allExercises = await res.json();

  setupFilters();
  applyAutoFilter();
  renderGallery();
  setupModal();
  handleAutoOpen();
}

function applyAutoFilter() {
  const params = new URLSearchParams(location.search);
  const f = params.get('filter');
  if (f) activeFilter = f;
}

function handleAutoOpen() {
  const params = new URLSearchParams(location.search);
  const openId = params.get('open');
  if (openId) {
    const ex = allExercises.find(e => e.id === openId);
    if (ex) openModal(ex);
  }
}

function setupFilters() {
  const tabs = document.querySelectorAll('.filter-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      activeFilter = tab.dataset.filter;
      tabs.forEach(t => t.classList.toggle('active', t === tab));
      renderGallery();
    });
    if (tab.dataset.filter === activeFilter) tab.classList.add('active');
  });

  // Show recommended banner
  const recTags = getRecommendedExerciseTags();
  const banner = document.getElementById('recommended-banner');
  if (banner && recTags.length) {
    const recExs = allExercises.filter(e => e.tags.some(t => recTags.includes(t))).slice(0, 2);
    if (recExs.length) {
      banner.classList.remove('hidden');
      const list = document.getElementById('recommended-list');
      if (list) {
        list.innerHTML = recExs.map(e => `
          <div class="exercise-card${isCompleted(e.id) ? ' completed' : ''}" data-id="${e.id}">
            <div class="exercise-card__meta">
              ${e.tags.map(t => `<span class="badge badge--primary">${t}</span>`).join('')}
              <span class="badge badge--muted">${e.duration}</span>
            </div>
            <div class="exercise-card__title">${e.title}</div>
            <div class="exercise-card__desc">${e.description}</div>
          </div>`).join('');
        list.querySelectorAll('.exercise-card').forEach(card => {
          card.addEventListener('click', () => {
            const ex = allExercises.find(e => e.id === card.dataset.id);
            if (ex) openModal(ex);
          });
        });
      }
    }
  }
}

function renderGallery() {
  const grid = document.getElementById('exercise-grid');
  if (!grid) return;

  const filtered = activeFilter === 'all'
    ? allExercises
    : allExercises.filter(e => e.tags.includes(activeFilter));

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state">
      <div class="empty-state__icon">🔍</div>
      <p>No exercises in this category yet. Check back soon.</p>
    </div>`;
    return;
  }

  grid.innerHTML = filtered.map(e => `
    <div class="exercise-card${isCompleted(e.id) ? ' completed' : ''}" data-id="${e.id}" style="cursor:pointer">
      <div class="exercise-card__meta">
        ${e.tags.map(t => `<span class="badge badge--primary">${t}</span>`).join('')}
        <span class="badge badge--muted">${e.duration}</span>
        <span class="badge badge--muted">${e.difficulty}</span>
      </div>
      <div class="exercise-card__title">${e.title}</div>
      <div class="exercise-card__desc">${e.description}</div>
    </div>`).join('');

  grid.querySelectorAll('.exercise-card').forEach(card => {
    card.addEventListener('click', () => {
      const ex = allExercises.find(e => e.id === card.dataset.id);
      if (ex) openModal(ex);
    });
  });
}

function setupModal() {
  document.getElementById('modal-overlay')?.addEventListener('click', e => {
    if (e.target.id === 'modal-overlay') closeModal();
  });
  document.getElementById('modal-close')?.addEventListener('click', closeModal);
}

function openModal(ex) {
  const overlay = document.getElementById('modal-overlay');
  const body    = document.getElementById('modal-body');
  if (!overlay || !body) return;

  const completed = isCompleted(ex.id);
  body.innerHTML = `
    <button class="modal__close" id="modal-close">✕</button>
    <div class="modal__handle"></div>
    <div class="flex gap-1 mb-2 flex-wrap">
      ${ex.tags.map(t => `<span class="badge badge--primary">${t}</span>`).join('')}
      <span class="badge badge--muted">${ex.duration}</span>
      <span class="badge badge--muted">${ex.difficulty}</span>
    </div>
    <h2 class="mb-1">${ex.title}</h2>
    <p class="mb-2">${ex.description}</p>
    <h4 class="mt-3 mb-1">How to do it</h4>
    <ol class="step-list">
      ${ex.steps.map((s, i) => `
        <li><span class="step-num">${i + 1}</span><span>${s}</span></li>`).join('')}
    </ol>
    <div class="reflection-box">
      <strong>Reflection prompt:</strong> ${ex.reflection}
    </div>
    <div class="mt-4">
      ${completed
        ? `<div class="flex items-center gap-2"><span class="text-success fw-600">✓ Completed</span><a href="#" class="btn btn--ghost btn--sm" id="uncomplete-btn">Undo</a></div>`
        : `<button class="btn btn--success btn--full" id="complete-btn">✓ Mark as Complete</button>`}
    </div>`;

  document.getElementById('modal-close')?.addEventListener('click', closeModal);

  if (!completed) {
    document.getElementById('complete-btn')?.addEventListener('click', () => {
      markComplete(ex.id);
      checkExerciseMilestones();
      openModal(ex); // re-render with completed state
      renderGallery();
    });
  } else {
    document.getElementById('uncomplete-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      const completed = JSON.parse(localStorage.getItem('tg_completed') || '[]').filter(id => id !== ex.id);
      localStorage.setItem('tg_completed', JSON.stringify(completed));
      openModal(ex);
      renderGallery();
    });
  }

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal-overlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

function checkExerciseMilestones() {
  const count  = getCompleted().length;
  const earned = getMilestones();
  if (count >= 1 && !earned.includes('first_exercise'))   earnMilestone('first_exercise');
  if (count >= 5 && !earned.includes('five_exercises'))   earnMilestone('five_exercises');
}
