// ── Token Management ──────────────────────────────────────────────
function getToken() {
  return localStorage.getItem('smartinvest_token');
}
function setToken(t) {
  localStorage.setItem('smartinvest_token', t);
}
function removeToken() {
  localStorage.removeItem('smartinvest_token');
}
function isLoggedIn() {
  return !!getToken();
}

function logout() {
  localStorage.removeItem('smartinvest_token');
  localStorage.removeItem('smartinvest_user');
  localStorage.removeItem('smartinvest_chat_history');
  window.location.href = '/login';
}

function retakeQuiz() {
  closeSettingsMenu();
  window.location.href = '/quiz';
}

// ── User Store ────────────────────────────────────────────────────
function setUser(u) {
  localStorage.setItem('smartinvest_user', JSON.stringify(u));
}
function getUser() {
  try {
    return JSON.parse(localStorage.getItem('smartinvest_user'));
  } catch {
    return null;
  }
}

// ── Auth Guard ────────────────────────────────────────────────────
function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = '/login';
    return false;
  }
  return true;
}

// ── Core API Helper ───────────────────────────────────────────────
async function apiCall(endpoint, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body !== null) options.body = JSON.stringify(body);

  let response;
  try {
    response = await fetch(endpoint, options);
  } catch (networkErr) {
    throw {
      status: 0,
      data: { message: 'Network error. Please check your connection.' },
    };
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = { message: response.statusText };
  }

  if (response.status === 401) {
    logout();
    return null;
  }
  if (!response.ok) throw { status: response.status, data };

  return data;
}

// ── Number Formatting ─────────────────────────────────────────────
function formatEGP(value) {
  if (value === null || value === undefined || isNaN(value)) return 'EGP 0';
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatEGPPrice(value) {
  return formatMarketPrice(value, 'EGP');
}

function formatMarketPrice(value, currency = 'EGP') {
  if (value === null || value === undefined || isNaN(value)) return '—';
  const resolvedCurrency = currency || 'EGP';
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: resolvedCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPct(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) return '0%';
  return `${parseFloat(value).toFixed(decimals)}%`;
}

function formatNum(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return '0';
  return parseFloat(value).toFixed(decimals);
}

// ── Loading Overlay ───────────────────────────────────────────────
function showLoading(message = 'Loading...', sub = '') {
  const overlay = document.getElementById('loading-overlay');
  const msgEl = document.getElementById('loading-message');
  const subEl = document.getElementById('loading-sub');
  if (overlay) overlay.style.display = 'flex';
  if (msgEl) msgEl.textContent = message;
  if (subEl) subEl.textContent = sub;
}

function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.style.display = 'none';
}

function setLoadingStep(stepIndex) {
  const steps = document.querySelectorAll('.loading-step');
  steps.forEach((s, i) => {
    s.classList.remove('active', 'done');
    if (i < stepIndex) s.classList.add('done');
    else if (i === stepIndex) s.classList.add('active');
  });
}

// ── Toast Notifications ───────────────────────────────────────────
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}

// ── Navbar Auth State ─────────────────────────────────────────────
function updateNavbar() {
  const loggedIn = isLoggedIn();
  const user = getUser();
  const loginLink = document.getElementById('nav-login');
  const registerLink = document.getElementById('nav-register');
  const dashboardLink = document.getElementById('nav-dashboard');
  const settingsMenu = document.getElementById('nav-settings');
  const usernameEl = document.getElementById('nav-username');
  const settingsName = document.getElementById('settings-user-name');
  const settingsEmail = document.getElementById('settings-user-email');

  if (loginLink) loginLink.style.display = loggedIn ? 'none' : '';
  if (registerLink) registerLink.style.display = loggedIn ? 'none' : '';
  if (dashboardLink) dashboardLink.style.display = loggedIn ? '' : 'none';
  if (settingsMenu) settingsMenu.style.display = loggedIn ? 'block' : 'none';
  if (usernameEl) usernameEl.textContent = loggedIn && user ? user.name || '' : '';
  if (settingsName) settingsName.textContent = user?.name || 'User';
  if (settingsEmail) settingsEmail.textContent = user?.email || '';
}

function toggleSettingsMenu() {
  const dropdown = document.getElementById('settings-dropdown');
  if (dropdown) dropdown.classList.toggle('open');
}

function closeSettingsMenu() {
  const dropdown = document.getElementById('settings-dropdown');
  if (dropdown) dropdown.classList.remove('open');
}

// ── Form Helpers ──────────────────────────────────────────────────
function showError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errEl = document.getElementById(fieldId + '-error');
  if (field) field.classList.add('error');
  if (errEl) {
    errEl.textContent = message;
    errEl.classList.add('visible');
  }
}

function clearError(fieldId) {
  const field = document.getElementById(fieldId);
  const errEl = document.getElementById(fieldId + '-error');
  if (field) field.classList.remove('error');
  if (errEl) errEl.classList.remove('visible');
}

function clearAllErrors() {
  document
    .querySelectorAll('.form-error')
    .forEach(e => e.classList.remove('visible'));
  document
    .querySelectorAll('.form-control.error')
    .forEach(e => e.classList.remove('error'));
}

function setButtonLoading(btn, loading) {
  if (!btn) return;
  btn.classList.toggle('loading', loading);
  btn.disabled = loading;
}

// ── Init on every page ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  updateNavbar();
  document.addEventListener('click', function (event) {
    const menu = document.getElementById('nav-settings');
    if (menu && !menu.contains(event.target)) closeSettingsMenu();
  });
});
