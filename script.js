// StudyMate: local browser storage helper

const STORAGE = {
  tasks: "studymate_tasks",
  grades: "studymate_grades",
  schedule: "studymate_schedule",
  notes: "studymate_notes",
  focus: "studymate_focus_sessions",
  quiz: "studymate_quiz_score"
};

function loadData(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch (error) {
    return fallback;
  }
}

function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Mobile navigation
const menuToggle = document.getElementById("menu-toggle");
const mainNav = document.getElementById("main-nav");

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    mainNav.classList.toggle("open");
  });

  mainNav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("open");
    });
  });
}

// Planner
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");

let tasks = loadData(STORAGE.tasks, []);

function renderTasks() {
  taskList.innerHTML = "";

  if (!tasks.length) {
    taskList.innerHTML =
      '<li class="empty-message">Your study tasks will appear here.</li>';
  }

  tasks.forEach((task, index) => {
    const li = document.createElement("li");

    if (task.done) {
      li.classList.add("done");
    }

    const label = document.createElement("label");
    const checkbox = document.createElement("input");

    checkbox.type = "checkbox";
    checkbox.checked = task.done;

    checkbox.addEventListener("change", () => {
      tasks[index].done = checkbox.checked;
      saveData(STORAGE.tasks, tasks);
      renderTasks();
      updateDashboard();
    });

    const text = document.createElement("span");
    text.textContent = task.text;

    label.append(checkbox, text);

    const remove = document.createElement("button");
    remove.className = "delete-btn";
    remove.type = "button";
    remove.textContent = "×";
    remove.setAttribute("aria-label", "Delete task");

    remove.addEventListener("click", () => {
      tasks.splice(index, 1);
      saveData(STORAGE.tasks, tasks);
      renderTasks();
      updateDashboard();
    });

    li.append(label, remove);
    taskList.appendChild(li);
  });

  const done = tasks.filter(task => task.done).length;

  document.getElementById("task-count").textContent =
    `${done} of ${tasks.length} tasks completed`;

  saveData(STORAGE.tasks, tasks);
}

taskForm.addEventListener("submit", event => {
  event.preventDefault();

  const text = taskInput.value.trim();

  if (!text) return;

  tasks.push({
    text: text,
    done: false
  });

  taskInput.value = "";

  renderTasks();
  updateDashboard();
});

// Grades
const gradeForm = document.getElementById("grade-form");
const subjectName = document.getElementById("subject-name");
const gradeInput = document.getElementById("grade");
const coefficientInput = document.getElementById("coefficient");
const gradeList = document.getElementById("grade-list");

let grades = loadData(STORAGE.grades, []);

function getAverage() {
  const sumCoef = grades.reduce(
    (sum, grade) => sum + grade.coefficient,
    0
  );

  if (!sumCoef) return null;

  const weightedSum = grades.reduce(
    (sum, grade) => sum + grade.grade * grade.coefficient,
    0
  );

  return weightedSum / sumCoef;
}

function renderGrades() {
  gradeList.innerHTML = "";

  grades.forEach((subject, index) => {
    const li = document.createElement("li");

    const label = document.createElement("span");

    label.textContent =
      `${subject.name}: ${subject.grade}/20 (Coef. ${subject.coefficient})`;

    const remove = document.createElement("button");

    remove.className = "delete-btn";
    remove.type = "button";
    remove.textContent = "×";
    remove.setAttribute("aria-label", "Delete grade");

    remove.addEventListener("click", () => {
      grades.splice(index, 1);

      saveData(STORAGE.grades, grades);

      renderGrades();
      updateDashboard();
    });

    li.append(label, remove);
    gradeList.appendChild(li);
  });

  const average = getAverage();

  document.getElementById("average").textContent =
    average === null
      ? "— / 20"
      : `${average.toFixed(2)} / 20`;

  saveData(STORAGE.grades, grades);
}

gradeForm.addEventListener("submit", event => {
  event.preventDefault();

  const grade = Number(gradeInput.value);
  const coefficient = Number(coefficientInput.value);
  const name = subjectName.value.trim();

  if (
    !name ||
    !Number.isFinite(grade) ||
    grade < 0 ||
    grade > 20 ||
    !Number.isFinite(coefficient) ||
    coefficient <= 0
  ) {
    return;
  }

  grades.push({
    name: name,
    grade: grade,
    coefficient: coefficient
  });

  subjectName.value = "";
  gradeInput.value = "";
  coefficientInput.value = "";

  renderGrades();
  updateDashboard();
});

document.getElementById("clear-grades").addEventListener("click", () => {
  grades = [];

  renderGrades();
  updateDashboard();
});

// Timetable
const scheduleForm = document.getElementById("schedule-form");

let schedule = loadData(STORAGE.schedule, []);

function renderSchedule() {
  const body = document.getElementById("schedule-list");

  body.innerHTML = "";

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ];

  schedule.sort((a, b) =>
    days.indexOf(a.day) - days.indexOf(b.day) ||
    a.time.localeCompare(b.time)
  );

  schedule.forEach((entry, index) => {
    const tr = document.createElement("tr");

    [
      entry.day,
      entry.time,
      entry.subject,
      entry.room || "—"
    ].forEach(value => {
      const td = document.createElement("td");

      td.textContent = value;

      tr.appendChild(td);
    });

    const action = document.createElement("td");
    const remove = document.createElement("button");

    remove.className = "delete-btn";
    remove.type = "button";
    remove.textContent = "×";
    remove.setAttribute("aria-label", "Remove timetable entry");

    remove.addEventListener("click", () => {
      schedule.splice(index, 1);

      saveData(STORAGE.schedule, schedule);

      renderSchedule();
    });

    action.appendChild(remove);
    tr.appendChild(action);
    body.appendChild(tr);
  });

  document.getElementById("schedule-empty").hidden =
    schedule.length > 0;

  saveData(STORAGE.schedule, schedule);
}

scheduleForm.addEventListener("submit", event => {
  event.preventDefault();

  const subject = document
    .getElementById("schedule-subject")
    .value.trim();

  const day = document.getElementById("schedule-day").value;
  const time = document.getElementById("schedule-time").value;

  const room = document
    .getElementById("schedule-room")
    .value.trim();

  if (!subject || !day || !time) return;

  schedule.push({
    subject: subject,
    day: day,
    time: time,
    room: room
  });

  scheduleForm.reset();

  renderSchedule();
});

// Notes
let notes = loadData(STORAGE.notes, []);

const noteForm = document.getElementById("note-form");

function renderNotes() {
  const list = document.getElementById("notes-list");

  list.innerHTML = "";

  notes.forEach((note, index) => {
    const card = document.createElement("article");

    card.className = "note-item";

    const title = document.createElement("h4");
    title.textContent = note.title;

    const content = document.createElement("p");
    content.textContent = note.content;

    const actions = document.createElement("div");
    actions.className = "note-actions";

    const edit = document.createElement("button");

    edit.type = "button";
    edit.textContent = "Edit";

    edit.addEventListener("click", () => {
      document.getElementById("note-title").value =
        note.title;

      document.getElementById("note-content").value =
        note.content;

      notes.splice(index, 1);

      saveData(STORAGE.notes, notes);

      renderNotes();

      document.getElementById("note-title").focus();
    });

    const remove = document.createElement("button");

    remove.type = "button";
    remove.textContent = "Delete";

    remove.addEventListener("click", () => {
      notes.splice(index, 1);

      saveData(STORAGE.notes, notes);

      renderNotes();
      updateDashboard();
    });

    actions.append(edit, remove);

    card.append(title, content, actions);

    list.appendChild(card);
  });

  saveData(STORAGE.notes, notes);
}

noteForm.addEventListener("submit", event => {
  event.preventDefault();

  const title = document
    .getElementById("note-title")
    .value.trim();

  const content = document
    .getElementById("note-content")
    .value.trim();

  if (!title || !content) return;

  notes.unshift({
    title: title,
    content: content
  });

  noteForm.reset();

  renderNotes();
  updateDashboard();
});

// Focus timer
let focusSessions = loadData(STORAGE.focus, 0);

let timerSeconds = 25 * 60;
let selectedMinutes = 25;
let timerInterval = null;
let running = false;

const timerDisplay = document.getElementById("timer-display");
const timerStart = document.getElementById("timer-start");
const timerMessage = document.getElementById("timer-message");

function formatTime(total) {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function drawTimer() {
  timerDisplay.textContent = formatTime(timerSeconds);
}

function stopTimer() {
  clearInterval(timerInterval);

  timerInterval = null;
  running = false;

  timerStart.textContent = "Start";
}

document.querySelectorAll(".mode-btn").forEach(button => {
  button.addEventListener("click", () => {
    stopTimer();

    document.querySelectorAll(".mode-btn").forEach(b => {
      b.classList.remove("active");
    });

    button.classList.add("active");

    selectedMinutes = Number(button.dataset.minutes);
    timerSeconds = selectedMinutes * 60;

    drawTimer();

    timerMessage.textContent = "Ready when you are.";
  });
});

timerStart.addEventListener("click", () => {
  if (running) {
    stopTimer();

    timerMessage.textContent = "Timer paused.";

    return;
  }

  running = true;

  timerStart.textContent = "Pause";

  timerMessage.textContent =
    "Stay focused — you can do it!";

  timerInterval = setInterval(() => {
    timerSeconds--;

    drawTimer();

    if (timerSeconds <= 0) {
      stopTimer();

      if (selectedMinutes === 25) {
        focusSessions++;

        saveData(STORAGE.focus, focusSessions);

        updateDashboard();

        timerMessage.textContent =
          "Focus session complete! Take a short break.";
      } else {
        timerMessage.textContent =
          "Break finished. Ready for another focus session?";
      }

      timerSeconds = selectedMinutes * 60;

      drawTimer();
    }
  }, 1000);
});

document.getElementById("timer-reset").addEventListener("click", () => {
  stopTimer();

  timerSeconds = selectedMinutes * 60;

  drawTimer();

  timerMessage.textContent = "Timer reset.";
});

drawTimer();

// Resource search and filter
const resourceSearch = document.getElementById("resource-search");
const resourceFilter = document.getElementById("resource-filter");

function filterResources() {
  const query = resourceSearch.value.toLowerCase().trim();
  const category = resourceFilter.value;

  let visible = 0;

  document
    .querySelectorAll("#resource-grid .resource-card")
    .forEach(card => {
      const matchText =
        card.textContent.toLowerCase().includes(query);

      const matchCategory =
        category === "all" ||
        card.dataset.category === category;

      card.hidden = !(matchText && matchCategory);

      if (!card.hidden) {
        visible++;
      }
    });

  document.getElementById("resource-empty").hidden =
    visible > 0;
}

resourceSearch.addEventListener("input", filterResources);

resourceFilter.addEventListener("change", filterResources);

// Quiz
const questions = [
  {
    question: "What does HTML stand for?",
    answers: [
      "HyperText Markup Language",
      "High Transfer Machine Link",
      "Home Tool Markup Language"
    ],
    correct: 0
  },
  {
    question: "Which language is used to style a web page?",
    answers: ["HTML", "CSS", "SQL"],
    correct: 1
  },
  {
    question: "Which one is a JavaScript data type?",
    answers: ["Boolean", "Paragraph", "Heading"],
    correct: 0
  },
  {
    question: "Which HTML element creates a link?",
    answers: ["<link>", "<a>", "<href>"],
    correct: 1
  },
  {
    question: "Which CSS property changes text color?",
    answers: ["font-style", "text-size", "color"],
    correct: 2
  }
];

let questionIndex = 0;

let quizScore = loadData(STORAGE.quiz, 0);

const questionText = document.getElementById("question");
const answersBox = document.getElementById("answers");
const feedback = document.getElementById("quiz-feedback");
const nextButton = document.getElementById("next-question");

function renderQuestion() {
  const question = questions[questionIndex];

  questionText.textContent = question.question;

  answersBox.innerHTML = "";

  feedback.textContent = "";

  nextButton.hidden = true;

  nextButton.textContent = "Next question";

  question.answers.forEach((answer, index) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "answer";
    button.textContent = answer;

    button.addEventListener("click", () => {
      const buttons = answersBox.querySelectorAll("button");

      buttons.forEach(b => {
        b.disabled = true;
      });

      if (index === question.correct) {
        button.classList.add("correct");

        quizScore++;

        saveData(STORAGE.quiz, quizScore);

        feedback.textContent = "Correct! Well done.";
      } else {
        button.classList.add("wrong");

        buttons[question.correct].classList.add("correct");

        feedback.textContent =
          "Not quite. The correct answer is highlighted.";
      }

      document.getElementById("quiz-score").textContent =
        `Quiz score: ${quizScore}`;

      nextButton.hidden = false;

      nextButton.textContent =
        questionIndex === questions.length - 1
          ? "Restart quiz"
          : "Next question";
    });

    answersBox.appendChild(button);
  });
}

nextButton.addEventListener("click", () => {
  questionIndex = (questionIndex + 1) % questions.length;

  renderQuestion();
});

document.getElementById("quiz-score").textContent =
  `Quiz score: ${quizScore}`;

renderQuestion();

// Dashboard and progress
function updateDashboard() {
  const done = tasks.filter(task => task.done).length;
  const total = tasks.length;

  const taskPercent = total
    ? Math.round(done / total * 100)
    : 0;

  const average = getAverage();

  const gradePercent = average === null
    ? 0
    : Math.round(average / 20 * 100);

  document.getElementById("stat-tasks").textContent =
    `${done} / ${total}`;

  document.getElementById("stat-average").textContent =
    average === null
      ? "— / 20"
      : `${average.toFixed(2)} / 20`;

  document.getElementById("stat-focus").textContent =
    focusSessions;

  document.getElementById("stat-notes").textContent =
    notes.length;

  document.getElementById("hero-progress").style.width =
    `${taskPercent}%`;

  document.getElementById("hero-progress-label").textContent =
    total
      ? `${taskPercent}% of tasks completed`
      : "Your progress starts here";

  document.getElementById("progress-task-label").textContent =
    `${taskPercent}%`;

  document.getElementById("progress-task-bar").style.width =
    `${taskPercent}%`;

  document.getElementById("progress-grade-label").textContent =
    average === null
      ? "— / 20"
      : `${average.toFixed(1)} / 20`;

  document.getElementById("progress-grade-bar").style.width =
    `${gradePercent}%`;

  const focusPercent = Math.min(focusSessions * 10, 100);

  document.getElementById("progress-focus-label").textContent =
    focusSessions;

  document.getElementById("progress-focus-bar").style.width =
    `${focusPercent}%`;
}

// Initial rendering
renderTasks();
renderGrades();
renderSchedule();
renderNotes();
updateDashboard();

// Dark / light mode
const themeToggle = document.getElementById("theme-toggle");

function setTheme(mode) {
  const isDark = mode === "dark";
  document.body.classList.toggle("dark-mode", isDark);

  if (themeToggle) {
    themeToggle.textContent = isDark ? "☀️ Light" : "🌙 Dark";
    themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    themeToggle.setAttribute("aria-pressed", String(isDark));
  }

  try {
    localStorage.setItem("studymate_theme", isDark ? "dark" : "light");
  } catch (error) {
    // Theme still works for this page even if browser storage is unavailable.
  }
}

let savedTheme = "light";
try {
  savedTheme = localStorage.getItem("studymate_theme") || "light";
} catch (error) {}

setTheme(savedTheme);

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const currentlyDark = document.body.classList.contains("dark-mode");
    setTheme(currentlyDark ? "light" : "dark");
  });
}
