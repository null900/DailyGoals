/* =============================================
   gamification.js — Lógica de XP, niveles,
   rachas e insignias
   ============================================= */

/**
 * XP requerido para subir del nivel `level` al siguiente.
 * @param {number} level
 * @returns {number}
 */
function xpForLevel(level) {
  return 100 + (level - 1) * 50;
}

/**
 * Otorga XP al usuario y gestiona subidas de nivel.
 * @param {object} state
 * @param {number} amount
 * @returns {{ leveledUp: boolean, newLevel: number }}
 */
function awardXp(state, amount) {
  state.user.xp += amount;
  let leveledUp = false;
  let newLevel = state.user.level;

  while (state.user.xp >= xpForLevel(state.user.level)) {
    state.user.xp -= xpForLevel(state.user.level);
    state.user.level += 1;
    leveledUp = true;
    newLevel = state.user.level;
  }

  return { leveledUp, newLevel };
}

/**
 * Fecha actual en formato YYYY-MM-DD (local).
 * @returns {string}
 */
function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Diferencia en días entre dos fechas YYYY-MM-DD.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function daysBetween(a, b) {
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.round((db - da) / 86400000);
}

/**
 * Actualiza la racha del usuario al iniciar la app.
 * @param {object} state
 * @returns {{ broke: boolean, usedFreeze: boolean }}
 */
function updateStreak(state) {
  const today = todayKey();
  const last = state.user.lastActiveDate;

  if (!last) {
    state.user.lastActiveDate = today;
    state.user.streak = Math.max(1, state.user.streak);
    return { broke: false, usedFreeze: false };
  }

  if (last === today) return { broke: false, usedFreeze: false };

  const diff = daysBetween(last, today);

  if (diff === 1) {
    state.user.lastActiveDate = today;
    return { broke: false, usedFreeze: false };
  }

  if (diff > 1) {
    const freezeAvailable = !state.user.streakFreezeUsed[today];
    if (state.user.streak > 0 && freezeAvailable) {
      state.user.streakFreezeUsed[today] = true;
      state.user.lastActiveDate = today;
      return { broke: false, usedFreeze: true };
    }
    state.user.streak = 0;
    state.user.lastActiveDate = today;
    return { broke: true, usedFreeze: false };
  }

  return { broke: false, usedFreeze: false };
}

/**
 * Incrementa la racha al completar el primer hábito del día.
 * @param {object} state
 */
function registerDailyCompletion(state) {
  const today = todayKey();
  if (state.user.lastActiveDate !== today) {
    state.user.lastActiveDate = today;
    state.user.streak += 1;
  }
  if (state.user.streak > state.user.bestStreak) {
    state.user.bestStreak = state.user.streak;
  }
}

/**
 * Definición de insignias disponibles (con iconos Font Awesome).
 */
const BADGES = [
  { id: 'first_habit',  icon: 'fa-seedling',         name: 'Primer Paso',  check: (s) => s.habits.length >= 1 },
  { id: 'three_habits', icon: 'fa-leaf',             name: 'Constancia',   check: (s) => s.habits.length >= 3 },
  { id: 'level_5',      icon: 'fa-star',             name: 'Nivel 5',      check: (s) => s.user.level >= 5 },
  { id: 'level_10',     icon: 'fa-star-half-stroke', name: 'Nivel 10',     check: (s) => s.user.level >= 10 },
  { id: 'streak_3',     icon: 'fa-fire',             name: 'Racha x3',     check: (s) => s.user.bestStreak >= 3 },
  { id: 'streak_7',     icon: 'fa-rocket',           name: 'Racha x7',     check: (s) => s.user.bestStreak >= 7 },
  { id: 'xp_500',       icon: 'fa-gem',              name: '500 XP',       check: (s) => s.user.xp + (s.user.level * 100) >= 500 },
  { id: 'xp_1000',      icon: 'fa-crown',            name: '1000 XP',      check: (s) => s.user.xp + (s.user.level * 100) >= 1000 },
  { id: 'perfect_day',  icon: 'fa-trophy',           name: 'Día Perfecto', check: (s) => {
      const today = todayKey();
      const h = s.history[today];
      return h && h.total > 0 && h.completed >= h.total;
    }},
];

/**
 * Comprueba y desbloquea nuevas insignias.
 * @param {object} state
 * @returns {array} nuevas insignias desbloqueadas
 */
function checkBadges(state) {
  const newBadges = [];
  BADGES.forEach((b) => {
    if (!state.badges.includes(b.id) && b.check(state)) {
      state.badges.push(b.id);
      newBadges.push(b);
    }
  });
  return newBadges;
}

window.Gamification = {
  xpForLevel,
  awardXp,
  todayKey,
  updateStreak,
  registerDailyCompletion,
  checkBadges,
  BADGES,
};