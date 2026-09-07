/**
 * NeuroScan AI — Learning Ability Profile Engine
 * Generates horizontal ability profile charts, domain summaries,
 * constructive educational interpretations, and development priorities.
 */

import { PERFORMANCE_BANDS } from './scoring-engine.js';

export class ProfileEngine {
  constructor(profileData) {
    this.profile = profileData;
  }

  renderAbilityBarChart(containerId, filterDomain = 'ALL') {
    const container = document.getElementById(containerId);
    if (!container) return;

    let list = this.profile.abilityScores || [];
    if (filterDomain !== 'ALL') {
      list = list.filter(a => a.domain.toUpperCase() === filterDomain.toUpperCase());
    }

    if (list.length === 0) {
      container.innerHTML = `<div style="padding:24px;text-align:center;color:var(--muted)">No ability scores match the selected filter.</div>`;
      return;
    }

    const html = `
      <div class="ability-profile-table">
        <div class="profile-scale-header">
          <div class="scale-label-col">Ability Construct</div>
          <div class="scale-bar-col">
            <span style="left:0%">0</span>
            <span style="left:40%">Low (40%)</span>
            <span style="left:60%">Dev (60%)</span>
            <span style="left:80%">Avg (80%)</span>
            <span style="left:92%">Strong (92%)</span>
            <span style="right:0">100%</span>
          </div>
          <div class="scale-score-col">Score</div>
        </div>
        <div class="ability-rows-container">
          ${list.map(a => this.renderSingleAbilityRow(a)).join('')}
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  renderSingleAbilityRow(a) {
    const pct = Math.max(0, Math.min(100, a.percentage));
    const bandInfo = PERFORMANCE_BANDS[a.performanceBand?.toUpperCase()] || PERFORMANCE_BANDS.AVERAGE;
    
    return `
      <div class="ability-profile-row" data-code="${a.code}" onclick="window.showAbilityModal && window.showAbilityModal('${a.code}')">
        <div class="ability-info-cell">
          <div class="ability-badge-domain ${a.domain?.toLowerCase()}">${a.domain}</div>
          <div class="ability-code-title">
            <strong>${a.code}</strong> — <span>${a.construct || a.name}</span>
          </div>
        </div>

        <div class="ability-bar-cell">
          <div class="ability-track-bg">
            <!-- Reference band zones -->
            <div class="zone zone-low" style="left:0;width:40%"></div>
            <div class="zone zone-dev" style="left:40%;width:20%"></div>
            <div class="zone zone-avg" style="left:60%;width:20%"></div>
            <div class="zone zone-str" style="left:80%;width:12%"></div>
            <div class="zone zone-exc" style="left:92%;width:8%"></div>

            <!-- Measured fill bar -->
            <div class="ability-fill-bar" style="width:${pct}%;background:${bandInfo.color}">
              <span class="ability-fill-thumb"></span>
            </div>
          </div>
        </div>

        <div class="ability-metrics-cell">
          <span class="ability-pct" style="color:${bandInfo.color}">${pct}%</span>
          <span class="ability-band-tag" style="background:${bandInfo.bg};color:${bandInfo.color}">${a.performanceBand}</span>
        </div>
      </div>
    `;
  }

  renderDomainCards(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const domains = this.profile.domainScores || {};
    const html = Object.values(domains).map(d => {
      const color = d.domain === 'Figural' ? '#2d6a4f' : d.domain === 'Symbolic' ? '#2563eb' : '#d97706';
      return `
        <div class="domain-summary-card">
          <div class="domain-card-hdr">
            <h4 style="color:${color}">${d.domain} Abilities</h4>
            <span class="domain-card-score" style="background:${color}15;color:${color}">${d.percentage}% · ${d.band}</span>
          </div>
          <div class="domain-progress-bar">
            <div class="domain-progress-fill" style="width:${d.percentage}%;background:${color}"></div>
          </div>
          <div class="domain-card-footer">
            <span>${d.abilityCount} constructs assessed</span>
            <span>Raw: ${d.rawScore}/${d.maxScore}</span>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = html;
  }

  renderPriorityBreakdown(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const strengths = this.profile.strongestAbilities || [];
    const priorities = this.profile.developmentPriorities || [];

    const html = `
      <div class="priority-split-grid">
        <div class="strength-panel">
          <div class="panel-badge strength"><span class="icon">✨</span> Demonstrated Strengths</div>
          <p class="panel-subtext">Cognitive abilities where the learner demonstrated high accuracy and efficient processing.</p>
          <div class="priority-items-list">
            ${strengths.map(s => `
              <div class="priority-item-card strength">
                <div class="p-card-top">
                  <strong>${s.code} · ${s.construct || s.name}</strong>
                  <span class="p-card-pct" style="color:var(--primary)">${s.percentage}%</span>
                </div>
                <p class="p-card-desc">${s.description || ''}</p>
                <div class="p-card-action">
                  <strong>Educational Significance:</strong> ${s.educationalSignificance || 'Provides a strong foundation for rapid comprehension.'}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="priority-panel">
          <div class="panel-badge priority"><span class="icon">🎯</span> Development Priorities</div>
          <p class="panel-subtext">Targeted abilities identified for systematic development in the personalized training program.</p>
          <div class="priority-items-list">
            ${priorities.map(p => `
              <div class="priority-item-card priority">
                <div class="p-card-top">
                  <strong>${p.code} · ${p.construct || p.name}</strong>
                  <span class="p-card-pct" style="color:var(--accent-d)">${p.percentage}%</span>
                </div>
                <p class="p-card-desc">${p.description || ''}</p>
                <div class="p-card-action">
                  <strong>Targeted Development:</strong> Focus on structured exercises and progressive difficulty scaffolding.
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }
}
