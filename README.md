# IT Task Board

Add tasks from your phone, see them live on a wall screen.

| Page | Use it on | What it does |
|---|---|---|
| `index.html` | Phone | Add a task, pick priority + category, Start / Done / Delete |
| `board.html` | PC / TV | Full-screen live board: To Do · In Progress · Done today |

Features: 4 priority levels (Critical pulses red on the wall), 8 IT categories with icons, assignee + location, live clock, counters, auto-scroll for long columns, screen stays awake, "Done today" clears itself every midnight. No build step — plain HTML/CSS/JS.

---

## 1. Put it on GitHub Pages

1. Create a new repo, upload all files in this folder.
2. Repo → **Settings → Pages** → Source: *Deploy from a branch* → `main` / root → Save.
3. After ~1 minute you get a link like `https://YOURNAME.github.io/it-task-board/`.
   - Phone: open that link → browser menu → **Add to Home Screen**.
   - PC: open `.../board.html` → move the mouse → **Full screen**.

At this point it runs in **Demo mode** (tasks stay on one device). Do step 2 so phone and PC share tasks.

## 2. Connect Firebase (free, ~5 minutes)

GitHub Pages only hosts files — it can't store data, so we use Firebase Firestore.

1. https://console.firebase.google.com → **Add project** (Analytics: off).
2. **Build → Firestore Database → Create database** → pick a region (e.g. `me-central2` Doha / `europe-west`) → *Start in production mode*.
3. **Rules** tab → paste the contents of `firestore.rules` → **Publish**.
4. **Project settings (gear) → Your apps → `</>` Web** → register → copy the `firebaseConfig` values.
5. Paste them into `js/config.js`, commit, done. The orange "Demo mode" bar disappears.

## 3. Customize

All in `js/config.js` and `js/shared.js`:

- `TEAM_NAME` — title on both screens.
- `TEAM_PIN` — optional PIN asked once per phone.
- `CATEGORIES` / `PRIORITIES` in `shared.js` — rename, add or remove. Icon names come from `js/icons.js`.

## Security — read this

The Firebase web config is **not secret** (it's visible in any website's code). With the included rules, **anyone who has your link can add or delete tasks**. Fine for an internal board with an unshared link; not fine for sensitive info.

- Don't put passwords, IPs or personal data in tasks.
- `TEAM_PIN` only stops casual use — it's in the page source.
- For real protection: enable **Firebase Authentication** (e.g. Google sign-in limited to your work domain) and change the rules to `allow read, write: if request.auth != null && request.auth.token.email.matches('.*@yourcompany[.]com');`

## Files

```
index.html        phone page
board.html        wall screen
css/style.css     all styling
js/config.js      ← your Firebase keys + team name + PIN
js/shared.js      priorities, categories, helpers
js/store.js       Firebase / demo data layer
js/add.js         phone logic
js/board.js       wall-screen logic
js/icons.js       icons (from Lucide, ISC license)
firestore.rules   database rules to paste into Firebase
```
