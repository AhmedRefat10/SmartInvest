// i18n.js — Bilingual Arabic / English translation system

const TRANSLATIONS = {
  en: {
    // ── Navbar ──────────────────────────────────────────────────
    nav_home: 'Home',
    nav_dashboard: 'Dashboard',
    nav_login: 'Login',
    nav_register: 'Get Started',
    nav_logout: 'Logout',
    settings_title: 'Settings',
    settings_edit_profile: 'Edit Profile',
    settings_investment_profile: 'Investment Profile',
    settings_retake_quiz: 'Retake Quiz',
    lang_toggle: 'العربية',

    // ── Loading Overlay ─────────────────────────────────────────
    loading_step0: 'Fetching market data',
    loading_step1: 'Analyzing risk profile',
    loading_step2: 'Optimizing portfolio',
    loading_step3: 'Running simulation',
    loading_default: 'Loading…',

    // ── Footer ──────────────────────────────────────────────────
    footer: 'SmartInvest © 2026 — Quantitative Investment Platform',

    // ── Index / Hero ────────────────────────────────────────────
    hero_badge: '🇪🇬 Designed for Egyptian Investors',
    hero_title_ar: 'استثمر بذكاء',
    hero_subtitle:
      'A data-driven investment advisory platform that analyzes your risk profile, builds a portfolio across EGX stocks, gold, and real estate, and simulates your wealth growth over time.',
    hero_cta_start: 'Get Started Free',
    hero_cta_learn: 'Learn More',
    hero_point_1: 'Weighted risk scorecard',
    hero_point_2: 'Yahoo Finance market data',
    hero_point_3: 'Explainable allocation logic',
    overview_tag: 'Project Idea',
    overview_title:
      'A clear investment recommendation workflow, not a black box',
    overview_subtitle:
      "SmartInvest turns a user's profile into a portfolio recommendation that can be explained step by step: risk scoring, market data, ranking, allocation, and simulation.",
    problem_title: 'The Problem',
    problem_text:
      'New investors often receive vague advice without understanding why a portfolio fits their capital, risk tolerance, and time horizon.',
    solution_title: 'The Solution',
    solution_text:
      'The platform asks structured questions, calculates a weighted risk score, fetches recent market data, and builds a diversified portfolio across stocks, gold, and real-estate exposure.',
    explainability_title: 'The Key Value',
    explainability_text:
      'Every output is traceable: why the user is classified, why an asset is selected, why it has a certain weight, and what each metric means.',
    method_tag: 'Methodology',
    method_title: 'How the recommendation is produced',
    method_subtitle:
      'SmartInvest combines your risk profile, capital size, and recent market data to produce a transparent portfolio recommendation you can understand.',
    method_1_title: 'Risk Score',
    method_1_text:
      'A weighted quiz gives most importance to behavioral risk tolerance, while financial capacity questions act as secondary adjustments.',
    method_2_title: 'Market Universe',
    method_2_text:
      'The app uses EGX30 companies, a gold proxy, and real-estate-sector exposure. Prices and volumes come from Yahoo Finance.',
    method_3_title: 'Asset Ranking',
    method_3_text:
      'Assets are ranked using historical return, volatility, Sharpe ratio, liquidity, and correlation filtering.',
    method_4_title: 'Capital-Aware Allocation',
    method_4_text:
      'Capital size controls the number of holdings. Risk level controls the mix and how strongly the optimizer tilts toward high-ranked assets.',
    features_title: 'Why SmartInvest?',
    features_subtitle:
      'Everything you need to invest like a seasoned financial professional.',
    feature1_title: 'Psychometric Risk Profiling',
    feature1_desc:
      '15 behavioral and financial questions identify how much market risk fits your situation and comfort level.',
    feature2_title: 'Live Market Data',
    feature2_desc:
      'Auto-updating market prices sourced from Yahoo Finance.',
    feature3_title: 'Portfolio Optimization',
    feature3_desc:
      'Capital-aware allocation across EGX stocks, gold, and real-estate exposure, tuned for your risk tolerance.',
    steps_title: 'How It Works',
    steps_subtitle: 'Your path to smarter investing',
    step1_title: 'Create Account',
    step1_desc: 'Register in 30 seconds with just your name and email.',
    step2_title: 'Set Your Profile',
    step2_desc: 'Tell us your capital, goals, and investment timeline.',
    step3_title: 'Take the Quiz',
    step3_desc:
      '15 behavioral questions score your risk tolerance using a clear 0-45 scorecard.',
    step4_title: 'Get Your Portfolio',
    step4_desc:
      'Receive a personalized, optimized portfolio with growth simulations.',
    stats_users: '15 Questions',
    stats_return: 'Scenario Tool',
    stats_assets: 'Stocks + Gold + Real Estate',
    stats_accuracy: '3 Risk Profiles',
    metrics_tag: 'Dashboard Outputs',
    metrics_title: 'What the user can explain after generation',
    metric_return_title: 'Historical Annual Return',
    metric_return_text: 'Annualized from recent daily price returns.',
    metric_vol_title: 'Annual Volatility',
    metric_vol_text: 'Measures how much the portfolio moved historically.',
    metric_sharpe_title: 'Sharpe Ratio',
    metric_sharpe_text: 'Shows historical return per unit of risk.',
    metric_div_title: 'Diversification Score',
    metric_div_text:
      'Uses correlation to show whether selected assets move differently.',
    metric_liq_title: 'Liquidity Score',
    metric_liq_text: 'Ranks assets by average trading volume.',
    metric_sim_title: 'Scenario Simulation',
    metric_sim_text:
      'Projects best, average, worst, and inflation-adjusted outcomes.',
    limits_tag: 'Honest Scope',
    limits_title: 'Important platform notes',
    limit_1:
      'SmartInvest provides data-driven portfolio guidance, not a guaranteed investment outcome.',
    limit_2:
      'Yahoo Finance data may be delayed or unavailable for some symbols.',
    limit_3:
      'Simulations are planning scenarios, not predictions or guarantees.',
    cta_title: 'Start Investing Smarter Today',
    cta_subtitle:
      'Use a clear data-driven workflow to understand risk, allocation, and long-term planning.',
    cta_btn: 'Create Free Account',

    // ── Register ────────────────────────────────────────────────
    reg_title: 'Create Your Account',
    reg_subtitle: 'Join SmartInvest and start investing smarter today.',
    reg_name: 'Full Name',
    reg_name_ph: 'e.g. Ahmed Hassan',
    reg_email: 'Email Address',
    reg_email_ph: 'you@example.com',
    reg_password: 'Password',
    reg_password_ph: 'At least 8 characters',
    reg_submit: 'Create Account',
    reg_already: 'Already have an account?',
    reg_signin: 'Sign In',

    // ── Login ───────────────────────────────────────────────────
    login_title: 'Welcome Back',
    login_subtitle: 'Sign in to access your investment dashboard.',
    login_email: 'Email Address',
    login_email_ph: 'you@example.com',
    login_password: 'Password',
    login_password_ph: 'Your password',
    login_submit: 'Sign In',
    login_no_account: "Don't have an account?",
    login_create: 'Create one here',

    // ── Profile ─────────────────────────────────────────────────
    profile_step: 'Step 1 of 3 — Financial Profile',
    profile_title: 'Your Investment Profile',
    profile_subtitle:
      'Tell us about your financial situation so we can tailor your portfolio recommendations.',
    profile_capital: 'Available Capital (EGP)',
    profile_capital_helper: '— How much are you investing?',
    profile_capital_ph: 'e.g. 50000',
    profile_goal: 'Investment Goal',
    profile_goal_default: 'Select your primary goal…',
    goal_retirement: 'Retirement Planning',
    goal_wealth: 'Wealth Growth',
    goal_education: "Children's Education",
    goal_emergency: 'Emergency Fund',
    goal_realestate: 'Real Estate Purchase',
    goal_other: 'Other',
    profile_horizon: 'Investment Horizon',
    profile_years: 'years',
    profile_liquidity: 'Liquidity Needs',
    liquidity_high: 'High — may need funds within 3 months',
    liquidity_medium: 'Medium — can wait up to 1 year',
    liquidity_low: 'Low — can lock funds for 2+ years',
    profile_monthly: 'Monthly Contribution (EGP)',
    profile_monthly_ph: 'e.g. 1000',
    profile_monthly_helper: 'Optional — extra amount added monthly',
    profile_submit: 'Save & Continue',

    // ── Account ─────────────────────────────────────────────────
    account_title: 'Account Settings',
    account_subtitle: 'Update your name, email, or password.',
    account_current_password: 'Current Password',
    account_current_password_ph: 'Required only when changing password',
    account_new_password: 'New Password',
    account_new_password_ph: 'Leave empty to keep current password',
    account_confirm_password: 'Confirm New Password',
    account_save: 'Save Account',

    // ── Quiz ────────────────────────────────────────────────────
    quiz_step: 'Step 2 of 3 — Risk Assessment',
    quiz_title: 'Risk Assessment Quiz',
    quiz_subtitle:
      'Answer all 15 questions honestly. Your responses are scored to determine your personalized investor profile.',
    quiz_counter: 'Question {n} of 15',
    btn_back: '← Back',
    btn_next: 'Next →',
    btn_submit: 'Submit & See Results',

    // ── Quiz Result Card ─────────────────────────────────────────
    quiz_risk_conservative: 'Conservative',
    quiz_risk_balanced: 'Balanced',
    quiz_risk_aggressive: 'Aggressive',
    quiz_result_score: 'Your Score',
    quiz_reason_conservative:
      'Your total score is in the conservative range. This usually means you prefer protecting capital, avoiding large losses, and taking lower-risk decisions.',
    quiz_reason_balanced:
      'Your total score is in the balanced range. This usually means your answers were mixed or moderate, not strongly conservative or strongly aggressive.',
    quiz_reason_aggressive:
      'Your total score is in the aggressive range. This usually means you can accept larger short-term losses in exchange for higher long-term growth potential.',
    quiz_result_key_factors: 'Risk-Tolerance Answers Behind This Result',
    quiz_result_cta: 'Generate My Portfolio →',

    // ── Dashboard ───────────────────────────────────────────────
    dashboard_title: 'Your Investment Dashboard',
    dashboard_subtitle:
      'Optimized portfolio based on your risk profile and live market data.',
    stat_capital_label: 'Total Investment',
    stat_capital_sub: 'Available Capital (EGP)',
    stat_risk_label: 'Risk Profile',
    stat_risk_sub: 'Score-Based Classification',
    stat_return_label: 'Historical Annual Return',
    stat_return_sub: 'Annualized from recent price history',
    stat_div_label: 'Diversification Score',
    stat_div_sub: 'Out of 10 (sector & correlation)',
    chart_allocation: 'Portfolio Allocation',
    chart_growth: 'Scenario Projection',
    chart_growth_sub: 'Simple best / average / worst compounding scenarios',
    risk_title: 'Risk Breakdown',
    risk_volatility: 'Annual Volatility',
    risk_sharpe: 'Sharpe Ratio',
    risk_category: 'Risk Category',
    asset_type_title: 'Asset Class Weights',
    sim_title: 'Simulation Controls',
    sim_years_label: 'Projection Years',
    sim_monthly_label: 'Monthly Contribution (EGP)',
    sim_inflation_label: 'Inflation Rate',
    btn_recalculate: 'Recalculate Simulation',
    sim_best: 'Best Case',
    sim_avg: 'Average',
    sim_worst: 'Worst Case',
    sim_real: 'Avg After Inflation',
    sim_assumptions:
      'Average uses {avg} yearly; best/worst use {best} / {worst}; inflation adjustment uses {inflation}.',
    table_title: 'Full Portfolio Allocation',
    col_asset: 'Asset Name',
    col_type: 'Type',
    col_sector: 'Sector',
    col_amount: 'Amount (EGP)',
    col_weight: 'Weight %',
    col_live_price: 'Live Price',
    col_today_change: 'Today',
    col_return: 'Hist. Return %',
    col_volatility: 'Volatility %',
    col_liquidity: 'Liquidity',
    asset_type_stock: 'Stock',
    asset_type_gold: 'Gold',
    asset_type_realestate: 'Real Estate',
    market_live_loading: 'Live prices loading...',
    market_live_updated: 'Live prices updated {time}',
    market_live_partial: 'Live prices updated {time}; {n} symbols unavailable',

    // ── Risk Descriptions ────────────────────────────────────────
    risk_desc_conservative:
      'You prefer capital preservation with minimal volatility. Your portfolio emphasizes stability and liquidity.',
    risk_desc_balanced:
      'You seek a balance between growth and capital protection, comfortable with moderate market fluctuations.',
    risk_desc_aggressive:
      'You prioritize maximum long-term growth and can withstand significant short-term market volatility.',

    // ── Toast / Error messages ───────────────────────────────────
    err_network: 'Network error. Please check your connection.',
    err_profile_incomplete: 'Please complete your profile first.',
    err_quiz_incomplete: 'Please complete the risk quiz first.',
    err_capital_low:
      'Minimum capital is 1,000 EGP. Please update your profile.',
    err_portfolio_failed: 'Portfolio generation failed.',
    err_select_answer: 'Please select an answer before continuing.',
    err_answer_all: 'Please answer question {n} before submitting.',
    // ── Stats Bar ────────────────────────────────────────────────
    stats_bar_asset_classes: 'Stocks, Gold, Real Estate',
    stats_bar_quiz_questions: 'Risk Assessment Questions',
    stats_bar_simulation: 'Growth Simulation',
    stats_bar_live: 'Live',
    stats_bar_data: 'Yahoo Finance Data',

    // ── Hero Visual Cards ─────────────────────────────────────────
    hero_card_score: 'Portfolio Score',
    hero_card_div: 'Diversification Index',
    hero_card_return: 'Expected Return',
    hero_card_return_sub: 'Annual (Balanced Profile)',
    hero_card_risk: 'Risk Level',
    hero_card_risk_sub: 'Score-Based Profile',
    hero_card_growth: '10-Year Growth',
    hero_card_growth_sub: 'Average Case Projection',

    // ── Dashboard extra ──────────────────────────────────────────
    table_loading: 'Loading portfolio data…',
    div_quality: 'Diversification Quality',
    loading_working: 'SmartInvest is working for you',

    // ── Chatbot ──────────────────────────────────────────────────
    chat_title: 'SmartInvest Assistant',
    chat_subtitle: 'Your personal investment advisor',
    chat_placeholder: 'Ask me anything…',

    // ── Tooltips ───────────────────────────────────────────────────
    tip_hist_return:
      'Annualized return calculated from recent downloaded prices. It is historical, not a guaranteed future return.',
    tip_diversification:
      'A 0-10 score based on how differently the selected assets moved historically. Higher means less correlation.',
    tip_volatility:
      'How much the asset or portfolio moved up and down historically. Higher volatility means larger swings.',
    tip_sharpe:
      'Risk-adjusted return. Higher means more historical return for each unit of risk.',
    tip_risk_category:
      'Your quiz result: Conservative, Balanced, or Aggressive.',
    tip_inflation:
      'Used only for the inflation-adjusted average result. Enter 5 for 5%.',
    tip_liquidity:
      '1-10 rank based on average Yahoo Finance trading volume inside the project universe.',
    tip_live_price:
      'Latest available Yahoo Finance price. Free data can be delayed.',
    tip_today_change:
      'Change from the previous close to the latest available price.',

    // ── Quiz Questions ───────────────────────────────────────────
    questions: [
      {
        text: 'What is your primary investment goal?',
        options: [
          'Preserve my capital with minimal risk',
          'Generate stable income with low risk',
          'Balance growth and income',
          'Maximize long-term growth, accepting high risk',
        ],
      },
      {
        text: 'How would you react if your portfolio dropped 20% in one month?',
        options: [
          'Panic and sell everything immediately',
          'Feel very uncomfortable and consider selling',
          'Stay calm but monitor closely',
          'See it as a buying opportunity',
        ],
      },
      {
        text: 'What is your investment time horizon?',
        options: [
          'Less than 1 year',
          '1–3 years',
          '3–7 years',
          'More than 7 years',
        ],
      },
      {
        text: 'What is the largest short-term loss you could tolerate without selling?',
        options: ['0–5%', '5–10%', '10–20%', 'More than 20%'],
      },
      {
        text: 'How familiar are you with financial instruments (stocks, bonds, ETFs)?',
        options: [
          'Completely unfamiliar',
          'Basic knowledge',
          'Intermediate — I invest occasionally',
          'Advanced — I actively manage investments',
        ],
      },
      {
        text: 'Have you invested before?',
        options: [
          'Never',
          'Once or twice, with losses',
          'Yes, with mixed results',
          'Yes, consistently with gains',
        ],
      },
      {
        text: 'If the market falls, how long can you stay invested without needing to sell?',
        options: [
          'Less than 3 months',
          '3–12 months',
          '1–3 years',
          'More than 3 years',
        ],
      },
      {
        text: 'How strong is your emergency savings buffer?',
        options: [
          'No emergency savings',
          'Less than 3 months of expenses',
          '3–6 months of expenses',
          'More than 6 months of expenses',
        ],
      },
      {
        text: 'How much of your total savings are you investing here?',
        options: [
          'More than 80% — this is most of what I have',
          '50–80%',
          '20–50%',
          'Less than 20% — this is extra money',
        ],
      },
      {
        text: 'Do you have financial dependents (children, family)?',
        options: [
          'Yes, many dependents',
          'Yes, a few',
          'Only myself',
          'No dependents at all',
        ],
      },
      {
        text: 'How would you describe your current job stability?',
        options: [
          'Unstable — contract/freelance with no security',
          'Somewhat stable',
          'Stable with good prospects',
          'Very stable — government or senior role',
        ],
      },
      {
        text: 'If given a guaranteed 8% return vs. a 50% chance of 25% return, you choose:',
        options: [
          'Definitely the 8% guaranteed',
          'Probably the guaranteed option',
          'Probably the higher-risk option',
          'Definitely the 25% chance',
        ],
      },
      {
        text: 'How comfortable are you with uncertain investment outcomes?',
        options: [
          'I strongly prefer predictable outcomes',
          'I accept small uncertainty',
          'I accept moderate uncertainty',
          'I accept high uncertainty for higher potential return',
        ],
      },
      {
        text: 'How do you feel when your investments are performing well and rising fast?',
        options: [
          'Worried it will crash soon, want to sell',
          'Happy but cautious',
          'Optimistic but keep my strategy',
          'Excited and invest even more',
        ],
      },
      {
        text: 'Your long-term financial goal is:',
        options: [
          'Just protect what I have from inflation',
          'Slowly grow wealth over decades',
          'Build a diversified growing portfolio',
          'Aggressively build maximum wealth as fast as possible',
        ],
      },
    ],
  },

  ar: {
    // ── Navbar ──────────────────────────────────────────────────
    nav_home: 'الرئيسية',
    nav_dashboard: 'لوحة التحكم',
    nav_login: 'تسجيل الدخول',
    nav_register: 'ابدأ الآن',
    nav_logout: 'تسجيل الخروج',
    settings_title: 'الإعدادات',
    settings_edit_profile: 'تعديل الملف الشخصي',
    settings_investment_profile: 'الملف الاستثماري',
    settings_retake_quiz: 'إعادة الاختبار',
    lang_toggle: 'English',

    // ── Loading Overlay ─────────────────────────────────────────
    loading_step0: 'جلب بيانات السوق',
    loading_step1: 'تحليل ملف المخاطر',
    loading_step2: 'تحسين المحفظة الاستثمارية',
    loading_step3: 'تشغيل المحاكاة',
    loading_default: 'جارٍ التحميل…',

    // ── Footer ──────────────────────────────────────────────────
    footer: 'SmartInvest © 2026 — منصة استثمار كمية',

    // ── Index / Hero ────────────────────────────────────────────
    hero_badge: '🇪🇬 مصمم للمستثمرين المصريين',
    hero_title_ar: 'استثمر بذكاء',
    hero_subtitle:
      'منصة استشارات استثمارية مبنية على البيانات تحلل ملف مخاطرك، وتبني محفظة بين أسهم البورصة المصرية والذهب والعقار، وتحاكي نمو ثروتك عبر الزمن.',
    hero_cta_start: 'ابدأ مجانًا',
    hero_cta_learn: 'اعرف أكثر',
    hero_point_1: 'تقييم مخاطر موزون',
    hero_point_2: 'بيانات سوق من Yahoo Finance',
    hero_point_3: 'منطق توزيع قابل للشرح',
    overview_tag: 'فكرة المشروع',
    overview_title: 'مسار واضح لتوصية استثمارية، وليس صندوقًا أسود',
    overview_subtitle:
      'يحوّل SmartInvest ملف المستخدم إلى توصية محفظة يمكن شرحها خطوة بخطوة: تقييم المخاطر، بيانات السوق، ترتيب الأصول، التوزيع، والمحاكاة.',
    problem_title: 'المشكلة',
    problem_text:
      'كثير من المستثمرين الجدد يحصلون على نصائح عامة دون فهم سبب ملاءمة المحفظة لرأس مالهم وتحملهم للمخاطر وأفقهم الزمني.',
    solution_title: 'الحل',
    solution_text:
      'تطرح المنصة أسئلة منظمة، وتحسب درجة مخاطر موزونة، وتجلب بيانات سوق حديثة، ثم تبني محفظة متنوعة بين الأسهم والذهب والتعرض العقاري.',
    explainability_title: 'القيمة الأساسية',
    explainability_text:
      'كل نتيجة قابلة للتتبع: لماذا صُنّف المستخدم، ولماذا اختير الأصل، ولماذا حصل على وزن معين، وما معنى كل مؤشر.',
    method_tag: 'المنهجية',
    method_title: 'كيف يتم إنتاج التوصية',
    method_subtitle:
      'يجمع SmartInvest بين ملف المخاطر وحجم رأس المال وبيانات السوق الحديثة لإنتاج توصية محفظة واضحة يمكنك فهمها.',
    method_1_title: 'درجة المخاطر',
    method_1_text:
      'يعطي الاختبار الموزون الأهمية الأكبر لسلوك تحمل المخاطر، بينما تعمل أسئلة القدرة المالية كتعديلات ثانوية.',
    method_2_title: 'عالم السوق',
    method_2_text:
      'يستخدم التطبيق شركات EGX30 وبديلًا للذهب وتعرضًا لقطاع العقارات. تأتي الأسعار والأحجام من Yahoo Finance.',
    method_3_title: 'ترتيب الأصول',
    method_3_text:
      'تُرتب الأصول باستخدام العائد التاريخي والتقلب ومعامل شارب والسيولة وتصفية الارتباطات العالية.',
    method_4_title: 'توزيع يراعي رأس المال',
    method_4_text:
      'حجم رأس المال يحدد عدد الأصول. ومستوى المخاطر يحدد المزيج ومدى ميل المحسن للأصول الأعلى ترتيبًا.',
    features_title: 'لماذا SmartInvest؟',
    features_subtitle: 'كل ما تحتاجه للاستثمار باحترافية حقيقية.',
    feature1_title: 'التقييم النفسي للمخاطر',
    feature1_desc:
      'تحدد 15 سؤالًا سلوكيًا وماليًا مستوى المخاطر المناسب لوضعك ودرجة ارتياحك.',
    feature2_title: 'بيانات السوق المباشرة',
    feature2_desc:
      'أسعار سوق محدثة تلقائيًا من Yahoo Finance.',
    feature3_title: 'تحسين المحفظة',
    feature3_desc:
      'توزيع يراعي حجم رأس المال بين الأسهم والذهب والتعرض العقاري، ومعدل حسب تحملك للمخاطر.',
    steps_title: 'كيف يعمل النظام؟',
    steps_subtitle: 'طريقك إلى استثمار أوضح',
    step1_title: 'إنشاء حساب',
    step1_desc: 'سجّل في 30 ثانية باسمك وبريدك الإلكتروني فقط.',
    step2_title: 'أكمل ملفك',
    step2_desc: 'أخبرنا برأس مالك وأهدافك والمدة الزمنية للاستثمار.',
    step3_title: 'خذ الاختبار',
    step3_desc:
      '15 سؤالًا سلوكيًا تقيس مستوى تحمّلك للمخاطر باستخدام درجة واضحة من 0 إلى 45.',
    step4_title: 'احصل على محفظتك',
    step4_desc: 'استقبل محفظة مخصصة ومحسنة مع محاكاة نمو الثروة.',
    stats_users: '15 سؤالًا',
    stats_return: 'أداة سيناريوهات',
    stats_assets: 'أسهم + ذهب + عقار',
    stats_accuracy: '3 ملفات مخاطر',
    metrics_tag: 'مخرجات لوحة التحكم',
    metrics_title: 'ما الذي يستطيع المستخدم شرحه بعد إنشاء المحفظة',
    metric_return_title: 'العائد السنوي التاريخي',
    metric_return_text: 'محسوب سنويًا من العوائد اليومية الحديثة.',
    metric_vol_title: 'التقلب السنوي',
    metric_vol_text: 'يقيس مقدار حركة المحفظة تاريخيًا.',
    metric_sharpe_title: 'معامل شارب',
    metric_sharpe_text: 'يوضح العائد التاريخي مقابل كل وحدة مخاطرة.',
    metric_div_title: 'درجة التنويع',
    metric_div_text:
      'تستخدم الارتباط لمعرفة هل تتحرك الأصول المختارة بشكل مختلف.',
    metric_liq_title: 'درجة السيولة',
    metric_liq_text: 'ترتب الأصول حسب متوسط حجم التداول.',
    metric_sim_title: 'محاكاة السيناريوهات',
    metric_sim_text:
      'تعرض أفضل ومتوسط وأسوأ حالة والنتيجة المعدلة بالتضخم.',
    limits_tag: 'نطاق واضح',
    limits_title: 'ملاحظات مهمة عن المنصة',
    limit_1:
      'يوفر SmartInvest توجيهًا استثماريًا مبنيًا على البيانات، وليس ضمانًا لنتيجة استثمارية.',
    limit_2:
      'قد تكون بيانات Yahoo Finance متأخرة أو غير متاحة لبعض الرموز.',
    limit_3:
      'المحاكاة سيناريوهات للتخطيط وليست توقعات أو ضمانات.',
    cta_title: 'ابدأ الاستثمار الذكي اليوم',
    cta_subtitle:
      'استخدم مسارًا واضحًا مبنيًا على البيانات لفهم المخاطر والتوزيع والتخطيط طويل المدى.',
    cta_btn: 'إنشاء حساب مجاني',

    // ── Register ────────────────────────────────────────────────
    reg_title: 'إنشاء حسابك',
    reg_subtitle: 'انضم إلى SmartInvest وابدأ الاستثمار الذكي اليوم.',
    reg_name: 'الاسم الكامل',
    reg_name_ph: 'مثال: أحمد حسن',
    reg_email: 'البريد الإلكتروني',
    reg_email_ph: 'example@mail.com',
    reg_password: 'كلمة المرور',
    reg_password_ph: '8 أحرف على الأقل',
    reg_submit: 'إنشاء الحساب',
    reg_already: 'هل لديك حساب بالفعل؟',
    reg_signin: 'تسجيل الدخول',

    // ── Login ───────────────────────────────────────────────────
    login_title: 'مرحبًا بعودتك',
    login_subtitle: 'سجّل الدخول للوصول إلى لوحة تحكم استثماراتك.',
    login_email: 'البريد الإلكتروني',
    login_email_ph: 'example@mail.com',
    login_password: 'كلمة المرور',
    login_password_ph: 'كلمة المرور الخاصة بك',
    login_submit: 'تسجيل الدخول',
    login_no_account: 'ليس لديك حساب؟',
    login_create: 'أنشئ حسابًا الآن',

    // ── Profile ─────────────────────────────────────────────────
    profile_step: 'الخطوة 1 من 3 — الملف المالي',
    profile_title: 'ملفك الاستثماري',
    profile_subtitle:
      'أخبرنا عن وضعك المالي حتى نتمكن من تصميم توصيات المحفظة المناسبة لك.',
    profile_capital: 'رأس المال المتاح (جنيه)',
    profile_capital_helper: '— كم تريد استثماره؟',
    profile_capital_ph: 'مثال: 50000',
    profile_goal: 'هدف الاستثمار',
    profile_goal_default: 'اختر هدفك الأساسي…',
    goal_retirement: 'التخطيط للتقاعد',
    goal_wealth: 'نمو الثروة',
    goal_education: 'تعليم الأبناء',
    goal_emergency: 'صندوق الطوارئ',
    goal_realestate: 'شراء عقار',
    goal_other: 'أخرى',
    profile_horizon: 'أفق الاستثمار',
    profile_years: 'سنة',
    profile_liquidity: 'احتياجات السيولة',
    liquidity_high: 'عالية — قد أحتاج الأموال خلال 3 أشهر',
    liquidity_medium: 'متوسطة — أستطيع الانتظار حتى سنة',
    liquidity_low: 'منخفضة — أستطيع تجميد الأموال لأكثر من سنتين',
    profile_monthly: 'الاشتراك الشهري (جنيه)',
    profile_monthly_ph: 'مثال: 1000',
    profile_monthly_helper: 'اختياري — مبلغ إضافي يضاف شهريًا',
    profile_submit: 'حفظ ومتابعة',

    // ── Account ─────────────────────────────────────────────────
    account_title: 'إعدادات الحساب',
    account_subtitle: 'حدّث الاسم أو البريد الإلكتروني أو كلمة المرور.',
    account_current_password: 'كلمة المرور الحالية',
    account_current_password_ph: 'مطلوبة فقط عند تغيير كلمة المرور',
    account_new_password: 'كلمة مرور جديدة',
    account_new_password_ph: 'اتركها فارغة للإبقاء على كلمة المرور الحالية',
    account_confirm_password: 'تأكيد كلمة المرور الجديدة',
    account_save: 'حفظ الحساب',

    // ── Quiz ────────────────────────────────────────────────────
    quiz_step: 'الخطوة 2 من 3 — تقييم المخاطر',
    quiz_title: 'اختبار تقييم المخاطر',
    quiz_subtitle:
      'أجب على جميع الأسئلة الـ15 بصدق. تُحسَب درجاتك لتحديد ملفك الاستثماري الشخصي.',
    quiz_counter: 'السؤال {n} من 15',
    btn_back: 'رجوع →',
    btn_next: '← التالي',
    btn_submit: 'إرسال وعرض النتائج',

    // ── Quiz Result Card ─────────────────────────────────────────
    quiz_risk_conservative: 'محافظ',
    quiz_risk_balanced: 'متوازن',
    quiz_risk_aggressive: 'نشط',
    quiz_result_score: 'درجتك',
    quiz_reason_conservative:
      'درجتك الكلية تقع في نطاق المستثمر المحافظ. هذا يعني عادةً أنك تفضل حماية رأس المال وتجنب الخسائر الكبيرة واتخاذ قرارات أقل مخاطرة.',
    quiz_reason_balanced:
      'درجتك الكلية تقع في نطاق المستثمر المتوازن. هذا يعني عادةً أن إجاباتك متوسطة أو مختلطة، وليست محافظة جدًا أو هجومية جدًا.',
    quiz_reason_aggressive:
      'درجتك الكلية تقع في نطاق المستثمر النشط. هذا يعني عادةً أنك تستطيع تحمل خسائر قصيرة المدى أكبر مقابل فرصة نمو أعلى على المدى الطويل.',
    quiz_result_key_factors: 'إجابات تحمّل المخاطر وراء هذه النتيجة',
    quiz_result_cta: '← إنشاء محفظتي',

    // ── Dashboard ───────────────────────────────────────────────
    dashboard_title: 'لوحة تحكم استثماراتك',
    dashboard_subtitle:
      'محفظة مُحسَّنة بناءً على ملف مخاطرك وبيانات السوق المباشرة.',
    stat_capital_label: 'إجمالي الاستثمار',
    stat_capital_sub: 'رأس المال المتاح (جنيه)',
    stat_risk_label: 'ملف المخاطر',
    stat_risk_sub: 'تصنيف قائم على الدرجة',
    stat_return_label: 'العائد السنوي التاريخي',
    stat_return_sub: 'محسوب سنويًا من تاريخ الأسعار الحديث',
    stat_div_label: 'درجة التنويع',
    stat_div_sub: 'من 10 (القطاع والارتباط)',
    chart_allocation: 'توزيع المحفظة',
    chart_growth: 'توقع السيناريوهات',
    chart_growth_sub: 'سيناريوهات تراكم بسيطة: أفضل / متوسط / أسوأ',
    risk_title: 'تفصيل المخاطر',
    risk_volatility: 'التقلب السنوي',
    risk_sharpe: 'نسبة شارب',
    risk_category: 'فئة المخاطر',
    asset_type_title: 'أوزان فئات الأصول',
    sim_title: 'أدوات المحاكاة',
    sim_years_label: 'سنوات التوقع',
    sim_monthly_label: 'الاشتراك الشهري (جنيه)',
    sim_inflation_label: 'معدل التضخم',
    btn_recalculate: 'إعادة حساب المحاكاة',
    sim_best: 'أفضل سيناريو',
    sim_avg: 'متوسط السيناريوهات',
    sim_worst: 'أسوأ سيناريو',
    sim_real: 'المتوسط بعد التضخم',
    sim_assumptions:
      'المتوسط يستخدم {avg} سنويًا؛ أفضل/أسوأ يستخدمان {best} / {worst}؛ تعديل التضخم يستخدم {inflation}.',
    table_title: 'توزيع المحفظة الكاملة',
    col_asset: 'اسم الأصل',
    col_type: 'النوع',
    col_sector: 'القطاع',
    col_amount: 'المبلغ (جنيه)',
    col_weight: 'الوزن %',
    col_live_price: 'السعر المباشر',
    col_today_change: 'تغير اليوم',
    col_return: 'العائد التاريخي %',
    col_volatility: 'التقلب %',
    col_liquidity: 'السيولة',
    asset_type_stock: 'أسهم',
    asset_type_gold: 'ذهب',
    asset_type_realestate: 'عقار',
    market_live_loading: 'جاري تحميل الأسعار المباشرة...',
    market_live_updated: 'تم تحديث الأسعار {time}',
    market_live_partial: 'تم تحديث الأسعار {time}؛ {n} رموز غير متاحة',

    // ── Risk Descriptions ────────────────────────────────────────
    risk_desc_conservative:
      'تفضّل الحفاظ على رأس المال مع تقلب ضئيل. تركّز محفظتك على الاستقرار والسيولة.',
    risk_desc_balanced:
      'تسعى إلى التوازن بين النمو وحماية رأس المال، ومرتاح مع تقلبات السوق المعتدلة.',
    risk_desc_aggressive:
      'تُعطي الأولوية لأقصى نمو على المدى البعيد ويمكنك تحمّل تقلبات السوق الحادة على المدى القصير.',

    // ── Toast / Error messages ───────────────────────────────────
    err_network: 'خطأ في الشبكة. يرجى التحقق من اتصالك.',
    err_profile_incomplete: 'يرجى إكمال ملفك الشخصي أولًا.',
    err_quiz_incomplete: 'يرجى إكمال اختبار المخاطر أولًا.',
    err_capital_low: 'الحد الأدنى لرأس المال 1,000 جنيه. يرجى تحديث ملفك.',
    err_portfolio_failed: 'فشل توليد المحفظة.',
    err_select_answer: 'يرجى اختيار إجابة قبل المتابعة.',
    err_answer_all: 'يرجى الإجابة على السؤال {n} قبل الإرسال.',
    // ── Stats Bar ────────────────────────────────────────────────
    stats_bar_asset_classes: 'أسهم وذهب وعقار',
    stats_bar_quiz_questions: 'أسئلة تقييم المخاطر',
    stats_bar_simulation: 'محاكاة النمو',
    stats_bar_live: 'مباشر',
    stats_bar_data: 'بيانات Yahoo Finance الحية',

    // ── Hero Visual Cards ─────────────────────────────────────────
    hero_card_score: 'درجة المحفظة',
    hero_card_div: 'مؤشر التنويع',
    hero_card_return: 'العائد المتوقع',
    hero_card_return_sub: 'سنوي (ملف متوازن)',
    hero_card_risk: 'مستوى المخاطر',
    hero_card_risk_sub: 'ملف قائم على الدرجة',
    hero_card_growth: 'نمو 10 سنوات',
    hero_card_growth_sub: 'توقع الحالة المتوسطة',

    // ── Dashboard extra ──────────────────────────────────────────
    table_loading: 'جارٍ تحميل بيانات المحفظة…',
    div_quality: 'جودة التنويع',
    loading_working: 'SmartInvest يعمل من أجلك',

    // ── Chatbot ──────────────────────────────────────────────────
    chat_title: 'مساعد SmartInvest',
    chat_subtitle: 'مستشارك الاستثماري الشخصي',
    chat_placeholder: 'اسألني أي شيء…',

    // ── Tooltips ───────────────────────────────────────────────────
    tip_hist_return:
      'عائد سنوي محسوب من الأسعار الحديثة التي تم تحميلها. هو تاريخي وليس ضمانًا لعائد مستقبلي.',
    tip_diversification:
      'درجة من 0 إلى 10 بناءً على اختلاف حركة الأصول تاريخيًا. الأعلى يعني ارتباطًا أقل.',
    tip_volatility:
      'مدى صعود وهبوط الأصل أو المحفظة تاريخيًا. التقلب الأعلى يعني حركة أكبر.',
    tip_sharpe:
      'عائد معدل بالمخاطر. الرقم الأعلى يعني عائدًا تاريخيًا أكبر مقابل كل وحدة مخاطر.',
    tip_risk_category:
      'نتيجة اختبارك: محافظ أو متوازن أو نشط.',
    tip_inflation:
      'يستخدم فقط في نتيجة المتوسط بعد التضخم. اكتب 5 إذا كنت تقصد 5%.',
    tip_liquidity:
      'ترتيب من 1 إلى 10 حسب متوسط حجم التداول من Yahoo Finance داخل عالم المشروع.',
    tip_live_price:
      'آخر سعر متاح من Yahoo Finance. البيانات المجانية قد تكون متأخرة.',
    tip_today_change:
      'التغير من إغلاق اليوم السابق إلى آخر سعر متاح.',

    // ── Quiz Questions ───────────────────────────────────────────
    questions: [
      {
        text: 'ما هو هدفك الاستثماري الأساسي؟',
        options: [
          'الحفاظ على رأس مالي بأقل قدر من المخاطر',
          'توليد دخل ثابت بمخاطر منخفضة',
          'تحقيق التوازن بين النمو والدخل',
          'تعظيم النمو على المدى البعيد مع قبول مخاطر عالية',
        ],
      },
      {
        text: 'كيف ستتصرف إذا انخفضت محفظتك 20% في شهر واحد؟',
        options: [
          'أذعر وأبيع كل شيء فورًا',
          'أشعر بعدم الارتياح الشديد وأفكر في البيع',
          'أبقى هادئًا لكن أراقب الوضع عن كثب',
          'أرى في ذلك فرصة للشراء',
        ],
      },
      {
        text: 'ما هو أفق استثمارك الزمني؟',
        options: [
          'أقل من سنة',
          'من 1 إلى 3 سنوات',
          'من 3 إلى 7 سنوات',
          'أكثر من 7 سنوات',
        ],
      },
      {
        text: 'ما أكبر خسارة قصيرة المدى يمكنك تحملها دون البيع؟',
        options: [
          'من 0% إلى 5%',
          'من 5% إلى 10%',
          'من 10% إلى 20%',
          'أكثر من 20%',
        ],
      },
      {
        text: 'ما مدى إلمامك بالأدوات المالية (الأسهم والسندات وصناديق الاستثمار)؟',
        options: [
          'لا أعرف شيئًا',
          'معرفة أساسية',
          'متوسط — أستثمر أحيانًا',
          'متقدم — أدير استثماراتي بفاعلية',
        ],
      },
      {
        text: 'هل سبق لك الاستثمار؟',
        options: [
          'أبدًا',
          'مرة أو مرتين وخسرت',
          'نعم، بنتائج متفاوتة',
          'نعم، بشكل منتظم وبمكاسب',
        ],
      },
      {
        text: 'إذا هبط السوق، كم من الوقت يمكنك البقاء مستثمرًا دون الحاجة للبيع؟',
        options: [
          'أقل من 3 أشهر',
          'من 3 إلى 12 شهرًا',
          'من سنة إلى 3 سنوات',
          'أكثر من 3 سنوات',
        ],
      },
      {
        text: 'ما مدى قوة صندوق الطوارئ لديك؟',
        options: [
          'لا يوجد صندوق طوارئ',
          'أقل من 3 أشهر من المصروفات',
          'من 3 إلى 6 أشهر من المصروفات',
          'أكثر من 6 أشهر من المصروفات',
        ],
      },
      {
        text: 'ما نسبة مدخراتك الكلية التي تستثمرها هنا؟',
        options: [
          'أكثر من 80% — هذا معظم ما لدي',
          'من 50% إلى 80%',
          'من 20% إلى 50%',
          'أقل من 20% — هذه أموال إضافية',
        ],
      },
      {
        text: 'هل لديك معالون ماليون (أطفال، أسرة)؟',
        options: [
          'نعم، كثيرون',
          'نعم، عدد قليل',
          'أنا فقط',
          'لا يوجد معالون إطلاقًا',
        ],
      },
      {
        text: 'كيف تصف استقرار وظيفتك الحالية؟',
        options: [
          'غير مستقر — عقود/مستقل بدون ضمان',
          'مستقر نسبيًا',
          'مستقر مع آفاق جيدة',
          'مستقر جدًا — حكومي أو منصب رفيع',
        ],
      },
      {
        text: 'إذا خُيِّرت بين عائد 8% مضمون أو فرصة 50% للحصول على 25%، ماذا تختار؟',
        options: [
          'بالتأكيد الـ8% المضمونة',
          'الخيار المضمون على الأرجح',
          'الخيار ذو المخاطرة الأعلى على الأرجح',
          'بالتأكيد فرصة الـ25%',
        ],
      },
      {
        text: 'ما مدى ارتياحك لنتائج استثمارية غير مؤكدة؟',
        options: [
          'أفضل النتائج المتوقعة جدًا',
          'أتقبل قدرًا بسيطًا من عدم اليقين',
          'أتقبل قدرًا متوسطًا من عدم اليقين',
          'أتقبل عدم يقين عاليًا مقابل عائد محتمل أعلى',
        ],
      },
      {
        text: 'كيف تشعر حين تؤدي استثماراتك جيدًا وترتفع بسرعة؟',
        options: [
          'قلق أنها ستنهار قريبًا، أريد البيع',
          'سعيد لكن حذر',
          'متفائل لكن أتمسك باستراتيجيتي',
          'متحمس واستثمر أكثر',
        ],
      },
      {
        text: 'ما هو هدفك المالي بعيد المدى؟',
        options: [
          'مجرد حماية ما لدي من التضخم',
          'نمو بطيء للثروة على مدى عقود',
          'بناء محفظة متنوعة ومتنامية',
          'بناء أقصى ثروة ممكنة بأسرع وقت',
        ],
      },
    ],
  },
};

// ── Public API ─────────────────────────────────────────────────────

function getLang() {
  return localStorage.getItem('smartinvest_lang') || 'en';
}

function setLang(lang) {
  localStorage.setItem('smartinvest_lang', lang);
  applyLang(lang);
}

function toggleLang() {
  setLang(getLang() === 'ar' ? 'en' : 'ar');
}

/** Get a translated string for key */
function t(key) {
  const lang = getLang();
  const dict = TRANSLATIONS[lang] || TRANSLATIONS['en'];
  const fallback = TRANSLATIONS['en'];
  const val = dict[key] !== undefined ? dict[key] : fallback[key];
  return val !== undefined ? val : key;
}

/** Get a translated string with {placeholder} substitution */
function tf(key, params = {}) {
  let str = t(key);
  if (typeof str !== 'string') return str;
  Object.entries(params).forEach(([k, v]) => {
    str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  });
  return str;
}

/** Apply language to the full page */
function applyLang(lang) {
  const html = document.documentElement;
  html.setAttribute('lang', lang);
  html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

  // Swap text content for data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if (typeof val === 'string') el.textContent = val;
  });

  // Swap placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const val = t(key);
    if (typeof val === 'string') el.placeholder = val;
  });

  // Swap title attributes
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    const val = t(key);
    if (typeof val === 'string') el.title = val;
  });

  // Swap custom tooltip text
  document.querySelectorAll('[data-tooltip-key]').forEach(el => {
    const key = el.getAttribute('data-tooltip-key');
    const val = t(key);
    if (typeof val === 'string') el.setAttribute('data-tooltip', val);
  });

  // Update the language toggle button label
  const btn = document.getElementById('lang-toggle');
  if (btn) btn.textContent = t('lang_toggle');

  // Notify other scripts that language has changed
  document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
}

// Apply on initial page load
document.addEventListener('DOMContentLoaded', function () {
  applyLang(getLang());
});
