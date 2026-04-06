# 🔥 Firebase Setup Guide — NeuroScan AI

## Quick Setup (5 minutes)

### Step 1 — Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click **"Add project"** → Name it `neuroscan-ai`
3. Click **Create project**

---

### Step 2 — Register a Web App
1. In your project, click the **Web icon** `</>`
2. Register app name: `neuroscan-web`
3. Copy the `firebaseConfig` object shown

---

### Step 3 — Paste credentials into the app
Open `js/firebase.js` and replace the placeholder values:

```js
const FIREBASE_CONFIG = {
  apiKey:            "YOUR_ACTUAL_KEY",
  authDomain:        "your-project.firebaseapp.com",
  projectId:         "your-project-id",
  storageBucket:     "your-project.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};
```

---

### Step 4 — Enable Authentication
1. Firebase Console → **Authentication** → **Get started**
2. **Sign-in method** tab → Enable **Google**
3. Enable **Email/Password**
4. **Settings** tab → **Authorized domains** → Add:
   - `localhost`
   - `127.0.0.1`

---

### Step 5 — Create Firestore Database
1. Firebase Console → **Firestore Database** → **Create database**
2. Choose **Start in test mode** (for development)
3. Select a region near you (e.g. `asia-south1` for India)

---

### Step 6 — Run the App
1. Open the `neuroscan-fixed` folder in **VS Code**
2. Install the **Live Server** extension
3. Right-click `index.html` → **Open with Live Server**
4. App opens at `http://127.0.0.1:5500`

---

## Firestore Collections (auto-created on first use)

| Collection | Purpose |
|-----------|---------|
| `users` | User profiles (uid, email, displayName, photoURL) |
| `assessments` | Multi-disorder AI assessment results |
| `chats` | AI doctor chat history |
| `referrals` | Doctor referral records |

---

## ⚠️ Security Rules (before going live)

In Firebase Console → Firestore → Rules, replace test mode rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /assessments/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null;
    }
    match /chats/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null;
    }
  }
}
```

---

## Medical Disclaimer

NeuroScan AI is an **educational screening tool only**.  
It does **not** provide medical diagnoses.  
Always consult qualified healthcare professionals for clinical evaluation.
