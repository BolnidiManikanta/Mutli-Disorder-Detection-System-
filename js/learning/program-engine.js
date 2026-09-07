/**
 * NeuroScan AI — Personalized Learning Development Program Engine
 * Translates Learning Ability Profiles into structured:
 * ABILITY → MODULE → EXERCISES training pathways with scheduled weekly plans.
 */

export class ProgramEngine {
  constructor(abilitiesRegistry = [], modulesRegistry = [], activitiesRegistry = []) {
    this.abilities = abilitiesRegistry;
    this.modules = modulesRegistry;
    this.activities = activitiesRegistry;
  }

  generateProgram(learningProfile, options = {}) {
    const learner = learningProfile.learner || { id: 'learner-001', name: 'Learner', age: 10, grade: '5' };
    const priorities = learningProfile.developmentPriorities || [];
    const strengths = learningProfile.strongestAbilities || [];
    const durationWeeks = options.durationWeeks || 8;
    const targetMinutesPerDay = options.targetMinutesPerDay || 25;

    // 1. Calculate Development Priority Matrix
    const priorityMatrix = this.calculatePriorityMatrix(learningProfile);

    // 2. Select targeted modules for the top priority abilities
    const targetedModules = [];
    priorityMatrix.slice(0, 4).forEach((pm, idx) => {
      const abilityModules = this.modules.filter(m => m.abilityCode === pm.abilityCode);
      if (abilityModules.length > 0) {
        targetedModules.push({
          priorityRank: idx + 1,
          abilityCode: pm.abilityCode,
          abilityName: pm.abilityName,
          domain: pm.domain,
          measuredScore: pm.percentage,
          weight: pm.weight,
          modules: abilityModules
        });
      }
    });

    // 3. Assemble Weekly Scheduled Program
    const weeklySchedule = this.buildWeeklySchedule(targetedModules, strengths, durationWeeks, targetMinutesPerDay);

    return {
      programId: `prog_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      learnerId: learner.id,
      learnerName: learner.name,
      assessmentId: learningProfile.assessmentId,
      createdAt: new Date().toISOString(),
      status: 'ACTIVE',
      durationWeeks,
      targetMinutesPerDay,
      priorityMatrix,
      targetedModules,
      weeklySchedule,
      specialistNotes: "Program initialized based on PLA/ALA profile. Focus on visual-spatial analogical deduction and symbolic pattern discovery.",
      version: "CURRICULUM-v1.0"
    };
  }

  calculatePriorityMatrix(profile) {
    const abilityScores = profile.abilityScores || [];
    
    // Transparent priority formula:
    // Score Deficit Weight (100 - percentage) * 0.65 + Domain Balancing Factor * 0.35
    return abilityScores.map(a => {
      const deficit = 100 - a.percentage;
      const weight = Math.round(deficit * 0.75 + (a.rawScore === 0 ? 15 : 0));
      return {
        abilityCode: a.code,
        abilityName: a.construct || a.name,
        domain: a.domain,
        percentage: a.percentage,
        performanceBand: a.performanceBand,
        deficitScore: deficit,
        priorityWeight: weight,
        urgency: a.percentage < 50 ? 'HIGH' : a.percentage < 70 ? 'MEDIUM' : 'LOW'
      };
    }).sort((a, b) => b.priorityWeight - a.priorityWeight);
  }

  buildWeeklySchedule(targetedModules, strengths, durationWeeks, targetMinutes) {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeks = [];

    for (let w = 1; w <= durationWeeks; w++) {
      const weekPlan = {
        weekNumber: w,
        theme: w <= 2 ? 'Foundation & Strategy Acquisition' : w <= 5 ? 'Core Skill Consolidation' : 'Speed, Precision & Transfer',
        dailyPlan: []
      };

      daysOfWeek.forEach((day, dIdx) => {
        let primaryModule = targetedModules[dIdx % (targetedModules.length || 1)];
        let exercise = null;

        if (primaryModule && primaryModule.modules.length > 0) {
          const mod = primaryModule.modules[0];
          const exIdx = (w + dIdx) % (mod.exercises.length || 1);
          exercise = mod.exercises[exIdx] || mod.exercises[0];
        }

        if (day === 'Saturday') {
          // Saturday is Enrichment using a demonstrated strength
          const strengthAbility = strengths[0] || { code: 'CFU', construct: 'Visual Closure' };
          weekPlan.dailyPlan.push({
            day,
            type: 'ENRICHMENT',
            abilityCode: strengthAbility.code,
            title: `${strengthAbility.code} Creative Challenge`,
            durationMinutes: 20,
            modality: 'Digital / Interactive Game',
            difficultyLevel: Math.min(5, Math.ceil(w / 2) + 1),
            objective: `Leverage high performance in ${strengthAbility.code} to build confidence.`
          });
        } else {
          weekPlan.dailyPlan.push({
            day,
            type: 'TARGETED_TRAINING',
            abilityCode: primaryModule ? primaryModule.abilityCode : 'CFR',
            title: exercise ? exercise.name : `${primaryModule?.abilityCode || 'Core'} Training`,
            durationMinutes: targetMinutes,
            modality: dIdx % 2 === 0 ? 'Digital Interactive' : 'Printable / Specialist-Led',
            difficultyLevel: Math.min(5, Math.ceil(w / 2)),
            objective: `Targeted practice for ${primaryModule ? primaryModule.abilityName : 'cognitive development'}.`
          });
        }
      });

      weeks.push(weekPlan);
    }

    return weeks;
  }
}
