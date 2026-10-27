/* =============================================
   app.js — Inicialización, DOM, eventos y render
   ============================================= */

(function () {
  'use strict';

  // ---------- Estado global ----------
  let state = Storage.loadState();
  let draftType = 'binary';
  let draftDifficulty = 'medium';
  let editingId = null;
  let currentFilter = 'all';
  let calendarDate = new Date();
  const activeTimers = {};
  const notifiedToday = new Set();   // evita doble notificación

  // ---------- Helpers DOM ----------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const els = {
    headerLevel: $('#headerLevel'),
    headerStreak: $('#headerStreak'),
    headerXpBar: $('#headerXpBar'),
    headerXpText: $('#headerXpText'),
    avatarBtn: $('#avatarBtn'),
    avatarIcon: $('#avatarIcon'),
    habitsList: $('#habitsList'),
    emptyState: $('#emptyState'),
    globalProgressBar: $('#globalProgressBar'),
    globalProgressText: $('#globalProgressText'),
    todayDate: $('#todayDate'),
    fabAddHabit: $('#fabAddHabit'),
    habitModal: $('#habitModal'),
    habitForm: $('#habitForm'),
    habitModalTitle: $('#habitModalTitle'),
    habitSubmitBtn: $('#habitSubmitBtn'),
    habitId: $('#habitId'),
    habitTime: $('#habitTime'),
    clearTime: $('#clearTime'),
    modalClose: $('#modalClose'),
    measureTypeGroup: $('#measureTypeGroup'),
    difficultyGroup: $('#difficultyGroup'),
    counterFields: $('#counterFields'),
    timerFields: $('#timerFields'),
    celebrationModal: $('#celebrationModal'),
    celebrationEmoji: $('#celebrationEmoji'),
    celebrationTitle: $('#celebrationTitle'),
    celebrationText: $('#celebrationText'),
    celebrationClose: $('#celebrationClose'),
    themeToggle: $('#themeToggle'),
    themeIcon: $('#themeIcon'),
    menuToggle: $('#menuToggle'),
    menuDropdown: $('#menuDropdown'),
    notifState: $('#notifState'),
    weeklyChart: $('#weeklyChart'),
    badgesGrid: $('#badgesGrid'),
    filtersBar: $('#filtersBar'),
    statCompletedToday: $('#statCompletedToday'),
    statTotalXp: $('#statTotalXp'),
    statBestStreak: $('#statBestStreak'),
    statTotalHabits: $('#statTotalHabits'),
    calendarGrid: $('#calendarGrid'),
    calendarTitle: $('#calendarTitle'),
    calPrev: $('#calPrev'),
    calNext: $('#calNext'),
    historyList: $('#historyList'),
    toastContainer: $('#toastContainer'),
    importFile: $('#importFile'),
    avatarModal: $('#avatarModal'),
    avatarModalClose: $('#avatarModalClose'),
    avatarGrid: $('#avatarGrid'),
  };

  // Avatares disponibles
  const AVATARS = [
    'fa-bullseye', 'fa-user-astronaut', 'fa-user-ninja',
    'fa-cat', 'fa-dog', 'fa-dragon', 'fa-frog', 'fa-otter',
    'fa-ghost', 'fa-robot', 'fa-hat-wizard', 'fa-masks-theater',
  ];

  // ============================================================
  // INICIALIZACIÓN
  // ============================================================

  function init() {
    applyTheme(state.settings.theme || 'light');
    applyAvatar(state.settings.avatar || 'fa-bullseye');

    state.habits.forEach(Habits.resetDailyIfNeeded);

    const streakInfo = Gamification.updateStreak(state);
    if (streakInfo.broke) {
      setTimeout(() =>
        showCelebration('fa-heart-crack', '¡Racha perdida!', 'Empieza de nuevo hoy'), 400);
    } else if (streakInfo.usedFreeze) {
      setTimeout(() => toast('Escudo de racha usado', 'info', 'fa-shield-halved'), 500);
    }

    els.todayDate.textContent = new Date().toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long',
    });

    updateNotifStateUI();
    renderAll();
    bindEvents();
    saveAndPersist();

    // Iniciar scheduler de recordatorios
    scheduleReminders();
  }

  // ============================================================
  // RENDER
  // ============================================================

  function renderAll() {
    renderHeader();
    renderHabits();
    renderStats();
    renderHistory();
  }

  function renderHeader() {
    const { level, xp, streak } = state.user;
    const needed = Gamification.xpForLevel(level);
    els.headerLevel.textContent = level;
    els.headerStreak.textContent = streak;
    els.headerXpText.textContent = `${xp} / ${needed}`;
    els.headerXpBar.style.width = `${Math.min(100, (xp / needed) * 100)}%`;
  }

  function renderHabits() {
    const all = state.habits;
    const filtered = currentFilter === 'all'
      ? all
      : all.filter((h) => h.category === currentFilter);

    els.habitsList.innerHTML = '';

    if (!filtered.length) {
      els.emptyState.hidden = false;
      els.emptyState.querySelector('.empty-title').textContent =
        all.length ? 'Sin hábitos en esta categoría' : 'Aún no tienes hábitos';
    } else {
      els.emptyState.hidden = true;
      filtered.forEach((habit) => {
        els.habitsList.appendChild(buildHabitCard(habit));
      });
    }

    const pct = Habits.globalProgress(all);
    els.globalProgressBar.style.width = pct + '%';
    els.globalProgressText.textContent = pct + '%';

    const today = Gamification.todayKey();
    const completedToday = all.filter(Habits.isHabitComplete).length;
    state.history[today] = { completed: completedToday, total: all.length };
  }

  function buildHabitCard(habit) {
    const card = document.createElement('div');
    card.className = 'habit-card' + (Habits.isHabitComplete(habit) ? ' completed' : '');
    card.style.setProperty('--habit-color', categoryColor(habit.category));
    card.dataset.id = habit.id;

    const top = document.createElement('div');
    top.className = 'habit-card-top';

    const info = document.createElement('div');
    info.className = 'habit-info';

    // Metadatos incluyendo hora si tiene
    const timeChip = habit.time
      ? `<span class="habit-time"><i class="fa-solid fa-clock"></i> ${habit.time}</span>`
      : '';

    info.innerHTML = `
      <div class="habit-title">${escapeHtml(habit.title)}</div>
      <div class="habit-meta">
        <span class="habit-tag">${habit.category}</span>
        <span class="habit-xp">+${Habits.xpForDifficulty(habit.difficulty)} XP</span>
        ${timeChip}
      </div>
    `;
    top.appendChild(info);

    if (habit.type === 'binary') {
      const check = document.createElement('button');
      check.className = 'habit-check' + (habit.completedToday ? ' checked' : '');
      check.innerHTML = habit.completedToday ? '<i class="fa-solid fa-check"></i>' : '';
      check.addEventListener('click', () => onToggleBinary(habit));
      top.appendChild(check);
    }

    card.appendChild(top);

    if (habit.type === 'counter') {
      const progress = Habits.habitProgress(habit);
      card.innerHTML += `
        <div class="habit-progress-track">
          <div class="habit-progress-fill" style="width:${progress * 100}%"></div>
        </div>
        <div class="counter-row">
          <span class="counter-value">${habit.current} / ${habit.goal} ${habit.unit}</span>
          <button class="counter-btn" data-action="inc">+${habit.step} ${habit.unit}</button>
        </div>
      `;
      card.querySelector('[data-action="inc"]').addEventListener('click', () => onIncrementCounter(habit));
    }

    if (habit.type === 'timer') {
      const progress = Habits.habitProgress(habit);
      card.innerHTML += `
        <div class="habit-progress-track">
          <div class="habit-progress-fill" style="width:${progress * 100}%"></div>
        </div>
        <div class="timer-row">
          <span class="timer-display" data-timer>${formatTime(habit.secondsLeft)}</span>
          <button class="timer-btn ${habit.running ? 'running' : ''}" data-action="timer">
            ${habit.running
              ? '<i class="fa-solid fa-pause"></i> Pausar'
              : '<i class="fa-solid fa-play"></i> Iniciar'}
          </button>
        </div>
      `;
      card.querySelector('[data-action="timer"]').addEventListener('click', () => onToggleTimer(habit));
    }

    // Editar
    const edit = document.createElement('button');
    edit.className = 'habit-edit';
    edit.innerHTML = '<i class="fa-solid fa-pen"></i>';
    edit.title = 'Editar hábito';
    edit.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal(habit);
    });
    card.appendChild(edit);

    // Eliminar
    const del = document.createElement('button');
    del.className = 'habit-delete';
    del.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    del.title = 'Eliminar hábito';
    del.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`¿Eliminar "${habit.title}"?`)) onDeleteHabit(habit);
    });
    card.appendChild(del);

    return card;
  }

  function categoryColor(cat) {
    return {
      Salud: 'var(--cat-salud)',
      Estudio: 'var(--cat-estudio)',
      Productividad: 'var(--cat-productividad)',
    }[cat] || 'var(--primary)';
  }

  // ============================================================
  // ACCIONES
  // ============================================================

  function onToggleBinary(habit) {
    const result = Habits.toggleBinary(habit, state);
    if (result.completed && result.xp > 0) {
      handleCompletion(habit, result.xp);
    } else {
      renderAll();
      saveAndPersist();
    }
  }

  function onIncrementCounter(habit) {
    const result = Habits.incrementCounter(habit);
    if (result.justCompleted && result.xp > 0) {
      handleCompletion(habit, result.xp);
    } else {
      renderAll();
      saveAndPersist();
    }
  }

  function onToggleTimer(habit) {
    if (activeTimers[habit.id]) {
      clearInterval(activeTimers[habit.id]);
      delete activeTimers[habit.id];
      habit.running = false;
      renderAll();
      saveAndPersist();
      return;
    }

    habit.running = true;
    renderAll();

    activeTimers[habit.id] = setInterval(() => {
      habit.secondsLeft = Math.max(0, habit.secondsLeft - 1);
      updateTimerDisplay(habit);
      if (habit.secondsLeft <= 0) {
        clearInterval(activeTimers[habit.id]);
        delete activeTimers[habit.id];
        habit.running = false;
        handleCompletion(habit, Habits.xpForDifficulty(habit.difficulty));
      }
    }, 1000);

    saveAndPersist();
  }

  function updateTimerDisplay(habit) {
    const card = els.habitsList.querySelector(`[data-id="${habit.id}"]`);
    if (!card) return;
    const t = card.querySelector('[data-timer]');
    if (t) t.textContent = formatTime(habit.secondsLeft);
    const fill = card.querySelector('.habit-progress-fill');
    if (fill) fill.style.width = (Habits.habitProgress(habit) * 100) + '%';
  }

  function onDeleteHabit(habit) {
    state.habits = state.habits.filter((h) => h.id !== habit.id);
    if (activeTimers[habit.id]) {
      clearInterval(activeTimers[habit.id]);
      delete activeTimers[habit.id];
    }
    renderAll();
    saveAndPersist();
    toast('Hábito eliminado', 'info', 'fa-trash');
  }

  function handleCompletion(habit, xp) {
    Gamification.registerDailyCompletion(state);
    const { leveledUp, newLevel } = Gamification.awardXp(state, xp);
    const newBadges = Gamification.checkBadges(state);

    renderAll();
    saveAndPersist();

    if (leveledUp) {
      showCelebration('fa-arrow-up', `¡Nivel ${newLevel}!`, `Has ganado +${xp} XP`);
    } else if (newBadges.length) {
      showCelebration('fa-medal', `¡${newBadges[0].name}!`, `Nueva insignia · +${xp} XP`);
    } else {
      showCelebration('fa-trophy', '¡Hábito Completado!', `+${xp} XP ganados`);
    }
  }

  // ============================================================
  // MODAL CREAR / EDITAR
  // ============================================================

  function openHabitModal() {
    editingId = null;
    els.habitForm.reset();
    els.habitModalTitle.textContent = 'Nuevo Hábito';
    els.habitSubmitBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Crear Hábito';
    draftType = 'binary';
    draftDifficulty = 'medium';
    els.habitId.value = '';
    els.habitTime.value = '';
    syncChips();
    els.counterFields.hidden = true;
    els.timerFields.hidden = true;
    els.habitModal.hidden = false;
  }

  function openEditModal(habit) {
    editingId = habit.id;
    els.habitModalTitle.textContent = 'Editar Hábito';
    els.habitSubmitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Guardar cambios';
    els.habitId.value = habit.id;
    $('#habitTitle').value = habit.title;
    $('#habitCategory').value = habit.category;
    els.habitTime.value = habit.time || '';
    draftType = habit.type;
    draftDifficulty = habit.difficulty;
    syncChips();

    if (habit.type === 'counter') {
      $('#habitGoal').value = habit.goal;
      $('#habitStep').value = habit.step;
      $('#habitUnit').value = habit.unit;
      els.counterFields.hidden = false;
      els.timerFields.hidden = true;
    } else if (habit.type === 'timer') {
      $('#habitMinutes').value = habit.minutes;
      els.timerFields.hidden = false;
      els.counterFields.hidden = true;
    } else {
      els.counterFields.hidden = true;
      els.timerFields.hidden = true;
    }

    els.habitModal.hidden = false;
  }

  function syncChips() {
    els.measureTypeGroup.querySelectorAll('.chip').forEach((c) =>
      c.classList.toggle('active', c.dataset.type === draftType)
    );
    els.difficultyGroup.querySelectorAll('.chip').forEach((c) =>
      c.classList.toggle('active', c.dataset.diff === draftDifficulty)
    );
  }

  function closeHabitModal() {
    els.habitModal.hidden = true;
  }

  function submitHabitForm(e) {
    e.preventDefault();
    const title = $('#habitTitle').value.trim();
    if (!title) return;

    const baseData = {
      title,
      category: $('#habitCategory').value,
      type: draftType,
      difficulty: draftDifficulty,
      time: els.habitTime.value || null,
    };

    if (draftType === 'counter') {
      baseData.goal = Math.max(1, parseInt($('#habitGoal').value) || 2500);
      baseData.step = Math.max(1, parseInt($('#habitStep').value) || 250);
      baseData.unit = $('#habitUnit').value.trim() || 'ml';
    }
    if (draftType === 'timer') {
      baseData.minutes = Math.max(1, parseInt($('#habitMinutes').value) || 30);
    }

    if (editingId) {
      const idx = state.habits.findIndex((h) => h.id === editingId);
      if (idx !== -1) {
        const prev = state.habits[idx];
        const updated = { ...prev, ...baseData };
        if (draftType === 'counter') {
          updated.current = Math.min(prev.current || 0, updated.goal);
        }
        if (draftType === 'timer') {
          if (prev.type !== 'timer' || prev.minutes !== updated.minutes) {
            updated.secondsLeft = updated.minutes * 60;
            updated.running = false;
            if (activeTimers[updated.id]) {
              clearInterval(activeTimers[updated.id]);
              delete activeTimers[updated.id];
            }
          }
        }
        if (prev.type !== draftType) {
          updated.completedToday = false;
          updated.current = 0;
          updated.secondsLeft = (updated.minutes || 30) * 60;
          updated.running = false;
        }
        state.habits[idx] = updated;
      }
      toast('Hábito actualizado', 'success', 'fa-pen');
    } else {
      state.habits.push(Habits.createHabit(baseData));
      Gamification.checkBadges(state);
      toast('Hábito creado', 'success', 'fa-circle-check');
    }

    closeHabitModal();
    renderAll();
    saveAndPersist();
  }

  // ============================================================
  // ESTADÍSTICAS
  // ============================================================

  function renderStats() {
    const { level, xp, bestStreak } = state.user;
    els.statCompletedToday.textContent =
      state.habits.filter(Habits.isHabitComplete).length;
    els.statTotalXp.textContent = xp + (level - 1) * 100;
    els.statBestStreak.textContent = bestStreak;
    els.statTotalHabits.textContent = state.habits.length;

    renderWeeklyChart();
    renderBadges();
  }

  function renderWeeklyChart() {
    const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    const today = new Date();
    const dayIdx = (today.getDay() + 6) % 7;
    els.weeklyChart.innerHTML = '';

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - (dayIdx - i));
      const key = formatDateKey(d);
      const h = state.history[key];
      const pct = h && h.total > 0 ? Math.round((h.completed / h.total) * 100) : 0;

      const col = document.createElement('div');
      col.className = 'chart-col';
      col.innerHTML = `
        <span class="chart-bar-value">${pct}%</span>
        <div class="chart-bar-wrap">
          <div class="chart-bar ${i === dayIdx ? 'today' : ''}" style="height:${Math.max(4, pct)}%"></div>
        </div>
        <span class="chart-day ${i === dayIdx ? 'today' : ''}">${days[i]}</span>
      `;
      els.weeklyChart.appendChild(col);
    }
  }

  function renderBadges() {
    els.badgesGrid.innerHTML = '';
    Gamification.BADGES.forEach((b) => {
      const unlocked = state.badges.includes(b.id);
      const el = document.createElement('div');
      el.className = 'badge-item' + (unlocked ? '' : ' locked');
      el.innerHTML = `
        <i class="fa-solid ${b.icon} badge-icon"></i>
        <span class="badge-name">${b.name}</span>
      `;
      els.badgesGrid.appendChild(el);
    });
  }

  // ============================================================
  // HISTORIAL
  // ============================================================

  function renderHistory() {
    renderCalendar();
    renderHistoryList();
  }

  function renderCalendar() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const monthName = calendarDate.toLocaleDateString('es-ES', {
      month: 'long', year: 'numeric',
    });
    els.calendarTitle.textContent = monthName;

    const dows = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = (firstDay.getDay() + 6) % 7;
    const today = Gamification.todayKey();

    els.calendarGrid.innerHTML = '';

    dows.forEach((d) => {
      const el = document.createElement('div');
      el.className = 'calendar-dow';
      el.textContent = d;
      els.calendarGrid.appendChild(el);
    });

    for (let i = 0; i < startOffset; i++) {
      const el = document.createElement('div');
      el.className = 'calendar-day empty';
      els.calendarGrid.appendChild(el);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const h = state.history[key];
      const pct = h && h.total > 0 ? Math.round((h.completed / h.total) * 100) : -1;

      const el = document.createElement('div');
      let lvl = '';
      if (pct >= 100) lvl = 'level-3';
      else if (pct >= 50) lvl = 'level-2';
      else if (pct > 0) lvl = 'level-1';
      el.className = `calendar-day ${lvl} ${key === today ? 'today' : ''}`;
      el.textContent = day;
      if (pct >= 0) el.title = `${pct}% completado`;
      els.calendarGrid.appendChild(el);
    }
  }

  function renderHistoryList() {
    const today = new Date();
    els.historyList.innerHTML = '';

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = formatDateKey(d);
      const h = state.history[key];
      const pct = h && h.total > 0 ? Math.round((h.completed / h.total) * 100) : 0;
      const label = i === 0 ? 'Hoy' :
                    i === 1 ? 'Ayer' :
                    d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });

      const row = document.createElement('div');
      row.className = 'history-row';
      row.innerHTML = `
        <span class="history-date">${label}</span>
        <div class="history-stats">
          <div class="history-bar">
            <div class="history-bar-fill" style="width:${pct}%"></div>
          </div>
          <span class="history-pct">${pct}%</span>
        </div>
      `;
      els.historyList.appendChild(row);
    }
  }

  // ============================================================
  // NOTIFICACIONES Y RECORDATORIOS
  // ============================================================

  function updateNotifStateUI() {
    if (!('Notification' in window)) {
      els.notifState.textContent = 'N/A';
      els.notifState.classList.remove('on');
      return;
    }
    const enabled = state.settings.notifications && Notification.permission === 'granted';
    els.notifState.textContent = enabled ? 'On' : 'Off';
    els.notifState.classList.toggle('on', enabled);
  }

  async function toggleNotifications() {
    if (!('Notification' in window)) {
      toast('Tu navegador no soporta notificaciones', 'error', 'fa-bell-slash');
      return;
    }
    if (state.settings.notifications && Notification.permission === 'granted') {
      state.settings.notifications = false;
      saveAndPersist();
      updateNotifStateUI();
      toast('Notificaciones desactivadas', 'info', 'fa-bell-slash');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        state.settings.notifications = true;
        saveAndPersist();
        updateNotifStateUI();
        toast('Notificaciones activadas', 'success', 'fa-bell');
        try {
          new Notification('DailyGoals', {
            body: '¡Notificaciones activadas! Recibirás recordatorios de tus hábitos.',
            icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135679.png',
          });
        } catch (e) { /* algunos móviles no permiten sin SW */ }
      } else {
        toast('Permiso denegado', 'warning', 'fa-bell-slash');
      }
    } catch (err) {
      toast('No se pudo activar', 'error', 'fa-triangle-exclamation');
    }
  }

  /**
   * Scheduler simple: revisa cada 30s si hay hábitos con hora que coincida
   * con la hora actual y todavía no completados.
   */
  function scheduleReminders() {
    // Cada 30s
    setInterval(checkReminders, 30000);
    // Primera comprobación al inicio
    setTimeout(checkReminders, 2000);
  }

  function checkReminders() {
    if (!state.settings.notifications) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const nowStr = `${hh}:${mm}`;
    const today = Gamification.todayKey();

    state.habits.forEach((habit) => {
      if (!habit.time) return;
      if (Habits.isHabitComplete(habit)) return;
      if (habit.time !== nowStr) return;

      const key = `${today}-${habit.id}-${nowStr}`;
      if (notifiedToday.has(key)) return;
      notifiedToday.add(key);

      try {
        new Notification('DailyGoals · Recordatorio', {
          body: `Es hora de: ${habit.title}`,
          icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135679.png',
          tag: key,
        });
      } catch (err) {
        toast(`⏰ Recordatorio: ${habit.title}`, 'info', 'fa-bell');
      }
    });
  }

  // ============================================================
  // AVATAR
  // ============================================================

  function applyAvatar(iconId) {
    els.avatarIcon.className = `fa-solid ${iconId}`;
    state.settings.avatar = iconId;
  }

  function openAvatarModal() {
    els.avatarGrid.innerHTML = '';
    AVATARS.forEach((icon) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'avatar-option' + (icon === state.settings.avatar ? ' active' : '');
      btn.innerHTML = `<i class="fa-solid ${icon}"></i>`;
      btn.addEventListener('click', () => {
        applyAvatar(icon);
        saveAndPersist();
        closeAvatarModal();
        toast('Avatar actualizado', 'success', 'fa-user');
      });
      els.avatarGrid.appendChild(btn);
    });
    els.avatarModal.hidden = false;
  }

  function closeAvatarModal() {
    els.avatarModal.hidden = true;
  }

  // ============================================================
  // TOASTS
  // ============================================================

  function toast(message, type = 'info', iconId = 'fa-circle-info') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<i class="fa-solid ${iconId}"></i><span>${message}</span>`;
    els.toastContainer.appendChild(el);
    setTimeout(() => {
      el.classList.add('leaving');
      setTimeout(() => el.remove(), 320);
    }, 2600);
  }

  // ============================================================
  // CELEBRACIÓN
  // ============================================================

  function showCelebration(iconId, title, text) {
    els.celebrationEmoji.innerHTML = `<i class="fa-solid ${iconId}"></i>`;
    els.celebrationTitle.textContent = title;
    els.celebrationText.textContent = text;
    els.celebrationModal.hidden = false;
    setTimeout(() => { els.celebrationModal.hidden = true; }, 2600);
  }

  // ============================================================
  // TEMA
  // ============================================================

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    els.themeIcon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    state.settings.theme = theme;
  }

  function toggleTheme() {
    const next = state.settings.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    saveAndPersist();
  }

  // ============================================================
  // MENÚ
  // ============================================================

  function toggleMenu() {
    els.menuDropdown.hidden = !els.menuDropdown.hidden;
  }

  function closeMenu() {
    els.menuDropdown.hidden = true;
  }

  function handleMenuAction(action) {
    closeMenu();
    if (action === 'export') return exportData();
    if (action === 'import') return els.importFile.click();
    if (action === 'reset') return resetAll();
    if (action === 'about') return showAbout();
    if (action === 'notifications') return toggleNotifications();
  }

  function exportData() {
    try {
      const dataStr = JSON.stringify(state, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dailygoals_backup_${Gamification.todayKey()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast('Datos exportados', 'success', 'fa-download');
    } catch (err) {
      toast('Error al exportar', 'error', 'fa-circle-exclamation');
    }
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed || typeof parsed !== 'object' || !parsed.user) {
          throw new Error('Formato inválido');
        }
        if (!confirm('Esto reemplazará tus datos actuales. ¿Continuar?')) return;
        state = {
          ...Storage.DEFAULT_STATE,
          ...parsed,
          user: { ...Storage.DEFAULT_STATE.user, ...(parsed.user || {}) },
          settings: { ...Storage.DEFAULT_STATE.settings, ...(parsed.settings || {}) },
        };
        applyTheme(state.settings.theme || 'light');
        applyAvatar(state.settings.avatar || 'fa-bullseye');
        updateNotifStateUI();
        renderAll();
        saveAndPersist();
        toast('Datos importados correctamente', 'success', 'fa-upload');
      } catch (err) {
        toast('Archivo inválido', 'error', 'fa-circle-exclamation');
      }
    };
    reader.readAsText(file);
  }

  function resetAll() {
    if (!confirm('⚠️ Se borrarán TODOS tus datos. ¿Continuar?')) return;
    Storage.clearState();
    state = Storage.loadState();
    applyTheme(state.settings.theme || 'light');
    applyAvatar(state.settings.avatar || 'fa-bullseye');
    updateNotifStateUI();
    renderAll();
    saveAndPersist();
    toast('Todo reseteado', 'warning', 'fa-trash');
  }

  function showAbout() {
    showCelebration('fa-circle-info', 'DailyGoals v2.5',
      'App de hábitos con gamificación · Prototipo');
  }

  // ============================================================
  // NAVEGACIÓN
  // ============================================================

  function switchView(viewName) {
    $$('.view').forEach((v) => v.classList.toggle('active', v.id === `view-${viewName}`));
    $$('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.view === viewName));
    if (viewName === 'stats') renderStats();
    if (viewName === 'history') renderHistory();
  }

  // ============================================================
  // EVENTOS
  // ============================================================

  function bindEvents() {
    els.fabAddHabit.addEventListener('click', openHabitModal);
    els.modalClose.addEventListener('click', closeHabitModal);
    els.habitModal.addEventListener('click', (e) => {
      if (e.target === els.habitModal) closeHabitModal();
    });
    els.habitForm.addEventListener('submit', submitHabitForm);

    // Limpiar hora
    els.clearTime.addEventListener('click', () => { els.habitTime.value = ''; });

    // Chips
    els.measureTypeGroup.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      draftType = chip.dataset.type;
      els.measureTypeGroup.querySelectorAll('.chip').forEach((c) =>
        c.classList.toggle('active', c === chip)
      );
      els.counterFields.hidden = draftType !== 'counter';
      els.timerFields.hidden = draftType !== 'timer';
    });

    els.difficultyGroup.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      draftDifficulty = chip.dataset.diff;
      els.difficultyGroup.querySelectorAll('.chip').forEach((c) =>
        c.classList.toggle('active', c === chip)
      );
    });

    // Filtros
    els.filtersBar.addEventListener('click', (e) => {
      const chip = e.target.closest('.filter-chip');
      if (!chip) return;
      currentFilter = chip.dataset.filter;
      els.filtersBar.querySelectorAll('.filter-chip').forEach((c) =>
        c.classList.toggle('active', c === chip)
      );
      renderHabits();
    });

    // Celebración
    els.celebrationClose.addEventListener('click', () => {
      els.celebrationModal.hidden = true;
    });

    // Avatar
    els.avatarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openAvatarModal();
    });
    els.avatarModalClose.addEventListener('click', closeAvatarModal);
    els.avatarModal.addEventListener('click', (e) => {
      if (e.target === els.avatarModal) closeAvatarModal();
    });

    // Tema y menú
    els.themeToggle.addEventListener('click', toggleTheme);
    els.menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMenu();
    });
    document.addEventListener('click', (e) => {
      if (!els.menuDropdown.hidden &&
          !els.menuDropdown.contains(e.target) &&
          !els.menuToggle.contains(e.target)) {
        closeMenu();
      }
    });
    els.menuDropdown.addEventListener('click', (e) => {
      const item = e.target.closest('.menu-item');
      if (item) handleMenuAction(item.dataset.action);
    });

    // Import
    els.importFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) importData(file);
      e.target.value = '';
    });

    // Nav
    $$('.nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    // Calendario
    els.calPrev.addEventListener('click', () => {
      calendarDate.setMonth(calendarDate.getMonth() - 1);
      renderCalendar();
    });
    els.calNext.addEventListener('click', () => {
      calendarDate.setMonth(calendarDate.getMonth() + 1);
      renderCalendar();
    });
  }

  // ============================================================
  // PERSISTENCIA
  // ============================================================

  function saveAndPersist() {
    Storage.saveState(state);
  }

  // ============================================================
  // UTILS
  // ============================================================

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------- Arranque ----------
  document.addEventListener('DOMContentLoaded', init);
})();