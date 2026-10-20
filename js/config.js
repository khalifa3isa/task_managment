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
  apiKey: "AIzaSyC4hW40W6sw0KcasFvilNWFtKyUKL5I1pg",   // public web key (safe to commit)
  authDomain: "itdep-b0fc9.firebaseapp.com",
  projectId: "itdep-b0fc9",                             // your Firebase project "IT dep"
  storageBucket: "itdep-b0fc9.firebasestorage.app",
  messagingSenderId: "594484769140",
  appId: "1:594484769140:web:8c9c4f46db76297d87bc21"
};

// Name shown at the top of the wall screen
export const TEAM_NAME = "IT Department";

// Optional 4+ digit PIN asked on the phone before adding/editing.
// Leave "" to disable. (Light protection only — see README.)
export const TEAM_PIN = "";
