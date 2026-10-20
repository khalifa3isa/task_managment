// ============================================================
//  PHONE PAGE LOGIC (index.html)
//  Add tasks, pick priority/category, move tasks along, delete.
// ============================================================

import { icon } from "./icons.js";
import { PRIORITIES, CATEGORIES, byPriority, timeAgo, esc } from "./shared.js";
import { TEAM_NAME, TEAM_PIN } from "./config.js";
import { createStore } from "./store.js";

// Short helper to grab an element by id
const $ = id => document.getElementById(id);

// Current form selections (sensible defaults)
let selPriority = "medium";
let selCategory = "hardware";
let filter = "open";          // which tab is showing: "open" or "done"
let tasks = [];               // latest task list from the store

// ---------- Static UI: icons + labels ----------
$("teamName").textContent = TEAM_NAME;
$("logo").innerHTML = icon("zap", 22);
$("boardLink").innerHTML = `${icon("tv", 16)} Wall screen`;
$("submit").innerHTML = `${icon("plus", 20)} Add task`;
$("assigneeWrap").insertAdjacentHTML("afterbegin", icon("user", 18));
$("locationWrap").insertAdjacentHTML("afterbegin", icon("map-pin", 18));

// ---------- Priority buttons ----------
function renderPriorities() {
  $("prioGrid").innerHTML = Object.entries(PRIORITIES).map(([key, p]) => `
    <button type="button" class="prio-btn ${key === selPriority ? "on" : ""}" data-p="${key}">
      <span class="dot">${icon(p.icon, 18)}</span>${p.label}
    </button>`).join("");
}
$("prioGrid").addEventListener("click", e => {
  const btn = e.target.closest(".prio-btn");   // which button was tapped (if any)
  if (!btn) return;
  selPriority = btn.dataset.p;                 // remember the choice
  navigator.vibrate?.(8);                      // tiny haptic tick on Android
  renderPriorities();                          // redraw to show the selection
});

// ---------- Category buttons ----------
function renderCategories() {
  $("catGrid").innerHTML = Object.entries(CATEGORIES).map(([key, c]) => `
    <button type="button" class="cat-btn ${key === selCategory ? "on" : ""}" data-c="${key}">
      ${icon(c.icon, 20)}${c.label}
    </button>`).join("");
}
$("catGrid").addEventListener("click", e => {
  const btn = e.target.closest(".cat-btn");
  if (!btn) return;
  selCategory = btn.dataset.c;
  navigator.vibrate?.(8);
  renderCategories();
});

renderPriorities();
renderCategories();

// ---------- Toast ----------
let toastTimer;
function toast(msg, ico = "check") {
  const t = $("toast");
  t.innerHTML = `${icon(ico, 18)} ${esc(msg)}`;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
}

// ---------- Optional PIN lock ----------
// The PIN is remembered on this phone so you only type it once.
if (TEAM_PIN) {
  let ok = false;
  try { ok = localStorage.getItem("itboard.pin") === TEAM_PIN; } catch {}
  if (!ok) $("lock").classList.add("show");
  $("pinForm").addEventListener("submit", e => {
    e.preventDefault();
    if ($("pin").value === TEAM_PIN) {
      try { localStorage.setItem("itboard.pin", TEAM_PIN); } catch {}
      $("lock").classList.remove("show");
    } else {
      $("pin").value = "";
      $("pin").placeholder = "Wrong PIN";
    }
  });
}

// ---------- Connect to the data store ----------
const store = await createStore();

if (store.mode === "demo") {
  $("banner").innerHTML = `${icon("cloud-off", 18)}<span><b>Demo mode</b> — tasks are saved on this device only. Add your Firebase keys in <code>js/config.js</code> to sync phone ↔ PC.</span>`;
  $("banner").classList.add("show");
}

// Live updates: redraw the list every time data changes
store.subscribe(
  list => { tasks = list; renderList(); fillPeople(); },
  err => {
    $("banner").className = "banner err show";
    $("banner").innerHTML = `${icon("triangle-alert", 18)}<span>Can't reach the database: ${esc(err.message)}</span>`;
  }
);

// ---------- Add a task ----------
$("form").addEventListener("submit", async e => {
  e.preventDefault();                              // stop the page reloading
  const title = $("title").value.trim();
  if (!title) return $("title").focus();           // title is the only required field

  $("submit").disabled = true;                     // prevent double-taps
  try {
    await store.add({
      title,
      priority: selPriority,
      category: selCategory,
      assignee: $("assignee").value.trim(),
      location: $("location").value.trim(),
      notes: $("notes").value.trim(),
      status: "todo",                              // every new task starts in To Do
      createdAt: Date.now(),
      startedAt: null,
      doneAt: null,
    });
    // Clear text fields but keep priority/category (often the same next time)
    $("title").value = $("notes").value = $("location").value = "";
    navigator.vibrate?.([10, 40, 10]);
    toast("Task added");
    filter = "open"; setTabs(); renderList();
  } catch (err) {
    toast("Couldn't save: " + err.message, "triangle-alert");
  } finally {
    $("submit").disabled = false;
  }
});

// ---------- Suggest names already used (datalist autocomplete) ----------
function fillPeople() {
  const names = [...new Set(tasks.map(t => t.assignee).filter(Boolean))];
  $("peopleList").innerHTML = names.map(n => `<option value="${esc(n)}">`).join("");
}

// ---------- Tabs: Open / Done ----------
function setTabs() {
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("on", t.dataset.f === filter));
}
$("tabs").addEventListener("click", e => {
  const tab = e.target.closest(".tab");
  if (!tab) return;
  filter = tab.dataset.f;
  setTabs();
  renderList();
});

// ---------- Task list ----------
function renderList() {
  const open = tasks.filter(t => t.status !== "done").sort(byPriority);
  const done = tasks.filter(t => t.status === "done")
                    .sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0)) // newest done first
                    .slice(0, 30);                                    // keep it short
  $("nOpen").textContent = open.length;
  $("nDone").textContent = done.length;

  const show = filter === "open" ? open : done;

  if (!show.length) {
    $("list").innerHTML = `<div class="empty">${icon(filter === "open" ? "inbox" : "circle-check", 36)}
      ${filter === "open" ? "No open tasks. Nice!" : "Nothing finished yet."}</div>`;
    return;
  }

  $("list").innerHTML = show.map(t => {
    const p = PRIORITIES[t.priority] || PRIORITIES.medium;
    const c = CATEGORIES[t.category] || CATEGORIES.other;

    // Buttons depend on where the task is in the workflow
    let btns = "";
    if (t.status === "todo")     btns += `<button class="act go" data-a="start">${icon("play", 15)} Start</button>`;
    if (t.status !== "done")     btns += `<button class="act done" data-a="done">${icon("check", 15)} Done</button>`;
    if (t.status === "done")     btns += `<button class="act" data-a="reopen">${icon("rotate-ccw", 15)} Reopen</button>`;
    btns += `<button class="act del" data-a="del" aria-label="Delete">${icon("trash-2", 15)}</button>`;

    return `
      <article class="mtask ${t.status === "done" ? "is-done" : ""}" data-p="${t.priority}" data-id="${t.id}">
        <div class="cat">${icon(c.icon, 20)}</div>
        <div class="body">
          <div class="title">${esc(t.title)}</div>
          <div class="meta">
            <span class="pchip">${icon(p.icon, 12)}${p.label}</span>
            ${t.status === "progress" ? `<span style="color:var(--medium)">${icon("loader-circle", 13)} In progress</span>` : ""}
            ${t.assignee ? `<span>${icon("user", 13)}${esc(t.assignee)}</span>` : ""}
            ${t.location ? `<span>${icon("map-pin", 13)}${esc(t.location)}</span>` : ""}
            <span>${icon("clock", 13)}${timeAgo(t.createdAt)}</span>
          </div>
          ${t.notes ? `<div class="meta" style="margin-top:6px">${esc(t.notes)}</div>` : ""}
          <div class="actions">${btns}</div>
        </div>
      </article>`;
  }).join("");
}

// One click handler for every action button in the list
$("list").addEventListener("click", async e => {
  const btn = e.target.closest(".act");
  if (!btn) return;
  const id = btn.closest(".mtask").dataset.id;     // which task
  const a = btn.dataset.a;                         // which action

  if (a === "start")  await store.update(id, { status: "progress", startedAt: Date.now() });
  if (a === "done")  { await store.update(id, { status: "done", doneAt: Date.now() }); toast("Marked done", "circle-check"); }
  if (a === "reopen") await store.update(id, { status: "todo", doneAt: null });
  if (a === "del" && confirm("Delete this task?")) await store.remove(id);
});

// Refresh "5m ago" labels every minute
setInterval(renderList, 60_000);
