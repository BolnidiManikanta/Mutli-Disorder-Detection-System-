// ================================================================
//  NeuroScan AI — MongoDB Seed Script
//  Run: node seed.js
//  Creates demo users and assessments for local development
// ================================================================

import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME   = process.env.DB_NAME   || 'neuroscan';
const DEMO_UID  = 'demo-user-001';

const demoAssessments = [
  {
    uid: DEMO_UID, name: 'Arjun', age: 7, gender: 'male',
    assessment_type: 'multi-disorder',
    createdAt: new Date(Date.now() - 90 * 86400000),
    disorder_results: {
      asd:   { probability: 0.72, riskLevel: 'High',     confidence: 'High' },
      adhd:  { probability: 0.58, riskLevel: 'Moderate', confidence: 'High' },
      spd:   { probability: 0.61, riskLevel: 'Moderate', confidence: 'Moderate' },
      dyslexia:              { probability: 0.31, riskLevel: 'Low', confidence: 'Moderate' },
      social_anxiety:        { probability: 0.25, riskLevel: 'Low', confidence: 'High' },
      speech_delay:          { probability: 0.45, riskLevel: 'Low', confidence: 'Moderate' },
      intellectual_disability:{ probability: 0.18, riskLevel: 'Minimal', confidence: 'High' },
    },
    answers: { q_eye_contact: 0, q_social_interaction: 0, q_attention_span: 1, q_repetitive_behavior: 3, q_sensory_response: 0 },
    risk_level: 'High', probability: 72,
  },
  {
    uid: DEMO_UID, name: 'Arjun', age: 7, gender: 'male',
    assessment_type: 'multi-disorder',
    createdAt: new Date(Date.now() - 60 * 86400000),
    disorder_results: {
      asd:   { probability: 0.65, riskLevel: 'High',     confidence: 'High' },
      adhd:  { probability: 0.52, riskLevel: 'Moderate', confidence: 'High' },
      spd:   { probability: 0.55, riskLevel: 'Moderate', confidence: 'Moderate' },
      dyslexia:              { probability: 0.28, riskLevel: 'Low', confidence: 'Moderate' },
      social_anxiety:        { probability: 0.22, riskLevel: 'Low', confidence: 'High' },
      speech_delay:          { probability: 0.38, riskLevel: 'Low', confidence: 'Moderate' },
      intellectual_disability:{ probability: 0.16, riskLevel: 'Minimal', confidence: 'High' },
    },
    answers: { q_eye_contact: 0, q_social_interaction: 1, q_attention_span: 1, q_repetitive_behavior: 2, q_sensory_response: 0 },
    risk_level: 'High', probability: 65,
  },
  {
    uid: DEMO_UID, name: 'Arjun', age: 7, gender: 'male',
    assessment_type: 'multi-disorder',
    createdAt: new Date(Date.now() - 30 * 86400000),
    disorder_results: {
      asd:   { probability: 0.58, riskLevel: 'Moderate', confidence: 'High' },
      adhd:  { probability: 0.45, riskLevel: 'Low',      confidence: 'High' },
      spd:   { probability: 0.48, riskLevel: 'Low',      confidence: 'Moderate' },
      dyslexia:              { probability: 0.24, riskLevel: 'Low', confidence: 'Moderate' },
      social_anxiety:        { probability: 0.18, riskLevel: 'Minimal', confidence: 'High' },
      speech_delay:          { probability: 0.30, riskLevel: 'Low', confidence: 'Moderate' },
      intellectual_disability:{ probability: 0.14, riskLevel: 'Minimal', confidence: 'High' },
    },
    answers: { q_eye_contact: 1, q_social_interaction: 1, q_attention_span: 2, q_repetitive_behavior: 2, q_sensory_response: 1 },
    risk_level: 'Moderate', probability: 58,
  },
  {
    uid: DEMO_UID, name: 'Arjun', age: 8, gender: 'male',
    assessment_type: 'multi-disorder',
    createdAt: new Date(Date.now() - 7 * 86400000),
    disorder_results: {
      asd:   { probability: 0.51, riskLevel: 'Moderate', confidence: 'High' },
      adhd:  { probability: 0.40, riskLevel: 'Low',      confidence: 'High' },
      spd:   { probability: 0.42, riskLevel: 'Low',      confidence: 'Moderate' },
      dyslexia:              { probability: 0.20, riskLevel: 'Minimal', confidence: 'Moderate' },
      social_anxiety:        { probability: 0.15, riskLevel: 'Minimal', confidence: 'High' },
      speech_delay:          { probability: 0.22, riskLevel: 'Minimal', confidence: 'Moderate' },
      intellectual_disability:{ probability: 0.12, riskLevel: 'Minimal', confidence: 'High' },
    },
    answers: { q_eye_contact: 1, q_social_interaction: 2, q_attention_span: 2, q_repetitive_behavior: 1, q_sensory_response: 1 },
    risk_level: 'Moderate', probability: 51,
  },
];

const demoChats = [
  { uid: DEMO_UID, role: 'user',      text: 'Is my child showing signs of autism?', createdAt: new Date(Date.now() - 5 * 86400000) },
  { uid: DEMO_UID, role: 'assistant', text: 'Based on what you\'ve shared, there are several behavioral patterns worth discussing with a specialist. Key indicators include reduced eye contact, repetitive movements, and sensory sensitivities.', createdAt: new Date(Date.now() - 5 * 86400000 + 3000) },
  { uid: DEMO_UID, role: 'user',      text: 'What therapy options are available?', createdAt: new Date(Date.now() - 4 * 86400000) },
  { uid: DEMO_UID, role: 'assistant', text: 'The most evidence-based therapies for ASD include Applied Behavior Analysis (ABA), Speech-Language Therapy, Occupational Therapy for sensory integration, and Social Skills Training. Early intervention before age 5 significantly improves outcomes.', createdAt: new Date(Date.now() - 4 * 86400000 + 3000) },
];

async function seed() {
  const client = new MongoClient(MONGO_URI, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
  });

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    console.log(`\n🌱 Seeding database: ${DB_NAME}\n`);

    // Clear existing demo data
    await db.collection('users').deleteMany({ uid: DEMO_UID });
    await db.collection('assessments').deleteMany({ uid: DEMO_UID });
    await db.collection('chats').deleteMany({ uid: DEMO_UID });

    // Insert demo user
    await db.collection('users').insertOne({
      uid:              DEMO_UID,
      email:            'demo@neuroscan.ai',
      displayName:      'Demo User',
      photoURL:         '',
      role:             'user',
      assessments_count: demoAssessments.length,
      createdAt:        new Date(),
    });
    console.log('✅ Demo user created');

    // Insert assessments
    const aResult = await db.collection('assessments').insertMany(demoAssessments);
    console.log(`✅ ${aResult.insertedCount} demo assessments inserted`);

    // Insert chats
    const cResult = await db.collection('chats').insertMany(demoChats);
    console.log(`✅ ${cResult.insertedCount} demo chat messages inserted`);

    // Create indexes
    await db.collection('users').createIndex({ uid: 1 }, { unique: true });
    await db.collection('assessments').createIndex({ uid: 1, createdAt: -1 });
    await db.collection('chats').createIndex({ uid: 1, createdAt: 1 });
    console.log('✅ Indexes created');

    console.log(`\n🎉 Seed complete! Demo UID: ${DEMO_UID}`);
    console.log('   Use X-Dev-UID: demo-user-001 header in DEV mode to test\n');

  } finally {
    await client.close();
  }
}

seed().catch(e => { console.error('❌ Seed failed:', e); process.exit(1); });
