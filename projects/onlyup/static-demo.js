const demoRoot = document.querySelector("[data-onlyup-demo]");

if (demoRoot) {
  const starterGoals = [
    {
      name: "Build Portfolio Website",
      category: "Project",
      start: "05/20/2026",
      estimatedHours: 18,
      hoursSpent: 11.5,
      due: "07/01/2026 23:59",
      estimatedCompletion: "06/28/2026",
      track: "Ahead",
      streak: 5,
      status: "Active",
      lastUpdate: "06/17/2026",
    },
    {
      name: "Python Automation Practice",
      category: "Learning",
      start: "06/01/2026",
      estimatedHours: 12,
      hoursSpent: 4.25,
      due: "07/10/2026 18:00",
      estimatedCompletion: "07/15/2026",
      track: "Behind",
      streak: 2,
      status: "Active",
      lastUpdate: "06/16/2026",
    },
    {
      name: "Half Marathon Training",
      category: "Health & Fitness",
      start: "05/01/2026",
      estimatedHours: 40,
      hoursSpent: 31,
      due: "08/15/2026 09:00",
      estimatedCompletion: "08/06/2026",
      track: "Ahead",
      streak: 9,
      status: "Active",
      lastUpdate: "06/17/2026",
    },
    {
      name: "Database Systems Review",
      category: "Academic",
      start: "05/15/2026",
      estimatedHours: 10,
      hoursSpent: 10,
      due: "06/12/2026 23:59",
      estimatedCompletion: "06/12/2026",
      track: "On Track",
      streak: 14,
      status: "Completed",
      lastUpdate: "06/12/2026",
    },
  ];

  const starterNotes = [
    {
      goal: "Build Portfolio Website",
      date: "2026-06-17",
      text: "I worked through how to present the goal tracker as a demo while keeping the original desktop app context.",
    },
    {
      goal: "Python Automation Practice",
      date: "2026-06-14",
      text: "Reviewed how to automate repetitive file tasks and practiced writing small functions before checking notes.",
    },
    {
      goal: "Database Systems Review",
      date: "2026-06-12",
      text: "Recalled normalization rules, joins, keys, and why indexes help query performance.",
    },
  ];

  const state = {
    goals: starterGoals.map((goal) => ({ ...goal })),
    notes: starterNotes.map((note) => ({ ...note })),
    selectedIndex: 0,
    remainingSeconds: 25 * 60,
    timer: null,
  };

  const elements = {
    goalList: demoRoot.querySelector("[data-goal-list]"),
    tabs: demoRoot.querySelectorAll("[data-demo-tab]"),
    panels: demoRoot.querySelectorAll("[data-demo-panel]"),
    goalCategory: demoRoot.querySelector("[data-goal-category]"),
    goalName: demoRoot.querySelector("[data-goal-name]"),
    goalStatus: demoRoot.querySelector("[data-goal-status]"),
    progressRing: demoRoot.querySelector("[data-progress-ring]"),
    goalPercent: demoRoot.querySelector("[data-goal-percent]"),
    hoursSpent: demoRoot.querySelector("[data-hours-spent]"),
    hoursLeft: demoRoot.querySelector("[data-hours-left]"),
    streak: demoRoot.querySelector("[data-streak]"),
    details: demoRoot.querySelector("[data-goal-details]"),
    addForm: demoRoot.querySelector("[data-add-goal-form]"),
    reset: demoRoot.querySelector("[data-reset-demo]"),
    timerDisplay: demoRoot.querySelector("[data-demo-timer]"),
    timerToggle: demoRoot.querySelector("[data-timer-toggle]"),
    timerAddMinute: demoRoot.querySelector("[data-timer-add-minute]"),
    timerSubtractMinute: demoRoot.querySelector("[data-timer-subtract-minute]"),
    timerReset: demoRoot.querySelector("[data-timer-reset]"),
    logHalfHour: demoRoot.querySelector("[data-log-half-hour]"),
    recallInput: demoRoot.querySelector("[data-recall-input]"),
    saveNote: demoRoot.querySelector("[data-save-note]"),
    notes: demoRoot.querySelector("[data-recall-notes]"),
  };

  function selectedGoal() {
    return state.goals[state.selectedIndex] || state.goals[0];
  }

  function completion(goal) {
    if (!goal || !goal.estimatedHours) {
      return 0;
    }

    return Math.min(100, Math.round((goal.hoursSpent / goal.estimatedHours) * 1000) / 10);
  }

  function showPanel(name) {
    elements.tabs.forEach((tab) => {
      tab.classList.toggle("is-active", tab.dataset.demoTab === name);
    });

    elements.panels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.demoPanel === name);
    });
  }

  function renderGoalList() {
    elements.goalList.innerHTML = state.goals
      .map(
        (goal, index) => `
          <button class="${index === state.selectedIndex ? "is-active" : ""}" type="button" data-goal-index="${index}">
            <strong>${goal.name}</strong>
            <span>${goal.category} · ${goal.status}</span>
          </button>
        `
      )
      .join("");
  }

  function renderDashboard() {
    const goal = selectedGoal();
    const percent = completion(goal);
    const hoursLeft = Math.max(goal.estimatedHours - goal.hoursSpent, 0);

    elements.goalCategory.textContent = goal.category;
    elements.goalName.textContent = goal.name;
    elements.goalStatus.textContent = `${goal.status} · ${goal.track}`;
    elements.progressRing.style.setProperty("--progress", `${percent}%`);
    elements.goalPercent.textContent = `${percent}%`;
    elements.hoursSpent.textContent = goal.hoursSpent.toFixed(2).replace(/\.00$/, "");
    elements.hoursLeft.textContent = hoursLeft.toFixed(2).replace(/\.00$/, "");
    elements.streak.textContent = goal.streak;
    elements.details.innerHTML = `
      <div><dt>Start Date</dt><dd>${goal.start}</dd></div>
      <div><dt>Ideal Completion</dt><dd>${goal.due}</dd></div>
      <div><dt>Estimated Completion</dt><dd>${goal.estimatedCompletion}</dd></div>
      <div><dt>Last Update</dt><dd>${goal.lastUpdate}</dd></div>
    `;
  }

  function renderTimer() {
    const minutes = Math.floor(state.remainingSeconds / 60).toString().padStart(2, "0");
    const seconds = (state.remainingSeconds % 60).toString().padStart(2, "0");
    elements.timerDisplay.textContent = `${minutes}:${seconds}`;
  }

  function renderNotes() {
    elements.notes.innerHTML = state.notes
      .map(
        (note) => `
          <article>
            <strong>${note.goal}</strong>
            <span>${note.date}</span>
            <p>${note.text}</p>
          </article>
        `
      )
      .join("");
  }

  function render() {
    renderGoalList();
    renderDashboard();
    renderTimer();
    renderNotes();
  }

  function logWork(hours) {
    const goal = selectedGoal();
    goal.hoursSpent = Math.min(goal.estimatedHours, Math.round((goal.hoursSpent + hours) * 100) / 100);
    goal.lastUpdate = "06/18/2026";
    goal.status = goal.hoursSpent >= goal.estimatedHours ? "Completed" : "Active";
    render();
  }

  elements.goalList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-goal-index]");

    if (!button) {
      return;
    }

    state.selectedIndex = Number(button.dataset.goalIndex);
    render();
    showPanel("dashboard");
  });

  elements.tabs.forEach((tab) => {
    tab.addEventListener("click", () => showPanel(tab.dataset.demoTab));
  });

  elements.addForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(elements.addForm);
    const estimatedHours = Number(form.get("hours")) || 1;

    state.goals.unshift({
      name: form.get("name").trim(),
      category: form.get("category"),
      start: "06/18/2026",
      estimatedHours,
      hoursSpent: 0,
      due: "N/A",
      estimatedCompletion: "N/A",
      track: "On Track",
      streak: 0,
      status: "Active",
      lastUpdate: "06/18/2026",
    });
    state.selectedIndex = 0;
    elements.addForm.reset();
    render();
    showPanel("dashboard");
  });

  elements.reset.addEventListener("click", () => {
    state.goals = starterGoals.map((goal) => ({ ...goal }));
    state.notes = starterNotes.map((note) => ({ ...note }));
    state.selectedIndex = 0;
    state.remainingSeconds = 25 * 60;
    clearInterval(state.timer);
    state.timer = null;
    elements.timerToggle.textContent = "Start";
    render();
  });

  elements.timerToggle.addEventListener("click", () => {
    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
      elements.timerToggle.textContent = "Start";
      return;
    }

    elements.timerToggle.textContent = "Pause";
    state.timer = setInterval(() => {
      state.remainingSeconds = Math.max(0, state.remainingSeconds - 1);
      renderTimer();

      if (state.remainingSeconds === 0) {
        clearInterval(state.timer);
        state.timer = null;
        elements.timerToggle.textContent = "Start";
      }
    }, 1000);
  });

  elements.timerReset.addEventListener("click", () => {
    clearInterval(state.timer);
    state.timer = null;
    state.remainingSeconds = 25 * 60;
    elements.timerToggle.textContent = "Start";
    renderTimer();
  });

  elements.timerAddMinute.addEventListener("click", () => {
    state.remainingSeconds += 60;
    renderTimer();
  });

  elements.timerSubtractMinute.addEventListener("click", () => {
    state.remainingSeconds = Math.max(60, state.remainingSeconds - 60);
    renderTimer();
  });

  elements.logHalfHour.addEventListener("click", () => {
    logWork(0.5);
    showPanel("dashboard");
  });

  elements.saveNote.addEventListener("click", () => {
    const text = elements.recallInput.value.trim();

    if (!text) {
      return;
    }

    state.notes.unshift({
      goal: selectedGoal().name,
      date: "2026-06-18",
      text,
    });
    elements.recallInput.value = "";
    render();
    showPanel("recall");
  });

  render();
}
