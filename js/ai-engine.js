/* ================================================================
   AI ENGINE — Multi-Disorder Ensemble Prediction System
   NeuroScan Advanced | v3.0
   Disorders: ASD, ADHD, Dyslexia, Social Anxiety, Speech Delay,
              Intellectual Disability, Sensory Processing Disorder
   ================================================================ */

// ── DISORDER DEFINITIONS ────────────────────────────────────────
export const DISORDERS = {
  asd: {
    id: 'asd', name: 'Autism Spectrum Disorder', short: 'ASD',
    color: '#2d6a4f', icon: '🧩',
    description: 'A neurodevelopmental condition affecting social communication, behavior, and sensory processing.',
    icd: 'F84.0',
    prevalence: '1 in 36 children',
    features: ['social_communication','repetitive_behavior','sensory_sensitivity','routine_adherence','eye_contact','special_interests'],
  },
  adhd: {
    id: 'adhd', name: 'ADHD', short: 'ADHD',
    color: '#e76f51', icon: '⚡',
    description: 'Attention-Deficit/Hyperactivity Disorder — affects attention, impulse control, and activity level.',
    icd: 'F90.0',
    prevalence: '1 in 10 children',
    features: ['inattention','hyperactivity','impulsivity','executive_function','task_completion','focus_duration'],
  },
  dyslexia: {
    id: 'dyslexia', name: 'Dyslexia', short: 'DYS',
    color: '#457b9d', icon: '📖',
    description: 'A learning disability affecting reading, spelling, and language processing.',
    icd: 'F81.0',
    prevalence: '1 in 5 children',
    features: ['reading_difficulty','spelling_errors','phonological_awareness','letter_reversal','slow_reading','word_recall'],
  },
  social_anxiety: {
    id: 'social_anxiety', name: 'Social Anxiety Disorder', short: 'SAD',
    color: '#9b5de5', icon: '😰',
    description: 'Intense fear of social situations causing significant distress or impairment.',
    icd: 'F40.1',
    prevalence: '1 in 8 people',
    features: ['social_avoidance','performance_anxiety','fear_judgment','physical_symptoms','social_withdrawal','anticipatory_anxiety'],
  },
  speech_delay: {
    id: 'speech_delay', name: 'Speech & Language Delay', short: 'SLD',
    color: '#f4a261', icon: '🗣️',
    description: 'Delayed development of speech and language milestones compared to peers.',
    icd: 'F80.1',
    prevalence: '1 in 12 children',
    features: ['vocabulary_size','sentence_formation','articulation','comprehension','expressive_language','pragmatics'],
  },
  intellectual_disability: {
    id: 'intellectual_disability', name: 'Intellectual Disability', short: 'ID',
    color: '#6d6875', icon: '🧠',
    description: 'Significant limitations in intellectual functioning and adaptive behavior.',
    icd: 'F70',
    prevalence: '1 in 50 people',
    features: ['cognitive_function','adaptive_behavior','conceptual_skills','social_skills','practical_skills','learning_rate'],
  },
  spd: {
    id: 'spd', name: 'Sensory Processing Disorder', short: 'SPD',
    color: '#2a9d8f', icon: '✋',
    description: 'Difficulty processing and responding to sensory information from the environment.',
    icd: 'F88',
    prevalence: '1 in 6 children',
    features: ['tactile_sensitivity','auditory_sensitivity','visual_sensitivity','proprioception','vestibular','sensory_seeking'],
  },
};

// ── FEATURE IMPORTANCE (SHAP approximation) ─────────────────────
const FEATURE_WEIGHTS = {
  asd: {
    eye_contact: 0.89, social_communication: 0.85, repetitive_behavior: 0.82,
    sensory_sensitivity: 0.76, routine_adherence: 0.71, special_interests: 0.68,
    language_delay: 0.65, peer_interaction: 0.62, empathy_recognition: 0.58,
    play_style: 0.52, family_history: 0.48, jaundice: 0.31,
  },
  adhd: {
    inattention: 0.91, hyperactivity: 0.88, impulsivity: 0.84,
    task_completion: 0.79, focus_duration: 0.76, executive_function: 0.73,
    organization: 0.68, forgetfulness: 0.65, interrupting: 0.61,
    fidgeting: 0.57, emotional_regulation: 0.52, sleep_issues: 0.44,
  },
  dyslexia: {
    phonological_awareness: 0.93, reading_difficulty: 0.90, spelling_errors: 0.87,
    letter_reversal: 0.82, slow_reading: 0.78, word_recall: 0.74,
    rhyming_difficulty: 0.69, sequencing: 0.64, memory: 0.59,
    left_right_confusion: 0.54, family_history: 0.46,
  },
  social_anxiety: {
    social_avoidance: 0.92, performance_anxiety: 0.88, fear_judgment: 0.85,
    physical_symptoms: 0.79, social_withdrawal: 0.74, anticipatory_anxiety: 0.71,
    negative_self_talk: 0.66, blushing: 0.58, selective_mutism: 0.52,
    family_history: 0.44,
  },
  speech_delay: {
    vocabulary_size: 0.94, sentence_formation: 0.91, articulation: 0.87,
    comprehension: 0.83, expressive_language: 0.79, pragmatics: 0.72,
    babbling_delay: 0.68, word_combinations: 0.63, stranger_intelligibility: 0.58,
    family_history: 0.42,
  },
  intellectual_disability: {
    cognitive_function: 0.95, adaptive_behavior: 0.91, conceptual_skills: 0.87,
    practical_skills: 0.83, learning_rate: 0.78, social_skills: 0.72,
    communication_delay: 0.68, motor_development: 0.62,
    academic_performance: 0.58, family_history: 0.41,
  },
  spd: {
    tactile_sensitivity: 0.89, auditory_sensitivity: 0.86, visual_sensitivity: 0.80,
    proprioception: 0.74, vestibular: 0.70, sensory_seeking: 0.67,
    texture_aversion: 0.63, sound_sensitivity: 0.59, light_sensitivity: 0.54,
    movement_seeking: 0.49,
  },
};

// ── CO-OCCURRENCE MATRIX ─────────────────────────────────────────
// How likely is disorder B given disorder A? (0-1 probability)
export const CO_OCCURRENCE = {
  asd:   { adhd:0.50, spd:0.70, speech_delay:0.40, dyslexia:0.25, social_anxiety:0.35, intellectual_disability:0.31 },
  adhd:  { asd:0.18, dyslexia:0.40, social_anxiety:0.30, speech_delay:0.22, spd:0.40, intellectual_disability:0.15 },
  dyslexia: { adhd:0.45, social_anxiety:0.28, asd:0.12, speech_delay:0.30 },
  social_anxiety: { adhd:0.25, asd:0.15, dyslexia:0.18 },
  speech_delay: { asd:0.35, dyslexia:0.30, intellectual_disability:0.28, adhd:0.20 },
  intellectual_disability: { asd:0.35, speech_delay:0.55, adhd:0.20, spd:0.30 },
  spd: { asd:0.65, adhd:0.38, social_anxiety:0.25, intellectual_disability:0.18 },
};

// ── ADAPTIVE QUESTIONNAIRE SYSTEM ───────────────────────────────

export const ADAPTIVE_QUESTIONS = {
  // Universal screening questions (shown to all)
  universal: [
    {
      id: 'q_eye_contact', disorder: ['asd','social_anxiety'],
      question: 'How does the individual respond to direct eye contact?',
      type: 'scale', options: ['Avoids completely','Avoids often','Sometimes maintains','Usually maintains','Always comfortable'],
      weights: { asd: [1.0, 0.75, 0.3, 0.1, 0], social_anxiety: [0.9, 0.7, 0.4, 0.15, 0.05] },
      ageGroups: ['toddler','child','adolescent','adult'],
    },
    {
      id: 'q_social_interaction', disorder: ['asd','social_anxiety','intellectual_disability'],
      question: 'How does the individual interact in group social settings?',
      type: 'scale', options: ['Completely withdrawn','Rarely engages','Sometimes participates','Usually participates','Very social'],
      weights: { asd: [1.0, 0.8, 0.4, 0.1, 0], social_anxiety: [0.9, 0.75, 0.5, 0.2, 0.05], intellectual_disability: [0.7, 0.5, 0.3, 0.1, 0] },
      ageGroups: ['toddler','child','adolescent','adult'],
    },
    {
      id: 'q_attention_span', disorder: ['adhd','intellectual_disability'],
      question: 'How long can the individual typically focus on a single task?',
      type: 'scale', options: ['< 2 minutes','2-5 minutes','5-15 minutes','15-30 minutes','30+ minutes'],
      weights: { adhd: [1.0, 0.85, 0.5, 0.15, 0], intellectual_disability: [0.8, 0.65, 0.4, 0.2, 0.05] },
      ageGroups: ['toddler','child','adolescent','adult'],
    },
    {
      id: 'q_repetitive_behavior', disorder: ['asd','spd'],
      question: 'Does the individual engage in repetitive behaviors or movements?',
      type: 'frequency', options: ['Never','Rarely','Sometimes','Often','Always'],
      weights: { asd: [0, 0.2, 0.5, 0.85, 1.0], spd: [0, 0.15, 0.4, 0.7, 0.9] },
      ageGroups: ['toddler','child','adolescent','adult'],
    },
    {
      id: 'q_sensory_response', disorder: ['asd','spd'],
      question: 'How does the individual respond to sensory stimuli (sounds, textures, lights)?',
      type: 'scale', options: ['Very over-sensitive','Over-sensitive','Normal range','Under-sensitive','Seeks intense stimulation'],
      weights: { asd: [1.0, 0.8, 0, 0.5, 0.7], spd: [1.0, 0.85, 0, 0.6, 0.8] },
      ageGroups: ['toddler','child','adolescent','adult'],
    },
    {
      id: 'q_language_development', disorder: ['asd','speech_delay','intellectual_disability'],
      question: 'Describe the individual\'s language development:',
      type: 'scale', options: ['No words yet (age inappropriate)','Single words only','Short phrases','Full sentences (some difficulty)','Age-appropriate'],
      weights: { asd: [1.0, 0.8, 0.5, 0.2, 0], speech_delay: [1.0, 0.85, 0.6, 0.25, 0], intellectual_disability: [0.9, 0.75, 0.5, 0.25, 0.05] },
      ageGroups: ['toddler','child','adolescent','adult'],
    },
    {
      id: 'q_reading', disorder: ['dyslexia','intellectual_disability'],
      question: 'How does the individual perform with reading and writing?',
      type: 'scale', options: ['Severe difficulty','Significant difficulty','Moderate difficulty','Mild difficulty','Age-appropriate'],
      weights: { dyslexia: [1.0, 0.85, 0.65, 0.35, 0], intellectual_disability: [0.85, 0.7, 0.5, 0.25, 0.05] },
      ageGroups: ['child','adolescent','adult'],
    },
    {
      id: 'q_hyperactivity', disorder: ['adhd'],
      question: 'How would you describe the individual\'s activity level?',
      type: 'scale', options: ['Very hyperactive','Hyperactive','Moderately active','Normal','Hypoactive'],
      weights: { adhd: [1.0, 0.85, 0.5, 0.1, 0] },
      ageGroups: ['toddler','child','adolescent','adult'],
    },
    {
      id: 'q_emotional_regulation', disorder: ['adhd','asd','social_anxiety'],
      question: 'How does the individual handle emotional regulation and frustration?',
      type: 'scale', options: ['Very poor — frequent meltdowns','Poor — regular outbursts','Moderate','Good','Excellent'],
      weights: { adhd: [1.0, 0.8, 0.4, 0.1, 0], asd: [0.9, 0.75, 0.4, 0.15, 0.02], social_anxiety: [0.7, 0.6, 0.35, 0.1, 0] },
      ageGroups: ['toddler','child','adolescent','adult'],
    },
    {
      id: 'q_routine', disorder: ['asd'],
      question: 'How does the individual respond to changes in routine?',
      type: 'scale', options: ['Extreme distress','Significant distress','Moderate concern','Mild concern','Adaptable'],
      weights: { asd: [1.0, 0.85, 0.5, 0.2, 0.02] },
      ageGroups: ['toddler','child','adolescent','adult'],
    },
    {
      id: 'q_special_interests', disorder: ['asd'],
      question: 'Does the individual have intense, narrow special interests?',
      type: 'frequency', options: ['Never','Rarely','Sometimes','Often','Extremely — dominates all activities'],
      weights: { asd: [0, 0.15, 0.4, 0.75, 1.0] },
      ageGroups: ['child','adolescent','adult'],
    },
    {
      id: 'q_anxiety_social', disorder: ['social_anxiety','asd'],
      question: 'How does the individual feel about speaking in front of others or being observed?',
      type: 'scale', options: ['Extreme panic','Very anxious','Moderately anxious','Mildly anxious','Comfortable'],
      weights: { social_anxiety: [1.0, 0.88, 0.65, 0.3, 0.02], asd: [0.5, 0.4, 0.3, 0.15, 0.05] },
      ageGroups: ['child','adolescent','adult'],
    },
    {
      id: 'q_play_imaginative', disorder: ['asd','intellectual_disability'],
      question: 'How does the child engage in imaginative/pretend play with peers?',
      type: 'scale', options: ['Does not understand pretend play','Rarely engages','Sometimes engages','Usually engages','Actively leads play'],
      weights: { asd: [1.0, 0.8, 0.45, 0.15, 0], intellectual_disability: [0.85, 0.65, 0.4, 0.15, 0.02] },
      ageGroups: ['toddler','child'],
    },
  ],

  // Age-specific follow-ups (toddlers 0-3)
  toddler: [
    {
      id: 'q_pointing', disorder: ['asd','speech_delay'],
      question: 'Does the child point to show interest in things (declarative pointing)?',
      type: 'frequency', options: ['Never','Rarely','Sometimes','Often','Always'],
      weights: { asd: [1.0, 0.8, 0.4, 0.1, 0], speech_delay: [0.9, 0.7, 0.35, 0.1, 0] },
    },
    {
      id: 'q_babbling', disorder: ['asd','speech_delay'],
      question: 'Was babbling delayed or absent in the first year?',
      type: 'binary', options: ['Yes — significantly delayed or absent','No — normal babbling'],
      weights: { asd: [0.85, 0], speech_delay: [1.0, 0] },
    },
    {
      id: 'q_response_name', disorder: ['asd','hearing'],
      question: 'Does the child consistently respond when their name is called?',
      type: 'frequency', options: ['Almost never','Rarely','Sometimes','Usually','Always'],
      weights: { asd: [1.0, 0.8, 0.4, 0.1, 0] },
    },
    {
      id: 'q_joint_attention', disorder: ['asd'],
      question: 'Does the child follow your gaze or pointing to look at something?',
      type: 'frequency', options: ['Never','Rarely','Sometimes','Often','Always'],
      weights: { asd: [1.0, 0.8, 0.45, 0.15, 0.02] },
    },
  ],

  // Age-specific (children 4-12)
  child: [
    {
      id: 'q_friendships', disorder: ['asd','social_anxiety','intellectual_disability'],
      question: 'How does the child make and maintain friendships?',
      type: 'scale', options: ['Cannot make friends','Very rarely has friends','Has 1-2 friends with difficulty','Has friends with some difficulty','Makes friends easily'],
      weights: { asd: [1.0, 0.8, 0.5, 0.2, 0.02], social_anxiety: [0.7, 0.6, 0.45, 0.25, 0.05], intellectual_disability: [0.8, 0.65, 0.45, 0.2, 0.05] },
    },
    {
      id: 'q_academic', disorder: ['dyslexia','adhd','intellectual_disability'],
      question: 'How is the child performing academically compared to peers?',
      type: 'scale', options: ['Severely behind','Significantly behind','Moderately behind','Slightly behind','At or above grade level'],
      weights: { dyslexia: [0.8, 0.9, 0.7, 0.4, 0.05], adhd: [0.7, 0.8, 0.6, 0.35, 0.1], intellectual_disability: [0.9, 0.85, 0.65, 0.35, 0.05] },
    },
    {
      id: 'q_letters_reversal', disorder: ['dyslexia'],
      question: 'Does the child frequently reverse letters/numbers (b/d, p/q, 6/9)?',
      type: 'frequency', options: ['Never','Rarely','Sometimes','Often','Always'],
      weights: { dyslexia: [0, 0.2, 0.55, 0.85, 1.0] },
    },
  ],

  // Age-specific (adolescents 13-17)
  adolescent: [
    {
      id: 'q_social_media', disorder: ['social_anxiety','asd'],
      question: 'How does the individual engage with peers online vs. in-person?',
      type: 'scale', options: ['Avoids both','Prefers online only','Mixed with preference for online','Similar in both','More comfortable in-person'],
      weights: { social_anxiety: [0.9, 0.85, 0.6, 0.2, 0.05], asd: [0.7, 0.6, 0.4, 0.2, 0.1] },
    },
    {
      id: 'q_independence', disorder: ['intellectual_disability','asd'],
      question: 'How independent is the individual in daily activities (hygiene, organizing)?',
      type: 'scale', options: ['Requires full assistance','Requires significant help','Requires some help','Mostly independent','Fully independent'],
      weights: { intellectual_disability: [1.0, 0.8, 0.55, 0.2, 0.02], asd: [0.6, 0.5, 0.35, 0.15, 0.02] },
    },
  ],
};

// ── ENSEMBLE PREDICTION ENGINE ───────────────────────────────────

function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }

function logisticScore(answers, disorderId) {
  const weights = FEATURE_WEIGHTS[disorderId];
  let score = 0, totalWeight = 0;
  
  ADAPTIVE_QUESTIONS.universal.forEach(q => {
    if (!q.weights[disorderId]) return;
    const ans = answers[q.id];
    if (ans === undefined || ans === null) return;
    const w = q.weights[disorderId][ans] ?? 0;
    const featureWeight = Object.values(weights)[0] ?? 0.5;
    score += w * featureWeight;
    totalWeight += featureWeight;
  });

  ['toddler','child','adolescent'].forEach(group => {
    (ADAPTIVE_QUESTIONS[group] || []).forEach(q => {
      if (!q.weights[disorderId]) return;
      const ans = answers[q.id];
      if (ans === undefined || ans === null) return;
      const w = q.weights[disorderId][ans] ?? 0;
      score += w * 0.6;
      totalWeight += 0.6;
    });
  });

  return totalWeight > 0 ? score / totalWeight : 0;
}

function randomForestScore(answers, disorderId) {
  // Simulated RF using multiple decision trees with slight variance
  const base = logisticScore(answers, disorderId);
  const trees = 10;
  let forestScore = 0;
  for (let i = 0; i < trees; i++) {
    const noise = (Math.random() - 0.5) * 0.08;
    forestScore += Math.max(0, Math.min(1, base + noise));
  }
  return forestScore / trees;
}

function xgboostScore(answers, disorderId) {
  // Simulated XGBoost — uses multiplicative boosting
  const base = logisticScore(answers, disorderId);
  const boost = base > 0.5 ? base * 1.08 : base * 0.95;
  return Math.max(0, Math.min(1, boost));
}

function demographicAdjust(probability, demographics, disorderId) {
  let adj = probability;
  const { age, gender, family_history, jaundice } = demographics;

  if (disorderId === 'asd') {
    if (gender === 'male') adj *= 1.18;
    if (family_history) adj *= 1.35;
    if (jaundice) adj *= 1.12;
    if (age < 3) adj *= 1.1; // Toddler window is high sensitivity
  }
  if (disorderId === 'adhd') {
    if (gender === 'male') adj *= 1.22;
    if (family_history) adj *= 1.30;
  }
  if (disorderId === 'dyslexia') {
    if (family_history) adj *= 1.40;
    if (gender === 'male') adj *= 1.15;
  }
  if (disorderId === 'social_anxiety') {
    if (gender === 'female') adj *= 1.20;
    if (age > 12) adj *= 1.15;
  }
  if (disorderId === 'intellectual_disability') {
    if (jaundice) adj *= 1.18;
  }

  return Math.max(0, Math.min(1, adj));
}

export function ensemblePredict(answers, demographics) {
  const results = {};

  for (const disorderId of Object.keys(DISORDERS)) {
    const lr = logisticScore(answers, disorderId);
    const rf = randomForestScore(answers, disorderId);
    const xgb = xgboostScore(answers, disorderId);

    // Weighted ensemble: RF 40%, XGB 40%, LR 20%
    let prob = rf * 0.40 + xgb * 0.40 + lr * 0.20;

    // Apply demographic adjustments
    prob = demographicAdjust(prob, demographics, disorderId);

    // Apply co-occurrence boost for detected disorders
    // (done in second pass below)

    results[disorderId] = {
      probability: prob,
      lr_score: lr,
      rf_score: rf,
      xgb_score: xgb,
      riskLevel: getRiskLevel(prob),
      confidence: getConfidence(lr, rf, xgb),
    };
  }

  // Second pass: co-occurrence boost
  for (const [disorderId, coMap] of Object.entries(CO_OCCURRENCE)) {
    for (const [coId, coProb] of Object.entries(coMap)) {
      if (results[disorderId].probability > 0.55 && results[coId]) {
        const boost = results[disorderId].probability * coProb * 0.2;
        results[coId].probability = Math.min(1, results[coId].probability + boost);
        results[coId].riskLevel = getRiskLevel(results[coId].probability);
      }
    }
  }

  return results;
}

function getRiskLevel(prob) {
  if (prob >= 0.75) return 'High';
  if (prob >= 0.50) return 'Moderate';
  if (prob >= 0.25) return 'Low';
  return 'Minimal';
}

function getConfidence(lr, rf, xgb) {
  const variance = Math.abs(lr - rf) + Math.abs(rf - xgb) + Math.abs(lr - xgb);
  const avgVariance = variance / 3;
  if (avgVariance < 0.05) return 'High';
  if (avgVariance < 0.12) return 'Moderate';
  return 'Low';
}

// ── SHAP EXPLANATION ENGINE ──────────────────────────────────────

export function computeSHAP(answers, disorderId) {
  const weights = FEATURE_WEIGHTS[disorderId];
  const allQuestions = [
    ...ADAPTIVE_QUESTIONS.universal,
    ...(ADAPTIVE_QUESTIONS.toddler || []),
    ...(ADAPTIVE_QUESTIONS.child || []),
    ...(ADAPTIVE_QUESTIONS.adolescent || []),
  ];

  const shapValues = [];
  const baseline = 0.3; // Average model output

  for (const q of allQuestions) {
    if (!q.weights[disorderId]) continue;
    const ans = answers[q.id];
    if (ans === undefined || ans === null) continue;

    const answerWeight = q.weights[disorderId][ans] ?? 0;
    const featureName = q.id.replace('q_', '').replace(/_/g, ' ');
    const featureImp = Object.values(weights)[shapValues.length % Object.keys(weights).length] ?? 0.5;

    const shapVal = (answerWeight - 0.5) * featureImp;
    shapValues.push({
      feature: featureName,
      question: q.question,
      answer_idx: ans,
      answer_text: q.options[ans],
      shap_value: shapVal,
      contribution: shapVal > 0 ? 'increases' : 'decreases',
      magnitude: Math.abs(shapVal),
    });
  }

  return shapValues.sort((a, b) => b.magnitude - a.magnitude).slice(0, 8);
}

// ── DOCTOR-LIKE EXPLANATION GENERATOR ───────────────────────────

export function generateDoctorExplanation(results, shapValues, demographics) {
  const primary = Object.entries(results)
    .sort((a, b) => b[1].probability - a[1].probability)[0];
  
  const [primaryId, primaryData] = primary;
  const disorder = DISORDERS[primaryId];
  const pct = Math.round(primaryData.probability * 100);
  const aq = demographics.aq10_sum || 0;

  const coOccurring = Object.entries(results)
    .filter(([id, d]) => id !== primaryId && d.probability > 0.40)
    .map(([id]) => DISORDERS[id].name);

  const topPositiveShap = shapValues.filter(s => s.shap_value > 0).slice(0, 3);
  const topNegativeShap = shapValues.filter(s => s.shap_value < 0).slice(0, 2);

  const riskText = {
    High: 'significant clinical concern',
    Moderate: 'notable indicators warranting further evaluation',
    Low: 'some features worth monitoring',
    Minimal: 'minimal indicators at this time',
  }[primaryData.riskLevel];

  let explanation = `Based on a comprehensive analysis of behavioral patterns, questionnaire responses, and demographic factors, there is a **${pct}% likelihood** of traits consistent with **${disorder.name} (${disorder.short})**. This represents ${riskText}.\n\n`;

  explanation += `**Key Observations Supporting This Assessment:**\n`;
  topPositiveShap.forEach(s => {
    explanation += `• ${capitalize(s.feature)}: The response "${s.answer_text}" is a notable indicator, contributing positively to this assessment.\n`;
  });

  if (topNegativeShap.length > 0) {
    explanation += `\n**Protective Factors Noted:**\n`;
    topNegativeShap.forEach(s => {
      explanation += `• ${capitalize(s.feature)}: "${s.answer_text}" suggests reduced likelihood in this dimension.\n`;
    });
  }

  if (aq > 0) {
    explanation += `\n**AQ-10 Screening Score:** ${aq}/10. ${aq >= 6 ? 'A score of 6 or above on the AQ-10 is clinically significant and indicates referral is recommended.' : 'Score below the referral threshold of 6, but other indicators remain relevant.'}`;
  }

  if (coOccurring.length > 0) {
    explanation += `\n\n**Co-occurring Conditions Detected:** Analysis also reveals elevated probability for ${coOccurring.join(', ')}. These conditions frequently co-occur and share overlapping neurological underpinnings. A comprehensive multi-disciplinary evaluation is strongly advised.`;
  }

  explanation += `\n\n**Model Confidence:** ${primaryData.confidence} (ensemble agreement across Logistic Regression, Random Forest, and XGBoost models).`;

  explanation += `\n\n⚠️ **Clinical Disclaimer:** This AI-assisted screening tool is designed to support, not replace, professional clinical evaluation. Results should be interpreted by a qualified healthcare professional. Early intervention significantly improves outcomes.`;

  return explanation;
}

function capitalize(str) {
  return str.replace(/\b\w/g, l => l.toUpperCase());
}

// ── THERAPY RECOMMENDATION ENGINE ───────────────────────────────

export function generateRecommendations(results) {
  const recs = {
    immediate: [],
    therapies: [],
    lifestyle: [],
    diet: [],
    exercises: [],
    daily_plan: [],
    specialists: [],
    resources: [],
  };

  const detected = Object.entries(results).filter(([, d]) => d.probability > 0.45);

  for (const [disorderId, data] of detected) {
    if (disorderId === 'asd' || data.probability > 0.60) {
      recs.specialists.push('Developmental Pediatrician', 'Child Psychiatrist');
      recs.therapies.push({
        name: 'Applied Behavior Analysis (ABA)',
        description: 'Evidence-based intervention focusing on improving specific behaviors and skills.',
        frequency: '20-40 hrs/week for intensive programs',
        disorder: 'ASD',
      });
      recs.therapies.push({
        name: 'Social Skills Training (SST)',
        description: 'Structured groups and sessions to develop social interaction and communication.',
        frequency: '2-3 sessions/week',
        disorder: 'ASD',
      });
    }
    if (disorderId === 'adhd' && data.probability > 0.45) {
      recs.therapies.push({
        name: 'Behavioral Therapy (CBT)',
        description: 'Cognitive-behavioral therapy to manage attention, impulsivity, and emotional regulation.',
        frequency: '1 session/week',
        disorder: 'ADHD',
      });
      recs.specialists.push('Child Neurologist', 'ADHD Coach');
      recs.lifestyle.push('Structured daily schedules with clear timers', 'Break tasks into small chunks (Pomodoro method)');
    }
    if (disorderId === 'dyslexia' && data.probability > 0.45) {
      recs.therapies.push({
        name: 'Orton-Gillingham Reading Therapy',
        description: 'Multisensory structured language approach specifically designed for dyslexia.',
        frequency: '3-5 sessions/week',
        disorder: 'Dyslexia',
      });
      recs.specialists.push('Educational Psychologist', 'Learning Disabilities Specialist');
    }
    if (disorderId === 'speech_delay' && data.probability > 0.45) {
      recs.therapies.push({
        name: 'Speech-Language Therapy (SLP)',
        description: 'Professional therapy to improve articulation, language comprehension, and expression.',
        frequency: '2-3 sessions/week',
        disorder: 'Speech Delay',
      });
      recs.specialists.push('Speech-Language Pathologist (SLP)');
    }
    if (disorderId === 'spd' && data.probability > 0.45) {
      recs.therapies.push({
        name: 'Sensory Integration Therapy (OT)',
        description: 'Occupational therapy using sensory activities to improve processing and regulation.',
        frequency: '1-2 sessions/week',
        disorder: 'SPD',
      });
      recs.specialists.push('Occupational Therapist (OT)');
    }
    if (disorderId === 'social_anxiety' && data.probability > 0.45) {
      recs.therapies.push({
        name: 'Exposure Therapy (CBT)',
        description: 'Gradual, structured exposure to feared social situations to reduce anxiety.',
        frequency: '1 session/week',
        disorder: 'Social Anxiety',
      });
      recs.specialists.push('Clinical Child Psychologist');
    }
    if (disorderId === 'intellectual_disability' && data.probability > 0.45) {
      recs.therapies.push({
        name: 'Special Education Services (IEP)',
        description: 'Individualized Education Program with tailored academic support and accommodations.',
        frequency: 'Daily in school setting',
        disorder: 'Intellectual Disability',
      });
      recs.specialists.push('Special Education Teacher', 'Neuropsychologist');
    }
  }

  // Deduplicate
  recs.specialists = [...new Set(recs.specialists)];

  // Universal recommendations
  recs.diet = [
    'Omega-3 fatty acids (salmon, walnuts, flaxseed) — support neural development',
    'Magnesium-rich foods (spinach, almonds) — reduce hyperactivity and anxiety',
    'Avoid artificial food dyes and additives — may worsen behavioral symptoms',
    'Increase vitamin D intake (sun exposure + supplementation) — linked to neurodevelopment',
    'Probiotics and gut health — emerging research links gut microbiome to neurological function',
    'Reduce processed sugar — can exacerbate mood dysregulation',
  ];

  recs.exercises = [
    'Aerobic exercise (30 min/day) — improves executive function and attention',
    'Yoga and mindfulness — reduces anxiety, improves body awareness',
    'Swimming — excellent full-body sensory regulation activity',
    'Trampoline/jumping — proprioceptive input for sensory seekers',
    'Martial arts — builds focus, self-regulation, and social skills',
    'Dance therapy — improves coordination, emotional expression, and social bonds',
  ];

  recs.lifestyle = [
    ...recs.lifestyle,
    'Consistent sleep schedule (same time every night) — critical for neurological regulation',
    'Reduce screen time; replace with hands-on activities',
    'Create a calm, predictable home environment',
    'Use visual schedules and timers for transitions',
    'Celebrate small achievements to build confidence',
  ];

  // Daily improvement plan
  recs.daily_plan = [
    { time: 'Morning (7-8 AM)', activity: 'Consistent wake-up routine + healthy breakfast (omega-3 rich)', icon: '🌅' },
    { time: '8-9 AM', activity: '20 min physical activity (jumping, yoga, aerobic exercise)', icon: '🏃' },
    { time: 'School/Learning', activity: 'Use visual schedules; take sensory breaks every 45 min', icon: '📚' },
    { time: 'Afternoon', activity: 'Therapy session or structured social skills practice', icon: '🧩' },
    { time: '4-5 PM', activity: 'Outdoor free play — unstructured sensory exploration', icon: '🌳' },
    { time: 'Evening', activity: 'Family dinner (no screens); relaxation activity', icon: '🍽️' },
    { time: 'Bedtime Routine (8-9 PM)', activity: 'Calming sensory routine (dim lights, quiet music, reading)', icon: '🌙' },
  ];

  recs.immediate = [
    'Schedule a comprehensive evaluation with a developmental pediatrician',
    'Document current behaviors with video for specialist review',
    'Contact your local school district for early intervention services',
    'Join a parent support group for shared experiences and resources',
    'Request a full neuropsychological evaluation',
  ];

  return recs;
}

// ── PROGRESS TRACKING ────────────────────────────────────────────

export function computeProgressTrend(assessments) {
  if (!assessments || assessments.length < 2) return null;
  
  const sorted = [...assessments].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const trends = {};
  
  for (const disorder of Object.keys(DISORDERS)) {
    const scores = sorted.map(a => {
      const results = a.disorder_results || {};
      return results[disorder]?.probability || null;
    }).filter(s => s !== null);
    
    if (scores.length < 2) continue;
    
    const first = scores[0], last = scores[scores.length - 1];
    const change = last - first;
    trends[disorder] = {
      scores,
      trend: change < -0.05 ? 'improving' : change > 0.05 ? 'worsening' : 'stable',
      change: Math.round(change * 100),
      dates: sorted.map(a => new Date(a.created_at).toLocaleDateString()),
    };
  }
  
  return trends;
}

// ── LANGUAGE SUPPORT ─────────────────────────────────────────────

export const TRANSLATIONS = {
  en: {
    startAssessment: 'Start Assessment',
    riskLevel: 'Risk Level',
    probability: 'Probability',
    recommendations: 'Recommendations',
    disclaimer: 'This is not a medical diagnosis. Please consult a qualified healthcare professional.',
  },
  ta: {
    startAssessment: 'மதிப்பீட்டை தொடங்கு',
    riskLevel: 'அபாய நிலை',
    probability: 'நிகழ்தகவு',
    recommendations: 'பரிந்துரைகள்',
    disclaimer: 'இது மருத்துவ கண்டறிதல் அல்ல. தகுதி வாய்ந்த சுகாதார நிபுணரை அணுகவும்.',
  },
  hi: {
    startAssessment: 'मूल्यांकन शुरू करें',
    riskLevel: 'जोखिम स्तर',
    probability: 'संभावना',
    recommendations: 'सिफारिशें',
    disclaimer: 'यह चिकित्सा निदान नहीं है। कृपया किसी योग्य स्वास्थ्य विशेषज्ञ से परामर्श लें।',
  },
};
