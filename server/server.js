// ================================================================
//  NeuroScan AI — Express Backend Server
//  Supports MongoDB with seamless in-memory fallback for local dev & demo.
//  Firebase Auth still supported for client authentication.
//
//  Run:   node server.js
//  Port:  3000 (configurable via PORT env)
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
//    POST   /api/referrals            Create referral
//    GET    /api/referrals/:uid       Get referrals
//
//    GET    /api/health               Health check
// ================================================================

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import fs from 'fs';
import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb';
import admin from 'firebase-admin';
import { GoogleGenAI } from '@google/genai';
import { createLearningRouter } from './routes/learning.js';

dotenv.config();

let genAIClient = null;
function getGenAI() {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      genAIClient = new GoogleGenAI({ apiKey });
    }
  }
  return genAIClient;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Hardcoded to 3000 as required by the runtime environment reverse proxy
const PORT = 3000;

// ── MIDDLEWARE ────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json({ limit: '5mb' }));

// Serve static files from parent directory (frontend)
app.use(express.static(path.join(__dirname, '..')));

// ── DATABASE LAYER (MongoDB + In-Memory Fallback) ─────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME   = process.env.DB_NAME   || 'neuroscan';

let mongoDbInstance = null;
let isUsingFallbackStore = false;

// In-Memory Data Store (Active when external MongoDB is not available)
const memoryStore = {
  users: new Map(),
  assessments: [],
  chats: [],
  referrals: []
};

// Seed in-memory store with sample initial assessment for quick visual testing
function seedInitialMemoryData() {
  const sampleUid = 'demo-user-001';
  memoryStore.users.set(sampleUid, {
    id: 'user_001',
    uid: sampleUid,
    email: 'demo@neuroscan.ai',
    displayName: 'Alex Mercer',
    photoURL: '',
    role: 'user',
    assessments_count: 2,
    createdAt: new Date(Date.now() - 86400000 * 7),
    updatedAt: new Date()
  });

  memoryStore.assessments.push({
    id: 'asm_sample_01',
    uid: sampleUid,
    name: 'Alex Mercer',
    age: 14,
    gender: 'm',
    ethnicity: 'White-European',
    country: 'United States',
    family_history: true,
    jaundice: false,
    disorder_results: {
      ASD: { score: 72, risk: 'High', prob: '72%' },
      ADHD: { score: 65, risk: 'Moderate', prob: '65%' },
      SPD: { score: 58, risk: 'Moderate', prob: '58%' },
      Dyslexia: { score: 28, risk: 'Low', prob: '28%' },
      Social_Anxiety: { score: 44, risk: 'Moderate', prob: '44%' },
      Speech_Delay: { score: 18, risk: 'Low', prob: '18%' },
      Intellectual: { score: 12, risk: 'Low', prob: '12%' }
    },
    probability: 72,
    aq10_sum: 7,
    risk_level: 'High',
    assessment_type: 'multi-disorder',
    createdAt: new Date(Date.now() - 86400000 * 5)
  });

  memoryStore.assessments.push({
    id: 'asm_sample_02',
    uid: sampleUid,
    name: 'Alex Mercer',
    age: 14,
    gender: 'm',
    ethnicity: 'White-European',
    country: 'United States',
    family_history: true,
    jaundice: false,
    disorder_results: {
      ASD: { score: 64, risk: 'Moderate', prob: '64%' },
      ADHD: { score: 52, risk: 'Moderate', prob: '52%' },
      SPD: { score: 48, risk: 'Moderate', prob: '48%' },
      Dyslexia: { score: 24, risk: 'Low', prob: '24%' },
      Social_Anxiety: { score: 38, risk: 'Low', prob: '38%' },
      Speech_Delay: { score: 15, risk: 'Low', prob: '15%' },
      Intellectual: { score: 10, risk: 'Low', prob: '10%' }
    },
    probability: 64,
    aq10_sum: 6,
    risk_level: 'Moderate',
    assessment_type: 'multi-disorder',
    createdAt: new Date()
  });
}

seedInitialMemoryData();

async function connectMongo() {
  try {
    const client = new MongoClient(MONGO_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      connectTimeoutMS: 2000,
      serverSelectionTimeoutMS: 2000
    });
    await client.connect();
    mongoDbInstance = client.db(DB_NAME);
    console.log(`✅ MongoDB connected — database: ${DB_NAME}`);

    // Create indexes safely
    await mongoDbInstance.collection('users').createIndex({ uid: 1 }, { unique: true }).catch(() => {});
    await mongoDbInstance.collection('assessments').createIndex({ uid: 1, createdAt: -1 }).catch(() => {});
    await mongoDbInstance.collection('assessments').createIndex({ createdAt: -1 }).catch(() => {});
    await mongoDbInstance.collection('chats').createIndex({ uid: 1, createdAt: 1 }).catch(() => {});
    await mongoDbInstance.collection('referrals').createIndex({ uid: 1, createdAt: -1 }).catch(() => {});
    console.log('✅ Indexes ensured');
  } catch (err) {
    isUsingFallbackStore = true;
    console.warn(`ℹ️ MongoDB connection not available (${err.message}). Seamlessly operating in-memory data store.`);
  }
}

// ── FIREBASE ADMIN INIT ───────────────────────────────────────
function initFirebaseAdmin() {
  if (admin.apps.length > 0) return;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('✅ Firebase Admin initialized with service account');
    } catch (e) {
      console.warn('⚠️ Could not parse FIREBASE_SERVICE_ACCOUNT JSON:', e.message);
    }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
      console.log('✅ Firebase Admin initialized with application default credentials');
    } catch (e) {
      console.warn('⚠️ Could not init Firebase Admin with application default:', e.message);
    }
  } else {
    console.log('ℹ️ Firebase Admin service credentials not provided — running in dev/demo auth mode.');
  }
}

// ── AUTH MIDDLEWARE ───────────────────────────────────────────
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const devUidHeader = req.headers['x-dev-uid'] || req.headers['x-user-id'];

  if (devUidHeader) {
    req.uid = devUidHeader;
    req.userEmail = req.headers['x-dev-email'] || `${devUidHeader}@neuroscan.ai`;
    req.userName = req.headers['x-dev-name'] || 'User';
    return next();
  }

  // If Firebase Admin is not configured with service account, decode token if present or allow guest dev mode
  if (admin.apps.length === 0) {
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          req.uid = payload.user_id || payload.sub || payload.uid || 'dev-user';
          req.userEmail = payload.email || 'user@neuroscan.ai';
          req.userName = payload.name || 'User';
          req.userPhoto = payload.picture || '';
          return next();
        }
      } catch {
        // Continue to fallback
      }
    }
    // Demo / Dev fallback
    req.uid = 'demo-user-001';
    req.userEmail = 'demo@neuroscan.ai';
    req.userName = 'Demo User';
    return next();
  }

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  try {
    const token = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    req.uid = decoded.uid;
    req.userEmail = decoded.email;
    req.userName = decoded.name;
    req.userPhoto = decoded.picture;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token', details: e.message });
  }
}

// ── HELPERS ───────────────────────────────────────────────────
function toId(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { id: (_id ? _id.toString() : doc.id) || `id_${Date.now()}`, ...rest };
}

function safeObjectId(id) {
  try { return new ObjectId(id); } catch { return null; }
}

// ── HEALTH CHECK ──────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  if (mongoDbInstance && !isUsingFallbackStore) {
    try {
      await mongoDbInstance.command({ ping: 1 });
      return res.json({ status: 'ok', db: 'mongodb', dbName: DB_NAME, timestamp: new Date().toISOString() });
    } catch (e) {
      return res.json({ status: 'ok', db: 'memory-fallback', message: e.message, timestamp: new Date().toISOString() });
    }
  }
  res.json({ status: 'ok', db: 'in-memory', timestamp: new Date().toISOString() });
});

// ── AUTH VERIFY ───────────────────────────────────────────────
app.post('/api/auth/verify', requireAuth, (req, res) => {
  res.json({ uid: req.uid, email: req.userEmail, name: req.userName });
});

// ── USERS ─────────────────────────────────────────────────────
app.get('/api/users/:uid', requireAuth, async (req, res) => {
  try {
    const targetUid = req.params.uid;
    if (mongoDbInstance && !isUsingFallbackStore) {
      const user = await mongoDbInstance.collection('users').findOne({ uid: targetUid });
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json(toId(user));
    }

    const memoryUser = memoryStore.users.get(targetUid);
    if (!memoryUser) return res.status(404).json({ error: 'User not found' });
    res.json(memoryUser);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/users/:uid', requireAuth, async (req, res) => {
  try {
    const targetUid = req.params.uid;
    const now = new Date();

    if (mongoDbInstance && !isUsingFallbackStore) {
      const update = {
        $set: {
          uid: targetUid,
          email: req.body.email || req.userEmail || '',
          displayName: req.body.displayName || req.userName || 'User',
          photoURL: req.body.photoURL || req.userPhoto || '',
          role: req.body.role || 'user',
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now, assessments_count: 0 }
      };

      const result = await mongoDbInstance.collection('users').findOneAndUpdate(
        { uid: targetUid },
        update,
        { upsert: true, returnDocument: 'after' }
      );
      return res.json(toId(result));
    }

    const existing = memoryStore.users.get(targetUid) || {
      id: `usr_${Date.now()}`,
      uid: targetUid,
      createdAt: now,
      assessments_count: 0
    };

    const updated = {
      ...existing,
      email: req.body.email || req.userEmail || existing.email || '',
      displayName: req.body.displayName || req.userName || existing.displayName || 'User',
      photoURL: req.body.photoURL || req.userPhoto || existing.photoURL || '',
      role: req.body.role || existing.role || 'user',
      updatedAt: now,
    };

    memoryStore.users.set(targetUid, updated);
    res.json(updated);
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

    if (mongoDbInstance && !isUsingFallbackStore) {
      const result = await mongoDbInstance.collection('assessments').insertOne(doc);
      await mongoDbInstance.collection('users').updateOne(
        { uid: req.uid },
        { $inc: { assessments_count: 1 }, $set: { updatedAt: now } }
      ).catch(() => {});
      return res.status(201).json({ id: result.insertedId.toString(), ...doc });
    }

    const id = `asm_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const savedDoc = { id, ...doc };
    memoryStore.assessments.unshift(savedDoc);

    const user = memoryStore.users.get(req.uid);
    if (user) {
      user.assessments_count = (user.assessments_count || 0) + 1;
      user.updatedAt = now;
    }

    res.status(201).json(savedDoc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/assessments/:uid', requireAuth, async (req, res) => {
  try {
    const targetUid = req.params.uid;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip  = parseInt(req.query.skip) || 0;

    if (mongoDbInstance && !isUsingFallbackStore) {
      const docs = await mongoDbInstance.collection('assessments')
        .find({ uid: targetUid })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
      return res.json(docs.map(toId));
    }

    const filtered = memoryStore.assessments
      .filter(a => a.uid === targetUid)
      .slice(skip, skip + limit);

    res.json(filtered);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/assessments/id/:id', requireAuth, async (req, res) => {
  try {
    const id = req.params.id;

    if (mongoDbInstance && !isUsingFallbackStore) {
      const oid = safeObjectId(id);
      const query = oid ? { _id: oid } : { id };
      const doc = await mongoDbInstance.collection('assessments').findOne(query);
      if (!doc) return res.status(404).json({ error: 'Assessment not found' });
      return res.json(toId(doc));
    }

    const doc = memoryStore.assessments.find(a => a.id === id);
    if (!doc) return res.status(404).json({ error: 'Assessment not found' });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/assessments/:id', requireAuth, async (req, res) => {
  try {
    const id = req.params.id;

    if (mongoDbInstance && !isUsingFallbackStore) {
      const oid = safeObjectId(id);
      const query = oid ? { _id: oid } : { id };
      await mongoDbInstance.collection('assessments').deleteOne(query);
      await mongoDbInstance.collection('users').updateOne(
        { uid: req.uid },
        { $inc: { assessments_count: -1 } }
      ).catch(() => {});
      return res.json({ deleted: true, id });
    }

    const idx = memoryStore.assessments.findIndex(a => a.id === id);
    if (idx !== -1) {
      memoryStore.assessments.splice(idx, 1);
      const user = memoryStore.users.get(req.uid);
      if (user && user.assessments_count > 0) user.assessments_count--;
    }
    res.json({ deleted: true, id });
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
      role:      req.body.role,
      text:      req.body.text,
      createdAt: new Date(),
    };

    if (mongoDbInstance && !isUsingFallbackStore) {
      const result = await mongoDbInstance.collection('chats').insertOne(doc);
      return res.status(201).json({ id: result.insertedId.toString(), ...doc });
    }

    const id = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const saved = { id, ...doc };
    memoryStore.chats.push(saved);
    res.status(201).json(saved);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/chats/:uid', requireAuth, async (req, res) => {
  try {
    const targetUid = req.params.uid;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);

    if (mongoDbInstance && !isUsingFallbackStore) {
      const docs = await mongoDbInstance.collection('chats')
        .find({ uid: targetUid })
        .sort({ createdAt: 1 })
        .limit(limit)
        .toArray();
      return res.json(docs.map(toId));
    }

    const filtered = memoryStore.chats
      .filter(c => c.uid === targetUid)
      .slice(-limit);

    res.json(filtered);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/chats/:uid', requireAuth, async (req, res) => {
  try {
    const targetUid = req.params.uid;

    if (mongoDbInstance && !isUsingFallbackStore) {
      const result = await mongoDbInstance.collection('chats').deleteMany({ uid: targetUid });
      return res.json({ deleted: result.deletedCount });
    }

    const before = memoryStore.chats.length;
    memoryStore.chats = memoryStore.chats.filter(c => c.uid !== targetUid);
    res.json({ deleted: before - memoryStore.chats.length });
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

    if (mongoDbInstance && !isUsingFallbackStore) {
      const result = await mongoDbInstance.collection('referrals').insertOne(doc);
      return res.status(201).json({ id: result.insertedId.toString(), ...doc });
    }

    const id = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const saved = { id, ...doc };
    memoryStore.referrals.push(saved);
    res.status(201).json(saved);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/referrals/:uid', requireAuth, async (req, res) => {
  try {
    const targetUid = req.params.uid;

    if (mongoDbInstance && !isUsingFallbackStore) {
      const docs = await mongoDbInstance.collection('referrals')
        .find({ uid: targetUid })
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray();
      return res.json(docs.map(toId));
    }

    const filtered = memoryStore.referrals.filter(r => r.uid === targetUid);
    res.json(filtered);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── REAL ML ENGINE ROUTES ─────────────────────────────────────
function runPythonScript(relativeScriptPath, payload = {}) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(__dirname, '..', relativeScriptPath);
    const py = spawn('python3', [scriptPath]);

    let stdout = '';
    let stderr = '';

    py.stdin.write(JSON.stringify(payload));
    py.stdin.end();

    py.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    py.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    py.on('close', (code) => {
      let jsonStr = stdout.trim();
      const firstBrace = jsonStr.indexOf('{');
      const lastBrace = jsonStr.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
      }

      if (code !== 0 && !jsonStr.startsWith('{')) {
        console.error(`Python script ${relativeScriptPath} failed (code ${code}):`, stderr);
        return reject(new Error(`ML Process error (code ${code}): ${stderr.slice(0, 300)}`));
      }
      try {
        const parsed = JSON.parse(jsonStr);
        resolve(parsed);
      } catch (err) {
        console.error('Failed to parse Python ML output:', stdout);
        reject(new Error(`Failed to parse ML output: ${err.message}`));
      }
    });

    py.on('error', (err) => {
      reject(err);
    });
  });
}

// POST /api/ml/predict — Real ASD ML prediction (Logistic Regression, Random Forest, Gradient Boosting / XGBoost)
app.post('/api/ml/predict', async (req, res) => {
  try {
    const input = req.body || {};
    const result = await runPythonScript('ml/inference/predictor.py', input);
    res.json(result);
  } catch (e) {
    console.error('ML Prediction endpoint error:', e.message);
    res.status(500).json({ error: 'ML Inference Error', details: e.message });
  }
});

// POST /api/ml/assess — Real Multi-Disorder ML assessment (7 disorders + SHAP + recommendations)
app.post('/api/ml/assess', async (req, res) => {
  try {
    const payload = {
      answers: req.body.answers || {},
      demographics: req.body.demographics || {}
    };
    const result = await runPythonScript('ml/inference/multi_predictor.py', payload);
    res.json(result);
  } catch (e) {
    console.error('Multi-disorder ML assessment endpoint error:', e.message);
    res.status(500).json({ error: 'Multi-Disorder ML Assessment Error', details: e.message });
  }
});

// GET /api/ml/metrics — Model performance & cross-validation metrics
app.get('/api/ml/metrics', async (_req, res) => {
  try {
    const asdMetricsPath = path.resolve(__dirname, '../ml/artifacts/metrics.json');
    const multiMetricsPath = path.resolve(__dirname, '../ml/artifacts/multi_disorder_metrics.json');

    let asdMetrics = null;
    let multiMetrics = null;

    if (fs.existsSync(asdMetricsPath)) {
      asdMetrics = JSON.parse(fs.readFileSync(asdMetricsPath, 'utf-8'));
    }
    if (fs.existsSync(multiMetricsPath)) {
      multiMetrics = JSON.parse(fs.readFileSync(multiMetricsPath, 'utf-8'));
    }

    res.json({
      status: 'HEALTHY',
      backend: 'Python Scikit-Learn / XGBoost Suite',
      asd_model: asdMetrics,
      multi_disorder_models: multiMetrics,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to retrieve ML metrics', details: e.message });
  }
});

// POST /api/ml/retrain — Retrain models on dataset (Admin / Pipeline only)
app.post('/api/ml/retrain', async (req, res) => {
  const adminKey = req.headers['x-admin-key'] || req.headers['authorization'];
  // Allow execution only in development or with valid admin key
  if (process.env.NODE_ENV === 'production' && (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY)) {
    return res.status(403).json({ error: 'Unauthorized: Retraining is restricted to offline automated pipelines and authenticated administrators.' });
  }

  try {
    const asdResult = await runPythonScript('ml/training/train_asd_models.py', {});
    const multiResult = await runPythonScript('ml/training/train_multi_disorder.py', {});
    res.json({
      status: 'RETRAIN_SUCCESS',
      asd_result: asdResult,
      multi_result: multiResult,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    res.status(500).json({ error: 'ML Retraining Failed', details: e.message });
  }
});

// ── AI ASSISTANT & DOCTOR CHAT API (GEMINI INTEGRATION) ────────
app.post('/api/doctor-chat', async (req, res) => {
  try {
    const { messages = [], language = 'en' } = req.body;
    const ai = getGenAI();
    const systemPrompt = `You are Dr. NeuroScan AI, an empathetic and highly knowledgeable pediatric neurodevelopment specialist AI assistant. You specialize in:
- Autism Spectrum Disorder (ASD) — diagnosis, symptoms, early signs, therapies
- ADHD — attention, hyperactivity, impulsivity, management
- Dyslexia and learning disabilities — reading, writing, phonological processing
- Social Anxiety Disorder — social fears, avoidance, CBT approaches
- Speech and Language Delay — developmental milestones, SLP therapy
- Intellectual Disability — cognitive development, IEP, adaptive skills
- Sensory Processing Disorder (SPD) — sensory integration, OT therapy

Your communication style:
- Warm, empathetic, and non-judgmental — especially with worried parents
- Clear and accessible language (avoid excessive medical jargon)
- Evidence-based: cite recognized therapies and research (AAP, CDC, NICE, DSM-5)
- Always acknowledge emotions before providing information
- Structure responses with bullet points when listing symptoms or options
- Always end responses involving clinical concern with a reminder to consult professionals
${language === 'ta' ? 'IMPORTANT: Respond in Tamil (தமிழ்) language.' : language === 'hi' ? 'IMPORTANT: Respond in Hindi (हिंदी) language.' : ''}

Format your responses naturally using markdown with bold for key terms.
Always include at the end: "⚠️ This is educational information only — please consult a qualified healthcare professional for formal diagnosis."`;

    if (ai) {
      try {
        const contents = messages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: String(m.content || m.text || '') }]
        }));

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: contents.length ? contents : [{ role: 'user', parts: [{ text: 'Hello doctor' }] }],
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        });

        const reply = response.text || 'I am Dr. NeuroScan AI. How can I assist you with neurodevelopmental evaluations today?';
        return res.json({ reply, role: 'assistant' });
      } catch (geminiError) {
        console.warn('Gemini API call failed, using clinical fallback:', geminiError.message);
      }
    }

    // High quality clinical rule-based response fallback if AI key or quota unavailable
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content?.toLowerCase() || '';
    let fallbackText = "Dr. NeuroScan AI specializes in pediatric neurodevelopmental screenings including Autism Spectrum Disorder (ASD), ADHD, Dyslexia, Speech Delays, and Sensory Processing Disorder. For personalized recommendations, please complete our Clinical Assessment module or consult a pediatric neurologist.\n\n⚠️ This is educational information only — please consult a qualified healthcare professional for formal diagnosis.";

    if (lastUserMsg.includes('asd') || lastUserMsg.includes('autism')) {
      fallbackText = "**Autism Spectrum Disorder (ASD)** is a neurodevelopmental condition characterized by variations in social communication, reciprocal interaction, and restricted or repetitive patterns of behavior.\n\n**Common Early Indicators:**\n• Reduced response to name by 12 months\n• Infrequent shared eye contact or pointing to show interest\n• Repetitive motor movements (flapping, spinning, rocking)\n• Strong preference for structured routines\n\n**Recommended Evidence-Based Steps:**\n• Standardized screening (e.g. M-CHAT-R, AQ-10, ADOS-2)\n• Developmental pediatric or child psychology evaluation\n• Early intervention therapies (Speech, Occupational, ESDM/ABA)\n\n⚠️ This is educational information only — please consult a qualified healthcare professional for formal diagnosis.";
    } else if (lastUserMsg.includes('adhd') || lastUserMsg.includes('attention') || lastUserMsg.includes('hyper')) {
      fallbackText = "**Attention-Deficit / Hyperactivity Disorder (ADHD)** involves persistent patterns of inattention, hyperactivity, and/or impulsivity that interfere with functioning or development.\n\n**Key Domains:**\n• Inattention: Difficulty sustaining focus, organizing tasks, following instructions\n• Hyperactivity: Constant physical motion, fidgeting, restlessness\n• Impulsivity: Interrupting others, difficulty waiting turns\n\n**Recommended Next Steps:**\n• Comprehensive psychoeducational evaluation\n• Executive function support and behavioral interventions\n• Structured school accommodations (IEP / 504 plan)\n\n⚠️ This is educational information only — please consult a qualified healthcare professional for formal diagnosis.";
    }

    res.json({ reply: fallbackText, role: 'assistant' });
  } catch (err) {
    console.error('Doctor chat route error:', err);
    res.status(500).json({ error: 'Doctor chat failed', details: err.message });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages = [] } = req.body;
    const ai = getGenAI();

    if (ai) {
      try {
        const contents = messages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: String(m.content || m.text || '') }]
        }));

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: contents.length ? contents : [{ role: 'user', parts: [{ text: 'Hello' }] }],
          config: {
            systemInstruction: 'You are NeuroScan AI Assistant, specializing in answering questions about neurodevelopmental screenings, ASD assessment tools, and evidence-based developmental support. Be warm, accurate, and concise.',
            temperature: 0.7,
            maxOutputTokens: 800
          }
        });

        const reply = response.text || 'Hello! How can I assist you with your NeuroScan screening today?';
        return res.json({ reply, role: 'assistant' });
      } catch (geminiError) {
        console.warn('Gemini chat API call failed, using fallback:', geminiError.message);
      }
    }

    res.json({
      reply: "Hello! I am NeuroScan AI Assistant. You can ask me about our screening tests (AQ-10, multi-disorder assessment), learning ability profiles, and progress tracking.",
      role: 'assistant'
    });
  } catch (err) {
    console.error('Chat route error:', err);
    res.status(500).json({ error: 'Chat failed', details: err.message });
  }
});

// ── LEARNING DEVELOPMENT API ROUTES ──────────────────────────
app.use('/api/learning', createLearningRouter(() => mongoDbInstance, memoryStore, requireAuth));

// ── FALLBACK ROUTE ────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ── START SERVER ──────────────────────────────────────────────
async function start() {
  try {
    await connectMongo();
    initFirebaseAdmin();
    app.listen(PORT, () => {
      console.log(`\n🚀 NeuroScan Server running at http://localhost:${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/api/health\n`);
    });
  } catch (e) {
    console.error('❌ Server startup error:', e);
  }
}

start();
