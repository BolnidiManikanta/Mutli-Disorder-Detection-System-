/**
 * NeuroScan AI — Learning Scoring Engine
 * Deterministic, reproducible scoring pipeline:
 * RAW RESPONSES → ITEM SCORES → ABILITY CONSTRUCT SCORES → DOMAIN SCORES → LEARNING PROFILE
 */

export const PERFORMANCE_BANDS = {
  LOW: { name: 'Low', min: 0, max: 40, color: '#c44b1b', bg: 'rgba(196,75,27,0.1)' },
  DEVELOPING: { name: 'Developing', min: 41, max: 60, color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
  AVERAGE: { name: 'Average', min: 61, max: 79, color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
  STRONG: { name: 'Strong', min: 80, max: 92, color: '#2d6a4f', bg: 'rgba(45,106,79,0.12)' },
  EXCEPTIONAL: { name: 'Exceptional', min: 93, max: 100, color: '#047857', bg: 'rgba(4,120,87,0.15)' }
};

export function getPerformanceBand(percentage) {
  const p = Math.round(percentage);
  if (p <= 40) return PERFORMANCE_BANDS.LOW;
  if (p <= 60) return PERFORMANCE_BANDS.DEVELOPING;
  if (p <= 79) return PERFORMANCE_BANDS.AVERAGE;
  if (p <= 92) return PERFORMANCE_BANDS.STRONG;
  return PERFORMANCE_BANDS.EXCEPTIONAL;
}

export class ScoringEngine {
  constructor(abilitiesRegistry = []) {
    this.abilities = abilitiesRegistry;
    this.abilitiesMap = new Map();
    abilitiesRegistry.forEach(a => this.abilitiesMap.set(a.code, a));
  }

  scoreAssessment(sessionPayload) {
    const responses = sessionPayload.responses || {};
    const abilityBuckets = {};

    // Group item responses by ability construct
    for (const [itemId, resp] of Object.entries(responses)) {
      const code = resp.abilityCode;
      if (!code) continue;

      if (!abilityBuckets[code]) {
        abilityBuckets[code] = {
          code,
          itemsCount: 0,
          rawScore: 0,
          maxScore: 0,
          correctCount: 0,
          totalLatencyMs: 0,
          items: []
        };
      }

      abilityBuckets[code].itemsCount++;
      abilityBuckets[code].rawScore += (resp.pointsEarned || 0);
      abilityBuckets[code].maxScore += (resp.maxPoints || 1);
      if (resp.isCorrect) abilityBuckets[code].correctCount++;
      abilityBuckets[code].totalLatencyMs += (resp.latencyMs || 0);
      abilityBuckets[code].items.push(resp);
    }

    // Calculate score metrics for each ability
    const abilityScores = [];
    for (const [code, bucket] of Object.entries(abilityBuckets)) {
      const meta = this.abilitiesMap.get(code) || {
        code,
        name: code,
        domain: 'Cognitive',
        construct: code,
        description: ''
      };

      const percentage = bucket.maxScore > 0 ? Math.round((bucket.rawScore / bucket.maxScore) * 100) : 0;
      const band = getPerformanceBand(percentage);
      const avgLatencyMs = bucket.itemsCount > 0 ? Math.round(bucket.totalLatencyMs / bucket.itemsCount) : 0;

      abilityScores.push({
        code,
        name: meta.name,
        domain: meta.domain || 'General',
        operation: meta.operation || 'Cognition',
        construct: meta.construct || meta.name,
        description: meta.description,
        educationalSignificance: meta.educationalSignificance,
        rawScore: bucket.rawScore,
        maxScore: bucket.maxScore,
        correctCount: bucket.correctCount,
        itemsCount: bucket.itemsCount,
        percentage,
        performanceBand: band.name,
        bandColor: band.color,
        bandBg: band.bg,
        avgLatencySeconds: (avgLatencyMs / 1000).toFixed(1),
        // Research reference cohort percentile heuristic (clearly identified as reference cohort)
        referenceCohortPercentile: Math.min(99, Math.max(1, Math.round(percentage * 0.95 + 2))),
        interpretation: meta.interpretationRules ? (
          percentage >= 75 ? meta.interpretationRules.strength : meta.interpretationRules.priority
        ) : ''
      });
    }

    // Sort abilities to extract Strongest and Development Priorities
    const sorted = [...abilityScores].sort((a, b) => b.percentage - a.percentage);
    const strongestAbilities = sorted.filter(a => a.percentage >= 65).slice(0, 4);
    const developmentPriorities = [...sorted].reverse().filter(a => a.percentage < 80).slice(0, 4);

    // If all are high, still pick relative lowest as priorities
    if (developmentPriorities.length === 0 && sorted.length > 0) {
      developmentPriorities.push(sorted[sorted.length - 1]);
    }

    // Calculate Domain Scores (Figural, Symbolic, Semantic)
    const domainScores = this.aggregateDomainScores(abilityScores);

    // Calculate Overall Index
    const totalRaw = abilityScores.reduce((s, a) => s + a.rawScore, 0);
    const totalMax = abilityScores.reduce((s, a) => s + a.maxScore, 0);
    const overallPercentage = totalMax > 0 ? Math.round((totalRaw / totalMax) * 100) : 0;

    return {
      assessmentId: sessionPayload.assessmentId,
      assessmentType: sessionPayload.assessmentType || 'PLA',
      learner: sessionPayload.learner,
      scoredAt: new Date().toISOString(),
      durationSeconds: sessionPayload.totalDurationSeconds || 0,
      totalItems: sessionPayload.totalItems || 0,
      answeredItems: sessionPayload.answeredItems || 0,
      overallPercentage,
      overallBand: getPerformanceBand(overallPercentage).name,
      abilityScores,
      domainScores,
      strongestAbilities,
      developmentPriorities,
      scoringVersion: "SCORING-v1.0",
      governanceNotice: "Research Prototype / Internal Reference Cohort. Deterministic scoring without AI hallucination."
    };
  }

  aggregateDomainScores(abilityScores) {
    const domains = {
      Figural: { name: 'Figural', raw: 0, max: 0, count: 0, abilities: [] },
      Symbolic: { name: 'Symbolic', raw: 0, max: 0, count: 0, abilities: [] },
      Semantic: { name: 'Semantic', raw: 0, max: 0, count: 0, abilities: [] }
    };

    abilityScores.forEach(a => {
      const d = domains[a.domain] || (domains[a.domain] = { name: a.domain, raw: 0, max: 0, count: 0, abilities: [] });
      d.raw += a.rawScore;
      d.max += a.maxScore;
      d.count++;
      d.abilities.push(a.code);
    });

    const result = {};
    for (const [key, d] of Object.entries(domains)) {
      const pct = d.max > 0 ? Math.round((d.raw / d.max) * 100) : 0;
      result[key] = {
        domain: key,
        rawScore: d.raw,
        maxScore: d.max,
        percentage: pct,
        band: getPerformanceBand(pct).name,
        abilityCount: d.count,
        abilityCodes: d.abilities
      };
    }
    return result;
  }
}
