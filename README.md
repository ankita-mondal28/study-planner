# Planr — AI-Powered Study Planner

> Built with vanilla JavaScript. No frameworks. No shortcuts.

Planr is a smart study planner that takes your tasks, deadlines, and priorities and generates a personalised day-by-day study schedule using AI. It tells you *how* to study — not just *what* to study.

---

## Features

- **Smart Plan Generation** — AI builds a day-by-day study plan based on your actual deadlines and priorities, with task-type-specific steps (Reading, Video, Practice, Revision)
- **Floating Study Assistant** — Ask questions about your workload, get study tips, or add tasks directly through chat
- **Add Tasks via Chat** — Tell the assistant "add a task: finish OS assignment by Friday" and it handles the rest
- **Live Task Awareness** — The assistant always reads your current task list in real time — deleted tasks are immediately gone from its context
- **Priority-Aware Scheduling** — High priority tasks get scheduled first; overdue tasks appear at the top
- **Deadline Countdown** — Every task shows a live countdown updated every minute
- **Export Plan** — Copy your full study plan to clipboard in one click
- **Persistent Storage** — Tasks survive page refresh via localStorage
- **Stale Plan Detection** — If you add or delete tasks after generating a plan, the app flags it as outdated

---

## Tech Stack

- **Vanilla JavaScript** (ES Modules) — no React, no Vue, no jQuery
- **Vite** — build tool and dev server
- **Groq API** (llama-3.3-70b-versatile) — plan generation and chat assistant
- **localStorage** — task persistence
- **CSS Custom Properties** — theming with the Earthy Rose palette

---

## JavaScript Concepts Used

| Concept | Where |
|---|---|
| Variables & Data Types | Task objects, store.js |
| Control Statements | Priority logic, deadline checks |
| Functions | renderTasks, generatePlan, renderPlan |
| Events & Event Listeners | Form submit, button clicks, keypress |
| Loops (forEach, nested) | Task rendering, plan rendering |
| Arrays & Array Methods | filter, map, reduce, sort |
| Objects | Task shape, store object, day plan objects |
| String Methods | toUpperCase, trim, includes, substring |
| Math Methods | Math.ceil for deadline calculation |
| Number Methods | toFixed for hours display |
| Date Methods | Deadline arithmetic, countdown labels |
| DOM Manipulation | createElement, appendChild, innerHTML |
| Query Selector | getElementById, querySelector |
| DOM Traversal | parentNode, appendChild for Done/Undo |
| Append & Remove | Task cards, completed section |
| Form Events | Task form submit with validation |
| Effects | Staggered fade-in animations |
| alert() | Clear all, export confirmation |
| confirm() | Delete task, clear plan, regenerate |
| prompt() | Name input on first visit, export fallback |
| localStorage | saveToStorage, loadFromStorage |
| ES Modules | import/export across main.js, chat.js, store.js |
| Async/Await + Fetch | Groq API calls for plan and chat |

---

## Project Structure

```
study-planner/
├── index.html
├── src/
│   ├── main.js       # Core app logic, task management, plan generation
│   ├── chat.js       # Floating chat assistant
│   ├── store.js      # Shared state (tasks array, callbacks)
│   └── style.css     # All styles, CSS variables, responsive layout
└── README.md
```

---

## Setup & Run Locally

```bash
# Clone the repo
git clone https://github.com/ankita-mondal28/study-planner.git
cd study-planner

# Install dependencies
npm install

# Create config file with your Groq API key
# Create src/config.js with:
# export const GROQ_API_KEY = "your-key-here";
# Get your key from: https://console.groq.com

# Run dev server
npm run dev
```

---

## Live Demo

[planr-by-ankita.vercel.app](https://planr-by-ankita.vercel.app) 

---

## Screenshots

<img width="1917" height="910" alt="image" src="https://github.com/user-attachments/assets/78faf101-581e-4d1c-8690-037ae23c2aaa" />


---

## Built By

**Ankita Mondal** — BCA Student, Sister Nivedita University  
[LinkedIn](https://linkedin.com/in/ankitamondal-dev) · [GitHub](https://github.com/ankita-mondal28) · ankitamondal2801@gmail.com

---

## License

© 2026 Ankita Mondal. All rights reserved.

This project is source-available for viewing and educational reference only.
Reuse, copying, or redistribution of any part of this code requires explicit
written permission from the author.

Contact: ankitamondal2801@gmail.com
