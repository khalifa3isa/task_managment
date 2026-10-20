// ============================================================
//  DATA STORE
//  -----------------------------------------------------------
//  One small API used by both pages:
//    store.mode              → "firebase" or "demo"
//    store.subscribe(cb)     → cb(tasksArray) on every change (live)
//    store.add(task)         → create a task
//    store.update(id, patch) → change fields of a task
//    store.remove(id)        → delete a task
//
//  If Firebase is configured → real-time sync between devices.
//  Otherwise → "demo" mode using localStorage (this browser only).
// ============================================================

import { firebaseConfig } from "./config.js";

// Firebase is "configured" once the placeholder API key has been replaced
const configured =
  firebaseConfig && firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("PASTE");

// Pinned Firebase version served from Google's CDN (works on GitHub Pages)
const FB = "https://www.gstatic.com/firebasejs/10.12.2";

export async function createStore() {
  return configured ? firebaseStore() : demoStore();
}

// ------------------------------------------------------------
//  FIREBASE (real, shared between phone and PC)
// ------------------------------------------------------------
async function firebaseStore() {
  // Load Firebase modules only when needed (keeps demo mode offline-friendly)
  const { initializeApp } = await import(`${FB}/firebase-app.js`);
  const {
    getFirestore, collection, addDoc, updateDoc, deleteDoc,
    doc, onSnapshot, query, orderBy,
  } = await import(`${FB}/firebase-firestore.js`);

  const app = initializeApp(firebaseConfig);      // connect to your project
  const db = getFirestore(app);                   // open the Firestore database
  const col = collection(db, "tasks");            // all tasks live in "tasks"

  return {
    mode: "firebase",

    subscribe(cb, onError) {
      // Live listener: fires immediately, then again whenever any task changes
      const q = query(col, orderBy("createdAt", "desc"));
      return onSnapshot(
        q,
        snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))), // doc → plain object
        err => onError && onError(err)                               // e.g. rules blocked us
      );
    },

    add: task => addDoc(col, task),                          // Firestore makes the id
    update: (id, patch) => updateDoc(doc(db, "tasks", id), patch),
    remove: id => deleteDoc(doc(db, "tasks", id)),
  };
}

// ------------------------------------------------------------
//  DEMO (localStorage — only this browser, but tabs stay in sync)
// ------------------------------------------------------------
function demoStore() {
  const KEY = "itboard.tasks";                   // localStorage key
  const listeners = new Set();                    // callbacks to notify
  const channel = "BroadcastChannel" in window ? new BroadcastChannel("itboard") : null;

  // Safe read: storage can be blocked (private mode) → just return []
  const read = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
    catch { return []; }
  };

  // Save, then tell this tab's listeners + other open tabs
  const write = tasks => {
    try { localStorage.setItem(KEY, JSON.stringify(tasks)); } catch {}
    emit();
    channel && channel.postMessage("changed");
  };

  // Newest first, same as the Firebase query
  const emit = () => {
    const tasks = read().sort((a, b) => b.createdAt - a.createdAt);
    listeners.forEach(cb => cb(tasks));
  };

  // Another tab changed something → refresh
  channel && (channel.onmessage = emit);
  window.addEventListener("storage", e => e.key === KEY && emit());

  return {
    mode: "demo",

    subscribe(cb) {
      listeners.add(cb);
      cb(read().sort((a, b) => b.createdAt - a.createdAt)); // initial data
      return () => listeners.delete(cb);                    // unsubscribe fn
    },

    async add(task) {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      write([...read(), { id, ...task }]);
    },

    async update(id, patch) {
      write(read().map(t => (t.id === id ? { ...t, ...patch } : t)));
    },

    async remove(id) {
      write(read().filter(t => t.id !== id));
    },
  };
}
