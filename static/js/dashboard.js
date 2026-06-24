// dashboard.js — Main dashboard rendering and data management

const ASSET_TYPE_COLORS = {
  Stock: [
    '#3b82f6',
    '#8b5cf6',
    '#ef4444',
    '#06b6d4',
    '#84cc16',
    '#f97316',
    '#ec4899',
    '#64748b',
  ],
  Gold: ['#f5a623'],
  RealEstate: ['#10b981', '#34d399', '#059669'],
};

let allocationChart = null;
let assetTypeChart = null;
let livePriceTimer = null;

document.addEventListener('DOMContentLoaded', async function () {
  if (!requireAuth()) return;
  updateNavbar();
  await initDashboard();
});

async function initDashboard() {
  try {
    const res = await apiCall('/api/dashboard_summary', 'GET');
    if (res && res.data) {
      renderDashboard(res.data);
    }
  } catch (err) {
    if (err.status === 404) {
      await generatePortfolio();
    } else {
      hideLoading();
      showToast('Failed to load dashboard. Please try again.', 'error');
    }
  }
}

async function generatePortfolio() {
  const steps = [
    typeof t === 'function' ? t('loading_step0') : 'Fetching live market data…',
    typeof t === 'function'
      ? t('loading_step1')
      : 'Analyzing your risk profile…',
    typeof t === 'function' ? t('loading_step2') : 'Optimizing your portfolio…',
    typeof t === 'function'
      ? t('loading_step3')
      : 'Running 10-year growth simulation…',
  ];

  showLoading(
    steps[0],
    typeof t === 'function'
      ? t('loading_working')
      : 'SmartInvest is working for you',
  );
  const overlayMsg = document.getElementById('loading-message');
  const stepsContainer = document.getElementById('loading-steps');

  // Animate step messages
  let stepIdx = 0;
  const stepInterval = setInterval(() => {
    stepIdx++;
    if (stepIdx < steps.length && overlayMsg) {
      overlayMsg.textContent = steps[stepIdx];
      setLoadingStep(stepIdx);
    }
  }, 2200);

  try {
    const res = await apiCall('/api/generate_portfolio', 'POST');
    clearInterval(stepInterval);
    hideLoading();
    if (res && res.data) {
      renderDashboard(res.data);
    }
  } catch (err) {
    clearInterval(stepInterval);
    hideLoading();
    const code = err.data?.code;
    if (code === 'PROFILE_INCOMPLETE') {
      showToast(
        typeof t === 'function'
          ? t('err_profile_incomplete')
          : 'Please complete your profile first.',
        'error',
      );
      setTimeout(() => (window.location.href = '/profile'), 1500);
    } else if (code === 'QUIZ_INCOMPLETE') {
      showToast(
        typeof t === 'function'
          ? t('err_quiz_incomplete')
          : 'Please complete the risk quiz first.',
        'error',
      );
      setTimeout(() => (window.location.href = '/quiz'), 1500);
    } else if (code === 'CAPITAL_TOO_LOW') {
      showToast(
        typeof t === 'function'
          ? t('err_capital_low')
          : 'Minimum capital is 1,000 EGP. Please update your profile.',
        'error',
      );
      setTimeout(() => (window.location.href = '/profile'), 1500);
    } else {
      showToast(err.data?.message || 'Portfolio generation failed.', 'error');
    }
  }
}

function renderDashboard(data) {
  const { portfolio, user } = data;
  if (!portfolio) return;

  const simulation = data.simulation || portfolio.simulation || null;
  data.simulation = simulation;
  window._lastDashboardData = data;

  renderStatCards(portfolio, user);
  renderRiskBreakdown(portfolio, user);
  renderAllocationChart(portfolio.allocations);
  renderAssetTypeChart(portfolio.allocations);
  renderGrowthChart(simulation);
  renderAllocationTable(portfolio.allocations);
  initSimulation(portfolio, simulation);
  startLivePricePolling(portfolio.allocations);

  // Show the main content (in case it was hidden)
  const content = document.getElementById('dashboard-content');
  if (content) content.style.display = '';
}

// ── Section A: Stat Cards ─────────────────────────────────────────
function renderStatCards(portfolio, user) {
  setText('stat-capital', formatEGP(portfolio.total_investment));

  const riskEl = document.getElementById('stat-risk-value');
  if (riskEl) {
    riskEl.textContent = portfolio.risk_level || '—';
    riskEl.className =
      'badge badge-' + (portfolio.risk_level || '').toLowerCase();
  }
  setText('stat-return', formatPct(portfolio.expected_return));
  setText(
    'stat-divScore',
    formatNum(portfolio.diversification_score, 1) + '/10',
  );
}

// ── Risk Breakdown Card ────────────────────────────────────────────
function renderRiskBreakdown(portfolio, user) {
  setText('risk-volatility', formatPct(portfolio.volatility));
  setText('risk-sharpe', formatNum(portfolio.sharpe_ratio, 2));
  setText('risk-level-text', portfolio.risk_level || '—');

  const descriptions = {
    Conservative:
      typeof t === 'function'
        ? t('risk_desc_conservative')
        : 'You prefer capital preservation with minimal volatility. Your portfolio emphasizes stability and liquidity.',
    Balanced:
      typeof t === 'function'
        ? t('risk_desc_balanced')
        : 'You seek a balance between growth and capital protection, comfortable with moderate market fluctuations.',
    Aggressive:
      typeof t === 'function'
        ? t('risk_desc_aggressive')
        : 'You prioritize maximum long-term growth and can withstand significant short-term market volatility.',
  };
  setText('risk-description', descriptions[portfolio.risk_level] || '');

  const confBar = document.getElementById('confidence-bar-fill');
  if (confBar) {
    const user2 = user || {};
    // We show diversification score as confidence proxy
    confBar.style.width = (portfolio.diversification_score || 0) * 10 + '%';
  }
}

// ── Doughnut Chart ────────────────────────────────────────────────
function renderAllocationChart(allocations) {
  const ctx = document.getElementById('allocation-chart');
  if (!ctx || !allocations || !allocations.length) return;

  const labels = allocations.map(a => a.ticker_symbol || a.asset_name);
  const data = allocations.map(a => a.weight_percent);
  const colors = buildColors(allocations);

  if (allocationChart) allocationChart.destroy();

  allocationChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderColor: '#0a0f1e',
          borderWidth: 3,
          hoverOffset: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '65%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx =>
              ` ${ctx.label}: ${ctx.parsed.toFixed(1)}% (${formatEGP(allocations[ctx.dataIndex]?.amount_egp)})`,
          },
          backgroundColor: '#1a2235',
          borderColor: '#1e2d45',
          borderWidth: 1,
          titleColor: '#f0f4ff',
          bodyColor: '#8892a4',
          padding: 12,
        },
      },
    },
  });

  // Render legend table
  renderLegendTable(allocations, colors);
}

function buildColors(allocations) {
  const typeIdx = {};
  return allocations.map(a => {
    const palette = ASSET_TYPE_COLORS[a.asset_type] || ['#8892a4'];
    const idx = typeIdx[a.asset_type] || 0;
    typeIdx[a.asset_type] = (idx + 1) % palette.length;
    return palette[idx];
  });
}

function renderLegendTable(allocations, colors) {
  const container = document.getElementById('allocation-legend');
  if (!container) return;
  container.innerHTML = '';
  allocations.forEach((a, i) => {
    const row = document.createElement('div');
    row.className = 'legend-row';
    row.innerHTML = `
      <div class="legend-color" style="background:${colors[i]}"></div>
      <span class="legend-name">${a.ticker_symbol || a.asset_name}</span>
      <span class="legend-weight">${a.weight_percent.toFixed(1)}%</span>
      <span class="legend-amount">${formatEGP(a.amount_egp)}</span>
    `;
    row.title = a.asset_name;
    container.appendChild(row);
  });
}

// ── Asset Type Horizontal Bar Chart ──────────────────────────────
function renderAssetTypeChart(allocations) {
  const ctx = document.getElementById('asset-type-chart');
  if (!ctx || !allocations || !allocations.length) return;

  const typeWeights = {};
  allocations.forEach(a => {
    typeWeights[a.asset_type] =
      (typeWeights[a.asset_type] || 0) + a.weight_percent;
  });

  const labels = Object.keys(typeWeights);
  const data = labels.map(l => parseFloat(typeWeights[l].toFixed(1)));
  const colors = labels.map(l => ASSET_TYPE_COLORS[l]?.[0] || '#8892a4');

  if (assetTypeChart) assetTypeChart.destroy();

  assetTypeChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderRadius: 6,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => ` ${ctx.parsed.x.toFixed(1)}%` },
          backgroundColor: '#1a2235',
          borderColor: '#1e2d45',
          borderWidth: 1,
          titleColor: '#f0f4ff',
          bodyColor: '#8892a4',
        },
      },
      scales: {
        x: {
          max: 100,
          ticks: { color: '#8892a4', callback: v => v + '%' },
          grid: { color: '#1e2d45' },
        },
        y: { ticks: { color: '#f0f4ff' }, grid: { display: false } },
      },
    },
  });
}

// ── Growth Line Chart ─────────────────────────────────────────────
function renderGrowthChart(simulation) {
  if (!simulation || !simulation.years_list) return;
  window._currentSimulation = simulation;

  const ctx = document.getElementById('simulation-chart');
  if (!ctx) return;

  if (window._growthChart) window._growthChart.destroy();

  window._growthChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: simulation.years_list.map(y => `Year ${y}`),
      datasets: [
        {
          label: typeof t === 'function' ? t('sim_best') : 'Best Case',
          data: simulation.best_case,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.08)',
          borderWidth: 2.5,
          pointRadius: 3,
          pointHoverRadius: 6,
          fill: false,
          tension: 0.3,
        },
        {
          label: typeof t === 'function' ? t('sim_avg') : 'Average Case',
          data: simulation.average_case,
          borderColor: '#f5a623',
          backgroundColor: 'rgba(245,166,35,0.08)',
          borderWidth: 2.5,
          pointRadius: 3,
          pointHoverRadius: 6,
          fill: false,
          tension: 0.3,
        },
        {
          label: typeof t === 'function' ? t('sim_worst') : 'Worst Case',
          data: simulation.worst_case,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239,68,68,0.08)',
          borderWidth: 2.5,
          pointRadius: 3,
          pointHoverRadius: 6,
          fill: false,
          tension: 0.3,
        },
        {
          label: typeof t === 'function' ? t('sim_real') : 'Avg After Inflation',
          data: simulation.real_average_case || [],
          borderColor: '#60a5fa',
          backgroundColor: 'rgba(96,165,250,0.08)',
          borderWidth: 2,
          borderDash: [6, 5],
          pointRadius: 2,
          pointHoverRadius: 5,
          fill: false,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#8892a4',
            usePointStyle: true,
            pointStyleWidth: 8,
            padding: 16,
          },
        },
        tooltip: {
          backgroundColor: '#1a2235',
          borderColor: '#1e2d45',
          borderWidth: 1,
          titleColor: '#f0f4ff',
          bodyColor: '#8892a4',
          padding: 12,
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${formatEGP(ctx.parsed.y)}`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: '#8892a4', maxTicksLimit: 10 },
          grid: { color: '#1e2d45' },
        },
        y: {
          ticks: {
            color: '#8892a4',
            callback: v => {
              if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
              if (v >= 1000) return (v / 1000).toFixed(0) + 'K';
              return v;
            },
          },
          grid: { color: '#1e2d45' },
        },
      },
    },
  });
}

// ── Allocation Table ──────────────────────────────────────────────
let tableSortCol = 'weight_percent';
let tableSortAsc = false;

function renderAllocationTable(allocations) {
  const tbody = document.getElementById('allocation-tbody');
  if (!tbody || !allocations) return;

  const sorted = [...allocations].sort((a, b) => {
    const va = a[tableSortCol];
    const vb = b[tableSortCol];
    if (typeof va === 'number') return tableSortAsc ? va - vb : vb - va;
    return tableSortAsc
      ? String(va).localeCompare(String(vb))
      : String(vb).localeCompare(String(va));
  });

  tbody.innerHTML = '';
  sorted.forEach(a => {
    const tr = document.createElement('tr');
    tr.dataset.ticker = a.ticker_symbol;
    tr.innerHTML = `
      <td><strong>${a.asset_name}</strong> <span class="ticker-tag">(${a.ticker_symbol})</span></td>
      <td>${renderTypeBadge(a.asset_type)}</td>
      <td class="td-muted">${a.sector || '—'}</td>
      <td>${formatEGP(a.amount_egp)}</td>
      <td class="text-gold">${a.weight_percent.toFixed(1)}%</td>
      <td class="live-price-cell" data-live-price="${a.ticker_symbol}">—</td>
      <td data-live-change="${a.ticker_symbol}">—</td>
      <td class="text-success">${formatPct(a.expected_return)}</td>
      <td>${formatPct(a.volatility)}</td>
      <td>${a.liquidity_score || '—'}/10</td>
    `;
    tbody.appendChild(tr);
  });

  window._tableAllocations = allocations;
  if (window._livePriceMap) applyLivePrices(window._livePriceMap);
}

function renderTypeBadge(type) {
  const map = {
    Stock: 'badge-balanced',
    Gold: 'badge-aggressive',
    RealEstate: 'badge-conservative',
  };
  const key = `asset_type_${String(type || '').toLowerCase()}`;
  const label = typeof t === 'function' ? t(key) : type;
  return `<span class="badge ${map[type] || ''}">${label || type}</span>`;
}

// Table sort
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('#allocation-table th[data-sort]').forEach(th => {
    th.addEventListener('click', function () {
      const col = this.dataset.sort;
      if (tableSortCol === col) tableSortAsc = !tableSortAsc;
      else {
        tableSortCol = col;
        tableSortAsc = false;
      }
      if (window._tableAllocations)
        renderAllocationTable(window._tableAllocations);
    });
  });
});

// ── Simulation Controls ───────────────────────────────────────────
function initSimulation(portfolio, simulation) {
  window._currentPortfolio = portfolio;
  if (simulation) {
    const yrs = simulation.years_list ? simulation.years_list.length : 10;
    const monthlyEl = document.getElementById('sim-monthly');
    const yrsEl = document.getElementById('sim-years');
    const yrsDisplay = document.getElementById('sim-years-display');
    if (yrsEl) {
      yrsEl.value = yrs;
      if (yrsDisplay) yrsDisplay.textContent = yrs;
    }
    if (monthlyEl && portfolio.total_investment) {
      /* keep default */
    }
  }
  updateSimResults(simulation);
}

function updateSimResults(simulation) {
  if (!simulation) return;
  setText('sim-final-best', formatEGP(simulation.final_best));
  setText('sim-final-avg', formatEGP(simulation.final_average));
  setText('sim-final-worst', formatEGP(simulation.final_worst));
  setText('sim-final-real', formatEGP(simulation.final_average_real));

  const assumptions = simulation.assumptions || {};
  const summary = document.getElementById('sim-assumptions');
  if (summary && assumptions.average_rate_percent !== undefined) {
    const params = {
      avg: formatPct(assumptions.average_rate_percent),
      best: formatPct(assumptions.best_rate_percent),
      worst: formatPct(assumptions.worst_rate_percent),
      inflation: formatPct(assumptions.inflation_rate_percent),
    };
    summary.textContent =
      typeof tf === 'function'
        ? tf('sim_assumptions', params)
        : `Average uses ${params.avg} yearly; best/worst use ${params.best} / ${params.worst}; inflation adjustment uses ${params.inflation}.`;
  }
}

function startLivePricePolling(allocations) {
  if (livePriceTimer) clearInterval(livePriceTimer);
  const tickers = [...new Set((allocations || []).map(a => a.ticker_symbol))];
  if (!tickers.length) return;

  fetchLivePrices(tickers);
  livePriceTimer = setInterval(() => fetchLivePrices(tickers), 60000);
}

async function fetchLivePrices(tickers) {
  const statusEl = document.getElementById('market-live-status');
  if (statusEl) {
    statusEl.textContent =
      typeof t === 'function' ? t('market_live_loading') : 'Live prices loading...';
  }

  try {
    const res = await apiCall(
      `/api/market_prices?tickers=${encodeURIComponent(tickers.join(','))}`,
      'GET',
    );
    if (!res || !res.data) return;

    const priceMap = {};
    (res.data.prices || []).forEach(item => {
      priceMap[item.ticker] = item;
    });
    window._livePriceMap = priceMap;
    applyLivePrices(priceMap);

    if (statusEl) {
      const time = new Date(res.data.updated_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      const errors = res.data.errors || [];
      statusEl.textContent =
        errors.length && typeof tf === 'function'
          ? tf('market_live_partial', { time, n: errors.length })
          : typeof tf === 'function'
            ? tf('market_live_updated', { time })
            : `Live prices updated ${time}`;
    }
  } catch (err) {
    if (statusEl) statusEl.textContent = 'Live prices unavailable.';
  }
}

function applyLivePrices(priceMap) {
  Object.entries(priceMap || {}).forEach(([ticker, item]) => {
    const priceCell = document.querySelector(`[data-live-price="${ticker}"]`);
    const changeCell = document.querySelector(`[data-live-change="${ticker}"]`);
    if (priceCell) priceCell.textContent = formatMarketPrice(item.price, item.currency);

    if (changeCell) {
      const pct = item.change_percent;
      const change = item.change;
      const cls = pct > 0 ? 'price-up' : pct < 0 ? 'price-down' : 'price-flat';
      changeCell.className = cls;
      changeCell.textContent =
        pct === null || pct === undefined
          ? '—'
          : `${change >= 0 ? '+' : ''}${change.toFixed(2)} (${pct.toFixed(2)}%)`;
    }
  });
}

// ── Helpers ────────────────────────────────────────────────────────
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// Re-render dashboard when user switches language
document.addEventListener('langchange', function () {
  if (window._lastDashboardData) {
    renderDashboard(window._lastDashboardData);
  }
});
