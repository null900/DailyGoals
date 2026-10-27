/* =============================================
   storage.js — Gestión de LocalStorage
   ============================================= */

const STORAGE_KEY = 'dailygoals_v1';

/**
 * Estado por defecto de la aplicación
 */
const DEFAULT_STATE = {
  user: {
    xp: 0,
    level: 1,
    streak: 0,
    bestStreak: 0,
    lastActiveDate: null,
    streakFreezeUsed: {},
  },
  habits: [],
  badges: [],
  history: {},
  settings: {
    theme: 'light',
    notifications: false,    // NUEVO
    avatar: 'fa-bullseye',   // NUEVO
  },
};

/**
 * Carga el estado desde LocalStorage.
 * @returns {object}
 */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(DEFAULT_STATE),
      ...parsed,
      user: { ...DEFAULT_STATE.user, ...(parsed.user || {}) },
      settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) },
    };
  } catch (err) {
    console.error('[storage] Error cargando estado:', err);
    return structuredClone(DEFAULT_STATE);
  }
}

/**
 * Guarda el estado completo en LocalStorage.
 * @param {object} state
 */
function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('[storage] Error guardando estado:', err);
  }
}

/**
 * Limpia todo el almacenamiento.
 */
function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}

window.Storage = { loadState, saveState, clearState, DEFAULT_STATE };