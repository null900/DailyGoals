/* =============================================
   habits.js — CRUD de hábitos y lógica por tipo
   ============================================= */

/**
 * Genera un ID único.
 * @returns {string}
 */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/**
 * Crea un objeto hábito normalizado.
 * @param {object} data
 * @returns {object}
 */
function createHabit(data) {
  return {
    id: uid(),
    title: data.title,
    category: data.category || 'Salud',
    difficulty: data.difficulty || 'medium',
    type: data.type || 'binary',
    time: data.time || null,           // NUEVO: 'HH:MM' o null
    createdAt: Date.now(),
    lastCompletedDate: null,
    completedToday: false,
    goal: data.goal || 2500,
    step: data.step || 250,
    unit: data.unit || 'ml',
    current: 0,
    minutes: data.minutes || 30,
    secondsLeft: (data.minutes || 30) * 60,
    running: false,
  };
}

/**
 * XP por dificultad.
 * @param {string} difficulty
 * @returns {number}
 */
function xpForDifficulty(difficulty) {
  return { easy: 10, medium: 20, hard: 35 }[difficulty] || 20;
}

/**
 * Verifica si un hábito está completo según su tipo.
 * @param {object} habit
 * @returns {boolean}
 */
function isHabitComplete(habit) {
  if (habit.type === 'binary') return habit.completedToday;
  if (habit.type === 'counter') return habit.current >= habit.goal;
  if (habit.type === 'timer') return habit.secondsLeft <= 0;
  return false;
}

/**
 * Progreso parcial (0-1) de un hábito.
 * @param {object} habit
 * @returns {number}
 */
function habitProgress(habit) {
  if (habit.type === 'binary') return habit.completedToday ? 1 : 0;
  if (habit.type === 'counter') return Math.min(1, habit.current / habit.goal);
  if (habit.type === 'timer') {
    const total = habit.minutes * 60;
    return total > 0 ? Math.min(1, 1 - habit.secondsLeft / total) : 0;
  }
  return 0;
}

/**
 * Marca un hábito binario como completado/no completado.
 * @param {object} habit
 * @param {object} state
 * @returns {{ completed: boolean, xp: number }}
 */
function toggleBinary(habit, state) {
  const today = Gamification.todayKey();

  if (habit.lastCompletedDate !== today) {
    habit.completedToday = false;
  }

  if (!habit.completedToday) {
    habit.completedToday = true;
    habit.lastCompletedDate = today;
    return { completed: true, xp: xpForDifficulty(habit.difficulty) };
  } else {
    habit.completedToday = false;
    return { completed: false, xp: 0 };
  }
}

/**
 * Incrementa el contador de un hábito tipo counter.
 * @param {object} habit
 * @returns {{ justCompleted: boolean, xp: number }}
 */
function incrementCounter(habit) {
  if (habit.current >= habit.goal) return { justCompleted: false, xp: 0 };

  habit.current = Math.min(habit.goal, habit.current + habit.step);
  const justCompleted = habit.current >= habit.goal;
  habit.completedToday = justCompleted;
  if (justCompleted) habit.lastCompletedDate = Gamification.todayKey();

  return {
    justCompleted,
    xp: justCompleted ? xpForDifficulty(habit.difficulty) : 0,
  };
}

/**
 * Calcula el porcentaje global del día.
 * @param {array} habits
 * @returns {number} 0-100
 */
function globalProgress(habits) {
  if (!habits.length) return 0;
  const completed = habits.filter(isHabitComplete).length;
  return Math.round((completed / habits.length) * 100);
}

/**
 * Resetea el estado diario de un hábito si cambió el día.
 * @param {object} habit
 */
function resetDailyIfNeeded(habit) {
  const today = Gamification.todayKey();
  if (habit.lastCompletedDate && habit.lastCompletedDate !== today) {
    habit.completedToday = false;
    if (habit.type === 'counter') habit.current = 0;
    if (habit.type === 'timer') habit.secondsLeft = habit.minutes * 60;
  }
}

window.Habits = {
  uid,
  createHabit,
  xpForDifficulty,
  isHabitComplete,
  habitProgress,
  toggleBinary,
  incrementCounter,
  globalProgress,
  resetDailyIfNeeded,
};