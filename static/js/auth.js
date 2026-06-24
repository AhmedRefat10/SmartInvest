// auth.js — Login and Registration page logic

document.addEventListener('DOMContentLoaded', function () {
  updateNavbar();
  const path = window.location.pathname;

  if (path === '/register') initRegisterPage();
  else if (path === '/login') initLoginPage();
});

// ── Registration ──────────────────────────────────────────────────
function initRegisterPage() {
  if (isLoggedIn()) {
    window.location.href = '/dashboard';
    return;
  }

  const form = document.getElementById('register-form');
  const pwInput = document.getElementById('password');
  const confirmPwInput = document.getElementById('confirm-password');

  if (!form) return;

  // Password strength meter
  if (pwInput) {
    pwInput.addEventListener('input', function () {
      updatePasswordStrength(this.value);
    });
  }

  // Real-time validation
  ['name', 'email', 'password', 'confirm-password'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('blur', () => validateRegisterField(id));
    if (el) el.addEventListener('input', () => clearError(id));
  });

  // Password visibility toggle
  document.querySelectorAll('.toggle-eye').forEach(btn => {
    btn.addEventListener('click', function () {
      const targetId = this.dataset.target;
      const inp = document.getElementById(targetId);
      if (!inp) return;
      if (inp.type === 'password') {
        inp.type = 'text';
        this.textContent = '🙈';
      } else {
        inp.type = 'password';
        this.textContent = '👁';
      }
    });
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearAllErrors();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    let valid = true;
    if (!name) {
      showError('name', 'Full name is required.');
      valid = false;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('email', 'Please enter a valid email address.');
      valid = false;
    }
    if (password.length < 8) {
      showError('password', 'Password must be at least 8 characters.');
      valid = false;
    }
    if (password !== confirmPassword) {
      showError('confirm-password', 'Passwords do not match.');
      valid = false;
    }
    if (!valid) return;

    const submitBtn = form.querySelector('[type="submit"]');
    setButtonLoading(submitBtn, true);

    try {
      const res = await apiCall('/api/register', 'POST', {
        name,
        email,
        password,
      });
      if (res && res.data) {
        setToken(res.data.token);
        setUser(res.data.user);
        showToast('Account created! Redirecting…', 'success');
        setTimeout(() => (window.location.href = '/profile'), 800);
      }
    } catch (err) {
      const msg = err.data?.message || 'Registration failed. Please try again.';
      if (err.status === 409) showError('email', msg);
      else showToast(msg, 'error');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

function validateRegisterField(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const val = el.value.trim();
  if (id === 'name' && !val) showError(id, 'Full name is required.');
  else if (id === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
    showError(id, 'Invalid email address.');
  else if (id === 'password' && val.length < 8)
    showError(id, 'At least 8 characters required.');
  else if (id === 'confirm-password') {
    const pw = document.getElementById('password')?.value || '';
    if (val !== pw) showError(id, 'Passwords do not match.');
  }
}

function updatePasswordStrength(password) {
  const fill = document.getElementById('pw-strength-fill');
  const text = document.getElementById('pw-strength-text');
  if (!fill || !text) return;

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: 'Very Weak', color: '#ef4444', width: '20%' },
    { label: 'Weak', color: '#f59e0b', width: '40%' },
    { label: 'Fair', color: '#fbbf24', width: '60%' },
    { label: 'Strong', color: '#10b981', width: '80%' },
    { label: 'Very Strong', color: '#059669', width: '100%' },
  ];
  const level = levels[Math.min(score, 4)];
  fill.style.width = password.length ? level.width : '0%';
  fill.style.background = level.color;
  text.textContent = password.length ? level.label : '';
  text.style.color = level.color;
}

// ── Login ─────────────────────────────────────────────────────────
function initLoginPage() {
  if (isLoggedIn()) {
    window.location.href = '/dashboard';
    return;
  }

  const form = document.getElementById('login-form');
  if (!form) return;

  document.querySelectorAll('.toggle-eye').forEach(btn => {
    btn.addEventListener('click', function () {
      const inp = document.getElementById(this.dataset.target);
      if (!inp) return;
      if (inp.type === 'password') {
        inp.type = 'text';
        this.textContent = '🙈';
      } else {
        inp.type = 'password';
        this.textContent = '👁';
      }
    });
  });

  ['email', 'password'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => clearError(id));
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearAllErrors();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    let valid = true;
    if (!email) {
      showError('email', 'Email is required.');
      valid = false;
    }
    if (!password) {
      showError('password', 'Password is required.');
      valid = false;
    }
    if (!valid) return;

    const submitBtn = form.querySelector('[type="submit"]');
    setButtonLoading(submitBtn, true);

    try {
      const res = await apiCall('/api/login', 'POST', { email, password });
      if (res && res.data) {
        setToken(res.data.token);
        setUser(res.data.user);
        showToast('Welcome back!', 'success');
        const user = res.data.user;
        setTimeout(() => {
          if (!user.profile_complete) window.location.href = '/profile';
          else if (!user.risk_category) window.location.href = '/quiz';
          else window.location.href = '/dashboard';
        }, 500);
      }
    } catch (err) {
      const msg =
        err.data?.message || 'Login failed. Please check your credentials.';
      showError('password', msg);
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}
