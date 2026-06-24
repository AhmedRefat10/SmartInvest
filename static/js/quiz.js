// quiz.js — 15-question risk assessment quiz SPA

function getQuestions() {
  return (typeof t === 'function' && t('questions')) || [];
}

const LETTERS = ['A', 'B', 'C', 'D'];

let currentQuestion = 0;
let answers = new Array(getQuestions().length || 15).fill(null);
let submittedResult = null;
let resultVisible = false;

document.addEventListener('DOMContentLoaded', function () {
  if (!requireAuth()) return;
  updateNavbar();
  renderQuiz();
  updateNavButtons();
  updateProgress();
});

function renderQuiz() {
  const container = document.getElementById('quiz-questions');
  if (!container) return;
  container.innerHTML = '';

  getQuestions().forEach((q, qi) => {
    const card = document.createElement('div');
    card.className = 'question-card' + (qi === 0 ? ' active' : '');
    card.id = `question-${qi}`;

    const questionText = document.createElement('p');
    questionText.className = 'question-text';
    questionText.textContent = `${qi + 1}. ${q.text}`;
    card.appendChild(questionText);

    q.options.forEach((opt, oi) => {
      const div = document.createElement('div');
      div.className = 'answer-option' + (answers[qi] === oi ? ' selected' : '');
      div.setAttribute('data-q', qi);
      div.setAttribute('data-a', oi);

      div.innerHTML = `
        <div class="answer-letter">${LETTERS[oi]}</div>
        <span class="answer-text">${opt}</span>
      `;
      div.addEventListener('click', () => selectAnswer(qi, oi));
      card.appendChild(div);
    });

    container.appendChild(card);
  });
}

function selectAnswer(questionIndex, answerIndex) {
  answers[questionIndex] = answerIndex;

  // Update UI
  const card = document.getElementById(`question-${questionIndex}`);
  if (card) {
    card.querySelectorAll('.answer-option').forEach((opt, i) => {
      opt.classList.toggle('selected', i === answerIndex);
    });
  }
  updateNavButtons();
}

function updateProgress() {
  const fill = document.getElementById('quiz-progress-fill');
  const counter = document.getElementById('question-counter');
  const qs = getQuestions();
  const pct = (currentQuestion / qs.length) * 100;
  if (fill) fill.style.width = pct + '%';
  if (counter)
    counter.textContent =
      typeof tf === 'function'
        ? tf('quiz_counter', { n: currentQuestion + 1 })
        : `Question ${currentQuestion + 1} of ${qs.length}`;
}

function updateNavButtons() {
  const backBtn = document.getElementById('btn-back');
  const nextBtn = document.getElementById('btn-next');
  const submitBtn = document.getElementById('btn-submit');
  const isLast = currentQuestion === getQuestions().length - 1;
  const answered = answers[currentQuestion] !== null;

  if (backBtn) backBtn.disabled = currentQuestion === 0;
  if (nextBtn) {
    nextBtn.style.display = isLast ? 'none' : '';
    nextBtn.disabled = !answered;
  }
  if (submitBtn) {
    submitBtn.style.display = isLast ? '' : 'none';
    submitBtn.disabled = !answered;
  }
}

function showQuestion(index) {
  document.querySelectorAll('.question-card').forEach((c, i) => {
    c.classList.toggle('active', i === index);
  });
  currentQuestion = index;
  updateProgress();
  updateNavButtons();
}

// ── Navigation Buttons ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  const backBtn = document.getElementById('btn-back');
  const nextBtn = document.getElementById('btn-next');
  const submitBtn = document.getElementById('btn-submit');

  if (backBtn) {
    backBtn.addEventListener('click', function () {
      if (currentQuestion > 0) showQuestion(currentQuestion - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      if (answers[currentQuestion] === null) {
        showToast(
          typeof t === 'function'
            ? t('err_select_answer')
            : 'Please select an answer before continuing.',
          'info',
        );
        return;
      }
      if (currentQuestion < getQuestions().length - 1)
        showQuestion(currentQuestion + 1);
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', submitQuiz);
  }
});

async function submitQuiz() {
  const unanswered = answers.findIndex(a => a === null);
  if (unanswered !== -1) {
    showToast(
      typeof tf === 'function'
        ? tf('err_answer_all', { n: unanswered + 1 })
        : `Please answer question ${unanswered + 1} before submitting.`,
      'error',
    );
    showQuestion(unanswered);
    return;
  }

  const submitBtn = document.getElementById('btn-submit');
  setButtonLoading(submitBtn, true);
  showLoading(
    typeof t === 'function'
      ? t('loading_step1')
      : 'Analyzing your risk profile…',
    typeof t === 'function'
      ? t('loading_working')
      : 'SmartInvest is working for you',
  );

  try {
    const res = await apiCall('/api/submit_quiz', 'POST', { answers });
    hideLoading();
    setButtonLoading(submitBtn, false);
    if (res && res.data) {
      showQuizResult(res.data);
    }
  } catch (err) {
    hideLoading();
    const msg =
      err.data?.message ||
      (typeof t === 'function'
        ? t('err_quiz_failed')
        : 'Failed to submit quiz. Please try again.');
    showToast(msg, 'error');
    setButtonLoading(submitBtn, false);
  }
}

function showQuizResult(data) {
  submittedResult = data;
  resultVisible = true;

  // Build factor details using the current-language questions + the user's actual answers
  const questions = getQuestions();
  const topFactors = data.top_factors || [];

  const factorDetails = topFactors.map(qKey => {
    const qIdx = parseInt(qKey.replace('Q', ''), 10) - 1;
    const q = questions[qIdx];
    const answerIdx = answers[qIdx];
    return {
      question: q ? q.text : qKey,
      answer:
        q && q.options && answerIdx !== null && answerIdx !== undefined
          ? q.options[answerIdx]
          : '',
    };
  });

  const catKey = (data.risk_category || '').toLowerCase(); // conservative|balanced|aggressive
  const catLabel =
    typeof t === 'function' ? t(`quiz_risk_${catKey}`) : data.risk_category;
  const desc = typeof t === 'function' ? t(`risk_desc_${catKey}`) : '';
  const localizedReason =
    typeof t === 'function' ? t(`quiz_reason_${catKey}`) : '';
  const scoreLabel =
    typeof t === 'function' ? t('quiz_result_score') : 'Your Score';
  const factorsLabel =
    typeof t === 'function'
      ? t('quiz_result_key_factors')
      : 'Risk-Tolerance Answers Behind This Result';
  const ctaLabel =
    typeof t === 'function' ? t('quiz_result_cta') : 'Generate My Portfolio →';
  const reason = localizedReason || desc || data.category_reason || '';

  const container = document.querySelector('.quiz-container');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align:center;padding:.5rem 0 1.5rem">

      <div style="margin-bottom:1.25rem">
        <span class="badge badge-${catKey}" style="font-size:1.15rem;padding:.45rem 1.5rem">
          ${catLabel}
        </span>
      </div>

      <div style="font-size:2rem;font-weight:700;color:#f0f4ff;margin-bottom:.15rem">
        ${data.total_score} <span style="font-size:1rem;font-weight:400;color:#8892a4">/ 45</span>
      </div>
      <div style="font-size:.9rem;color:#8892a4;margin-bottom:1.25rem">
        ${scoreLabel} — ${data.score_percent}%
      </div>

      <p style="color:#8892a4;font-size:.9rem;max-width:560px;margin:0 auto 2rem;line-height:1.65">
        ${reason}
      </p>

      <div style="text-align:start;background:#0d1b2e;border-radius:12px;padding:1.25rem;margin-bottom:2rem;border:1px solid #1e2d45">
        <div style="font-size:.72rem;color:#f5a623;font-weight:600;text-transform:uppercase;letter-spacing:.07em;margin-bottom:1rem">
          ${factorsLabel}
        </div>
        ${factorDetails
          .map(
            (f, i) => `
          <div style="padding-bottom:.85rem;${i < factorDetails.length - 1 ? 'margin-bottom:.85rem;border-bottom:1px solid #1e2d45;' : ''}">
            <div style="font-size:.78rem;color:#8892a4;margin-bottom:.3rem">${f.question}</div>
            <div style="color:#f0f4ff;font-size:.92rem">↳ <em style="color:#f5a623">"${f.answer}"</em></div>
          </div>
        `,
          )
          .join('')}
      </div>

      <button class="btn btn-primary btn-lg" onclick="window.location.href='/dashboard'" style="min-width:260px">
        ${ctaLabel}
      </button>
    </div>
  `;
}

// Re-render quiz when user switches language
document.addEventListener('langchange', function () {
  if (resultVisible && submittedResult) {
    showQuizResult(submittedResult);
    return;
  }

  renderQuiz();
  showQuestion(currentQuestion);
});
