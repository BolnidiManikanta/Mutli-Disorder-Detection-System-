/* =============================================
   SHARED.JS — nav, modals, auth guard, toast
   NeuroScan AI Global Shared Infrastructure
   ============================================= */
import { onAuthChange, firebaseSignOut, getUserDoc } from './mongodb.js';

// ── GLOBAL AUTH STATE ──────────────────────────────────────
window.APP = { user: null, userDoc: null };

// ── LAYOUT INJECTION ───────────────────────────────────────
(function injectLayout() {
  const isRoot = !window.location.pathname.includes('/pages/');
  const root   = isRoot ? '' : '../';

  const NAV = `
<nav class="navbar">
  <div class="nav-inner">
    <a class="nav-logo" href="${root}index.html">
      <div class="nav-logo-icon">🧠</div>
      <span>NeuroScan AI</span>
    </a>
    <ul class="nav-links">
      <li><a class="nav-link" href="${root}index.html">Home</a></li>
      <li><a class="nav-link" href="${root}pages/assess.html">🧠 AI Screening</a></li>
      <li class="nav-item nav-dropdown">
        <a class="nav-link nav-dropdown-toggle" href="${root}pages/learning-assessment.html">🎓 Learning Suite</a>
        <div class="nav-dropdown-menu">
          <a class="nav-dropdown-item" href="${root}pages/learning-assessment.html">
            <div>
              <strong>📝 PLA / ALA Assessment</strong>
              <span class="sub-desc">14 Primary &amp; 30 Advanced abilities</span>
            </div>
          </a>
          <a class="nav-dropdown-item" href="${root}pages/learning-profile.html">
            <div>
              <strong>📊 Ability Profile</strong>
              <span class="sub-desc">Cognitive domain strengths &amp; priorities</span>
            </div>
          </a>
          <a class="nav-dropdown-item" href="${root}pages/learning-program.html">
            <div>
              <strong>🎯 Training Program</strong>
              <span class="sub-desc">8-Week adaptive developmental plan</span>
            </div>
          </a>
          <a class="nav-dropdown-item" href="${root}pages/learning-progress.html">
            <div>
              <strong>📈 Progress &amp; Reports</strong>
              <span class="sub-desc">Quantified shifts &amp; printable reports</span>
            </div>
          </a>
        </div>
      </li>
      <li><a class="nav-link" href="${root}pages/tracker.html">📈 Progress</a></li>
      <li><a class="nav-link" href="${root}pages/doctor-chat.html">👨‍⚕️ AI Doctor</a></li>
      <li><a class="nav-link" href="${root}pages/media-analysis.html">📤 Upload &amp; Detect</a></li>
      <li><a class="nav-link" href="${root}pages/dashboard.html">📊 Dashboard</a></li>
    </ul>
    <div class="nav-actions" id="navAuthArea">
      <button class="btn btn-outline btn-sm" onclick="window.location.href='${root}pages/auth.html'">Sign In</button>
      <button class="btn btn-primary btn-sm" onclick="window.location.href='${root}pages/assess.html'">Start Assessment</button>
    </div>
    <button class="nav-hamburger" id="navHamburger" aria-label="Toggle Navigation">
      <span></span><span></span><span></span>
    </button>
  </div>
</nav>
<div class="nav-drawer" id="navDrawer">
  <div class="nav-drawer-content">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--border)">
      <a class="nav-logo" href="${root}index.html" style="padding:0">
        <div class="nav-logo-icon">🧠</div>
        <span>NeuroScan AI</span>
      </a>
      <button id="closeDrawerBtn" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:var(--text-muted)">&times;</button>
    </div>

    <div class="drawer-section-title">Core Platform</div>
    <a href="${root}index.html">🏠 Home</a>
    <a href="${root}pages/assess.html">🧠 AI Clinical Screening</a>
    <a href="${root}pages/media-analysis.html">📤 Upload &amp; Detect</a>
    <a href="${root}pages/doctor-chat.html">👨‍⚕️ AI Doctor Chat</a>
    <a href="${root}pages/speech-analysis.html">🎙️ Speech AI Analysis</a>
    <a href="${root}pages/emotion-detect.html">👁️ Emotion Detection</a>

    <div class="drawer-section-title">Learning Development Suite</div>
    <a href="${root}pages/learning-assessment.html">🎓 PLA / ALA Assessment</a>
    <a href="${root}pages/learning-profile.html">📊 Learning Ability Profile</a>
    <a href="${root}pages/learning-program.html">🎯 8-Week Training Program</a>
    <a href="${root}pages/learning-progress.html">📈 Longitudinal Progress &amp; Reports</a>

    <div class="drawer-section-title">User Account</div>
    <a href="${root}pages/dashboard.html">📊 Clinical &amp; Learning Dashboard</a>
    <a href="${root}pages/tracker.html">📈 Progress Tracker</a>
    <a href="${root}pages/history.html">📜 Assessment History</a>
    <a href="${root}pages/profile.html">👤 User Profile</a>

    <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border)" id="drawerAuthArea">
      <button class="btn btn-primary btn-full btn-sm" onclick="window.location.href='${root}pages/auth.html'">Sign In / Register</button>
    </div>
  </div>
</div>`;

  const FOOTER = `
<footer class="footer">
  <div class="footer-inner">
    <div class="footer-top">
      <div class="footer-brand">
        <a class="nav-logo" href="${root}index.html">
          <div class="nav-logo-icon">🧠</div>
          <span>NeuroScan AI</span>
        </a>
        <p>AI-powered neurodevelopmental screening and personalized learning-development research platform. Supporting parents, clinicians, and educators with explainable AI.</p>
      </div>
      <div class="footer-col">
        <h5>Platform</h5>
        <ul>
          <li><a href="${root}pages/assess.html">AI Disorder Screening</a></li>
          <li><a href="${root}pages/learning-assessment.html">Learning Development</a></li>
          <li><a href="${root}pages/doctor-chat.html">AI Doctor Chat</a></li>
          <li><a href="${root}pages/media-analysis.html">Media Analysis</a></li>
          <li><a href="${root}pages/speech-analysis.html">Speech Biomarkers</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h5>Learning Suite</h5>
        <ul>
          <li><a href="${root}pages/learning-assessment.html">PLA Assessment (14 Abilities)</a></li>
          <li><a href="${root}pages/learning-assessment.html">ALA Assessment (30 Abilities)</a></li>
          <li><a href="${root}pages/learning-profile.html">Diagnostic Ability Profile</a></li>
          <li><a href="${root}pages/learning-program.html">Adaptive 8-Week Training</a></li>
          <li><a href="${root}pages/learning-progress.html">Progress Reports &amp; Notes</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h5>Account &amp; Info</h5>
        <ul>
          <li><a href="${root}pages/dashboard.html">Dashboard</a></li>
          <li><a href="${root}pages/history.html">Assessment History</a></li>
          <li><a href="${root}pages/profile.html">User Profile</a></li>
          <li><a href="${root}pages/about.html">Methodology &amp; Research</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 NeuroScan AI · Research prototype &amp; educational tool · Not a substitute for medical diagnosis.</span>
      <span>Kaggle ML Olympiad &amp; Cognitive Research Architecture</span>
    </div>
  </div>
</footer>`;

  const navEl    = document.getElementById('nav-ph');
  const footerEl = document.getElementById('footer-ph');

  if (navEl) {
    navEl.innerHTML = NAV;
  } else if (!document.querySelector('.navbar')) {
    document.body.insertAdjacentHTML('afterbegin', NAV);
  }

  if (footerEl) {
    footerEl.innerHTML = FOOTER;
  } else if (!document.querySelector('.footer')) {
    document.body.insertAdjacentHTML('beforeend', FOOTER);
  }
})();

// ── ACTIVE NAV LINK & INTERACTION ──────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  const page = path.split('/').pop() || 'index.html';

  document.querySelectorAll('.nav-links a, .nav-drawer a').forEach(a => {
    const href = a.getAttribute('href');
    if (href && (href.endsWith(page) || (page === '' && href.endsWith('index.html')))) {
      a.classList.add('active');
    }
  });

  // Mobile Drawer Toggle
  const hb = document.getElementById('navHamburger');
  const dr = document.getElementById('navDrawer');
  const closeBtn = document.getElementById('closeDrawerBtn');

  if (hb && dr) {
    hb.addEventListener('click', (e) => {
      e.stopPropagation();
      dr.classList.toggle('open');
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => dr.classList.remove('open'));
    }

    dr.addEventListener('click', (e) => {
      if (e.target === dr) dr.classList.remove('open');
    });
  }

  // Animate any progress bars on page
  setTimeout(() => {
    document.querySelectorAll('.progress-fill[data-w]').forEach(b => {
      b.style.transition = 'width 1s ease';
      b.style.width = b.dataset.w;
    });
  }, 300);
});

// ── AUTH STATE → update nav ────────────────────────────────
onAuthChange(async (user) => {
  window.APP.user = user;
  const isRoot = !window.location.pathname.includes('/pages/');
  const root   = isRoot ? '' : '../';
  const navAuth    = document.getElementById('navAuthArea');
  const drawerAuth = document.getElementById('drawerAuthArea');

  if (user) {
    window.APP.userDoc = await getUserDoc(user.uid).catch(() => null);
    const avatar = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName||'U')}&background=1b4d3e&color=fff&size=32`;
    const authHTML = `
      <a href="${root}pages/history.html" class="btn btn-ghost btn-sm">My History</a>
      <a href="${root}pages/profile.html" style="display:flex;align-items:center;gap:8px;text-decoration:none;padding:4px 8px;border-radius:var(--r-sm);background:var(--bg-subtle)">
        <img src="${avatar}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;border:1.5px solid var(--primary)" onerror="this.src='https://ui-avatars.com/api/?name=U&background=1b4d3e&color=fff&size=32'"/>
        <span style="font-size:.82rem;font-weight:700;color:var(--text);max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${user.displayName?.split(' ')[0] || 'My Account'}</span>
      </a>`;
    if (navAuth)    navAuth.innerHTML    = authHTML;
    if (drawerAuth) drawerAuth.innerHTML = authHTML;
  } else {
    const signInHTML = `
      <button class="btn btn-outline btn-sm" onclick="window.location.href='${root}pages/auth.html'">Sign In</button>
      <button class="btn btn-primary btn-sm" onclick="window.location.href='${root}pages/assess.html'">Start Screening</button>`;
    if (navAuth)    navAuth.innerHTML    = signInHTML;
    if (drawerAuth) drawerAuth.innerHTML = signInHTML;
  }
});

// ── AUTH GUARD (call from protected pages) ─────────────────
window.requireAuth = function(redirectUrl) {
  return new Promise(resolve => {
    const unsub = onAuthChange(user => {
      unsub();
      if (!user) {
        const isRoot = !window.location.pathname.includes('/pages/');
        window.location.href = (isRoot ? '' : '../') + 'pages/auth.html';
      } else {
        resolve(user);
      }
    });
  });
};

// ── TOAST NOTIFICATIONS ────────────────────────────────────
window.showToast = function(message, type = 'success') {
  const existing = document.getElementById('toast-container');
  if (!existing) {
    const tc = document.createElement('div');
    tc.id = 'toast-container';
    tc.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px';
    document.body.appendChild(tc);
  }
  const toast = document.createElement('div');
  const colors = { success:'var(--primary)', error:'var(--danger)', info:'var(--accent)', warning:'var(--warning)' };
  toast.style.cssText = `background:${colors[type]||colors.success};color:#fff;padding:12px 20px;border-radius:10px;font-size:.88rem;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,.2);animation:slideIn .3s ease;max-width:340px`;
  toast.textContent = message;
  document.getElementById('toast-container').appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
};

// ── MODALS ─────────────────────────────────────────────────
window.openModal  = id => { const m = document.getElementById(id); if(m){m.classList.add('open');document.body.style.overflow='hidden'} };
window.closeModal = id => { const m = document.getElementById(id); if(m){m.classList.remove('open');document.body.style.overflow=''} };
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-overlay').forEach(o => {
    o.addEventListener('click', e => { if(e.target===o){o.classList.remove('open');document.body.style.overflow=''} });
  });
  document.addEventListener('keydown', e => {
    if(e.key==='Escape') document.querySelectorAll('.modal-overlay.open').forEach(m=>{m.classList.remove('open');document.body.style.overflow=''});
  });
});

// CSS for toast animation
const s = document.createElement('style');
s.textContent = `@keyframes slideIn{from{opacity:0;transform:translateX(100%)}to{opacity:1;transform:none}}`;
document.head.appendChild(s);

