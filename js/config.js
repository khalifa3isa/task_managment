// ============================================================
//  FIREBASE CONFIG
//  -----------------------------------------------------------
//  The phone and the PC need ONE shared place to store tasks.
//  We use Firebase Firestore (free tier is more than enough).
//
//  1. Go to https://console.firebase.google.com → Add project
//  2. Build → Firestore Database → Create database
//  3. Project settings (gear) → Your apps → Web app (</>)
//  4. Copy the "firebaseConfig" values and paste them below.
//
//  While apiKey still says "PASTE_...", the app runs in DEMO MODE:
//  tasks are saved only in this browser (good for trying it out,
//  but the phone and PC will NOT see each other's tasks).
// ============================================================

export const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY",          // e.g. "AIzaSy..."
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:xxxxxxxx"
};

// Name shown at the top of the wall screen
export const TEAM_NAME = "IT Department";

// Optional 4+ digit PIN asked on the phone before adding/editing.
// Leave "" to disable. (Light protection only — see README.)
export const TEAM_PIN = "";
