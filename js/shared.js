/* =============================================
   SHARED.JS — nav, modals, auth guard, toast
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
  <a class="nav-logo" href="${root}index.html"><span class="dot"></span>NeuroScan AI</a>
  <ul class="nav-links">
    <li><a href="${root}index.html">Home</a></li>
    <li><a href="${root}pages/assess.html">🧠 AI Assessment</a></li>
    <li><a href="${root}pages/media-analysis.html">📤 Upload & Detect</a></li>
    <li><a href="${root}pages/doctor-chat.html">👨‍⚕️ AI Doctor</a></li>
    <li><a href="${root}pages/emotion-detect.html">👁️ Emotion AI</a></li>
    <li><a href="${root}pages/speech-analysis.html">🎙️ Speech AI</a></li>
    <li><a href="${root}pages/tracker.html">📈 Tracker</a></li>
    <li><a href="${root}pages/recommendations.html">💊 Therapy</a></li>
  </ul>
  <div class="nav-actions" id="navAuthArea">
    <button class="btn btn-outline btn-sm" onclick="window.location.href='${root}pages/auth.html'">Sign In</button>
  </div>
  <button class="nav-hamburger" id="navHamburger"><span></span><span></span><span></span></button>
</nav>
<div class="nav-drawer" id="navDrawer">
  <a href="${root}index.html">Home</a>
  <a href="${root}pages/assess.html">🧠 AI Assessment</a>
  <a href="${root}pages/media-analysis.html">📤 Upload &amp; Detect</a>
  <a href="${root}pages/doctor-chat.html">👨‍⚕️ AI Doctor Chat</a>
  <a href="${root}pages/emotion-detect.html">👁️ Emotion Detection</a>
  <a href="${root}pages/speech-analysis.html">🎙️ Speech Analysis</a>
  <a href="${root}pages/tracker.html">📈 Progress Tracker</a>
  <a href="${root}pages/recommendations.html">💊 Therapy & Recs</a>
  <a href="${root}pages/predict.html">AQ-10 Test</a>
  <a href="${root}pages/dashboard.html">Dashboard</a>
  <a href="${root}pages/history.html">My History</a>
  <div class="d-actions" id="drawerAuthArea">
    <button class="btn btn-primary btn-sm" onclick="window.location.href='${root}pages/auth.html'">Sign In</button>
  </div>
</div>`;

  const FOOTER = `
<footer class="footer">
  <div class="footer-inner">
    <div class="footer-top">
      <div class="footer-brand">
        <a class="nav-logo" href="${root}index.html"><span class="dot" style="background:var(--accent)"></span>AutismRecog</a>
        <p>AI-powered autism behaviour recognition. Kaggle ML Olympiad dataset. Firebase-powered. For screening purposes only.</p>
      </div>
      <div class="footer-col"><h5>Platform</h5><ul>
        <li><a href="${root}pages/predict.html">AQ-10 Prediction</a></li>
        <li><a href="${root}pages/dashboard.html">Dashboard</a></li>
        <li><a href="${root}pages/chat.html">AI Chat Assistant</a></li>
        <li><a href="${root}pages/profile.html">My Profile</a></li>
        <li><a href="${root}pages/history.html">Assessment History</a></li>
      </ul></div>
      <div class="footer-col"><h5>Data</h5><ul>
        <li><a href="${root}pages/dataset.html">Dataset Explorer</a></li>
        <li><a href="https://www.kaggle.com/code/desalegngeb/autism-spectrum-disorder-prediction" target="_blank">Kaggle Source</a></li>
        <li><a href="${root}pages/about.html">Methodology</a></li>
      </ul></div>
      <div class="footer-col"><h5>Account</h5><ul>
        <li><a href="${root}pages/auth.html">Sign In / Register</a></li>
        <li><a href="${root}pages/profile.html">My Profile</a></li>
        <li><a href="#">Privacy Policy</a></li>
      </ul></div>
    </div>
    <div class="footer-bottom">
      <span>© 2025 AutismRecog · Firebase + Kaggle ML · Not a clinical tool</span>
    </div>
  </div>
</footer>`;

  const navEl    = document.getElementById('nav-ph');
  const footerEl = document.getElementById('footer-ph');

  if (navEl) {
    navEl.innerHTML = NAV;
  } else {
    // Pages without a nav-ph placeholder: prepend nav directly into body
    document.body.insertAdjacentHTML('afterbegin', NAV);
  }

  if (footerEl) {
    footerEl.innerHTML = FOOTER;
  } else {
    // Pages without a footer-ph placeholder: append footer to body
    document.body.insertAdjacentHTML('beforeend', FOOTER);
  }
})();

// ── ACTIVE NAV LINK ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .nav-drawer a').forEach(a => {
    if (a.getAttribute('href')?.endsWith(page)) a.classList.add('active');
  });

  // Hamburger
  const hb = document.getElementById('navHamburger');
  const dr = document.getElementById('navDrawer');
  if (hb && dr) {
    hb.addEventListener('click', () => dr.classList.toggle('open'));
    document.addEventListener('click', e => { if (!hb.contains(e.target) && !dr.contains(e.target)) dr.classList.remove('open'); });
  }

  // Progress bars
  setTimeout(() => {
    document.querySelectorAll('.progress-fill[data-w]').forEach(b => {
      b.style.transition = 'width 1s ease';
      b.style.width = b.dataset.w;
    });
  }, 300);
});

// ── FIREBASE AUTH STATE → update nav ──────────────────────
onAuthChange(async (user) => {
  window.APP.user = user;
  const isRoot = !window.location.pathname.includes('/pages/');
  const root   = isRoot ? '' : '../';
  const navAuth    = document.getElementById('navAuthArea');
  const drawerAuth = document.getElementById('drawerAuthArea');

  if (user) {
    window.APP.userDoc = await getUserDoc(user.uid).catch(() => null);
    const avatar = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName||'U')}&background=2d6a4f&color=fff&size=32`;
    const authHTML = `
      <a href="${root}pages/history.html" class="btn btn-ghost btn-sm">My History</a>
      <a href="${root}pages/profile.html" style="display:flex;align-items:center;gap:8px;text-decoration:none">
        <img src="${avatar}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;border:2px solid var(--primary-l)" onerror="this.src='https://ui-avatars.com/api/?name=U&background=2d6a4f&color=fff&size=32'"/>
        <span style="font-size:.82rem;font-weight:600;color:var(--text);max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${user.displayName?.split(' ')[0] || 'User'}</span>
      </a>`;
    if (navAuth)    navAuth.innerHTML    = authHTML;
    if (drawerAuth) drawerAuth.innerHTML = authHTML;
  } else {
    const signInHTML = `<button class="btn btn-outline btn-sm" onclick="window.location.href='${root}pages/auth.html'">Sign In</button>
      <button class="btn btn-primary btn-sm" onclick="window.location.href='${root}pages/auth.html'">Get Started</button>`;
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
  const colors = { success:'var(--primary)', error:'#e76f51', info:'#4361ee', warning:'#e9c46a' };
  toast.style.cssText = `background:${colors[type]||colors.success};color:#fff;padding:12px 20px;border-radius:10px;font-size:.88rem;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,.2);animation:slideIn .3s ease;max-width:320px`;
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
