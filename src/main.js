import { GROQ_API_KEY } from "./config.js"; 
import { store, callbacks } from "./store.js";
import "./chat.js";

let planGenerated = false;
let currentPlanData = null;

function saveToStorage() {
  localStorage.setItem("planr-tasks", JSON.stringify(store.tasks));
}

function loadFromStorage() {
  const saved = localStorage.getItem("planr-tasks");
  if (saved) {
    try {
      store.setTasks(JSON.parse(saved));
      renderTasks();
    } catch (e) {
      store.clearTasks();
    }
  }
}

function setMinDeadline() {
  const deadlineInput = document.getElementById("task-deadline");
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  deadlineInput.min = yyyy + "-" + mm + "-" + dd;
}

function getDaysLeft(deadline) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  return Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
}

function getCountdownLabel(daysLeft) {
  if (daysLeft < 0) return { text: "OVERDUE", urgent: true };
  if (daysLeft === 0) return { text: "TODAY", urgent: true };
  if (daysLeft === 1) return { text: "Tomorrow", urgent: true };
  return { text: daysLeft + " days left", urgent: false };
}

function getPriorityColor(priority) {
  if (priority === "High") return "#C23C5A";
  if (priority === "Medium") return "#D5A18E";
  return "#75BB7C";
}

function getTotalHours() {
  return store.tasks.reduce(function(sum, t) {
    return sum + (parseFloat(t.hours) || 0);
  }, 0);
}

function updateTaskSummary() {
  const summary = document.getElementById("task-summary");
  if (store.tasks.length === 0) {
    summary.textContent = "";
    return;
  }
  const totalHours = getTotalHours().toFixed(1);
  const overdueTasks = store.tasks.filter(function(t) { return getDaysLeft(t.deadline) < 0; });
  let text = store.tasks.length + " task" + (store.tasks.length !== 1 ? "s" : "") + " · " + totalHours + " hrs";
  if (overdueTasks.length > 0) {
    text += " · " + overdueTasks.length + " overdue";
  }
  summary.textContent = text;
}

function markPlanStale() {
  if (planGenerated) {
    document.getElementById("plan-stale-badge").style.display = "inline";
  }
}

export function addTaskFromChat(taskData) {
  const task = {
    id: Date.now(),
    name: taskData.name,
    subject: taskData.subject,
    deadline: taskData.deadline,
    priority: taskData.priority,
    type: taskData.type,
    hours: parseFloat(taskData.hours) || 1,
    createdAt: new Date().toISOString()
  };
  store.addTask(task);
  saveToStorage();
  renderTasks();
  markPlanStale();
  return task;
}

function showEmptyPlanState() {
  const container = document.getElementById("plan-container");
  container.innerHTML = "";
  const wrapper = document.createElement("div");
  wrapper.className = "empty-state-wrapper";
  const icon = document.createElement("div");
  icon.className = "empty-state-icon";
  icon.textContent = "📋";
  const title = document.createElement("p");
  title.className = "empty-state-title";
  title.textContent = "No plan yet";
  const sub = document.createElement("p");
  sub.className = "empty-state-sub";
  sub.innerHTML = "Add your tasks on the left, then click <strong>Generate Plan</strong> to build your personalised study schedule.";
  wrapper.appendChild(icon);
  wrapper.appendChild(title);
  wrapper.appendChild(sub);
  container.appendChild(wrapper);
}

function resetPlanUI() {
  showEmptyPlanState();
  document.getElementById("completed-section").style.display = "none";
  document.getElementById("completed-list").innerHTML = "";
  document.getElementById("clear-plan-btn").style.display = "none";
  document.getElementById("export-plan-btn").style.display = "none";
  document.getElementById("plan-stale-badge").style.display = "none";
  planGenerated = false;
  currentPlanData = null;
}

function exportPlan() {
  if (!currentPlanData) return;
  let text = "PLANR — Your Study Plan\n";
  text += "Generated: " + new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) + "\n";
  text += "Tasks: " + store.tasks.length + " · Total Hours: " + getTotalHours().toFixed(1) + "\n";
  text += "=".repeat(40) + "\n\n";
  currentPlanData.forEach(function(day) {
    text += "📅 " + day.date.toUpperCase() + "\n";
    if (day.overloaded) text += "⚠ Heavy day\n";
    day.tasks.forEach(function(task, i) {
      text += "\n  " + (i + 1) + ". " + task.name + " [" + task.subject + " · " + task.priority + " · " + task.type + "]\n";
      if (Array.isArray(task.steps)) {
        task.steps.forEach(function(step, si) {
          text += "     " + (si + 1) + ") " + step + "\n";
        });
      }
      if (task.suggestion && task.suggestion !== "null") {
        text += "     💡 " + task.suggestion + "\n";
      }
      text += "     ⌛ " + parseFloat(task.hours).toFixed(1) + " hrs\n";
    });
    text += "\n";
  });
  navigator.clipboard.writeText(text).then(function() {
    alert("Plan copied to clipboard! Paste it anywhere to save.");
  }).catch(function() {
    prompt("Copy this plan manually:", text);
  });
}

function renderTasks() {
  const list = document.getElementById("task-list");
  list.innerHTML = "";
  updateTaskSummary();

  if (store.tasks.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-task";
    empty.textContent = "No tasks yet. Add your first task above.";
    list.appendChild(empty);
    return;
  }

  const sorted = [...store.tasks].sort(function(a, b) {
    return getDaysLeft(a.deadline) - getDaysLeft(b.deadline);
  });

  sorted.forEach(function(task) {
    const daysLeft = getDaysLeft(task.deadline);
    const countdown = getCountdownLabel(daysLeft);

    const card = document.createElement("div");
    card.className = "task-card";
    card.style.borderLeft = "4px solid " + getPriorityColor(task.priority);

    const row1 = document.createElement("div");
    row1.className = "task-card-row1";

    const name = document.createElement("span");
    name.className = "task-card-name";
    name.textContent = task.name;

    const delBtn = document.createElement("button");
    delBtn.className = "delete-btn";
    delBtn.textContent = "×";
    delBtn.addEventListener("click", function() {
      if (confirm("Delete \"" + task.name + "\"?")) {
        store.removeTask(task.id);
        saveToStorage();
        renderTasks();
        markPlanStale();
      }
    });

    row1.appendChild(name);
    row1.appendChild(delBtn);

    const row2 = document.createElement("div");
    row2.className = "task-card-row2";

    const subjectPill = document.createElement("span");
    subjectPill.className = "pill pill-subject";
    subjectPill.textContent = task.subject.toUpperCase();

    const typePill = document.createElement("span");
    typePill.className = "pill pill-type";
    typePill.textContent = task.type;

    const priorityLabel = document.createElement("span");
    priorityLabel.style.fontSize = "11px";
    priorityLabel.style.fontWeight = "700";
    priorityLabel.style.color = getPriorityColor(task.priority);
    priorityLabel.textContent = task.priority;

    row2.appendChild(subjectPill);
    row2.appendChild(typePill);
    row2.appendChild(priorityLabel);

    const row3 = document.createElement("div");
    row3.className = "task-card-row3";

    const countdownEl = document.createElement("span");
    countdownEl.textContent = "⏰ " + countdown.text;
    if (countdown.urgent) countdownEl.className = "countdown-urgent";

    const hoursEl = document.createElement("span");
    hoursEl.textContent = "⌛ " + parseFloat(task.hours).toFixed(1) + " hrs";

    row3.appendChild(countdownEl);
    row3.appendChild(hoursEl);

    card.appendChild(row1);
    card.appendChild(row2);
    card.appendChild(row3);
    list.appendChild(card);
  });
}

function renderPlan(dayPlan) {
  currentPlanData = dayPlan;
  planGenerated = true;

  const container = document.getElementById("plan-container");
  container.innerHTML = "";

  document.getElementById("plan-stale-badge").style.display = "none";
  document.getElementById("clear-plan-btn").style.display = "inline-block";
  document.getElementById("export-plan-btn").style.display = "inline-block";
  document.getElementById("completed-section").style.display = "none";
  document.getElementById("completed-list").innerHTML = "";

  if (!dayPlan || dayPlan.length === 0) {
    showEmptyPlanState();
    return;
  }

  dayPlan.forEach(function(day, index) {
    const section = document.createElement("div");
    section.className = "day-section";

    const headingRow = document.createElement("div");
    headingRow.className = "day-heading";

    const headingText = document.createElement("span");
    headingText.textContent = day.date;

    const dayHoursTotal = day.tasks.reduce(function(sum, t) {
      return sum + (parseFloat(t.hours) || 0);
    }, 0);

    const isHeavy = dayHoursTotal > 6;
    const hoursSpan = document.createElement("span");
    hoursSpan.className = "day-hours-total" + (isHeavy ? " day-hours-heavy" : "");
    hoursSpan.textContent = dayHoursTotal.toFixed(1) + " hrs" + (isHeavy ? " · heavy" : "");

    headingRow.appendChild(headingText);
    headingRow.appendChild(hoursSpan);
    section.appendChild(headingRow);

    if (day.overloaded) {
      const warn = document.createElement("p");
      warn.className = "overloaded-warning";
      warn.textContent = "⚠ Heavy day — consider moving a task";
      section.appendChild(warn);
    }

    day.tasks.forEach(function(task) {
      const daysLeft = task.deadline ? getDaysLeft(task.deadline) : 99;
      const isUrgent = daysLeft <= 1;

      const card = document.createElement("div");
      card.className = "plan-task-card" + (isUrgent ? " urgent-card" : "");
      card.style.borderLeft = "4px solid " + getPriorityColor(task.priority);

      const taskName = document.createElement("div");
      taskName.className = "plan-task-name";
      taskName.textContent = task.name;

      const badges = document.createElement("div");
      badges.className = "plan-task-badges";

      const subBadge = document.createElement("span");
      subBadge.className = "pill pill-subject";
      subBadge.textContent = task.subject ? task.subject.toUpperCase() : "";

      const typeBadge = document.createElement("span");
      typeBadge.className = "pill";
      typeBadge.style.background = "#425749";
      typeBadge.style.color = "#F5F0EB";
      typeBadge.textContent = task.type;

      const prioBadge = document.createElement("span");
      prioBadge.className = "pill";
      prioBadge.style.background = getPriorityColor(task.priority);
      prioBadge.style.color = "#fff";
      prioBadge.textContent = task.priority;

      badges.appendChild(subBadge);
      badges.appendChild(typeBadge);
      badges.appendChild(prioBadge);

      if (isUrgent) {
        const urgencyLabel = document.createElement("span");
        urgencyLabel.className = "urgency-label";
        urgencyLabel.textContent = daysLeft <= 0 ? "🚨 Overdue" : "⚡ Due Tomorrow";
        badges.appendChild(urgencyLabel);
      }

      const stepsBox = document.createElement("div");
      stepsBox.className = "plan-task-steps";
      const stepsList = document.createElement("ol");
      const stepsArray = Array.isArray(task.steps) ? task.steps : [String(task.steps)];
      stepsArray.forEach(function(step) {
        const li = document.createElement("li");
        li.textContent = step;
        stepsList.appendChild(li);
      });
      stepsBox.appendChild(stepsList);

      const footer = document.createElement("div");
      footer.className = "plan-task-footer";

      const meta = document.createElement("div");
      meta.className = "plan-task-meta";
      meta.textContent = "⌛ " + parseFloat(task.hours).toFixed(1) + " hrs · " + task.type;

      const doneBtn = document.createElement("button");
      doneBtn.className = "done-btn";
      doneBtn.textContent = "✓ Done";
      doneBtn.addEventListener("click", function() {
        const completedSection = document.getElementById("completed-section");
        const completedList = document.getElementById("completed-list");
        if (doneBtn.textContent === "✓ Done") {
          taskName.style.textDecoration = "line-through";
          taskName.style.opacity = "0.5";
          card.style.opacity = "0.55";
          doneBtn.textContent = "↩ Undo";
          completedSection.style.display = "block";
          completedList.appendChild(card);
        } else {
          taskName.style.textDecoration = "none";
          taskName.style.opacity = "1";
          card.style.opacity = "1";
          doneBtn.textContent = "✓ Done";
          section.appendChild(card);
          if (completedList.children.length === 0) {
            completedSection.style.display = "none";
          }
        }
      });

      footer.appendChild(meta);
      footer.appendChild(doneBtn);

      card.appendChild(taskName);
      card.appendChild(badges);
      card.appendChild(stepsBox);

      if (task.suggestion && task.suggestion !== "null" && String(task.suggestion).length > 2) {
        const suggestion = document.createElement("p");
        suggestion.className = "plan-task-suggestion";
        suggestion.textContent = "💡 " + task.suggestion;
        card.appendChild(suggestion);
      }

      card.appendChild(footer);
      section.appendChild(card);
    });

    container.appendChild(section);
    setTimeout(function() {
      section.classList.add("visible");
    }, index * 150);
  });
}

async function generatePlan() {
  if (store.tasks.length === 0) {
    alert("No tasks added yet. Add at least one task first.");
    return;
  }

  if (planGenerated) {
    const confirmed = confirm("A plan already exists. Regenerate with your current tasks?");
    if (!confirmed) return;
  }

  const container = document.getElementById("plan-container");
  container.innerHTML = "";
  document.getElementById("clear-plan-btn").style.display = "none";
  document.getElementById("export-plan-btn").style.display = "none";
  document.getElementById("plan-stale-badge").style.display = "none";

  const loading = document.createElement("p");
  loading.className = "loading-state";
  loading.textContent = "Building your plan...";
  container.appendChild(loading);

  const today = new Date();
  const todayStr = today.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const taskSummary = store.tasks.map(function(t) {
    return {
      name: t.name,
      subject: t.subject,
      deadline: t.deadline,
      daysUntilDeadline: getDaysLeft(t.deadline),
      priority: t.priority,
      type: t.type,
      hours: parseFloat(t.hours).toFixed(1)
    };
  });

  const deadlineGroups = {};
  taskSummary.forEach(function(t) {
    if (t.priority === "High") {
      if (!deadlineGroups[t.deadline]) deadlineGroups[t.deadline] = [];
      deadlineGroups[t.deadline].push(t.name);
    }
  });

  const conflictingTasks = [];
  Object.keys(deadlineGroups).forEach(function(key) {
    if (deadlineGroups[key].length > 1) {
      conflictingTasks.push(deadlineGroups[key].join(" and "));
    }
  });

  const conflictNote = conflictingTasks.length > 0
    ? " Note: These high-priority tasks share the same deadline and may conflict: " + conflictingTasks.join(", ") + "."
    : "";

  const prompt = "Today is " + todayStr + ". You are a strict study scheduler. The user has these tasks: " + JSON.stringify(taskSummary) + "." + conflictNote + " STRICT RULES: 1) Each task MUST be scheduled on a day BEFORE its deadline — never after. 2) Spread tasks across MULTIPLE days — do not put everything on Today unless all deadlines are today. 3) A task with daysUntilDeadline of 7 should NOT appear on day 1 unless earlier days are already full. 4) Work backwards from each deadline — if a task is due in 6 days and takes 2 hours, schedule it on day 3 or 4. 5) Max 3 tasks per day, mark overloaded true if exceeded. 6) Use the EXACT task name, subject, and hours from the input — never change them. 7) For Reading: steps must include chunking into timed blocks and summarizing after each block, specific to the subject. 8) For Video: steps must include watching speed, pause intervals, and note-taking technique. 9) For Practice: steps must include attempt-first then check approach. 10) For Revision: steps must include active recall — write from memory first, then check gaps. 11) If daysUntilDeadline is 0 or less, schedule it first on Today. 12) If hours > 3, add a suggestion to split into two sessions. 13) Date label format: 'Today — Mon Jun 28' or 'Tomorrow — Tue Jun 29' or 'Wed Jun 30' based on today being " + todayStr + ". Return ONLY a valid JSON array, no markdown, no backticks, no text before or after, in this exact shape: [{\"date\": \"Today — Mon Jun 28\", \"overloaded\": false, \"tasks\": [{\"name\": \"exact name from input\", \"subject\": \"exact subject from input\", \"steps\": [\"step 1\", \"step 2\", \"step 3\"], \"suggestion\": \"short tip or null\", \"hours\": 1.0, \"priority\": \"High\", \"type\": \"Reading\", \"deadline\": \"2026-07-01\"}]}]";

  const attemptFetch = async function(retryCount) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + GROQ_API_KEY
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a smart study planner. Return ONLY a valid JSON array. No markdown. No backticks. No text before or after the JSON array." },
          { role: "user", content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      const msg = errData.error?.message || "unknown error";
      if (response.status === 429 && retryCount < 2) {
        await new Promise(function(resolve) { setTimeout(resolve, 3000); });
        return attemptFetch(retryCount + 1);
      }
      throw new Error("API error " + response.status + ": " + msg);
    }
    return response.json();
  };

  try {
    const data = await attemptFetch(0);
    const raw = data.choices[0].message.content;
    const firstBracket = raw.indexOf("[");
    const lastBracket = raw.lastIndexOf("]");
    if (firstBracket === -1 || lastBracket === -1) throw new Error("Model returned unexpected format. Please try again.");
    const clean = raw.substring(firstBracket, lastBracket + 1);
    const dayPlan = JSON.parse(clean);
    if (!Array.isArray(dayPlan) || dayPlan.length === 0) throw new Error("Empty plan returned. Please try again.");
    renderPlan(dayPlan);
  } catch (err) {
    container.innerHTML = "";
    const errorWrapper = document.createElement("div");
    errorWrapper.style.textAlign = "center";
    errorWrapper.style.padding = "40px 28px";
    const error = document.createElement("p");
    error.className = "error-state";
    error.style.padding = "0";
    error.textContent = "Could not generate plan. " + err.message;
    const retryBtn = document.createElement("button");
    retryBtn.className = "retry-btn";
    retryBtn.textContent = "Try Again";
    retryBtn.addEventListener("click", function() {
      planGenerated = false;
      generatePlan();
    });
    errorWrapper.appendChild(error);
    errorWrapper.appendChild(retryBtn);
    container.appendChild(errorWrapper);
  }
}

document.getElementById("task-form").addEventListener("submit", function(e) {
  e.preventDefault();
  const nameInput = document.getElementById("task-name");
  const subjectInput = document.getElementById("task-subject");
  const deadlineInput = document.getElementById("task-deadline");
  const hoursInput = document.getElementById("task-hours");

  const name = nameInput.value.trim();
  const subject = subjectInput.value.trim();
  const deadline = deadlineInput.value;
  const priority = document.getElementById("task-priority").value;
  const type = document.getElementById("task-type").value;
  const hours = parseFloat(hoursInput.value);

  nameInput.classList.remove("input-error");
  subjectInput.classList.remove("input-error");
  deadlineInput.classList.remove("input-error");

  let hasError = false;
  if (!name) { nameInput.classList.add("input-error"); hasError = true; }
  if (!subject) { subjectInput.classList.add("input-error"); hasError = true; }
  if (!deadline) { deadlineInput.classList.add("input-error"); hasError = true; }
  if (isNaN(hours) || hours < 0.5) { hoursInput.value = "1"; }
  if (hasError) return;

  const task = {
    id: Date.now(),
    name: name,
    subject: subject,
    deadline: deadline,
    priority: priority,
    type: type,
    hours: isNaN(hours) || hours < 0.5 ? 1 : hours,
    createdAt: new Date().toISOString()
  };

  store.addTask(task);
  saveToStorage();
  renderTasks();
  markPlanStale();
  e.target.reset();
  setMinDeadline();
  document.getElementById("task-hours").value = "1";
});

document.getElementById("generate-plan-btn").addEventListener("click", generatePlan);

document.getElementById("clear-plan-btn").addEventListener("click", function() {
  if (confirm("Clear the generated plan?")) resetPlanUI();
});

document.getElementById("export-plan-btn").addEventListener("click", exportPlan);

document.getElementById("clear-all-btn").addEventListener("click", function() {
  if (store.tasks.length === 0) {
    alert("No tasks to clear.");
    return;
  }
  if (confirm("Clear all " + store.tasks.length + " task(s)? This cannot be undone.")) {
    store.clearTasks();
    saveToStorage();
    renderTasks();
    resetPlanUI();
  }
});

function initUserName() {
  let userName = localStorage.getItem("planr-username");
  if (!userName) {
    userName = prompt("Welcome to Planr! What's your name?");
    if (userName && userName.trim().length > 0) {
      userName = userName.trim();
      localStorage.setItem("planr-username", userName);
    } else {
      userName = "Student";
      localStorage.setItem("planr-username", userName);
    }
  }
  const logo = document.querySelector(".logo");
  logo.textContent = "Planr";
  const tagline = document.querySelector(".tagline");
  tagline.textContent = "hey " + userName.toLowerCase() + ", study smarter";
}

setInterval(renderTasks, 60000);
setMinDeadline();
initUserName();
loadFromStorage();

callbacks.onTaskAdded = function(task) {
  saveToStorage();
  renderTasks();
  markPlanStale();
};