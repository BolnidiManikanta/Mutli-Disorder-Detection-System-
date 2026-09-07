/**
 * NeuroScan AI — Learning Progress Engine
 * Aggregates training activity sessions, baseline vs reassessment profiles,
 * and calculates ability trajectory shifts (+Δ).
 */

export class ProgressEngine {
  constructor(learnerId, progressData = {}) {
    this.learnerId = learnerId;
    this.data = progressData;
  }

  calculateComparativeProgress(baselineProfile, currentProfile) {
    if (!baselineProfile || !currentProfile) return null;

    const baseMap = new Map();
    (baselineProfile.abilityScores || []).forEach(a => baseMap.set(a.code, a));

    const comparisons = [];
    (currentProfile.abilityScores || []).forEach(curr => {
      const base = baseMap.get(curr.code) || { percentage: 0, rawScore: 0 };
      const change = curr.percentage - base.percentage;
      
      let status = 'MAINTAINED';
      if (change >= 8) status = 'IMPROVED';
      else if (change <= -8) status = 'NEEDS_FOCUS';

      comparisons.push({
        code: curr.code,
        name: curr.construct || curr.name,
        domain: curr.domain,
        baselineScore: base.percentage,
        currentScore: curr.percentage,
        change,
        changeFormatted: change >= 0 ? `+${change}%` : `${change}%`,
        status,
        baselineBand: base.performanceBand || 'N/A',
        currentBand: curr.performanceBand
      });
    });

    // Domain Comparisons
    const domainComparisons = {};
    const baseDomains = baselineProfile.domainScores || {};
    const currDomains = currentProfile.domainScores || {};

    ['Figural', 'Symbolic', 'Semantic'].forEach(d => {
      const bPct = baseDomains[d]?.percentage || 0;
      const cPct = currDomains[d]?.percentage || 0;
      const diff = cPct - bPct;
      domainComparisons[d] = {
        domain: d,
        baseline: bPct,
        current: cPct,
        change: diff,
        changeFormatted: diff >= 0 ? `+${diff}%` : `${diff}%`
      };
    });

    return {
      learnerId: this.learnerId,
      comparedAt: new Date().toISOString(),
      baselineAssessmentId: baselineProfile.assessmentId,
      currentAssessmentId: currentProfile.assessmentId,
      comparisons,
      domainComparisons,
      improvedCount: comparisons.filter(c => c.status === 'IMPROVED').length,
      maintainedCount: comparisons.filter(c => c.status === 'MAINTAINED').length,
      needsFocusCount: comparisons.filter(c => c.status === 'NEEDS_FOCUS').length
    };
  }

  renderComparisonTable(containerId, comparisonResult) {
    const container = document.getElementById(containerId);
    if (!container || !comparisonResult) return;

    const html = `
      <div class="table-responsive">
        <table class="progress-comp-table">
          <thead>
            <tr>
              <th>Ability Construct</th>
              <th>Domain</th>
              <th>Baseline</th>
              <th>Current</th>
              <th>Observed Change</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${comparisonResult.comparisons.map(c => {
              const badgeClass = c.change > 0 ? 'badge-improved' : c.change < 0 ? 'badge-regressed' : 'badge-neutral';
              return `
                <tr>
                  <td><strong>${c.code}</strong> · ${c.name}</td>
                  <td><span class="domain-tag ${c.domain.toLowerCase()}">${c.domain}</span></td>
                  <td>${c.baselineScore}%</td>
                  <td><strong>${c.currentScore}%</strong></td>
                  <td>
                    <span class="change-pill ${badgeClass}">${c.changeFormatted}</span>
                  </td>
                  <td><span class="status-tag ${c.status.toLowerCase()}">${c.status.replace('_', ' ')}</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = html;
  }
}
