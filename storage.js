const KEYS = {
  COUPLE:     'tg_couple',
  GOALS:      'tg_goals',
  CHECKINS:   'tg_checkins',
  CONFLICTS:  'tg_conflicts',
  COMPLETED:  'tg_completed',
  MILESTONES: 'tg_milestones',
};

export const storage = {
  get(key)        { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set(key, val)   { localStorage.setItem(key, JSON.stringify(val)); },
  remove(key)     { localStorage.removeItem(key); },
  clear()         { Object.values(KEYS).forEach(k => localStorage.removeItem(k)); },
};

/* ── Couple profile ─────────────────────────────────────────────────── */
export function getCouple()         { return storage.get(KEYS.COUPLE); }
export function saveCouple(data)    { storage.set(KEYS.COUPLE, data); }
export function hasCouple()         { return !!getCouple(); }

/* ── Goals ──────────────────────────────────────────────────────────── */
export function getGoals()          { return storage.get(KEYS.GOALS) || {}; }
export function saveGoals(data)     { storage.set(KEYS.GOALS, data); }

/* ── Check-ins ──────────────────────────────────────────────────────── */
export function getCheckins()       { return storage.get(KEYS.CHECKINS) || []; }
export function addCheckin(entry)   {
  const list = getCheckins();
  list.push({ ...entry, id: Date.now(), date: new Date().toISOString() });
  storage.set(KEYS.CHECKINS, list);
  return list;
}
export function getLatestCheckin()  { const c = getCheckins(); return c[c.length - 1] || null; }

/* ── Conflict reflections ───────────────────────────────────────────── */
export function getConflicts()      { return storage.get(KEYS.CONFLICTS) || []; }
export function addConflict(entry)  {
  const list = getConflicts();
  list.push({ ...entry, id: Date.now(), date: new Date().toISOString() });
  storage.set(KEYS.CONFLICTS, list);
  return list;
}

/* ── Completed exercises ────────────────────────────────────────────── */
export function getCompleted()      { return storage.get(KEYS.COMPLETED) || []; }
export function markComplete(id)    {
  const list = getCompleted();
  if (!list.includes(id)) { list.push(id); storage.set(KEYS.COMPLETED, list); }
}
export function isCompleted(id)     { return getCompleted().includes(id); }

/* ── Milestones ─────────────────────────────────────────────────────── */
export function getMilestones()     { return storage.get(KEYS.MILESTONES) || []; }
export function earnMilestone(id)   {
  const list = getMilestones();
  if (!list.includes(id)) { list.push(id); storage.set(KEYS.MILESTONES, list); }
}
