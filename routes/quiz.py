from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import User, RiskQuiz, Portfolio, PortfolioAllocation, Simulation
from ml.risk_classifier import predict_risk_category

quiz_bp = Blueprint('quiz', __name__)

QUESTION_NAMES = {
    "Q1": "Investment Goal",
    "Q2": "Loss Reaction",
    "Q3": "Time Horizon",
    "Q4": "Acceptable Short-Term Loss",
    "Q5": "Financial Literacy",
    "Q6": "Prior Experience",
    "Q7": "Downturn Patience",
    "Q8": "Emergency Savings",
    "Q9": "% of Savings",
    "Q10": "Financial Dependents",
    "Q11": "Job Stability",
    "Q12": "Risk Preference",
    "Q13": "Uncertainty Comfort",
    "Q14": "Gains Reaction",
    "Q15": "Long-term Aspiration",
}


@quiz_bp.route('/submit_quiz', methods=['POST'])
@jwt_required()
def submit_quiz():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"status": "error", "message": "User not found", "code": "USER_NOT_FOUND"}), 404

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"status": "error", "message": "No data provided", "code": "NO_DATA"}), 400

    answers = data.get('answers', [])
    if len(answers) != 15:
        return jsonify({"status": "error", "message": "Exactly 15 answers required", "code": "VALIDATION_ERROR"}), 400

    validated = []
    for i, ans in enumerate(answers):
        if not isinstance(ans, int) or not (0 <= ans <= 3):
            return jsonify({
                "status": "error",
                "message": f"Answer {i+1} must be integer 0–3",
                "code": "VALIDATION_ERROR"
            }), 400
        validated.append(ans)

    prediction = predict_risk_category(validated)
    quiz = RiskQuiz(
        user_id=user_id,
        q1_ans=validated[0], q2_ans=validated[1], q3_ans=validated[2],
        q4_ans=validated[3], q5_ans=validated[4], q6_ans=validated[5],
        q7_ans=validated[6], q8_ans=validated[7], q9_ans=validated[8],
        q10_ans=validated[9], q11_ans=validated[10], q12_ans=validated[11],
        q13_ans=validated[12], q14_ans=validated[13], q15_ans=validated[14],
        total_score=prediction['total_score'],
        risk_category=prediction['category'],
        score_breakdown=prediction.get('score_breakdown', {}),
    )
    db.session.add(quiz)

    user.final_risk_category = prediction['category']

    old_portfolios = Portfolio.query.filter_by(user_id=user_id).all()
    for portfolio in old_portfolios:
        Simulation.query.filter_by(portfolio_id=portfolio.portfolio_id).delete()
        PortfolioAllocation.query.filter_by(portfolio_id=portfolio.portfolio_id).delete()
        db.session.delete(portfolio)

    db.session.commit()

    top_factor_names = [QUESTION_NAMES.get(f, f) for f in prediction.get('top_factors', [])]
    score_pct = prediction['score_percent']

    return jsonify({
        "status": "success",
        "data": {
            "risk_category":    prediction['category'],
            "total_score":      prediction['total_score'],
            "score_percent":    score_pct,
            "max_score":        prediction['max_score'],
            "thresholds":       prediction['thresholds'],
            "score_breakdown":  prediction.get('score_breakdown', {}),
            "top_factors":      prediction.get('top_factors', []),
            "top_factor_names": top_factor_names,
            "category_reason":  prediction.get('category_reason', ''),
            "message": (
                f"You scored {prediction['total_score']}/45 ({score_pct}%). "
                f"Your investor profile is {prediction['category']}. "
                f"{prediction.get('category_reason', '')}"
            ),
        }
    }), 200
