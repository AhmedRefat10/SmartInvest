// profile.js — Financial profile form

document.addEventListener('DOMContentLoaded', async function () {
  if (!requireAuth()) return;
  updateNavbar();

  initHorizonSlider();
  initRadioCards();
  await loadExistingProfile();
  initProfileForm();
});

function initHorizonSlider() {
  const slider = document.getElementById('investment-horizon');
  const display = document.getElementById('horizon-display');
  if (!slider || !display) return;

  slider.addEventListener('input', function () {
    display.textContent = this.value;
  });
}

function initRadioCards() {
  document.querySelectorAll('.radio-card').forEach(card => {
    card.addEventListener('click', function () {
      const name = this.querySelector('input[type="radio"]')?.name;
      if (!name) return;
      document.querySelectorAll(`input[name="${name}"]`).forEach(r => {
        r.closest('.radio-card')?.classList.remove('selected');
      });
      this.classList.add('selected');
      const radio = this.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    });
  });
}

async function loadExistingProfile() {
  try {
    const res = await apiCall('/api/profile', 'GET');
    if (!res || !res.data) return;
    const d = res.data;

    const capitalEl = document.getElementById('current-capital');
    if (capitalEl && d.current_capital) capitalEl.value = d.current_capital;

    const goalEl = document.getElementById('investment-goal');
    if (goalEl && d.investment_goal) goalEl.value = d.investment_goal;

    const horizonEl = document.getElementById('investment-horizon');
    const horizonDisplay = document.getElementById('horizon-display');
    if (horizonEl && d.investment_horizon) {
      horizonEl.value = d.investment_horizon;
      if (horizonDisplay) horizonDisplay.textContent = d.investment_horizon;
    }

    if (d.liquidity_needs) {
      const radio = document.querySelector(
        `input[name="liquidity-needs"][value="${d.liquidity_needs}"]`,
      );
      if (radio) {
        radio.checked = true;
        radio.closest('.radio-card')?.classList.add('selected');
      }
    }

    const monthlyEl = document.getElementById('monthly-contribution');
    if (monthlyEl && d.monthly_contribution)
      monthlyEl.value = d.monthly_contribution;
  } catch (err) {
    // No existing profile — that's fine
  }
}

function initProfileForm() {
  const form = document.getElementById('profile-form');
  if (!form) return;

  const capitalEl = document.getElementById('current-capital');
  if (capitalEl) {
    capitalEl.addEventListener('input', function () {
      clearError('current-capital');
    });
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearAllErrors();

    const capital = parseFloat(
      document.getElementById('current-capital')?.value,
    );
    const goal = document.getElementById('investment-goal')?.value;
    const horizon = parseInt(
      document.getElementById('investment-horizon')?.value,
    );
    const liquidity = document.querySelector(
      'input[name="liquidity-needs"]:checked',
    )?.value;
    const monthly =
      parseFloat(document.getElementById('monthly-contribution')?.value) || 0;

    let valid = true;

    if (!capital || capital <= 0) {
      showError(
        'current-capital',
        'Please enter a valid capital amount greater than 0.',
      );
      valid = false;
    }
    if (capital < 1000) {
      showError('current-capital', 'Minimum capital is 1,000 EGP.');
      valid = false;
    }
    if (!goal) {
      showError('investment-goal', 'Please select an investment goal.');
      valid = false;
    }
    if (!liquidity) {
      showError('liquidity-needs', 'Please select your liquidity needs.');
      valid = false;
    }
    if (monthly < 0) {
      showToast('Monthly contribution cannot be negative.', 'error');
      valid = false;
    }
    if (!valid) return;

    const submitBtn = form.querySelector('[type="submit"]');
    setButtonLoading(submitBtn, true);

    try {
      const res = await apiCall('/api/profile', 'POST', {
        current_capital: capital,
        investment_goal: goal,
        investment_horizon: horizon,
        liquidity_needs: liquidity,
        monthly_contribution: monthly,
      });

      if (res && res.status === 'success') {
        showToast('Profile saved! Proceeding to quiz…', 'success');
        setTimeout(() => (window.location.href = '/quiz'), 800);
      }
    } catch (err) {
      const msg = err.data?.message || 'Failed to save profile.';
      showToast(msg, 'error');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}
