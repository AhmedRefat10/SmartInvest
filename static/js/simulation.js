// simulation.js — Simulation controls and chart update logic

document.addEventListener('DOMContentLoaded', function () {
  initSimControls();
});

function initSimControls() {
  const yearsSlider = document.getElementById('sim-years');
  const yearsDisplay = document.getElementById('sim-years-display');
  const recalcBtn = document.getElementById('btn-recalculate');

  if (yearsSlider && yearsDisplay) {
    yearsSlider.addEventListener('input', function () {
      yearsDisplay.textContent = this.value;
    });
  }

  if (recalcBtn) {
    recalcBtn.addEventListener('click', recalculateSimulation);
  }

}

async function recalculateSimulation() {
  const yearsEl = document.getElementById('sim-years');
  const monthlyEl = document.getElementById('sim-monthly');
  const inflationEl = document.getElementById('sim-inflation');
  const recalcBtn = document.getElementById('btn-recalculate');

  const years = parseInt(yearsEl?.value) || 10;
  const monthly = parseFloat(monthlyEl?.value) || 0;
  const rawInflation = parseFloat(inflationEl?.value);
  const inflation = Number.isFinite(rawInflation)
    ? rawInflation > 1
      ? rawInflation / 100
      : rawInflation
    : 0.05;

  if (monthly < 0) {
    showToast('Monthly contribution cannot be negative.', 'error');
    return;
  }
  if (inflation < 0 || inflation > 0.5) {
    showToast('Inflation must be between 0% and 50%.', 'error');
    return;
  }

  setButtonLoading(recalcBtn, true);

  try {
    const res = await apiCall('/api/simulation', 'POST', {
      years,
      monthly_contribution: monthly,
      inflation_rate: inflation,
    });

    if (res && res.data) {
      // Update the growth chart
      renderGrowthChart(res.data);
      updateSimResults(res.data);
      showToast('Simulation updated!', 'success');
    }
  } catch (err) {
    showToast(err.data?.message || 'Simulation failed.', 'error');
  } finally {
    setButtonLoading(recalcBtn, false);
  }
}
