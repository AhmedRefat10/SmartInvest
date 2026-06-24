// account.js — Account settings form

document.addEventListener('DOMContentLoaded', async function () {
  if (!requireAuth()) return;
  updateNavbar();
  await loadAccount();
  initAccountForm();
});

async function loadAccount() {
  try {
    const res = await apiCall('/api/account', 'GET');
    if (!res || !res.data) return;
    const nameEl = document.getElementById('account-name');
    const emailEl = document.getElementById('account-email');
    if (nameEl) nameEl.value = res.data.name || '';
    if (emailEl) emailEl.value = res.data.email || '';
  } catch (err) {
    showToast(err.data?.message || 'Failed to load account.', 'error');
  }
}

function initAccountForm() {
  const form = document.getElementById('account-form');
  if (!form) return;

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    clearAllErrors();

    const name = document.getElementById('account-name')?.value.trim();
    const email = document.getElementById('account-email')?.value.trim();
    const currentPassword = document.getElementById('current-password')?.value || '';
    const newPassword = document.getElementById('new-password')?.value || '';
    const confirmPassword =
      document.getElementById('confirm-password')?.value || '';

    let valid = true;
    if (!name) {
      showError('account-name', 'Name is required.');
      valid = false;
    }
    if (!email) {
      showError('account-email', 'Email is required.');
      valid = false;
    }
    if (newPassword && newPassword.length < 8) {
      showError('new-password', 'Password must be at least 8 characters.');
      valid = false;
    }
    if (newPassword && newPassword !== confirmPassword) {
      showError('new-password', 'New passwords do not match.');
      valid = false;
    }
    if (!valid) return;

    const submitBtn = form.querySelector('[type="submit"]');
    setButtonLoading(submitBtn, true);

    try {
      const res = await apiCall('/api/account', 'POST', {
        name,
        email,
        current_password: currentPassword,
        new_password: newPassword,
      });

      if (res && res.data && res.data.user) {
        const existing = getUser() || {};
        setUser({ ...existing, ...res.data.user });
        updateNavbar();
        showToast('Account updated successfully.', 'success');
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
      }
    } catch (err) {
      showToast(err.data?.message || 'Failed to update account.', 'error');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}
