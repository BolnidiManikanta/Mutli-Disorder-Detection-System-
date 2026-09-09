// ================================================================
//  NeuroScan AI — Global Interactive AI Assistance Bot Widget
//  Provides conversational guidance, 60-second quick screener,
//  voice recognition, text-to-speech, and instant clinical shortcuts.
// ================================================================

(function initAIAssistantBot() {
  function mountBot() {
    if (document.getElementById('neuroscan-ai-bot-root')) return;
    if (!document.body) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mountBot);
      } else {
        setTimeout(mountBot, 30);
      }
      return;
    }

    const isRoot = !window.location.pathname.includes('/pages/');
    const root = isRoot ? '' : '../';

    // 1. Inject Styles
    const style = document.createElement('style');
    style.id = 'neuroscan-bot-styles';
    style.textContent = `
    /* Floating Launcher Button */
    .ns-bot-launcher {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9998;
      display: flex;
      align-items: center;
      gap: 10px;
      background: linear-gradient(135deg, #1b4d3e, #2d6a4f);
      color: #fff;
      padding: 10px 18px 10px 14px;
      border-radius: 50px;
      border: 1.5px solid rgba(255,255,255,0.25);
      cursor: pointer;
      box-shadow: 0 8px 26px rgba(27, 77, 62, 0.38);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      user-select: none;
    }
    .ns-bot-launcher:hover {
      transform: translateY(-3px) scale(1.03);
      box-shadow: 0 12px 32px rgba(27, 77, 62, 0.48);
      background: linear-gradient(135deg, #164033, #245741);
    }
    .ns-bot-launcher-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.15rem;
      position: relative;
    }
    .ns-bot-launcher-avatar::after {
      content: '';
      position: absolute;
      bottom: -1px;
      right: -1px;
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #52b788;
      border: 2px solid #1b4d3e;
      animation: botPulse 2s infinite;
    }
    @keyframes botPulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.25); opacity: 0.6; }
    }
    .ns-bot-launcher-text {
      font-size: 0.88rem;
      font-weight: 700;
      letter-spacing: -0.01em;
      display: flex;
      flex-direction: column;
      line-height: 1.15;
    }
    .ns-bot-launcher-sub {
      font-size: 0.66rem;
      opacity: 0.8;
      font-weight: 500;
    }

    /* Bot Window */
    .ns-bot-window {
      position: fixed;
      bottom: 84px;
      right: 24px;
      width: 385px;
      max-width: calc(100vw - 32px);
      height: 560px;
      max-height: calc(100vh - 100px);
      background: #ffffff;
      border-radius: 18px;
      border: 1px solid rgba(0,0,0,0.08);
      box-shadow: 0 16px 48px rgba(10, 22, 40, 0.2);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 9999;
      opacity: 0;
      pointer-events: none;
      transform: translateY(18px) scale(0.96);
      transition: opacity 0.24s cubic-bezier(0.16, 1, 0.3, 1), transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .ns-bot-window.open {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0) scale(1);
    }
    .ns-bot-window.maximized {
      width: 520px;
      height: 720px;
    }

    /* Window Header */
    .ns-bot-header {
      background: linear-gradient(135deg, #0a1628, #1b3a5c);
      color: #fff;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .ns-bot-h-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2d6a4f, #52b788);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      flex-shrink: 0;
    }
    .ns-bot-h-info {
      flex: 1;
      min-width: 0;
    }
    .ns-bot-h-title {
      font-size: 0.92rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .ns-bot-h-badge {
      background: rgba(82, 183, 136, 0.25);
      color: #74c69d;
      border: 1px solid rgba(82, 183, 136, 0.4);
      font-size: 0.62rem;
      padding: 1px 6px;
      border-radius: 50px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .ns-bot-h-status {
      font-size: 0.7rem;
      color: rgba(255,255,255,0.7);
      margin-top: 2px;
    }
    .ns-bot-h-actions {
      display: flex;
      gap: 4px;
    }
    .ns-bot-btn-icon {
      background: rgba(255,255,255,0.1);
      border: none;
      color: #fff;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.82rem;
      transition: background 0.18s;
    }
    .ns-bot-btn-icon:hover {
      background: rgba(255,255,255,0.22);
    }

    /* Subheader Tabs */
    .ns-bot-nav {
      display: flex;
      background: #f4f6f9;
      border-bottom: 1px solid #e2e8f0;
      padding: 3px 6px;
      gap: 4px;
    }
    .ns-bot-nav-btn {
      flex: 1;
      padding: 7px 4px;
      border: none;
      background: transparent;
      border-radius: 8px;
      font-size: 0.74rem;
      font-weight: 700;
      color: #64748b;
      cursor: pointer;
      transition: all 0.18s;
      text-align: center;
      white-space: nowrap;
    }
    .ns-bot-nav-btn.active {
      background: #ffffff;
      color: #1b4d3e;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }

    /* Tab Panes */
    .ns-bot-pane {
      flex: 1;
      display: none;
      flex-direction: column;
      overflow: hidden;
      background: #fafbfd;
    }
    .ns-bot-pane.active {
      display: flex;
    }

    /* Chat Messages */
    .ns-bot-messages {
      flex: 1;
      overflow-y: auto;
      padding: 14px 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .ns-bot-msg {
      display: flex;
      gap: 8px;
      max-width: 86%;
    }
    .ns-bot-msg.user {
      align-self: flex-end;
      flex-direction: row-reverse;
    }
    .ns-bot-msg-av {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      background: #2d6a4f;
      color: #fff;
    }
    .ns-bot-msg.user .ns-bot-msg-av {
      background: #0284c7;
    }
    .ns-bot-bubble {
      padding: 10px 13px;
      border-radius: 14px;
      font-size: 0.82rem;
      line-height: 1.55;
      color: #1e293b;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }
    .ns-bot-msg.user .ns-bot-bubble {
      background: #1b4d3e;
      color: #ffffff;
      border-color: #1b4d3e;
    }
    .ns-bot-bubble p { margin: 0 0 6px; }
    .ns-bot-bubble p:last-child { margin-bottom: 0; }
    .ns-bot-bubble ul { margin: 4px 0; padding-left: 16px; }
    .ns-bot-bubble li { margin-bottom: 2px; }
    .ns-bot-bubble strong { font-weight: 700; }

    /* Action bar under bot bubble */
    .ns-bot-bubble-actions {
      display: flex;
      gap: 6px;
      margin-top: 4px;
    }
    .ns-bot-action-pill {
      font-size: 0.68rem;
      padding: 2px 7px;
      border-radius: 5px;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      color: #475569;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 3px;
      transition: all 0.15s;
    }
    .ns-bot-action-pill:hover {
      background: #e2e8f0;
      color: #1b4d3e;
    }

    /* Suggestions chips */
    .ns-bot-suggestions {
      padding: 8px 12px;
      display: flex;
      gap: 6px;
      overflow-x: auto;
      background: #ffffff;
      border-top: 1px solid #f1f5f9;
      flex-shrink: 0;
    }
    .ns-bot-chip {
      white-space: nowrap;
      padding: 5px 10px;
      border-radius: 50px;
      font-size: 0.72rem;
      font-weight: 600;
      background: #f1f5f9;
      color: #1b4d3e;
      border: 1px solid #e2e8f0;
      cursor: pointer;
      transition: all 0.16s;
      flex-shrink: 0;
    }
    .ns-bot-chip:hover {
      background: #e8f5e9;
      border-color: #52b788;
    }

    /* Chat Input */
    .ns-bot-input-bar {
      padding: 10px 12px;
      background: #ffffff;
      border-top: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ns-bot-input {
      flex: 1;
      padding: 9px 12px;
      border-radius: 10px;
      border: 1.5px solid #cbd5e1;
      font-size: 0.84rem;
      outline: none;
      transition: border-color 0.2s;
    }
    .ns-bot-input:focus {
      border-color: #1b4d3e;
    }
    .ns-bot-btn-send {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: #1b4d3e;
      color: #fff;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.95rem;
      transition: transform 0.15s, background 0.15s;
    }
    .ns-bot-btn-send:hover {
      background: #2d6a4f;
      transform: scale(1.05);
    }
    .ns-bot-btn-mic {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      transition: all 0.15s;
    }
    .ns-bot-btn-mic:hover {
      background: #e2e8f0;
      color: #1b4d3e;
    }
    .ns-bot-btn-mic.listening {
      background: #fee2e2;
      border-color: #ef4444;
      color: #dc2626;
      animation: botPulse 1.2s infinite;
    }

    /* Mini Screening Tab */
    .ns-screener-wrap {
      padding: 16px;
      overflow-y: auto;
      flex: 1;
    }
    .ns-screener-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      padding: 14px;
      margin-bottom: 12px;
    }
    .ns-screener-q-title {
      font-size: 0.82rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 8px;
    }
    .ns-screener-opt {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .ns-screener-btn {
      flex: 1;
      min-width: 80px;
      padding: 6px 10px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      font-size: 0.74rem;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
      transition: all 0.16s;
      text-align: center;
    }
    .ns-screener-btn.selected {
      background: #e8f5e9;
      border-color: #2d6a4f;
      color: #1b4d3e;
      font-weight: 700;
    }
    .ns-screener-result {
      background: linear-gradient(135deg, #f0fdf4, #e8f5e9);
      border: 1.5px solid #a7f3d0;
      border-radius: 12px;
      padding: 14px;
      text-align: center;
      margin-top: 10px;
      display: none;
    }

    /* Quick Tools Tab */
    .ns-tools-grid {
      padding: 16px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
      overflow-y: auto;
    }
    .ns-tool-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-radius: 12px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      text-decoration: none;
      color: #0f172a;
      transition: all 0.2s;
      cursor: pointer;
    }
    .ns-tool-item:hover {
      border-color: #2d6a4f;
      transform: translateX(3px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.04);
    }
    .ns-tool-icon {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      flex-shrink: 0;
    }
    .ns-tool-name {
      font-size: 0.85rem;
      font-weight: 700;
      color: #1e293b;
    }
    .ns-tool-desc {
      font-size: 0.72rem;
      color: #64748b;
      margin-top: 2px;
    }

    /* Typing bubble */
    .ns-bot-typing {
      display: flex;
      gap: 4px;
      padding: 8px 12px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      width: fit-content;
      align-items: center;
    }
    .ns-bot-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #94a3b8;
      animation: botPulse 1s infinite alternate;
    }
    .ns-bot-dot:nth-child(2) { animation-delay: 0.2s; }
    .ns-bot-dot:nth-child(3) { animation-delay: 0.4s; }

    @media (max-width: 480px) {
      .ns-bot-window {
        bottom: 0;
        right: 0;
        left: 0;
        width: 100vw;
        height: 85vh;
        max-width: 100vw;
        border-radius: 20px 20px 0 0;
      }
      .ns-bot-launcher {
        bottom: 16px;
        right: 16px;
        padding: 8px 14px;
      }
    }
  `;
  document.head.appendChild(style);

  // 2. Create Markup Container
  const rootDiv = document.createElement('div');
  rootDiv.id = 'neuroscan-ai-bot-root';
  rootDiv.innerHTML = `
    <!-- Floating Trigger -->
    <div class="ns-bot-launcher" id="nsBotLauncher" title="Open NeuroScan AI Assistant">
      <div class="ns-bot-launcher-avatar">🧠</div>
      <div class="ns-bot-launcher-text">
        <span>AI Assistant</span>
        <span class="ns-bot-launcher-sub">Real-Time Copilot</span>
      </div>
    </div>

    <!-- Bot Window -->
    <div class="ns-bot-window" id="nsBotWindow">
      <!-- Header -->
      <div class="ns-bot-header">
        <div class="ns-bot-h-avatar">🤖</div>
        <div class="ns-bot-h-info">
          <div class="ns-bot-h-title">
            NeuroScan AI Assistant
            <span class="ns-bot-h-badge">Live</span>
          </div>
          <div class="ns-bot-h-status">Powered by Google Gemini 3.8 Flash</div>
        </div>
        <div class="ns-bot-h-actions">
          <button class="ns-bot-btn-icon" id="nsBotSizeBtn" title="Expand/Shrink">⛶</button>
          <button class="ns-bot-btn-icon" id="nsBotCloseBtn" title="Close">✕</button>
        </div>
      </div>

      <!-- Tab Switcher -->
      <div class="ns-bot-nav">
        <button class="ns-bot-nav-btn active" data-tab="chat">💬 Copilot Chat</button>
        <button class="ns-bot-nav-btn" data-tab="quickcheck">⚡ 60s Quick Check</button>
        <button class="ns-bot-nav-btn" data-tab="tools">🚀 Quick Actions</button>
      </div>

      <!-- Tab 1: Chat -->
      <div class="ns-bot-pane active" id="nsPaneChat">
        <div class="ns-bot-messages" id="nsBotMessages">
          <!-- Initial greeting injected via JS -->
        </div>

        <!-- Quick suggestion chips -->
        <div class="ns-bot-suggestions" id="nsBotSuggestions">
          <button class="ns-bot-chip" onclick="window.nsSendPreset('What is the AQ-10 screening test?')">🧠 What is AQ-10?</button>
          <button class="ns-bot-chip" onclick="window.nsSendPreset('How does speech delay relate to Autism?')">🗣️ Speech Delay vs ASD</button>
          <button class="ns-bot-chip" onclick="window.nsSendPreset('Key differences between ADHD and Autism')">⚡ ADHD vs Autism</button>
          <button class="ns-bot-chip" onclick="window.nsSendPreset('How to manage sensory overload at home?')">🎧 Sensory Overload Tips</button>
        </div>

        <!-- Input Row -->
        <div class="ns-bot-input-bar">
          <button class="ns-bot-btn-mic" id="nsBotMicBtn" title="Voice Input (Speech-to-Text)">🎙️</button>
          <input type="text" class="ns-bot-input" id="nsBotInput" placeholder="Ask anything about screening, therapies…" />
          <button class="ns-bot-btn-send" id="nsBotSendBtn" title="Send message">➤</button>
        </div>
      </div>

      <!-- Tab 2: 60-Second Quick Screener -->
      <div class="ns-bot-pane" id="nsPaneQuickCheck">
        <div class="ns-screener-wrap">
          <div style="font-size:.84rem;color:#475569;margin-bottom:12px;line-height:1.45">
            Answer 3 quick pulse questions for an immediate developmental indicator:
          </div>

          <!-- Q1 -->
          <div class="ns-screener-card">
            <div class="ns-screener-q-title">1. Social Eye Gaze & Response to Name:</div>
            <div class="ns-screener-opt">
              <button class="ns-screener-btn" data-q="1" data-val="0" onclick="window.nsSelectOpt(this)">Consistent (Normal)</button>
              <button class="ns-screener-btn" data-q="1" data-val="1" onclick="window.nsSelectOpt(this)">Sometimes</button>
              <button class="ns-screener-btn" data-q="1" data-val="2" onclick="window.nsSelectOpt(this)">Rarely / Never</button>
            </div>
          </div>

          <!-- Q2 -->
          <div class="ns-screener-card">
            <div class="ns-screener-q-title">2. Repetitive Motor Stims or Sensory Distress:</div>
            <div class="ns-screener-opt">
              <button class="ns-screener-btn" data-q="2" data-val="0" onclick="window.nsSelectOpt(this)">None / Infrequent</button>
              <button class="ns-screener-btn" data-q="2" data-val="1" onclick="window.nsSelectOpt(this)">Moderate</button>
              <button class="ns-screener-btn" data-q="2" data-val="2" onclick="window.nsSelectOpt(this)">Intense / Daily</button>
            </div>
          </div>

          <!-- Q3 -->
          <div class="ns-screener-card">
            <div class="ns-screener-q-title">3. Speech & Spoken Milestone Timeline:</div>
            <div class="ns-screener-opt">
              <button class="ns-screener-btn" data-q="3" data-val="0" onclick="window.nsSelectOpt(this)">On Schedule</button>
              <button class="ns-screener-btn" data-q="3" data-val="1" onclick="window.nsSelectOpt(this)">Mild Delay</button>
              <button class="ns-screener-btn" data-q="3" data-val="2" onclick="window.nsSelectOpt(this)">Noticeable Delay</button>
            </div>
          </div>

          <!-- Live Result -->
          <div class="ns-screener-result" id="nsScreenerResult">
            <div style="font-size:1.1rem;font-weight:800;color:#1b4d3e" id="nsResultTitle">Indicator Calculated</div>
            <div style="font-size:.78rem;color:#475569;margin:6px 0 10px" id="nsResultDesc"></div>
            <div style="display:flex;gap:6px;justify-content:center">
              <a href="${root}pages/assess.html" class="ns-tool-item" style="padding:6px 12px;background:#1b4d3e;color:#fff;font-size:.75rem;border-radius:6px;text-decoration:none">
                🧠 Start Full Assessment
              </a>
              <a href="${root}pages/doctor-chat.html" class="ns-tool-item" style="padding:6px 12px;background:#fff;border:1px solid #1b4d3e;color:#1b4d3e;font-size:.75rem;border-radius:6px;text-decoration:none">
                👨‍⚕️ Ask Dr. NeuroScan
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 3: Quick Tools -->
      <div class="ns-bot-pane" id="nsPaneTools">
        <div class="ns-tools-grid">
          <a href="${root}pages/assess.html" class="ns-tool-item">
            <div class="ns-tool-icon">🧠</div>
            <div>
              <div class="ns-tool-name">Multi-Disorder Assessment</div>
              <div class="ns-tool-desc">Evaluates 7 conditions with Scikit-Learn ensemble & SHAP.</div>
            </div>
          </a>
          <a href="${root}pages/doctor-chat.html" class="ns-tool-item">
            <div class="ns-tool-icon">👨‍⚕️</div>
            <div>
              <div class="ns-tool-name">Dr. NeuroScan Clinical Chat</div>
              <div class="ns-tool-desc">Voice input, symptom builder & pediatric specialist advice.</div>
            </div>
          </a>
          <a href="${root}pages/speech.html" class="ns-tool-item">
            <div class="ns-tool-icon">🎙️</div>
            <div>
              <div class="ns-tool-name">Voice & Speech Acoustic Analysis</div>
              <div class="ns-tool-desc">Analyzes prosody, WPM, and audio developmental biomarkers.</div>
            </div>
          </a>
          <a href="${root}pages/recommendations.html" class="ns-tool-item">
            <div class="ns-tool-icon">💊</div>
            <div>
              <div class="ns-tool-name">Personalized Interventions & Diet</div>
              <div class="ns-tool-desc">Daily sensory routines, nutrition, and behavioral plans.</div>
            </div>
          </a>
          <a href="${root}pages/tracker.html" class="ns-tool-item">
            <div class="ns-tool-icon">📈</div>
            <div>
              <div class="ns-tool-name">Progress & Milestone Tracker</div>
              <div class="ns-tool-desc">Visual development charts and intervention timelines.</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(rootDiv);

  // 3. State & Logic
  const launcher = document.getElementById('nsBotLauncher');
  const windowEl = document.getElementById('nsBotWindow');
  const closeBtn = document.getElementById('nsBotCloseBtn');
  const sizeBtn  = document.getElementById('nsBotSizeBtn');
  const inputEl  = document.getElementById('nsBotInput');
  const sendBtn  = document.getElementById('nsBotSendBtn');
  const micBtn   = document.getElementById('nsBotMicBtn');
  const msgContainer = document.getElementById('nsBotMessages');

  let botHistory = [];
  let isBotTyping = false;
  let screenerAnswers = {};

  // Restore history from sessionStorage if exists
  try {
    const saved = sessionStorage.getItem('ns_bot_history');
    if (saved) {
      botHistory = JSON.parse(saved);
    }
  } catch(e) {}

  if (botHistory.length === 0) {
    botHistory.push({
      role: 'assistant',
      content: `Hello! I am your **NeuroScan AI Copilot**. 🌟\n\nI can answer questions on Autism (ASD), ADHD, Speech Delays, Sensory Diets, or walk you through our screening tools.\n\nHow can I help you today?`
    });
  }

  renderBotMessages();

  // Launcher toggle
  window.nsToggleBot = function(forceState) {
    if (!windowEl) return;
    if (typeof forceState === 'boolean') {
      windowEl.classList.toggle('open', forceState);
    } else {
      windowEl.classList.toggle('open');
    }
    if (windowEl.classList.contains('open')) {
      setTimeout(() => inputEl && inputEl.focus(), 150);
    }
  };

  launcher.addEventListener('click', () => {
    window.nsToggleBot();
  });

  closeBtn.addEventListener('click', () => {
    windowEl.classList.remove('open');
  });

  sizeBtn.addEventListener('click', () => {
    windowEl.classList.toggle('maximized');
  });

  // Tab Switching
  document.querySelectorAll('.ns-bot-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ns-bot-nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.ns-bot-pane').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const tab = btn.dataset.tab;
      if (tab === 'chat') document.getElementById('nsPaneChat').classList.add('active');
      if (tab === 'quickcheck') document.getElementById('nsPaneQuickCheck').classList.add('active');
      if (tab === 'tools') document.getElementById('nsPaneTools').classList.add('active');
    });
  });

  // Send Message Logic
  async function handleSend(textOverride = null) {
    const text = (textOverride !== null ? textOverride : inputEl.value).trim();
    if (!text || isBotTyping) return;

    if (textOverride === null) inputEl.value = '';
    
    botHistory.push({ role: 'user', content: text });
    renderBotMessages();
    saveBotHistory();

    showBotTyping();
    isBotTyping = true;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 25000);

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ messages: botHistory.slice(-5) }),
      }).finally(() => clearTimeout(timer));

      const data = await res.json();
      removeBotTyping();
      const reply = data.reply || "I am here to guide you with neurodevelopmental evaluations. What else would you like to know?";

      botHistory.push({ role: 'assistant', content: reply });
      renderBotMessages();
      saveBotHistory();

    } catch (err) {
      removeBotTyping();
      botHistory.push({
        role: 'assistant',
        content: "NeuroScan AI Assistant is currently active. For comprehensive assessments, try the **Take Assessment** tab or consult **Dr. NeuroScan AI**!"
      });
      renderBotMessages();
    }

    isBotTyping = false;
  }

  sendBtn.addEventListener('click', () => handleSend());
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  });

  window.nsSendPreset = function(q) {
    handleSend(q);
  };

  function renderBotMessages() {
    msgContainer.innerHTML = '';
    botHistory.forEach((msg, idx) => {
      const div = document.createElement('div');
      div.className = `ns-bot-msg ${msg.role}`;
      const av = msg.role === 'assistant' ? '🤖' : '👤';
      const msgId = `bot-msg-${idx}`;

      let actions = '';
      if (msg.role === 'assistant') {
        actions = `
          <div class="ns-bot-bubble-actions">
            <button class="ns-bot-action-pill" onclick="window.nsBotSpeak('${msgId}')">🔊 Read</button>
            <button class="ns-bot-action-pill" onclick="window.nsBotCopy('${msgId}', this)">📋 Copy</button>
          </div>
        `;
      }

      div.innerHTML = `
        <div class="ns-bot-msg-av">${av}</div>
        <div style="max-width:100%">
          <div class="ns-bot-bubble" id="${msgId}">${formatBotMarkdown(msg.content)}</div>
          ${actions}
        </div>
      `;
      msgContainer.appendChild(div);
    });
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }

  function formatBotMarkdown(t) {
    if (!t) return '';
    let safe = t
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    safe = safe.replace(/\*(.*?)\*/g, '<em>$1</em>');

    const lines = safe.split('\n');
    let inList = false;
    const out = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
        if (!inList) {
          out.push('<ul style="margin:4px 0;padding-left:18px">');
          inList = true;
        }
        out.push(`<li>${line.replace(/^[•\-\*]\s*/, '')}</li>`);
      } else {
        if (inList) {
          out.push('</ul>');
          inList = false;
        }
        if (line === '') {
          out.push('<div style="height:6px"></div>');
        } else {
          out.push(`<p style="margin:3px 0">${line}</p>`);
        }
      }
    }
    if (inList) out.push('</ul>');
    return out.join('');
  }

  function showBotTyping() {
    const div = document.createElement('div');
    div.id = 'nsBotTypingIndicator';
    div.className = 'ns-bot-msg assistant';
    div.innerHTML = `
      <div class="ns-bot-msg-av">🤖</div>
      <div class="ns-bot-typing">
        <div class="ns-bot-dot"></div>
        <div class="ns-bot-dot"></div>
        <div class="ns-bot-dot"></div>
      </div>
    `;
    msgContainer.appendChild(div);
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }

  function removeBotTyping() {
    document.getElementById('nsBotTypingIndicator')?.remove();
  }

  function saveBotHistory() {
    try {
      sessionStorage.setItem('ns_bot_history', JSON.stringify(botHistory.slice(-20)));
    } catch(e) {}
  }

  // Voice Input (Speech Recognition)
  let botSpeechRec = null;
  let isBotListening = false;
  micBtn.addEventListener('click', () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isBotListening) {
      if (botSpeechRec) botSpeechRec.stop();
      isBotListening = false;
      micBtn.classList.remove('listening');
      return;
    }

    botSpeechRec = new SpeechRec();
    botSpeechRec.continuous = false;
    botSpeechRec.interimResults = false;
    botSpeechRec.lang = 'en-US';

    botSpeechRec.onstart = () => {
      isBotListening = true;
      micBtn.classList.add('listening');
      inputEl.placeholder = 'Listening… speak now…';
    };

    botSpeechRec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      inputEl.value = transcript;
      handleSend(transcript);
    };

    botSpeechRec.onerror = () => {
      micBtn.classList.remove('listening');
      isBotListening = false;
      inputEl.placeholder = 'Ask anything about screening, therapies…';
    };

    botSpeechRec.onend = () => {
      micBtn.classList.remove('listening');
      isBotListening = false;
      inputEl.placeholder = 'Ask anything about screening, therapies…';
    };

    botSpeechRec.start();
  });

  // Text-To-Speech
  window.nsBotSpeak = function(id) {
    if (!('speechSynthesis' in window)) return;
    const el = document.getElementById(id);
    if (!el) return;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      return;
    }

    const text = el.innerText.trim();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 1.05;
    window.speechSynthesis.speak(utt);
  };

  window.nsBotCopy = function(id, btn) {
    const el = document.getElementById(id);
    if (!el) return;
    navigator.clipboard.writeText(el.innerText).then(() => {
      const orig = btn.innerHTML;
      btn.innerHTML = '✓ Copied';
      setTimeout(() => { btn.innerHTML = orig; }, 1600);
    });
  };

  // Quick Screener logic
  window.nsSelectOpt = function(btn) {
    const q = btn.dataset.q;
    const val = parseInt(btn.dataset.val, 10);

    btn.parentElement.querySelectorAll('.ns-screener-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    screenerAnswers[q] = val;

    if (Object.keys(screenerAnswers).length === 3) {
      calculateScreenerResult();
    }
  };

  function calculateScreenerResult() {
    const total = Object.values(screenerAnswers).reduce((a, b) => a + b, 0);
    const box = document.getElementById('nsScreenerResult');
    const title = document.getElementById('nsResultTitle');
    const desc = document.getElementById('nsResultDesc');

    box.style.display = 'block';

    if (total <= 1) {
      title.textContent = '🟢 Minimal / Low Traits';
      title.style.color = '#2d6a4f';
      desc.textContent = 'Reported milestones align with typical developmental expectations. Regular milestone monitoring recommended.';
    } else if (total <= 3) {
      title.textContent = '🟡 Moderate Behavioral Traits';
      title.style.color = '#b45309';
      desc.textContent = 'Some distinct behaviors or communication delays observed. We suggest our complete AQ-10 or Multi-Disorder assessment.';
    } else {
      title.textContent = '🔴 Elevated Traits Observed';
      title.style.color = '#b91c1c';
      desc.textContent = 'Significant indicators identified across gaze, speech, or repetitive patterns. We recommend a full clinical screening and pediatric consultation.';
    }
  }
}

  mountBot();
})();
