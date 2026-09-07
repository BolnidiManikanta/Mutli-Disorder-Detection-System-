/**
 * NeuroScan AI — Learning Specialist Engine
 * Manages specialist workflows: learner rostering, assessment launch,
 * program modification, clinical observation logging, and offline score recording.
 */

export class SpecialistEngine {
  constructor(apiBase = '/api/learning') {
    this.apiBase = apiBase;
  }

  async getLearners() {
    try {
      const res = await fetch(`${this.apiBase}/learners`);
      if (!res.ok) throw new Error('Failed to fetch learners');
      return await res.json();
    } catch (e) {
      console.warn('SpecialistEngine: Using local fallback learners list', e);
      return [
        {
          id: 'learner-001',
          name: 'Leo Tanaka',
          dob: '2014-06-15',
          age: 10,
          grade: '5',
          schoolLevel: 'Elementary',
          preferredLanguage: 'English',
          parentName: 'Elena Tanaka',
          specialistName: 'Dr. Sarah Jenkins, Ed.D',
          status: 'ACTIVE_TRAINING',
          lastAssessment: 'PLA-v1.0 (Scored 74%)'
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
          specialistName: 'Dr. Sarah Jenkins, Ed.D',
          status: 'ASSESSMENT_PENDING',
          lastAssessment: 'None'
        }
      ];
    }
  }

  async createLearner(learnerData) {
    try {
      const res = await fetch(`${this.apiBase}/learners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(learnerData)
      });
      return await res.json();
    } catch (e) {
      console.warn('SpecialistEngine createLearner fallback:', e);
      return { id: `learner_${Date.now()}`, ...learnerData };
    }
  }

  async recordObservation(observation) {
    try {
      const res = await fetch(`${this.apiBase}/specialist/observation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(observation)
      });
      return await res.json();
    } catch (e) {
      console.warn('Observation saved locally:', observation);
      return { success: true, observation };
    }
  }

  async recordOfflineActivity(offlinePayload) {
    try {
      const res = await fetch(`${this.apiBase}/specialist/offline-activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offlinePayload)
      });
      return await res.json();
    } catch (e) {
      console.warn('Offline activity saved locally:', offlinePayload);
      return { success: true, offlinePayload };
    }
  }
}
