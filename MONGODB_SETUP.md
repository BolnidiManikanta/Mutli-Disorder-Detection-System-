# 🍃 MongoDB Backend Setup — NeuroScan AI

## Architecture Overview

```
Browser (Firebase Auth)
    │  Google / Email login → get ID token
    │
    ▼
Express API Server (Node.js)
    │  Verifies Firebase ID token
    │  All data operations via MongoDB
    │
    ▼
MongoDB Database
    ├── users          (profiles)
    ├── assessments    (AI results)
    ├── chats          (AI doctor history)
    └── referrals      (doctor referrals)
```

**Firebase is used ONLY for authentication** (Google OAuth + Email/Password).  
**All data** (assessments, chat history, profiles) is stored in **MongoDB**.

---

## Option A — Local MongoDB (Development)

### 1. Install MongoDB
```bash
# macOS
brew tap mongodb/brew && brew install mongodb-community@7.0
brew services start mongodb-community@7.0

# Ubuntu/Debian
sudo apt-get install -y mongodb-org
sudo systemctl start mongod

# Windows — download installer from mongodb.com/try/download/community
```

### 2. Install Node.js dependencies
```bash
cd server/
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env — local defaults work without changes for development
```

### 4. Seed demo data
```bash
node seed.js
```

### 5. Start the server
```bash
npm run dev        # development (auto-restarts on file changes)
# or
npm start          # production
```

Server runs at **http://localhost:3001**  
Health check: http://localhost:3001/api/health

---

## Option B — MongoDB Atlas (Cloud, Free Tier)

### 1. Create Atlas account
1. Go to https://cloud.mongodb.com → Create free account
2. Create a **Free Shared Cluster** (M0)
3. Cluster name: `neuroscan-cluster`

### 2. Get connection string
1. Click **Connect** → **Drivers**
2. Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/
   ```

### 3. Allow IP access
- Atlas → Network Access → Add IP Address → **Allow from anywhere** (0.0.0.0/0) for development

### 4. Update .env
```env
MONGO_URI=mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
DB_NAME=neuroscan
```

---

## Firebase Auth Setup (still required)

1. Go to https://console.firebase.google.com → Create project
2. **Authentication** → Sign-in methods → Enable **Google** + **Email/Password**
3. **Project Settings** → Your apps → Add web app → copy `firebaseConfig`
4. Paste credentials into **`js/mongodb.js`** (top of file, `FIREBASE_CONFIG` object)
5. For production token verification, also add service account to `.env`:
   - Firebase Console → Project Settings → **Service accounts** → Generate new private key
   - Copy JSON content into `FIREBASE_SERVICE_ACCOUNT` in `.env`

---

## Running the Full App

### Terminal 1 — Start MongoDB API server
```bash
cd server/
npm run dev
```

### Terminal 2 — Serve the frontend
Open `index.html` in VS Code → Live Server  
Or: `npx serve . -p 5500`

App opens at http://127.0.0.1:5500

---

## API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |
| POST | `/api/auth/verify` | Verify Firebase token |
| GET | `/api/users/:uid` | Get user profile |
| PUT | `/api/users/:uid` | Create/update user profile |
| POST | `/api/assessments` | Save assessment result |
| GET | `/api/assessments/:uid` | Get user's assessments |
| GET | `/api/assessments/id/:id` | Get single assessment |
| DELETE | `/api/assessments/:id` | Delete assessment |
| POST | `/api/chats` | Save chat message |
| GET | `/api/chats/:uid` | Get chat history |
| DELETE | `/api/chats/:uid` | Clear chat history |
| POST | `/api/referrals` | Create referral |
| GET | `/api/referrals/:uid` | Get referrals |

---

## MongoDB Collections Schema

### `users`
```json
{
  "_id": "ObjectId",
  "uid": "firebase-uid",
  "email": "user@example.com",
  "displayName": "User Name",
  "photoURL": "https://...",
  "role": "user",
  "assessments_count": 4,
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

### `assessments`
```json
{
  "_id": "ObjectId",
  "uid": "firebase-uid",
  "name": "Child Name",
  "age": 7,
  "gender": "male",
  "assessment_type": "multi-disorder",
  "disorder_results": {
    "asd":  { "probability": 0.72, "riskLevel": "High", "confidence": "High" },
    "adhd": { "probability": 0.55, "riskLevel": "Moderate", "confidence": "High" }
  },
  "answers": { "q_eye_contact": 0, "q_attention_span": 1 },
  "risk_level": "High",
  "probability": 72,
  "createdAt": "ISODate"
}
```

### `chats`
```json
{
  "_id": "ObjectId",
  "uid": "firebase-uid",
  "role": "user",
  "text": "Is my child showing signs of autism?",
  "createdAt": "ISODate"
}
```

---

## DEV Mode (no Firebase needed)

If you haven't set up Firebase yet, the server accepts a `X-Dev-UID` header:

```js
// In browser console or test:
fetch('http://localhost:3001/api/assessments/demo-user-001', {
  headers: { 'X-Dev-UID': 'demo-user-001' }
})
```

Run `node seed.js` first to populate demo data for `demo-user-001`.

---

## Medical Disclaimer

NeuroScan AI is an **educational screening tool only**.  
It does **not** provide medical diagnoses.  
Always consult qualified healthcare professionals.
