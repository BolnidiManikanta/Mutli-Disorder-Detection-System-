/**
 * NeuroScan AI — Learning Activity Engine
 * Runs interactive cognitive training exercises with real-time feedback,
 * 5-level difficulty adaptation, and performance logging.
 */

export class ActivitySessionRunner {
  constructor(activityData, config = {}) {
    this.activity = activityData;
    this.learner = config.learner || { id: 'learner-001', name: 'Learner' };
    this.currentLevel = config.startingLevel || activityData.difficulty || 1;
    this.onProgress = config.onProgress || (() => {});
    this.onFinish = config.onFinish || (() => {});

    this.state = {
      sessionId: `act_sess_${Date.now()}`,
      activityId: activityData.id,
      abilityCodes: activityData.abilityCodes || [],
      currentLevel: this.currentLevel,
      currentItemIndex: 0,
      totalItems: 5,
      correctCount: 0,
      errorCount: 0,
      hintsUsed: 0,
      elapsedSeconds: 0,
      isCompleted: false,
      itemResults: []
    };

    this.timer = null;
    this.activeExercises = this.generateExercisesForLevel(this.currentLevel);
    this.state.totalItems = this.activeExercises.length;
  }

  start() {
    this.state.elapsedSeconds = 0;
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (!this.state.isCompleted) {
        this.state.elapsedSeconds++;
        this.notify();
      }
    }, 1000);
    this.notify();
  }

  getCurrentItem() {
    return this.activeExercises[this.state.currentItemIndex] || null;
  }

  submitAnswer(selectedAnswerIndex, latencyMs = 0) {
    const item = this.getCurrentItem();
    if (!item || this.state.isCompleted) return;

    const isCorrect = (selectedAnswerIndex === item.correctIndex);
    if (isCorrect) {
      this.state.correctCount++;
    } else {
      this.state.errorCount++;
    }

    this.state.itemResults.push({
      itemIndex: this.state.currentItemIndex,
      stimulus: item.stimulus,
      selectedAnswerIndex,
      correctIndex: item.correctIndex,
      isCorrect,
      latencyMs,
      difficultyLevel: this.state.currentLevel
    });

    if (this.state.currentItemIndex < this.activeExercises.length - 1) {
      this.state.currentItemIndex++;
    } else {
      this.finishSession();
      return;
    }

    this.notify();
    return isCorrect;
  }

  finishSession() {
    if (this.state.isCompleted) return;
    this.state.isCompleted = true;
    if (this.timer) clearInterval(this.timer);

    const accuracy = Math.round((this.state.correctCount / this.state.totalItems) * 100);
    const avgLatency = Math.round(
      this.state.itemResults.reduce((s, r) => s + r.latencyMs, 0) / (this.state.itemResults.length || 1)
    );

    // Adaptive Difficulty Decision Logic
    let nextLevel = this.state.currentLevel;
    let adaptationReason = "Performance within optimal training range. Maintain current difficulty.";

    if (accuracy >= 80 && this.state.currentLevel < 5) {
      nextLevel = this.state.currentLevel + 1;
      adaptationReason = `High mastery (${accuracy}% accuracy). Difficulty promoted to Level ${nextLevel}.`;
    } else if (accuracy < 60 && this.state.currentLevel > 1) {
      nextLevel = this.state.currentLevel - 1;
      adaptationReason = `Accuracy below 60%. Difficulty calibrated down to Level ${nextLevel} for reinforcement.`;
    }

    const payload = {
      sessionId: this.state.sessionId,
      activityId: this.activity.id,
      activityName: this.activity.name,
      abilityCodes: this.activity.abilityCodes,
      learnerId: this.learner.id,
      completedAt: new Date().toISOString(),
      durationSeconds: this.state.elapsedSeconds,
      levelCompleted: this.state.currentLevel,
      accuracy,
      correctCount: this.state.correctCount,
      totalItems: this.state.totalItems,
      avgLatencyMs: avgLatency,
      nextRecommendedLevel: nextLevel,
      adaptationReason,
      itemResults: this.state.itemResults
    };

    this.notify();
    this.onFinish(payload);
    return payload;
  }

  notify() {
    this.onProgress({
      ...this.state,
      currentItem: this.getCurrentItem(),
      progressPercent: Math.round(((this.state.currentItemIndex + (this.state.isCompleted ? 1 : 0)) / this.state.totalItems) * 100)
    });
  }

  generateExercisesForLevel(lvl) {
    const type = this.activity.interactiveType || 'analogy_grid';

    if (type === 'analogy_grid') {
      return [
        {
          stimulus: `[▲ pointing Up, Blue] : [▼ pointing Down, Orange] :: [■ with Solid Border, Blue] : ?`,
          prompt: `Select the corresponding transformed figure:`,
          options: [`■ with Dashed Border, Orange`, `▲ with Solid Border, Blue`, `● with No Border, Green`, `◆ in Blue`],
          correctIndex: 0,
          explanation: `Inversion of orientation/border type and color shift (Blue -> Orange).`
        },
        {
          stimulus: `[Circle with 1 horizontal stripe] : [Circle with 2 vertical stripes] :: [Square with 1 horizontal stripe] : ?`,
          prompt: `Identify the analogous transformation:`,
          options: [`Square with 2 vertical stripes`, `Square with 1 vertical stripe`, `Triangle with 2 horizontal stripes`, `Diamond in solid red`],
          correctIndex: 0,
          explanation: `Orientation shifts from horizontal to vertical, count increments from 1 to 2.`
        },
        {
          stimulus: `[Outer Hexagon containing Inner Dot] : [Outer Dot containing Inner Hexagon] :: [Outer Pentagon containing Inner Star] : ?`,
          prompt: `Select the role-reversal pattern:`,
          options: [`Outer Star containing Inner Pentagon`, `Outer Pentagon with 2 Stars`, `Outer Circle with Pentagon`, `Solid Star`],
          correctIndex: 0,
          explanation: `Container and content roles invert.`
        },
        {
          stimulus: `[Grid Row 1 Shaded] : [Grid Column 1 Shaded] :: [Grid Diagonal Shaded] : ?`,
          prompt: `What is the 90-degree orthogonal transformation?`,
          options: [`Opposite Anti-Diagonal Shaded`, `Grid Center Shaded`, `All Cells Shaded`, `Perimeter Shaded`],
          correctIndex: 0,
          explanation: `Reflective orthogonal rotation transforms main diagonal to anti-diagonal.`
        }
      ];
    } else if (type === 'sequence_solver') {
      return [
        {
          stimulus: `Sequence: 4, 9, 14, 19, 24, ?`,
          prompt: `What is the next number?`,
          options: [`29`, `27`, `31`, `34`],
          correctIndex: 0,
          explanation: `Common difference +5.`
        },
        {
          stimulus: `Sequence: 3, 6, 12, 24, 48, ?`,
          prompt: `Find the next value in the geometric series:`,
          options: [`96`, `72`, `84`, `108`],
          correctIndex: 0,
          explanation: `Multiplier *2.`
        },
        {
          stimulus: `Dual Stream: 10, A, 20, B, 30, C, ?`,
          prompt: `What is the next term in the alternating stream?`,
          options: [`40`, `D`, `35`, `E`],
          correctIndex: 0,
          explanation: `Even positions step +10 (10, 20, 30 -> 40).`
        },
        {
          stimulus: `Fibonacci Series: 2, 3, 5, 8, 13, ?`,
          prompt: `What is the next sum term?`,
          options: [`21`, `18`, `20`, `25`],
          correctIndex: 0,
          explanation: `8 + 13 = 21.`
        }
      ];
    } else {
      // Default cognitive discrimination
      return [
        {
          stimulus: `Set: [Equilateral Triangle, Regular Octagon, Square, Scalene Triangle]`,
          prompt: `Which shape violates the regular polygon classification rule?`,
          options: [`Scalene Triangle (unequal sides/angles)`, `Square`, `Regular Octagon`, `Equilateral Triangle`],
          correctIndex: 0,
          explanation: `All others are equilateral and equiangular regular polygons.`
        },
        {
          stimulus: `Relationship: MICROSCOPE : CELL :: TELESCOPE : ?`,
          prompt: `Complete the conceptual tool analogy:`,
          options: [`GALAXY / STAR`, `LABORATORY`, `EYEPIECE`, `THERMOMETER`],
          correctIndex: 0,
          explanation: `A microscope magnifies microscopic cells; a telescope magnifies distant celestial bodies.`
        },
        {
          stimulus: `Equation Balance: 4y + 12 = 36`,
          prompt: `Solve for y:`,
          options: [`6`, `4`, `8`, `12`],
          correctIndex: 0,
          explanation: `4y = 24 -> y = 6.`
        },
        {
          stimulus: `Pattern Recall: [★ Star, ◆ Diamond, ▲ Triangle, ● Circle]`,
          prompt: `Which shape was in the 2nd position?`,
          options: [`◆ Diamond`, `★ Star`, `▲ Triangle`, `● Circle`],
          correctIndex: 0,
          explanation: `Diamond was at position 2.`
        }
      ];
    }
  }
}
