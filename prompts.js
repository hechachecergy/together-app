import { getCheckins, getGoals, getCompleted, getConflicts, getLatestCheckin } from './storage.js';

/*
  Coach-logic engine.
  Each rule returns null (no nudge) or { title, text, exerciseTags, cta }.
  evaluate() runs all rules and returns the first matching nudge,
  or a default "keep going" nudge.
*/

const RULES = [

  /* Rule 1 — Conflict flagged this week */
  function conflictFlagged() {
    const latest = getLatestCheckin();
    if (!latest) return null;
    const p1Conflict = latest.p1?.hadConflict;
    const p2Conflict = latest.p2?.hadConflict;
    if (!p1Conflict && !p2Conflict) return null;
    return {
      title:        "It sounds like this week had some tension.",
      text:         "That's normal — and it's data. These exercises help you both understand the moment better before it calculates into a pattern.",
      exerciseTags: ['conflict', 'communication'],
      cta:          "See conflict exercises",
      ctaFilter:    'conflict',
    };
  },

  /* Rule 2 — Low connection score (≤4) for 2+ consecutive weeks */
  function lowConnectionStreak() {
    const checkins = getCheckins();
    if (checkins.length < 2) return null;
    const last2 = checkins.slice(-2);
    const bothLow = last2.every(c => {
      const p1 = c.p1?.connectionScore ?? 10;
      const p2 = c.p2?.connectionScore ?? 10;
      return ((p1 + p2) / 2) <= 4;
    });
    if (!bothLow) return null;
    return {
      title:        "Your connection score has been lower two weeks in a row.",
      text:         "Sometimes that just means life is busy. But if it means something needs more attention — here are two exercises to try together.",
      exerciseTags: ['intimacy', 'connection'],
      cta:          "See intimacy exercises",
      ctaFilter:    'intimacy',
    };
  },

  /* Rule 3 — No activity in 10+ days */
  function inactiveTooLong() {
    const checkins = getCheckins();
    if (!checkins.length) return null;
    const lastDate  = new Date(checkins[checkins.length - 1].date);
    const daysSince = (Date.now() - lastDate.getTime()) / 86_400_000;
    if (daysSince < 10) return null;
    return {
      title:        "It's been a little while.",
      text:         "Your relationship doesn't take a week off — so neither should your tools. A 5-minute check-in is better than none.",
      exerciseTags: [],
      cta:          "Do a quick check-in",
      ctaHref:      'checkin.html',
    };
  },

  /* Rule 4 — Trust selected as focus area + conflict flagged repeatedly */
  function trustFocusHighConflict() {
    const goals     = getGoals();
    const checkins  = getCheckins();
    if (!goals.areas?.includes('Trust')) return null;
    const conflictCount = checkins.filter(c => c.p1?.hadConflict || c.p2?.hadConflict).length;
    if (conflictCount < 2) return null;
    return {
      title:        "Trust is a core theme for you right now.",
      text:         "We've highlighted the repair and trust-building exercises. Small, consistent actions are what move the needle here — not grand gestures.",
      exerciseTags: ['trust'],
      cta:          "See trust exercises",
      ctaFilter:    'trust',
    };
  },

  /* Rule 5 — Connection scores diverge by 3+ points this week */
  function scoreDivergence() {
    const latest = getLatestCheckin();
    if (!latest?.p1 || !latest?.p2) return null;
    const gap = Math.abs((latest.p1.connectionScore || 5) - (latest.p2.connectionScore || 5));
    if (gap < 3) return null;
    return {
      title:        "You two are experiencing this week quite differently.",
      text:         "That gap is worth a conversation — and the Looping Conversation exercise is a great place to start. No agenda, just listening.",
      exerciseTags: ['communication'],
      cta:          "See communication exercises",
      ctaFilter:    'communication',
    };
  },

  /* Rule 6 — Goal area score hasn't improved after 4+ check-ins */
  function stuckGoalArea() {
    const goals    = getGoals();
    const checkins = getCheckins();
    if (!goals.areas?.length || checkins.length < 4) return null;
    const initialScores = goals.initialScores || {};
    const currentScores = goals.currentScores  || {};
    const stuckArea = goals.areas.find(area => {
      const init = initialScores[area] || 5;
      const curr = currentScores[area]  || init;
      return curr <= init;
    });
    if (!stuckArea) return null;
    return {
      title:        `"${stuckArea}" hasn't moved much yet.`,
      text:         "That might mean it needs more deliberate attention — or that there's a harder conversation underneath it. These exercises go deeper.",
      exerciseTags: [stuckArea.toLowerCase()],
      cta:          `See ${stuckArea.toLowerCase()} exercises`,
      ctaFilter:    stuckArea.toLowerCase(),
    };
  },

  /* Rule 7 — Streak milestone: 7 check-ins */
  function streakCelebration() {
    const checkins = getCheckins();
    if (checkins.length !== 7) return null;
    return {
      title:        "7 check-ins in a row. That's not small.",
      text:         "Consistency is what separates couples who grow from couples who stall. You're doing the work. Here's your progress so far.",
      exerciseTags: [],
      cta:          "See your progress",
      ctaHref:      'dashboard.html',
      type:         'success',
    };
  },
];

export function evaluate() {
  for (const rule of RULES) {
    const result = rule();
    if (result) return result;
  }
  // Default nudge
  const completed = getCompleted().length;
  if (completed === 0) {
    return {
      title: "Ready for your first exercise?",
      text:  "Browse the exercise gallery and try one together this week. Most take under 15 minutes.",
      cta:   "Browse exercises",
      ctaHref: 'exercises.html',
    };
  }
  return null;
}

export function getRecommendedExerciseTags() {
  const nudge = evaluate();
  return nudge?.exerciseTags || [];
}
