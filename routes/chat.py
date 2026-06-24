"""
AI Chatbot route — /api/chat

Uses an OpenAI-compatible API when configured, with the user's full investment
profile injected as system context. If no valid API key is configured, a small
local fallback still answers common project questions.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from openai import OpenAI
from models import User
from config import Config

chat_bp = Blueprint('chat', __name__)

_MAX_MESSAGE_LEN  = 1000   # characters per user message
_MAX_HISTORY_MSGS = 10     # number of past messages kept (each side)


@chat_bp.route('/chat_status', methods=['GET'])
@jwt_required()
def chat_status():
    """Return non-secret AI configuration status for debugging."""
    return jsonify({
        "configured": bool(Config.AI_API_KEY),
        "base_url": Config.AI_BASE_URL,
        "model": Config.AI_MODEL,
        "key_prefix": Config.AI_API_KEY[:4] if Config.AI_API_KEY else "",
    }), 200


def _build_system_prompt(user: User) -> str:
    """Compose a context-rich system prompt from the user's DB record."""

    lines = [
        "You are SmartInvest Assistant, a professional Egyptian investment advisor chatbot.",
        "Respond in the same language the user writes in (Arabic → Arabic, English → English).",
        "Be concise, professional, and encouraging.",
        "Use the profile data below to give personalised, specific answers.",
        "Do not invent stock prices or market data that is not given here.",
        "If asked about topics unrelated to investing, politely redirect the conversation.",
        "",
        "══════════════════════════════",
        "USER PROFILE",
        "══════════════════════════════",
        f"Name:                 {user.name}",
        f"Risk Profile:         {user.final_risk_category or 'Not assessed yet'}",
    ]

    if user.current_capital:
        lines.append(f"Investment Capital:   EGP {user.current_capital:,.0f}")
    if user.investment_goal:
        lines.append(f"Investment Goal:      {user.investment_goal}")
    if user.investment_horizon:
        lines.append(f"Investment Horizon:   {user.investment_horizon} years")
    if user.monthly_contribution:
        lines.append(f"Monthly Contribution: EGP {user.monthly_contribution:,.0f}")
    if user.liquidity_needs:
        lines.append(f"Liquidity Needs:      {user.liquidity_needs}")

    # Latest portfolio
    portfolios = sorted(user.portfolios, key=lambda p: p.created_at or 0, reverse=True)
    if portfolios:
        p = portfolios[0]
        lines += [
            "",
            "══════════════════════════════",
            "CURRENT PORTFOLIO",
            "══════════════════════════════",
            f"Risk Level:            {p.risk_level}",
            f"Total Investment:      EGP {p.total_investment:,.0f}" if p.total_investment else "",
            f"Historical Annual Return:{p.expected_return:.1f}%" if p.expected_return is not None else "",
            f"Annual Volatility:     {p.volatility:.1f}%" if p.volatility is not None else "",
            f"Sharpe Ratio:          {p.sharpe_ratio:.2f}" if p.sharpe_ratio is not None else "",
            f"Diversification Score: {p.diversification_score:.1f}/10" if p.diversification_score is not None else "",
            "",
            "Allocations:",
        ]
        for alloc in p.allocations:
            ret  = f"{alloc.expected_return:.1f}%" if alloc.expected_return is not None else "N/A"
            vol  = f"{alloc.volatility:.1f}%"      if alloc.volatility      is not None else "N/A"
            wt   = f"{alloc.weight_percent:.1f}%"  if alloc.weight_percent  is not None else "N/A"
            amt  = f"EGP {alloc.amount_egp:,.0f}"  if alloc.amount_egp      is not None else "N/A"
            lines.append(
                f"  • {alloc.asset_name} ({alloc.ticker_symbol}) | "
                f"{wt} = {amt} | {alloc.asset_type} | "
                f"Return {ret} | Volatility {vol}"
            )

        # Simulation summary
        if p.simulations:
            sim = sorted(p.simulations, key=lambda s: s.created_at or 0, reverse=True)[0]
            if sim.average_case and len(sim.average_case) > 0:
                avg_final   = sim.average_case[-1]
                best_final  = sim.best_case[-1]  if sim.best_case  else None
                worst_final = sim.worst_case[-1] if sim.worst_case else None
                lines += [
                    "",
                    "══════════════════════════════",
                    f"WEALTH SIMULATION ({sim.years}-YEAR PROJECTION)",
                    "══════════════════════════════",
                    f"Average Case: EGP {avg_final:,.0f}",
                ]
                if best_final:
                    lines.append(f"Best Case:    EGP {best_final:,.0f}")
                if worst_final:
                    lines.append(f"Worst Case:   EGP {worst_final:,.0f}")
    else:
        lines += [
            "",
            "Note: This user has not generated a portfolio yet.",
        ]

    lines.append("")
    return "\n".join(line for line in lines if line is not None)


def _is_arabic(text: str) -> bool:
    return any('\u0600' <= ch <= '\u06ff' for ch in text or '')


def _latest_portfolio(user: User):
    portfolios = sorted(user.portfolios, key=lambda p: p.created_at or 0, reverse=True)
    return portfolios[0] if portfolios else None


def _portfolio_summary_en(portfolio) -> str:
    if not portfolio:
        return "No portfolio has been generated yet. Complete the profile and quiz, then open the dashboard to generate one."
    allocations = ", ".join(
        f"{a.ticker_symbol} {a.weight_percent:.1f}%"
        for a in portfolio.allocations[:8]
        if a.weight_percent is not None
    )
    return (
        f"Your latest portfolio is {portfolio.risk_level}, with capital "
        f"EGP {portfolio.total_investment:,.0f}. Historical annual return is "
        f"{portfolio.expected_return:.1f}%, annual volatility is {portfolio.volatility:.1f}%, "
        f"Sharpe ratio is {portfolio.sharpe_ratio:.2f}, and diversification score is "
        f"{portfolio.diversification_score:.1f}/10. Main holdings: {allocations}."
    )


def _portfolio_summary_ar(portfolio) -> str:
    if not portfolio:
        return "لم يتم إنشاء محفظة بعد. أكمل الملف الاستثماري والاختبار ثم افتح لوحة التحكم لتوليد المحفظة."
    allocations = ", ".join(
        f"{a.ticker_symbol} {a.weight_percent:.1f}%"
        for a in portfolio.allocations[:8]
        if a.weight_percent is not None
    )
    return (
        f"آخر محفظة لديك هي {portfolio.risk_level} برأس مال "
        f"{portfolio.total_investment:,.0f} جنيه. العائد التاريخي السنوي "
        f"{portfolio.expected_return:.1f}%، التقلب السنوي {portfolio.volatility:.1f}%، "
        f"معامل شارب {portfolio.sharpe_ratio:.2f}، ودرجة التنويع "
        f"{portfolio.diversification_score:.1f}/10. أهم المراكز: {allocations}."
    )


def _build_local_reply(user: User, message: str, service_warning: str = "") -> str:
    """
    Small deterministic fallback used when the external AI key is missing/invalid.
    It keeps the demo usable and avoids showing raw provider errors to users.
    """
    ar = _is_arabic(message)
    text = (message or "").lower()
    portfolio = _latest_portfolio(user)

    if ar:
        if any(word in message for word in ["اهلا", "أهلا", "مرحبا", "السلام"]):
            return "أهلًا! اسألني عن المحفظة، سبب اختيار أصل معين، الأوزان، العائد التاريخي، التقلب، معامل شارب، السيولة، أو التنويع."
        if any(word in message for word in ["نسبة", "وزن", "14", "6", "لماذا", "ليه"]):
            return (
                "اختلاف الأوزان داخل نفس الملف يحدث لأن المحفظة ليست موزعة بالتساوي بالكامل. "
                "النظام يبدأ بنسبة مستهدفة لكل فئة أصول، ثم يوزع داخل الفئة بمزيج من وزن متساوٍ "
                "ووزن حسب ترتيب الأصل. ترتيب الأصل يعتمد على العائد التاريخي، معامل شارب، السيولة، "
                "وانخفاض التقلب. لذلك أصل ترتيبه أقوى يمكن أن يأخذ مثلًا 14%، وأصل أضعف لكنه ما زال "
                "مفيدًا للتنويع قد يأخذ 6%."
            )
        if any(word in message for word in ["توصية", "ترشيح", "محفظة", "اختيار", "الأصول"]):
            return (
                _portfolio_summary_ar(portfolio)
                + "\n\nطريقة التوصية: درجة المخاطر تحدد النسب بين الأسهم والذهب والعقار. "
                "حجم رأس المال يحدد الحد الأقصى لعدد الأصول. بعد ذلك يتم ترتيب كل أصل حسب "
                "العائد التاريخي والتقلب ومعامل شارب والسيولة، ثم يتم تجنب الأصول شديدة الارتباط."
            )
        if any(word in message for word in ["عائد", "return", "تاريخي"]):
            return "العائد التاريخي السنوي = متوسط العائد اليومي من أسعار Yahoo Finance مضروبًا في 252 يوم تداول. هو رقم تاريخي للتفسير وليس ضمانًا للمستقبل."
        if any(word in message for word in ["تنويع", "diversification", "ارتباط"]):
            return "درجة التنويع تعتمد على الارتباط التاريخي بين الأصول المختارة. إذا كانت الأصول تتحرك معًا كثيرًا تكون الدرجة أقل، وإذا كانت تتحرك بشكل مختلف تكون الدرجة أعلى."
        if any(word in message for word in ["تقلب", "volatility"]):
            return "التقلب السنوي يقيس مقدار صعود وهبوط السعر تاريخيًا. نحسب الانحراف المعياري للعوائد اليومية ثم نحوله إلى سنوي باستخدام الجذر التربيعي لـ252."
        if any(word in message for word in ["شارب", "sharpe"]):
            return "معامل شارب = العائد فوق معدل خالي من المخاطر مقسومًا على التقلب. كلما زاد، كان العائد التاريخي أفضل بالنسبة للمخاطرة."
        if any(word in message for word in ["سيولة", "liquidity"]):
            return "السيولة هي ترتيب من 1 إلى 10 حسب متوسط حجم التداول من Yahoo Finance داخل عالم الأصول. الأعلى يعني أن السهم أسهل نسبيًا في البيع والشراء."
        return (
            "أعمل حاليًا بدون مفتاح AI خارجي صالح، لذلك أستطيع الإجابة فقط عن أسئلة المشروع المحددة. "
            "اسألني مثلًا: لماذا سهم أخذ 14%؟ كيف تُحسب التوصية؟ ما معنى معامل شارب؟ كيف تُحسب السيولة أو التنويع؟"
        )

    if any(word in text for word in ["hello", "hi", "hey"]):
        return "Hi! Ask me about your portfolio, asset weights, recommendation logic, historical return, volatility, Sharpe ratio, liquidity, or diversification."
    if any(word in text for word in ["weight", "percent", "percentage", "14", "6", "why this", "why does"]):
        return (
            "Different assets get different weights because the portfolio is not fully equal-weighted. "
            "First, the optimizer assigns a target percentage to each asset class. Then, inside each class, "
            "it blends equal weighting with score-based weighting. The score uses historical return, Sharpe ratio, "
            "liquidity, and lower volatility. In an Aggressive profile, the score tilt is stronger, so a top-ranked "
            "asset can receive around 14%, while another selected asset may receive around 6% because its score is lower "
            "or because it is included mainly for diversification."
        )
    if any(word in text for word in ["recommend", "allocation", "portfolio", "choose", "assets", "stocks"]):
        return (
            _portfolio_summary_en(portfolio)
            + "\n\nRecommendation logic: risk category sets target weights between stocks, gold, and real estate. "
            "Capital sets the maximum number of holdings. Then each candidate is ranked using historical return, "
            "volatility, Sharpe ratio, and liquidity. Highly correlated assets are filtered so the portfolio is not just many names moving the same way."
        )
    if any(word in text for word in ["return", "historical"]):
        return "Historical annual return is calculated from Yahoo Finance prices: average daily return multiplied by 252 trading days. It is historical evidence, not a guaranteed future return."
    if any(word in text for word in ["diversification", "correlation"]):
        return "Diversification score is based on historical correlation between the selected assets. Assets that move together reduce the score; assets that move differently improve it."
    if any(word in text for word in ["volatility"]):
        return "Annual volatility measures how much the price moved up and down historically. It uses the standard deviation of daily returns, annualized with sqrt(252)."
    if any(word in text for word in ["sharpe"]):
        return "Sharpe ratio is risk-adjusted return: (annual return minus the risk-free rate) divided by annual volatility. Higher means better historical return per unit of risk."
    if any(word in text for word in ["liquidity"]):
        return "Liquidity is a 1-10 rank based on average Yahoo Finance trading volume inside the project universe. Higher means easier relative trading."
    if any(word in text for word in ["risk", "classification", "quiz"]):
        return "Risk classification is now weighted: behavioral risk-tolerance answers carry 70%, financial capacity answers carry 20%, and knowledge/goal answers carry 10%. This prevents time horizon or emergency savings from dominating the result."
    return (
        "I do not have a valid external AI key right now, so I can only answer specific SmartInvest project questions locally. "
        "Try asking: why does one asset have 14% and another 6%, how is the recommendation calculated, what is Sharpe ratio, "
        "or how are liquidity and diversification calculated."
    )


@chat_bp.route('/chat', methods=['POST'])
@jwt_required()
def chat():
    """
    POST /api/chat
    Body: { "message": "...", "history": [{"role":"user","content":"..."}, ...] }
    Returns: { "reply": "..." }
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data    = request.get_json(silent=True) or {}
    message = (data.get('message') or '').strip()
    history = data.get('history') or []

    if not message:
        return jsonify({"error": "Message is required"}), 400

    # Sanitise inputs
    message = message[:_MAX_MESSAGE_LEN]
    history = history[-_MAX_HISTORY_MSGS:]

    if not Config.AI_API_KEY:
        return jsonify({
            "error": (
                "AI API key is not configured. Add GROQ_API_KEY or AI_API_KEY "
                "to .env, then restart python app.py."
            ),
            "code": "AI_KEY_MISSING",
        }), 503

    # Build message list
    system_prompt = _build_system_prompt(user)
    messages = [{"role": "system", "content": system_prompt}]

    for item in history:
        role    = item.get('role')
        content = (item.get('content') or '')[:500]
        if role in ('user', 'assistant') and content:
            messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": message})

    try:
        client = OpenAI(
            api_key=Config.AI_API_KEY,
            base_url=Config.AI_BASE_URL,
        )
        response = client.chat.completions.create(
            model=Config.AI_MODEL,
            messages=messages,
            max_tokens=600,
            temperature=0.7,
        )
        reply = response.choices[0].message.content.strip()
        return jsonify({"reply": reply})

    except Exception as exc:
        message_text = str(exc)
        if "401" in message_text or "invalid_api_key" in message_text.lower():
            message = (
                "AI API key is invalid for the configured provider. Check that "
                "the key matches AI_BASE_URL and restart python app.py."
            )
        else:
            message = f"AI provider request failed: {message_text}"
        return jsonify({
            "error": message,
            "code": "AI_PROVIDER_ERROR",
        }), 503
