/**
 * NeuroScan AI — Learning Development Backend Routes
 * Express router handling learning assessments, scoring calculations,
 * ability profiles, personalized training programs, activities, progress tracking,
 * reassessments, and specialist workflows.
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

export function createLearningRouter(getDb, memoryStore, requireAuth) {
  const router = express.Router();

  // Load static learning definitions
  function loadJsonSafe(relPath, defaultVal = []) {
    try {
      const fullPath = path.join(ROOT_DIR, relPath);
      if (fs.existsSync(fullPath)) {
        return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      }
    } catch (e) {
      console.warn(`Could not load ${relPath}:`, e.message);
    }
    return defaultVal;
  }

  const abilitiesRegistry = loadJsonSafe('data/learning/abilities.json', []);
  const plaData = loadJsonSafe('data/learning/pla-items.json', { sections: [] });
  const alaData = loadJsonSafe('data/learning/ala-items.json', { sections: [] });
  const modulesRegistry = loadJsonSafe('data/learning/modules.json', []);
  const activitiesRegistry = loadJsonSafe('data/learning/activities.json', []);
  const governanceData = loadJsonSafe('learning/model_governance.json', {});

  // In-memory collections extension
  if (!memoryStore.learningAssessments) memoryStore.learningAssessments = [];
  if (!memoryStore.learningProfiles) memoryStore.learningProfiles = [];
  if (!memoryStore.learningPrograms) memoryStore.learningPrograms = [];
  if (!memoryStore.learningActivitiesAttempts) memoryStore.learningActivitiesAttempts = [];
  if (!memoryStore.learningLearners) memoryStore.learningLearners = [
    {
      id: 'learner-001',
      name: 'Leo Tanaka',
      dob: '2014-06-15',
      age: 10,
      grade: '5',
      schoolLevel: 'Elementary',
      preferredLanguage: 'English',
      parentName: 'Elena Tanaka',
      parentEmail: 'elena.tanaka@example.com',
      specialistName: 'Dr. Sarah Jenkins, Ed.D',
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString()
    },
    {
      id: 'learner-002',
      name: 'Maya Rodriguez',
      dob: '2016-03-22',
      age: 8,
      grade: '3',
      schoolLevel: 'Elementary',
      preferredLanguage: 'English',
      parentName: 'Carlos Rodriguez',
      parentEmail: 'carlos.rodriguez@example.com',
      specialistName: 'Dr. Sarah Jenkins, Ed.D',
      createdAt: new Date(Date.now() - 86400000 * 14).toISOString()
    }
  ];
  if (!memoryStore.specialistObservations) memoryStore.specialistObservations = [];

  // ── GOVERNANCE & REGISTRIES ───────────────────────────────────
  router.get('/governance', (_req, res) => {
    res.json(governanceData);
  });

  router.get('/abilities', (_req, res) => {
    res.json(abilitiesRegistry);
  });

  router.get('/modules', (_req, res) => {
    res.json(modulesRegistry);
  });

  // ── LEARNERS ──────────────────────────────────────────────────
  router.get('/learners', async (_req, res) => {
    const db = getDb();
    if (db) {
      try {
        const learners = await db.collection('learning_learners').find({}).toArray();
        return res.json(learners);
      } catch (e) {
        // fallback to memory
      }
    }
    res.json(memoryStore.learningLearners);
  });

  router.post('/learners', async (req, res) => {
    const learner = {
      id: req.body.id || `learner_${Date.now()}`,
      name: req.body.name || 'New Learner',
      dob: req.body.dob || '2015-01-01',
      age: req.body.age || 9,
      grade: req.body.grade || '4',
      schoolLevel: req.body.schoolLevel || 'Elementary',
      preferredLanguage: req.body.preferredLanguage || 'English',
      parentName: req.body.parentName || 'Parent',
      parentEmail: req.body.parentEmail || '',
      specialistName: req.body.specialistName || 'Specialist',
      createdAt: new Date().toISOString()
    };

    const db = getDb();
    if (db) {
      try {
        await db.collection('learning_learners').insertOne(learner);
      } catch (e) {
        console.warn('Mongo insert learner failed:', e.message);
      }
    }
    memoryStore.learningLearners.push(learner);
    res.status(201).json(learner);
  });

  router.get('/learners/:id', async (req, res) => {
    const targetId = req.params.id;
    const db = getDb();
    if (db) {
      try {
        const found = await db.collection('learning_learners').findOne({ id: targetId });
        if (found) return res.json(found);
      } catch (e) {}
    }
    const mem = memoryStore.learningLearners.find(l => l.id === targetId);
    if (!mem) return res.status(404).json({ error: 'Learner not found' });
    res.json(mem);
  });

  // ── ASSESSMENT CONFIGURATIONS ────────────────────────────────
  router.get('/assessment-items/pla', (_req, res) => {
    res.json(plaData);
  });

  router.get('/assessment-items/ala', (_req, res) => {
    res.json(alaData);
  });

  // ── ASSESSMENT SESSION MANAGEMENT ────────────────────────────
  router.post('/assessment/start', (req, res) => {
    const type = (req.body.type || 'PLA').toUpperCase();
    const learnerId = req.body.learnerId || 'learner-001';
    const learner = memoryStore.learningLearners.find(l => l.id === learnerId) || { id: learnerId, name: 'Learner' };

    const session = {
      sessionId: `sess_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      assessmentType: type,
      assessmentId: type === 'ALA' ? 'ALA-v1.0' : 'PLA-v1.0',
      targetDurationMinutes: type === 'ALA' ? 150 : 90,
      learner,
      startedAt: new Date().toISOString(),
      status: 'IN_PROGRESS',
      responses: {}
    };

    res.json(session);
  });

  router.post('/assessment/response', (req, res) => {
    const { sessionId, itemId, selectedIndex, latencyMs } = req.body;
    res.json({ success: true, recordedAt: new Date().toISOString() });
  });

  router.post('/assessment/complete', async (req, res) => {
    try {
      const payload = req.body;
      const responses = payload.responses || {};
      const assessmentType = payload.assessmentType || 'PLA';

      // Deterministic Server-Side Scoring
      const scoredProfile = computeDeterministicProfile(payload, abilitiesRegistry);

      const db = getDb();
      if (db) {
        try {
          await db.collection('learning_assessments').insertOne(payload);
          await db.collection('learning_profiles').insertOne(scoredProfile);
        } catch (e) {
          console.warn('DB save learning assessment/profile failed:', e.message);
        }
      }

      memoryStore.learningAssessments.push(payload);
      memoryStore.learningProfiles.push(scoredProfile);

      res.json({
        success: true,
        assessmentId: payload.assessmentId,
        scoredProfile
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get('/profile/:learnerId', async (req, res) => {
    const learnerId = req.params.learnerId;
    const db = getDb();
    let profile = null;

    if (db) {
      try {
        profile = await db.collection('learning_profiles').findOne(
          { 'learner.id': learnerId },
          { sort: { scoredAt: -1 } }
        );
      } catch (e) {}
    }

    if (!profile) {
      const list = memoryStore.learningProfiles.filter(p => p.learner?.id === learnerId);
      profile = list[list.length - 1] || null;
    }

    if (!profile) {
      // Generate standard sample profile for demo
      profile = generateSampleProfile(learnerId, abilitiesRegistry);
      memoryStore.learningProfiles.push(profile);
    }

    res.json(profile);
  });

  router.get('/profile/assessment/:assessmentId', async (req, res) => {
    const aid = req.params.assessmentId;
    const db = getDb();
    let profile = null;

    if (db) {
      try {
        profile = await db.collection('learning_profiles').findOne({ assessmentId: aid });
      } catch (e) {}
    }
    if (!profile) {
      profile = memoryStore.learningProfiles.find(p => p.assessmentId === aid) || null;
    }

    if (!profile) return res.status(404).json({ error: 'Assessment profile not found' });
    res.json(profile);
  });

  // ── ACTIVITIES & CURRICULUM ──────────────────────────────────
  router.get('/activities', (_req, res) => {
    res.json(activitiesRegistry);
  });

  router.get('/activity/:id', (req, res) => {
    const act = activitiesRegistry.find(a => a.id === req.params.id);
    if (!act) return res.status(404).json({ error: 'Activity not found' });
    res.json(act);
  });

  router.post('/activity/complete', async (req, res) => {
    const attempt = {
      attemptId: `att_${Date.now()}`,
      ...req.body,
      receivedAt: new Date().toISOString()
    };

    const db = getDb();
    if (db) {
      try {
        await db.collection('learning_activities_attempts').insertOne(attempt);
      } catch (e) {}
    }
    memoryStore.learningActivitiesAttempts.push(attempt);
    res.json({ success: true, attempt });
  });

  // ── TRAINING PROGRAMS ─────────────────────────────────────────
  router.get('/program/:learnerId', async (req, res) => {
    const learnerId = req.params.learnerId;
    const db = getDb();
    let program = null;

    if (db) {
      try {
        program = await db.collection('learning_programs').findOne(
          { learnerId },
          { sort: { createdAt: -1 } }
        );
      } catch (e) {}
    }

    if (!program) {
      const list = memoryStore.learningPrograms.filter(p => p.learnerId === learnerId);
      program = list[list.length - 1] || null;
    }

    if (!program) {
      // Auto-generate based on current profile
      const sampleProfile = generateSampleProfile(learnerId, abilitiesRegistry);
      program = generateSampleProgram(sampleProfile, modulesRegistry);
      memoryStore.learningPrograms.push(program);
    }

    res.json(program);
  });

  router.post('/program/generate', async (req, res) => {
    const { profile } = req.body;
    const generated = generateSampleProgram(profile, modulesRegistry);

    const db = getDb();
    if (db) {
      try {
        await db.collection('learning_programs').insertOne(generated);
      } catch (e) {}
    }
    memoryStore.learningPrograms.push(generated);
    res.json(generated);
  });

  router.put('/program/:id', async (req, res) => {
    const progId = req.params.id;
    const updated = { ...req.body, updatedAt: new Date().toISOString() };

    const db = getDb();
    if (db) {
      try {
        await db.collection('learning_programs').updateOne({ programId: progId }, { $set: updated });
      } catch (e) {}
    }

    const idx = memoryStore.learningPrograms.findIndex(p => p.programId === progId);
    if (idx >= 0) memoryStore.learningPrograms[idx] = { ...memoryStore.learningPrograms[idx], ...updated };

    res.json({ success: true, program: updated });
  });

  // ── PROGRESS & REASSESSMENT ──────────────────────────────────
  router.get('/progress/:learnerId', async (req, res) => {
    const learnerId = req.params.learnerId;
    const attempts = memoryStore.learningActivitiesAttempts.filter(a => a.learnerId === learnerId);
    const baselineProfile = generateSampleProfile(learnerId, abilitiesRegistry, 0.72);
    const currentProfile = generateSampleProfile(learnerId, abilitiesRegistry, 0.85);

    const baseScores = {};
    baselineProfile.abilityScores.forEach(a => { baseScores[a.code] = a.percentage; });

    const comparisons = currentProfile.abilityScores.map(curr => {
      const bPct = baseScores[curr.code] || curr.percentage - 10;
      const diff = curr.percentage - bPct;
      return {
        code: curr.code,
        name: curr.construct || curr.name,
        domain: curr.domain,
        baselineScore: bPct,
        currentScore: curr.percentage,
        change: diff,
        changeFormatted: diff >= 0 ? `+${diff}%` : `${diff}%`,
        status: diff >= 8 ? 'IMPROVED' : diff <= -8 ? 'NEEDS_FOCUS' : 'MAINTAINED'
      };
    });

    res.json({
      learnerId,
      totalTrainingSessions: Math.max(12, attempts.length),
      totalTrainingMinutes: Math.max(280, attempts.length * 15),
      averageAccuracy: 84,
      baselineProfile,
      currentProfile,
      comparisons,
      attempts
    });
  });

  // ── SPECIALIST LOGS ──────────────────────────────────────────
  router.post('/specialist/observation', async (req, res) => {
    const obs = { id: `obs_${Date.now()}`, ...req.body, loggedAt: new Date().toISOString() };
    const db = getDb();
    if (db) {
      try {
        await db.collection('specialist_observations').insertOne(obs);
      } catch (e) {}
    }
    memoryStore.specialistObservations.push(obs);
    res.json({ success: true, observation: obs });
  });

  router.post('/specialist/offline-activity', async (req, res) => {
    const offlineRec = {
      id: `off_${Date.now()}`,
      ...req.body,
      isOfflineSpecialistLogged: true,
      loggedAt: new Date().toISOString()
    };
    memoryStore.learningActivitiesAttempts.push(offlineRec);
    res.json({ success: true, offlineRecord: offlineRec });
  });

  return router;
}

// ── INTERNAL DETERMINISTIC SCORING HELPER ──────────────────────
function computeDeterministicProfile(payload, abilitiesRegistry) {
  const responses = payload.responses || {};
  const abilityMap = new Map();
  abilitiesRegistry.forEach(a => abilityMap.set(a.code, a));

  const buckets = {};
  for (const [_, resp] of Object.entries(responses)) {
    const code = resp.abilityCode;
    if (!code) continue;
    if (!buckets[code]) {
      buckets[code] = { code, raw: 0, max: 0, correct: 0, count: 0, latency: 0 };
    }
    buckets[code].raw += (resp.pointsEarned || 0);
    buckets[code].max += (resp.maxPoints || 1);
    if (resp.isCorrect) buckets[code].correct++;
    buckets[code].count++;
    buckets[code].latency += (resp.latencyMs || 0);
  }

  const abilityScores = [];
  for (const [code, b] of Object.entries(buckets)) {
    const meta = abilityMap.get(code) || { code, name: code, domain: 'Figural', construct: code };
    const pct = b.max > 0 ? Math.round((b.raw / b.max) * 100) : 0;
    
    let band = 'Average';
    let color = '#2563eb';
    if (pct <= 40) { band = 'Low'; color = '#c44b1b'; }
    else if (pct <= 60) { band = 'Developing'; color = '#d97706'; }
    else if (pct <= 79) { band = 'Average'; color = '#2563eb'; }
    else if (pct <= 92) { band = 'Strong'; color = '#2d6a4f'; }
    else { band = 'Exceptional'; color = '#047857'; }

    abilityScores.push({
      code,
      name: meta.name,
      domain: meta.domain || 'Figural',
      construct: meta.construct || meta.name,
      description: meta.description || '',
      educationalSignificance: meta.educationalSignificance || '',
      rawScore: b.raw,
      maxScore: b.max,
      correctCount: b.correct,
      itemsCount: b.count,
      percentage: pct,
      performanceBand: band,
      bandColor: color,
      avgLatencySeconds: ((b.latency / (b.count || 1)) / 1000).toFixed(1),
      referenceCohortPercentile: Math.min(99, Math.max(1, Math.round(pct * 0.95 + 2)))
    });
  }

  const sorted = [...abilityScores].sort((a, b) => b.percentage - a.percentage);
  const totalRaw = abilityScores.reduce((s, a) => s + a.rawScore, 0);
  const totalMax = abilityScores.reduce((s, a) => s + a.maxScore, 0);
  const overallPct = totalMax > 0 ? Math.round((totalRaw / totalMax) * 100) : 70;

  return {
    assessmentId: payload.assessmentId || 'PLA-v1.0',
    assessmentType: payload.assessmentType || 'PLA',
    learner: payload.learner || { id: 'learner-001', name: 'Learner' },
    scoredAt: new Date().toISOString(),
    durationSeconds: payload.totalDurationSeconds || 3600,
    overallPercentage: overallPct,
    overallBand: overallPct >= 80 ? 'Strong' : overallPct >= 60 ? 'Average' : 'Developing',
    abilityScores,
    strongestAbilities: sorted.slice(0, 3),
    developmentPriorities: [...sorted].reverse().slice(0, 3),
    scoringVersion: 'SCORING-v1.0'
  };
}

function generateSampleProfile(learnerId, abilitiesRegistry, scale = 1.0) {
  const sampleCodes = ['CFU', 'CFC', 'CFR', 'MFU', 'EFU', 'EFC', 'NFU', 'CSS', 'MSU', 'MSUA', 'NST', 'CMUr', 'CMR', 'CMS'];
  const abilityScores = sampleCodes.map((code, idx) => {
    const meta = abilitiesRegistry.find(a => a.code === code) || { code, name: code, domain: 'Figural', construct: code };
    // Deterministic varied baseline percentages
    const basePcts = [88, 75, 52, 90, 68, 58, 82, 48, 78, 62, 54, 85, 56, 72];
    const pct = Math.min(100, Math.round(basePcts[idx % basePcts.length] * scale));
    
    let band = 'Average';
    let color = '#2563eb';
    if (pct <= 40) { band = 'Low'; color = '#c44b1b'; }
    else if (pct <= 60) { band = 'Developing'; color = '#d97706'; }
    else if (pct <= 79) { band = 'Average'; color = '#2563eb'; }
    else if (pct <= 92) { band = 'Strong'; color = '#2d6a4f'; }
    else { band = 'Exceptional'; color = '#047857'; }

    return {
      code,
      name: meta.name,
      domain: meta.domain || 'Figural',
      construct: meta.construct || meta.name,
      description: meta.description || '',
      educationalSignificance: meta.educationalSignificance || '',
      rawScore: Math.round(pct / 25),
      maxScore: 4,
      percentage: pct,
      performanceBand: band,
      bandColor: color,
      referenceCohortPercentile: Math.min(99, Math.max(1, Math.round(pct * 0.94 + 3)))
    };
  });

  const sorted = [...abilityScores].sort((a, b) => b.percentage - a.percentage);

  return {
    assessmentId: 'PLA-v1.0-SAMPLE',
    assessmentType: 'PLA',
    learner: { id: learnerId, name: 'Leo Tanaka', age: 10, grade: '5', schoolLevel: 'Elementary' },
    scoredAt: new Date().toISOString(),
    durationSeconds: 4800,
    overallPercentage: Math.round(abilityScores.reduce((s, a) => s + a.percentage, 0) / abilityScores.length),
    overallBand: 'Average',
    abilityScores,
    strongestAbilities: sorted.slice(0, 3),
    developmentPriorities: [...sorted].reverse().slice(0, 3),
    scoringVersion: 'SCORING-v1.0'
  };
}

function generateSampleProgram(profile, modulesRegistry) {
  const priorities = profile.developmentPriorities || [
    { code: 'CSS', construct: 'Numerical Sequences' },
    { code: 'CFR', construct: 'Spatial Analogies' },
    { code: 'NST', construct: 'Symbolic Transformation' }
  ];

  return {
    programId: `prog_sample_${Date.now()}`,
    learnerId: profile.learner?.id || 'learner-001',
    learnerName: profile.learner?.name || 'Leo Tanaka',
    assessmentId: profile.assessmentId || 'PLA-v1.0',
    createdAt: new Date().toISOString(),
    status: 'ACTIVE',
    durationWeeks: 8,
    targetMinutesPerDay: 25,
    weeklySchedule: [
      {
        weekNumber: 1,
        theme: 'Foundation & Strategy Acquisition',
        dailyPlan: [
          { day: 'Monday', abilityCode: priorities[0]?.code || 'CSS', title: 'Numerical Sequence Discovery', durationMinutes: 20, modality: 'Digital Interactive', difficultyLevel: 1, objective: 'Identify arithmetic steps and multi-track rules.' },
          { day: 'Tuesday', abilityCode: priorities[1]?.code || 'CFR', title: 'Spatial Analogies Foundation', durationMinutes: 20, modality: 'Printable / Specialist-Led', difficultyLevel: 1, objective: 'Deduce 2D rotations and scale shifts.' },
          { day: 'Wednesday', abilityCode: priorities[0]?.code || 'CSS', title: 'Interleaved Sequence Architect', durationMinutes: 20, modality: 'Digital Interactive', difficultyLevel: 2, objective: 'Solve alternating mathematical streams.' },
          { day: 'Thursday', abilityCode: priorities[2]?.code || 'NST', title: 'Algebraic Balancing Scale', durationMinutes: 20, modality: 'Digital Interactive', difficultyLevel: 1, objective: 'Balance linear unknown equations.' },
          { day: 'Friday', abilityCode: priorities[1]?.code || 'CFR', title: 'Compound Spatial Transformations', durationMinutes: 20, modality: 'Specialist-Led Session', difficultyLevel: 2, objective: 'Multi-axis rotational deduction.' },
          { day: 'Saturday', abilityCode: 'CFU', title: 'Visual Closure Creative Quest', durationMinutes: 15, modality: 'Enrichment Game', difficultyLevel: 3, objective: 'Celebrate high strength in visual recognition.' }
        ]
      }
    ],
    specialistNotes: 'Initial curriculum scheduled focusing on CSS, CFR, and NST constructs with weekly Saturday enrichment.',
    version: 'CURRICULUM-v1.0'
  };
}
