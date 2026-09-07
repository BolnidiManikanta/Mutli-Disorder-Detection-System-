/**
 * NeuroScan AI — Learning Assessment Session Engine
 * Orchestrates PLA and ALA assessment sessions with autosave, section timing,
 * state recovery, answer verification, and final scoring package compilation.
 */

export class AssessmentSession {
  constructor(config) {
    this.assessmentId = config.assessmentId || 'PLA-v1.0';
    this.title = config.title || 'Learning Abilities Assessment';
    this.type = config.type || 'PLA'; // 'PLA' | 'ALA' | 'REASSESSMENT'
    this.targetDurationMinutes = config.targetDurationMinutes || 90;
    this.sections = config.sections || [];
    this.learner = config.learner || { id: 'demo-learner', name: 'Learner', age: 10, grade: '5' };
    this.onStateChange = config.onStateChange || (() => {});
    this.onComplete = config.onComplete || (() => {});
    
    this.state = {
      sessionId: `sess_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      currentSectionIndex: 0,
      currentItemIndex: 0,
      responses: {}, // { [itemId]: { selectedIndex, isCorrect, latencyMs, timestamp } }
      sectionStartTimes: {},
      isPaused: false,
      isCompleted: false,
      startedAt: new Date().toISOString(),
      completedAt: null,
      totalElapsedSeconds: 0,
      sectionElapsedSeconds: 0
    };

    this.timerInterval = null;
    this.storageKey = `neuroscan_learning_session_${this.type}_${this.learner.id || 'default'}`;
  }

  init() {
    // Attempt recovery from localStorage if active session exists
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && !parsed.isCompleted && parsed.assessmentId === this.assessmentId) {
          this.state = { ...this.state, ...parsed };
          console.log('🔄 Restored in-progress assessment session:', this.state.sessionId);
        }
      } catch (e) {
        console.warn('Could not parse stored session:', e);
      }
    }

    this.startTimer();
    this.saveState();
    this.notify();
    return this;
  }

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (!this.state.isPaused && !this.state.isCompleted) {
        this.state.totalElapsedSeconds++;
        this.state.sectionElapsedSeconds++;
        this.notify();
        // Autosave every 10 seconds
        if (this.state.totalElapsedSeconds % 10 === 0) {
          this.saveState();
        }
      }
    }, 1000);
  }

  getCurrentSection() {
    return this.sections[this.state.currentSectionIndex] || null;
  }

  getCurrentItem() {
    const sec = this.getCurrentSection();
    return sec ? sec.items[this.state.currentItemIndex] || null : null;
  }

  getTotalItemsCount() {
    return this.sections.reduce((sum, sec) => sum + (sec.items ? sec.items.length : 0), 0);
  }

  getAnsweredItemsCount() {
    return Object.keys(this.state.responses).length;
  }

  getCompletionPercentage() {
    const total = this.getTotalItemsCount();
    if (total === 0) return 0;
    return Math.round((this.getAnsweredItemsCount() / total) * 100);
  }

  recordAnswer(selectedIndex, latencyMs = 0) {
    const item = this.getCurrentItem();
    const section = this.getCurrentSection();
    if (!item || !section || this.state.isCompleted) return;

    const isCorrect = (selectedIndex === item.correctIndex);
    this.state.responses[item.id] = {
      itemId: item.id,
      abilityCode: item.abilityCode || section.abilityCode,
      sectionId: section.sectionId,
      selectedIndex,
      correctIndex: item.correctIndex,
      isCorrect,
      pointsEarned: isCorrect ? (item.points || 1) : 0,
      maxPoints: item.points || 1,
      difficulty: item.difficulty || 1,
      latencyMs: latencyMs || 0,
      timestamp: new Date().toISOString()
    };

    this.saveState();
    this.notify();
  }

  nextItem() {
    const sec = this.getCurrentSection();
    if (!sec) return;

    if (this.state.currentItemIndex < sec.items.length - 1) {
      this.state.currentItemIndex++;
    } else if (this.state.currentSectionIndex < this.sections.length - 1) {
      this.state.currentSectionIndex++;
      this.state.currentItemIndex = 0;
      this.state.sectionElapsedSeconds = 0;
    } else {
      // Reached the end
      this.completeSession();
      return;
    }

    this.saveState();
    this.notify();
  }

  previousItem() {
    if (this.state.currentItemIndex > 0) {
      this.state.currentItemIndex--;
    } else if (this.state.currentSectionIndex > 0) {
      this.state.currentSectionIndex--;
      const prevSec = this.sections[this.state.currentSectionIndex];
      this.state.currentItemIndex = prevSec.items.length - 1;
    }
    this.saveState();
    this.notify();
  }

  jumpToSection(sectionIndex) {
    if (sectionIndex >= 0 && sectionIndex < this.sections.length) {
      this.state.currentSectionIndex = sectionIndex;
      this.state.currentItemIndex = 0;
      this.state.sectionElapsedSeconds = 0;
      this.saveState();
      this.notify();
    }
  }

  togglePause() {
    this.state.isPaused = !this.state.isPaused;
    this.saveState();
    this.notify();
    return this.state.isPaused;
  }

  completeSession() {
    if (this.state.isCompleted) return;
    this.state.isCompleted = true;
    this.state.completedAt = new Date().toISOString();
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.saveState();
    this.notify();
    this.onComplete(this.compilePayload());
  }

  compilePayload() {
    return {
      sessionId: this.state.sessionId,
      assessmentId: this.assessmentId,
      assessmentType: this.type,
      learner: this.learner,
      startedAt: this.state.startedAt,
      completedAt: this.state.completedAt,
      totalDurationSeconds: this.state.totalElapsedSeconds,
      totalItems: this.getTotalItemsCount(),
      answeredItems: this.getAnsweredItemsCount(),
      responses: this.state.responses,
      version: "1.0.0"
    };
  }

  saveState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }

  clearSavedSession() {
    localStorage.removeItem(this.storageKey);
  }

  notify() {
    this.onStateChange(this.getStateSummary());
  }

  getStateSummary() {
    const sec = this.getCurrentSection();
    const item = this.getCurrentItem();
    return {
      sessionId: this.state.sessionId,
      type: this.type,
      currentSectionIndex: this.state.currentSectionIndex,
      totalSections: this.sections.length,
      currentSection: sec,
      currentItemIndex: this.state.currentItemIndex,
      totalSectionItems: sec ? sec.items.length : 0,
      currentItem: item,
      totalItems: this.getTotalItemsCount(),
      answeredCount: this.getAnsweredItemsCount(),
      percentComplete: this.getCompletionPercentage(),
      isPaused: this.state.isPaused,
      isCompleted: this.state.isCompleted,
      totalElapsedSeconds: this.state.totalElapsedSeconds,
      sectionElapsedSeconds: this.state.sectionElapsedSeconds,
      currentResponse: item ? this.state.responses[item.id] : null
    };
  }
}
