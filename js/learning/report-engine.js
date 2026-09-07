/**
 * NeuroScan AI — Learning Report Engine
 * Generates professional, printable, multi-page HTML / PDF-ready educational assessment reports.
 */

export class ReportEngine {
  constructor(reportData) {
    this.data = reportData;
  }

  generateHtmlReport() {
    const profile = this.data.profile || {};
    const learner = profile.learner || { name: 'Learner Name', age: 10, grade: '5', schoolLevel: 'Elementary' };
    const program = this.data.program || null;
    const progress = this.data.progress || null;

    return `
      <div class="print-report-container" id="printableReport">
        <!-- REPORT HEADER -->
        <div class="report-header-banner">
          <div class="report-brand">
            <div class="report-logo-dot"></div>
            <div>
              <h2>NeuroScan AI</h2>
              <span class="report-subtitle">Learning Ability Assessment & Personalized Development Report</span>
            </div>
          </div>
          <div class="report-meta-box">
            <div><strong>Report Date:</strong> ${new Date(profile.scoredAt || Date.now()).toLocaleDateString()}</div>
            <div><strong>Assessment:</strong> ${profile.assessmentId || 'PLA-v1.0'} (${profile.assessmentType || 'PLA'})</div>
            <div><strong>Scoring Engine:</strong> ${profile.scoringVersion || 'SCORING-v1.0'}</div>
          </div>
        </div>

        <!-- LEARNER INFO STRIP -->
        <div class="report-learner-strip">
          <div class="learner-info-item">
            <span class="lbl">Learner Name</span>
            <strong class="val">${learner.name}</strong>
          </div>
          <div class="learner-info-item">
            <span class="lbl">Age / Grade</span>
            <strong class="val">${learner.age} yrs · Grade ${learner.grade || 'N/A'}</strong>
          </div>
          <div class="learner-info-item">
            <span class="lbl">Assessment Duration</span>
            <strong class="val">${Math.round((profile.durationSeconds || 0)/60)} minutes</strong>
          </div>
          <div class="learner-info-item">
            <span class="lbl">Overall Performance Index</span>
            <strong class="val" style="color:var(--primary)">${profile.overallPercentage || 0}% (${profile.overallBand || 'Average'})</strong>
          </div>
        </div>

        <!-- SECTION 1: LEARNING ABILITY PROFILE (PAGE 1) -->
        <div class="report-section page-break">
          <div class="report-section-title">
            <h3>1. Learning Ability Profile</h3>
            <span class="section-tag">Standardized 14-Construct Spectrum</span>
          </div>

          <p class="report-intro-text">
            The profile below maps relative cognitive and learning ability strengths across <strong>Figural</strong>, <strong>Symbolic</strong>, and <strong>Semantic</strong> domains. Scores represent measured accuracy and response efficiency across systematically calibrated diagnostic tasks.
          </p>

          <div class="report-ability-table">
            <div class="r-table-header">
              <div style="width:30%">Ability Construct</div>
              <div style="width:55%">Performance Spectrum (Low 0-40% | Dev 41-60% | Avg 61-79% | Strong 80-92% | Exc 93-100%)</div>
              <div style="width:15%;text-align:right">Score</div>
            </div>
            ${(profile.abilityScores || []).map(a => `
              <div class="r-table-row">
                <div class="r-name-col">
                  <strong>${a.code}</strong> <span style="font-size:.8rem;color:#475569">— ${a.construct || a.name}</span>
                </div>
                <div class="r-bar-col">
                  <div class="r-bar-track">
                    <div class="r-bar-fill" style="width:${a.percentage}%;background:${a.bandColor || '#2d6a4f'}"></div>
                  </div>
                </div>
                <div class="r-score-col" style="color:${a.bandColor || '#2d6a4f'}">
                  ${a.percentage}% · ${a.performanceBand}
                </div>
              </div>
            `).join('')}
          </div>

          <!-- STRENGTHS & PRIORITIES SUMMARY -->
          <div class="report-dual-summary">
            <div class="r-summary-box strength">
              <h4>✨ Demonstrated Relative Strengths</h4>
              <ul>
                ${(profile.strongestAbilities || []).map(s => `
                  <li><strong>${s.code} (${s.construct || s.name}) — ${s.percentage}%:</strong> ${s.educationalSignificance || s.description}</li>
                `).join('')}
              </ul>
            </div>
            <div class="r-summary-box priority">
              <h4>🎯 Priority Development Targets</h4>
              <ul>
                ${(profile.developmentPriorities || []).map(p => `
                  <li><strong>${p.code} (${p.construct || p.name}) — ${p.percentage}%:</strong> Targeted for systematic curriculum scaffolding.</li>
                `).join('')}
              </ul>
            </div>
          </div>
        </div>

        <!-- SECTION 2: PERSONALIZED TRAINING PROGRAM (PAGE 2) -->
        ${program ? `
          <div class="report-section page-break">
            <div class="report-section-title">
              <h3>2. Personalized Learning Development Program</h3>
              <span class="section-tag">${program.durationWeeks || 8}-Week Curriculum Plan</span>
            </div>

            <p class="report-intro-text">
              Based on the priority matrix generated from the learner's profile, the following structured curriculum provides daily targeted exercises designed to develop underlying cognitive processing efficiency.
            </p>

            <div class="report-program-grid">
              ${(program.weeklySchedule?.[0]?.dailyPlan || []).map(d => `
                <div class="r-day-card">
                  <div class="r-day-hdr">${d.day} · ${d.durationMinutes} Min</div>
                  <strong class="r-day-title">${d.title}</strong>
                  <div class="r-day-meta">Ability: <strong>${d.abilityCode}</strong> · ${d.modality}</div>
                  <p class="r-day-obj">${d.objective}</p>
                </div>
              `).join('')}
            </div>

            <div class="specialist-signoff-box">
              <div class="signoff-field">
                <span class="lbl">Learning Specialist Signature:</span>
                <div class="sign-line"></div>
              </div>
              <div class="signoff-field">
                <span class="lbl">Assessment Review Date:</span>
                <div class="sign-line">${new Date().toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- SECTION 3: BEFORE / AFTER REASSESSMENT (IF APPLICABLE) -->
        ${progress && progress.comparisons ? `
          <div class="report-section">
            <div class="report-section-title">
              <h3>3. Longitudinal Progress & Reassessment Comparison</h3>
              <span class="section-tag">Baseline vs. Current Trajectory</span>
            </div>

            <div class="report-progress-table">
              <table style="width:100%;border-collapse:collapse">
                <thead>
                  <tr style="background:#f1f5f9;text-align:left;font-size:.8rem">
                    <th style="padding:10px">Ability</th>
                    <th style="padding:10px">Baseline</th>
                    <th style="padding:10px">Current</th>
                    <th style="padding:10px">Observed Change</th>
                    <th style="padding:10px">Trajectory Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${progress.comparisons.map(c => `
                    <tr style="border-bottom:1px solid #e2e8f0;font-size:.85rem">
                      <td style="padding:10px"><strong>${c.code}</strong> — ${c.name}</td>
                      <td style="padding:10px">${c.baselineScore}%</td>
                      <td style="padding:10px"><strong>${c.currentScore}%</strong></td>
                      <td style="padding:10px;font-weight:700;color:${c.change >= 0 ? '#2d6a4f' : '#c44b1b'}">${c.changeFormatted}</td>
                      <td style="padding:10px">${c.status.replace('_', ' ')}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}

        <!-- GOVERNANCE & RESEARCH DISCLAIMER FOOTER -->
        <div class="report-disclaimer-footer">
          <p>
            <strong>Research & Demonstration Governance:</strong> NeuroScan AI Learning Development assessments and reports are educational profiling tools designed for developmental curriculum planning and cognitive training scaffolding. They do not constitute clinical diagnoses or formal psychiatric evaluations.
          </p>
        </div>
      </div>
    `;
  }
}
