// ================================================================
//  NeuroScan AI — Unified Assessment Session Architecture
//  Handles cross-modality session state, data persistence,
//  feature vector standardization, audit logging, and export.
// ================================================================

export const MODEL_VERSION = 'v2.4.0-multimodal';
export const FEATURE_SCHEMA_VERSION = 'v2.1';
export const CALIBRATION_VERSION = 'v1.2-isotonic';

export class AssessmentSessionManager {
  static STORAGE_KEY = 'neuroscan_assessment_sessions';
  static ACTIVE_SESSION_ID_KEY = 'neuroscan_active_session_id';

  /**
   * Create a new unified assessment session
   */
  static createSession(participant = {}) {
    const sessionId = `ns-sess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const session = {
      sessionId,
      participantId: participant.id || `pt-${Date.now().toString().slice(-6)}`,
      participantName: participant.name || 'Anonymous Participant',
      demographics: {
        age: parseFloat(participant.age) || 8,
        gender: participant.gender || 'm',
        jaundice: participant.jaundice === true || participant.jaundice === 'yes',
        familyHistory: participant.familyHistory === true || participant.familyHistory === 'yes'
      },
      assessmentDate: new Date().toISOString(),
      processingStatus: 'draft', // 'draft' | 'in_progress' | 'processing' | 'completed' | 'incomplete' | 'failed'
      modelVersion: MODEL_VERSION,
      featureSchemaVersion: FEATURE_SCHEMA_VERSION,
      calibrationVersion: CALIBRATION_VERSION,
      
      // Modality data containers
      questionnaireData: null,
      speechData: null,
      drawingData: null,
      cognitiveData: null,

      // Unified feature vector
      derivedFeatures: {},
      fusionFeatures: null,

      // Model evaluation outputs
      prediction: null,
      uncertainty: null,
      explanations: null,
      counterfactuals: null,

      // Data quality metrics
      dataQuality: {
        overall: 0,
        questionnaire: null,
        speech: null,
        drawing: null,
        cognitive: null,
        warnings: []
      },

      auditTrail: [
        {
          timestamp: new Date().toISOString(),
          event: 'SESSION_CREATED',
          details: 'Unified assessment session initialized'
        }
      ],

      timestamps: {
        created: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        completed: null
      }
    };

    const sessions = this.getAllSessions();
    sessions[sessionId] = session;
    this.saveAllSessions(sessions);
    this.setActiveSessionId(sessionId);
    return session;
  }

  /**
   * Retrieve active session or create one if none exists
   */
  static getActiveSession() {
    const activeId = localStorage.getItem(this.ACTIVE_SESSION_ID_KEY);
    const sessions = this.getAllSessions();
    if (activeId && sessions[activeId]) {
      return sessions[activeId];
    }
    // Return latest session or create new
    const keys = Object.keys(sessions);
    if (keys.length > 0) {
      const latest = sessions[keys[keys.length - 1]];
      this.setActiveSessionId(latest.sessionId);
      return latest;
    }
    return this.createSession();
  }

  static setActiveSessionId(sessionId) {
    localStorage.setItem(this.ACTIVE_SESSION_ID_KEY, sessionId);
  }

  static getSession(sessionId) {
    const sessions = this.getAllSessions();
    return sessions[sessionId] || null;
  }

  static getAllSessions() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Failed to read sessions from localStorage', e);
      return {};
    }
  }

  static saveAllSessions(sessions) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save sessions to localStorage', e);
    }
  }

  /**
   * Save or overwrite a complete session object
   */
  static saveSession(session) {
    if (!session || !session.sessionId) return null;
    const sessions = this.getAllSessions();
    if (!session.timestamps) session.timestamps = {};
    session.timestamps.lastUpdated = new Date().toISOString();
    this.updateDataQuality(session);
    this.syncDerivedFeatures(session);
    sessions[session.sessionId] = session;
    this.saveAllSessions(sessions);
    this.setActiveSessionId(session.sessionId);

    // Asynchronously push to server if available
    this.syncToServer(session).catch(() => {});

    return session;
  }

  /**
   * Save or update an assessment session
   */
  static updateSession(sessionId, updater) {
    const sessions = this.getAllSessions();
    let session = sessions[sessionId];
    if (!session) {
      session = this.createSession();
      sessionId = session.sessionId;
    }

    if (typeof updater === 'function') {
      session = updater(session) || session;
    } else if (typeof updater === 'object') {
      Object.assign(session, updater);
    }

    session.timestamps.lastUpdated = new Date().toISOString();
    this.updateDataQuality(session);
    this.syncDerivedFeatures(session);

    sessions[sessionId] = session;
    this.saveAllSessions(sessions);

    // Asynchronously push to server if available
    this.syncToServer(session).catch(() => {});

    return session;
  }

  /**
   * Update specific modality data
   */
  static recordModalityData(sessionId, modality, data) {
    return this.updateSession(sessionId, (session) => {
      if (modality === 'questionnaire') {
        session.questionnaireData = data;
        this.addAudit(session, 'QUESTIONNAIRE_UPDATED', `AQ-10 score: ${data.aq10_sum ?? 'N/A'}`);
      } else if (modality === 'speech') {
        session.speechData = data;
        this.addAudit(session, 'SPEECH_PROCESSED', `Duration: ${data.duration}s, WPM: ${data.wpm}`);
      } else if (modality === 'drawing') {
        session.drawingData = data;
        this.addAudit(session, 'DRAWING_PROCESSED', `Strokes: ${data.strokeCount}, Quality: ${data.qualityScore}%`);
      } else if (modality === 'cognitive') {
        session.cognitiveData = data;
        this.addAudit(session, 'COGNITIVE_COMPLETED', `Trials: ${data.trials?.length || 0}`);
      }

      if (session.processingStatus === 'draft') {
        session.processingStatus = 'in_progress';
      }
      return session;
    });
  }

  static addAudit(session, event, details = '') {
    if (!session.auditTrail) session.auditTrail = [];
    session.auditTrail.push({
      timestamp: new Date().toISOString(),
      event,
      details
    });
  }

  /**
   * Calculate quality indicators for all modalities
   */
  static updateDataQuality(session) {
    const warnings = [];
    const q = {
      questionnaire: null,
      speech: null,
      drawing: null,
      cognitive: null,
      overall: 0
    };

    let totalWeight = 0;
    let weightedSum = 0;

    // 1. Questionnaire quality
    if (session.questionnaireData) {
      let qScore = 95;
      const ansCount = Object.keys(session.questionnaireData.answers || {}).length;
      if (ansCount < 10) {
        qScore = Math.round((ansCount / 10) * 80);
        warnings.push({ modality: 'questionnaire', message: `Only ${ansCount}/10 questions answered.` });
      }
      q.questionnaire = qScore;
      weightedSum += qScore * 1.0;
      totalWeight += 1.0;
    }

    // 2. Speech quality
    if (session.speechData) {
      let sScore = session.speechData.qualityScore || 85;
      if (session.speechData.duration < 5) {
        sScore = Math.max(30, sScore - 40);
        warnings.push({ modality: 'speech', message: 'Audio recording is under 5 seconds, reducing statistical reliability.' });
      } else if (session.speechData.silenceRatio > 0.65) {
        sScore = Math.max(40, sScore - 25);
        warnings.push({ modality: 'speech', message: 'High background silence/inactivity detected (>65%).' });
      }
      q.speech = sScore;
      weightedSum += sScore * 1.0;
      totalWeight += 1.0;
    }

    // 3. Drawing quality
    if (session.drawingData) {
      let dScore = session.drawingData.qualityScore || 80;
      if (session.drawingData.strokeCount < 3 && !session.drawingData.imageUrl) {
        dScore = 40;
        warnings.push({ modality: 'drawing', message: 'Drawing has minimal stroke data (<3 strokes).' });
      }
      if (session.drawingData.isLowResolution) {
        dScore = Math.max(35, dScore - 30);
        warnings.push({ modality: 'drawing', message: 'Drawing resolution is below 400x300px threshold.' });
      }
      q.drawing = dScore;
      weightedSum += dScore * 1.0;
      totalWeight += 1.0;
    }

    // 4. Cognitive games quality
    if (session.cognitiveData) {
      let cScore = session.cognitiveData.qualityScore || 90;
      const trialCount = session.cognitiveData.trials?.length || 0;
      if (trialCount < 12) {
        cScore = Math.max(40, Math.round((trialCount / 20) * 85));
        warnings.push({ modality: 'cognitive', message: `Cognitive battery incomplete (${trialCount} trials recorded).` });
      }
      if (session.cognitiveData.unusuallyFastTrials > 2) {
        cScore = Math.max(30, cScore - 20);
        warnings.push({ modality: 'cognitive', message: 'Multiple anticipatory/premature responses detected (<150ms).' });
      }
      q.cognitive = cScore;
      weightedSum += cScore * 1.0;
      totalWeight += 1.0;
    }

    q.overall = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
    q.warnings = warnings;
    session.dataQuality = q;
  }

  /**
   * Synchronize derived standardized feature vector
   */
  static syncDerivedFeatures(session) {
    const f = {};

    // Demographics
    f['age'] = session.demographics?.age ?? 8;
    f['gender_num'] = session.demographics?.gender === 'm' ? 1 : 0;
    f['jaundice_num'] = session.demographics?.jaundice ? 1 : 0;
    f['austim_num'] = session.demographics?.familyHistory ? 1 : 0;

    // Questionnaire
    if (session.questionnaireData) {
      const qd = session.questionnaireData;
      for (let i = 1; i <= 10; i++) {
        f[`A${i}_Score`] = qd[`A${i}_Score`] ?? qd[`A${i}`] ?? 0;
      }
      f['aq10_sum'] = qd.aq10_sum ?? 0;
    }

    // Speech
    if (session.speechData) {
      const sp = session.speechData;
      f['speech_duration'] = sp.duration || 0;
      f['speech_wpm'] = sp.wpm || 0;
      f['speech_pause_frequency'] = sp.pauseFrequency || 0;
      f['speech_mean_pause'] = sp.meanPauseDuration || 0;
      f['speech_fluency_score'] = sp.fluencyScore || 0;
      f['speech_f0_pitch'] = sp.pitchF0 || 0;
      f['speech_vocabulary_diversity'] = sp.vocabularyDiversity || 0;
      f['speech_filled_pauses'] = sp.filledPausesCount || 0;
    }

    // Drawing
    if (session.drawingData) {
      const dr = session.drawingData;
      f['drawing_stroke_count'] = dr.strokeCount || 0;
      f['drawing_occupied_area'] = dr.occupiedAreaRatio || 0;
      f['drawing_spatial_symmetry'] = dr.symmetryIndex || 0;
      f['drawing_shape_complexity'] = dr.shapeComplexity || 0;
      f['drawing_line_tremor'] = dr.lineTremorIndex || 0;
    }

    // Cognitive
    if (session.cognitiveData) {
      const cg = session.cognitiveData;
      f['cog_reaction_time_mean'] = cg.meanReactionTime ?? cg.reactionTimeMean ?? 0;
      f['cog_reaction_time_variability'] = cg.reactionTimeVariability ?? cg.sdRT ?? 0;
      f['cog_working_memory_span'] = cg.workingMemorySpan ?? 0;
      f['cog_attention_accuracy'] = cg.attentionAccuracy ?? 0;
      f['cog_pattern_reasoning_acc'] = cg.patternReasoningAccuracy ?? 0;
    }

    session.derivedFeatures = f;
  }

  /**
   * Delete a session
   */
  static deleteSession(sessionId) {
    const sessions = this.getAllSessions();
    if (sessions[sessionId]) {
      delete sessions[sessionId];
      this.saveAllSessions(sessions);
    }
    if (localStorage.getItem(this.ACTIVE_SESSION_ID_KEY) === sessionId) {
      const remaining = Object.keys(sessions);
      if (remaining.length > 0) {
        this.setActiveSessionId(remaining[0]);
      } else {
        localStorage.removeItem(this.ACTIVE_SESSION_ID_KEY);
      }
    }
    // Asynchronously notify server
    fetch(`/api/session/${sessionId}`, { method: 'DELETE' }).catch(() => {});
  }

  /**
   * Export session as structured JSON
   */
  static exportSessionJSON(sessionId) {
    const session = this.getSession(sessionId);
    if (!session) return null;
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neuroscan-session-${session.sessionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return session;
  }

  /**
   * Export feature vector as CSV for authorized research use
   */
  static exportSessionCSV(sessionId) {
    const session = this.getSession(sessionId);
    if (!session || !session.derivedFeatures) return null;

    const headers = Object.keys(session.derivedFeatures);
    const values = headers.map(h => session.derivedFeatures[h]);

    const csvContent = [
      headers.join(','),
      values.map(v => typeof v === 'string' ? `"${v}"` : v).join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neuroscan-features-${session.sessionId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Sync with server backend
   */
  static async syncToServer(session) {
    try {
      const res = await fetch('/api/session/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session)
      });
      return await res.json();
    } catch (e) {
      // Offline fallback
      return { status: 'OFFLINE_SAVED_LOCALLY', local: true };
    }
  }
}
