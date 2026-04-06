// ================================================================
//  NeuroScan AI — Express + MongoDB Backend Server
//  Replaces Firestore entirely. Firebase Auth still used for tokens.
//
//  Run:   node server.js
//  Port:  3001 (configurable via PORT env)
//
//  Endpoints:
//    POST   /api/auth/verify          Verify Firebase ID token
//    GET    /api/users/:uid           Get user profile
//    PUT    /api/users/:uid           Upsert user profile
//
//    POST   /api/assessments          Save assessment
//    GET    /api/assessments/:uid     Get user assessments (paginated)
//    GET    /api/assessments/id/:id   Get single assessment
//    DELETE /api/assessments/:id      Delete assessment
//
//    POST   /api/chats                Save chat message
//    GET    /api/chats/:uid           Get chat history
//    DELETE /api/chats/:uid           Clear chat history
//
//    GET    /api/health               Health check
// ================================================================

import express     from 'express';
import cors        from 'cors';
import dotenv      from 'dotenv';
import path        from 'path';
import { fileURLToPath } from 'url';
import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb';
import admin       from 'firebase-admin';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 3001;

// ── MIDDLEWARE ────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL || ''
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));

// Serve static files from parent directory (frontend)
app.use(express.static(path.join(__dirname, '..')));

// ── MONGODB CONNECTION ────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME   = process.env.DB_NAME   || 'neuroscan';

let db;

async function connectMongo() {
  const client = new MongoClient(MONGO_URI, {
    serverApi: {
      version:           ServerApiVersion.v1,
      strict:            true,
      deprecationErrors: true,
    }
  });
  await client.connect();
  db = client.db(DB_NAME);
  console.log(`✅ MongoDB connected — database: ${DB_NAME}`);

  // Create indexes
  await db.collection('users').createIndex({ uid: 1 }, { unique: true });
  await db.collection('assessments').createIndex({ uid: 1, createdAt: -1 });
  await db.collection('assessments').createIndex({ createdAt: -1 });
  await db.collection('chats').createIndex({ uid: 1, createdAt: 1 });
  await db.collection('referrals').createIndex({ uid: 1, createdAt: -1 });
  console.log('✅ Indexes ensured');
}

// ── FIREBASE ADMIN INIT ───────────────────────────────────────
// Two modes:
// 1. SERVICE_ACCOUNT_JSON env var = JSON string of service account
// 2. APPLICATION_DEFAULT credentials (for GCP / Cloud Run)
function initFirebaseAdmin() {
  if (admin.apps.length > 0) return;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin initialized with service account');
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
    console.log('✅ Firebase Admin initialized with application default credentials');
  } else {
    // DEV MODE: skip token verification, trust uid from header
    console.warn('⚠️  Firebase Admin not configured — running in DEV mode (no token verification)');
  }
}

// ── AUTH MIDDLEWARE ───────────────────────────────────────────
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  // DEV mode — accept X-Dev-UID header directly (no token)
  if (!process.env.FIREBASE_SERVICE_ACCOUNT && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const devUid = req.headers['x-dev-uid'];
    if (devUid) {
      req.uid = devUid;
      return next();
    }
    return res.status(401).json({ error: 'No auth configured and no X-Dev-UID header' });
  }

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  try {
    const token    = authHeader.split('Bearer ')[1];
    const decoded  = await admin.auth().verifyIdToken(token);
    req.uid        = decoded.uid;
    req.userEmail  = decoded.email;
    req.userName   = decoded.name;
    req.userPhoto  = decoded.picture;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token', details: e.message });
  }
}

// ── HELPERS ───────────────────────────────────────────────────
function toId(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest };
}

function safeObjectId(id) {
  try { return new ObjectId(id); } catch { return null; }
}

// ── HEALTH CHECK ──────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  try {
    await db.command({ ping: 1 });
    res.json({ status: 'ok', db: DB_NAME, timestamp: new Date().toISOString() });
  } catch (e) {
    res.status(503).json({ status: 'error', message: e.message });
  }
});

// ── AUTH VERIFY ───────────────────────────────────────────────
app.post('/api/auth/verify', requireAuth, (req, res) => {
  res.json({ uid: req.uid, email: req.userEmail, name: req.userName });
});

// ── USERS ─────────────────────────────────────────────────────
app.get('/api/users/:uid', requireAuth, async (req, res) => {
  try {
    if (req.uid !== req.params.uid) return res.status(403).json({ error: 'Forbidden' });
    const user = await db.collection('users').findOne({ uid: req.params.uid });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(toId(user));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/users/:uid', requireAuth, async (req, res) => {
  try {
    if (req.uid !== req.params.uid) return res.status(403).json({ error: 'Forbidden' });

    const now = new Date();
    const update = {
      $set: {
        uid:          req.params.uid,
        email:        req.body.email        || req.userEmail  || '',
        displayName:  req.body.displayName  || req.userName   || 'User',
        photoURL:     req.body.photoURL     || req.userPhoto  || '',
        role:         req.body.role         || 'user',
        updatedAt:    now,
      },
      $setOnInsert: { createdAt: now, assessments_count: 0 }
    };

    const result = await db.collection('users').findOneAndUpdate(
      { uid: req.params.uid },
      update,
      { upsert: true, returnDocument: 'after' }
    );
    res.json(toId(result));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── ASSESSMENTS ───────────────────────────────────────────────
app.post('/api/assessments', requireAuth, async (req, res) => {
  try {
    const now = new Date();
    const doc = {
      uid:              req.uid,
      name:             req.body.name             || '',
      age:              req.body.age              || null,
      gender:           req.body.gender           || '',
      ethnicity:        req.body.ethnicity        || '',
      country:          req.body.country          || '',
      family_history:   req.body.family_history   || false,
      jaundice:         req.body.jaundice         || false,
      answers:          req.body.answers          || {},
      disorder_results: req.body.disorder_results || {},
      probability:      req.body.probability      || 0,
      aq10_sum:         req.body.aq10_sum         || 0,
      risk_level:       req.body.risk_level       || '',
      assessment_type:  req.body.assessment_type  || 'multi-disorder',
      createdAt:        now,
    };

    const result = await db.collection('assessments').insertOne(doc);

    // Increment user assessment count
    await db.collection('users').updateOne(
      { uid: req.uid },
      { $inc: { assessments_count: 1 }, $set: { updatedAt: now } }
    );

    res.status(201).json({ id: result.insertedId.toString(), ...doc });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/assessments/:uid', requireAuth, async (req, res) => {
  try {
    if (req.uid !== req.params.uid) return res.status(403).json({ error: 'Forbidden' });

    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip  = parseInt(req.query.skip) || 0;

    const docs = await db.collection('assessments')
      .find({ uid: req.params.uid })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    res.json(docs.map(toId));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/assessments/id/:id', requireAuth, async (req, res) => {
  try {
    const oid = safeObjectId(req.params.id);
    if (!oid) return res.status(400).json({ error: 'Invalid ID format' });

    const doc = await db.collection('assessments').findOne({ _id: oid });
    if (!doc) return res.status(404).json({ error: 'Assessment not found' });
    if (doc.uid !== req.uid) return res.status(403).json({ error: 'Forbidden' });

    res.json(toId(doc));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/assessments/:id', requireAuth, async (req, res) => {
  try {
    const oid = safeObjectId(req.params.id);
    if (!oid) return res.status(400).json({ error: 'Invalid ID format' });

    const doc = await db.collection('assessments').findOne({ _id: oid });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    if (doc.uid !== req.uid) return res.status(403).json({ error: 'Forbidden' });

    await db.collection('assessments').deleteOne({ _id: oid });

    // Decrement counter
    await db.collection('users').updateOne(
      { uid: req.uid },
      { $inc: { assessments_count: -1 } }
    );

    res.json({ deleted: true, id: req.params.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── CHATS ─────────────────────────────────────────────────────
app.post('/api/chats', requireAuth, async (req, res) => {
  try {
    if (!req.body.role || !req.body.text) {
      return res.status(400).json({ error: 'role and text are required' });
    }
    const doc = {
      uid:       req.uid,
      role:      req.body.role,   // 'user' | 'assistant' | 'ai'
      text:      req.body.text,
      createdAt: new Date(),
    };
    const result = await db.collection('chats').insertOne(doc);
    res.status(201).json({ id: result.insertedId.toString(), ...doc });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/chats/:uid', requireAuth, async (req, res) => {
  try {
    if (req.uid !== req.params.uid) return res.status(403).json({ error: 'Forbidden' });

    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const docs  = await db.collection('chats')
      .find({ uid: req.params.uid })
      .sort({ createdAt: 1 })
      .limit(limit)
      .toArray();

    res.json(docs.map(toId));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/chats/:uid', requireAuth, async (req, res) => {
  try {
    if (req.uid !== req.params.uid) return res.status(403).json({ error: 'Forbidden' });
    const result = await db.collection('chats').deleteMany({ uid: req.params.uid });
    res.json({ deleted: result.deletedCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── REFERRALS ─────────────────────────────────────────────────
app.post('/api/referrals', requireAuth, async (req, res) => {
  try {
    const doc = {
      uid:          req.uid,
      assessmentId: req.body.assessmentId || '',
      notes:        req.body.notes        || '',
      status:       'pending',
      createdAt:    new Date(),
    };
    const result = await db.collection('referrals').insertOne(doc);
    res.status(201).json({ id: result.insertedId.toString(), ...doc });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/referrals/:uid', requireAuth, async (req, res) => {
  try {
    if (req.uid !== req.params.uid) return res.status(403).json({ error: 'Forbidden' });
    const docs = await db.collection('referrals')
      .find({ uid: req.params.uid })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
    res.json(docs.map(toId));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── FALLBACK ROUTE ────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ── START ──────────────────────────────────────────────────────
async function start() {
  try {
    await connectMongo();
    initFirebaseAdmin();
    app.listen(PORT, () => {
      console.log(`\n🚀 NeuroScan API running at http://localhost:${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/api/health`);
      console.log(`   DB:     ${MONGO_URI}/${DB_NAME}\n`);
    });
  } catch (e) {
    console.error('❌ Startup failed:', e);
    process.exit(1);
  }
}

start();
