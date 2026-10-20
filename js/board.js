// ============================================================
//  WALL SCREEN LOGIC (board.html)
//  Read-only, always-on display. Updates live, no clicking needed.
// ============================================================

import { icon } from "./icons.js";
import { PRIORITIES, CATEGORIES, STATUSES, byPriority, timeAgo, isToday, esc } from "./shared.js";
import { TEAM_NAME } from "./config.js";
import { createStore } from "./store.js";

const $ = id => document.getElementById(id);
let tasks = [];

// ---------- Static header ----------
$("teamName").textContent = TEAM_NAME;
$("logo").innerHTML = icon("zap", 24);
$("fsBtn").innerHTML = `${icon("maximize", 16)} Full screen`;

// ---------- Clock (updates every second) ----------
function tick() {
  const now = new Date();
  $("time").textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  $("date").textContent = now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" });
}
tick();
setInterval(tick, 1000);

// ---------- Full screen toggle ----------
$("fsBtn").addEventListener("click", () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.();
});

// ---------- Keep the PC screen awake (Chrome/Edge) ----------
// Stops the monitor from sleeping while this tab is visible.
async function keepAwake() {
  try { await navigator.wakeLock?.request("screen"); } catch {}
}
keepAwake();
document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && keepAwake());

// ---------- Connect to data ----------
const store = await createStore();

if (store.mode === "demo") {
  $("banner").innerHTML = `${icon("cloud-off", 18)}<span><b>Demo mode</b> — only tasks added in this same browser show here. Add Firebase keys in <code>js/config.js</code> to show tasks from phones.</span>`;
  $("banner").classList.add("show");
}

store.subscribe(
  list => { tasks = list; setLive(true); render(); },
  err => {
    setLive(false);
    $("banner").className = "banner err show";
    $("banner").innerHTML = `${icon("triangle-alert", 18)}<span>Connection problem: ${esc(err.message)}</span>`;
  }
);

// Live indicator also reacts to the PC losing internet
function setLive(on) {
  $("live").classList.toggle("off", !on);
  $("live").querySelector("span").textContent = on ? "Live" : "Offline";
}
window.addEventListener("offline", () => setLive(false));
window.addEventListener("online", () => setLive(true));

// ---------- Rendering ----------
function card(t) {
  const p = PRIORITIES[t.priority] || PRIORITIES.medium;
  const c = CATEGORIES[t.category] || CATEGORIES.other;
  // Highlight tasks added in the last 2 minutes so people notice them
  const fresh = t.status === "todo" && Date.now() - t.createdAt < 120_000;
  // Show the most useful time for each column
  const when =
    t.status === "done"     ? `done ${timeAgo(t.doneAt)}` :
    t.status === "progress" ? `started ${timeAgo(t.startedAt || t.createdAt)}` :
                              timeAgo(t.createdAt);

  return `
    <article class="wtask ${fresh ? "new" : ""}" data-p="${t.priority}">
      <div class="cat">${icon(c.icon, 24)}</div>
      <div class="body">
        <div class="title">${esc(t.title)}</div>
        <div class="meta">
          <span class="pchip">${icon(p.icon, 12)}${p.label}</span>
          ${t.assignee ? `<span>${icon("user", 14)}${esc(t.assignee)}</span>` : ""}
          ${t.location ? `<span>${icon("map-pin", 14)}${esc(t.location)}</span>` : ""}
          <span>${icon("clock", 14)}${when}</span>
        </div>
      </div>
    </article>`;
}

function fillColumn(headId, bodyId, key, list, emptyText, emptyIcon) {
  const s = STATUSES[key];
  $(headId).innerHTML = `${icon(s.icon, 22)}${s.label}${key === "done" ? " today" : ""}<span class="count">${list.length}</span>`;
  $(bodyId).innerHTML = list.length
    ? list.map(card).join("")
    : `<div class="empty">${icon(emptyIcon, 32)}${emptyText}</div>`;
}

function render() {
  const todo     = tasks.filter(t => t.status === "todo").sort(byPriority);
  const progress = tasks.filter(t => t.status === "progress").sort(byPriority);
  // Done column only shows today's finished work → board resets each morning
  const done     = tasks.filter(t => t.status === "done" && isToday(t.doneAt))
                        .sort((a, b) => b.doneAt - a.doneAt);
  const critical = tasks.filter(t => t.status !== "done" && t.priority === "critical").length;

  // Header counters
  const stat = (label, n, ico, color, alert = false) => `
    <div class="stat ${alert ? "alert" : ""}" style="--c:${color}">
      <div class="si">${icon(ico, 24)}</div>
      <div><b>${n}</b><small>${label}</small></div>
    </div>`;
  $("stats").innerHTML =
    stat("Open", todo.length + progress.length, "list-todo", "var(--accent)") +
    stat("Critical", critical, "flame", "var(--critical)", critical > 0) +
    stat("In progress", progress.length, "loader-circle", "var(--medium)") +
    stat("Done today", done.length, "circle-check", "var(--low)");

  fillColumn("hTodo", "cTodo", "todo", todo, "All clear — nothing waiting", "inbox");
  fillColumn("hProgress", "cProgress", "progress", progress, "Nobody working on anything", "loader-circle");
  fillColumn("hDone", "cDone", "done", done, "Nothing finished yet today", "circle-check");

  // After the DOM updates, check which columns need auto-scrolling
  requestAnimationFrame(() => document.querySelectorAll(".col-body").forEach(setupScroll));
}

// ---------- Auto-scroll long columns ----------
// If a column has more cards than fit on screen, it slowly scrolls
// down, pauses, scrolls back up, pauses… so every card gets seen.
const scrollers = new WeakMap();
function setupScroll(body) {
  const track = body.firstElementChild;
  clearTimeout(scrollers.get(body));                      // stop any previous loop
  track.style.transition = "none";
  track.style.transform = "translateY(0)";

  const overflow = track.scrollHeight - body.clientHeight + 16; // how far we'd need to move
  if (overflow <= 16 || window.innerWidth <= 900) return;      // fits → no scrolling

  const seconds = Math.max(4, overflow / 30);             // ~30px per second, calm speed
  let down = true;
  const step = () => {
    track.style.transition = `transform ${seconds}s linear`;
    track.style.transform = `translateY(${down ? -overflow : 0}px)`;
    down = !down;
    scrollers.set(body, setTimeout(step, seconds * 1000 + 4000)); // + 4s pause at each end
  };
  scrollers.set(body, setTimeout(step, 4000));            // wait 4s before first move
}

// Re-render every 30s so "5m ago" stays fresh and "Done today" resets at midnight
setInterval(render, 30_000);
window.addEventListener("resize", () => render());
