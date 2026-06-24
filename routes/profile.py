import re
import bcrypt
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import User, Portfolio, PortfolioAllocation, Simulation

profile_bp = Blueprint('profile', __name__)


def _valid_email(email):
    return bool(re.match(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$', email))


@profile_bp.route('/profile', methods=['POST'])
@jwt_required()
def save_profile():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"status": "error", "message": "User not found", "code": "USER_NOT_FOUND"}), 404

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"status": "error", "message": "No data provided", "code": "NO_DATA"}), 400

    capital = data.get('current_capital')
    goal = str(data.get('investment_goal', '')).strip()
    horizon = data.get('investment_horizon')
    liquidity = str(data.get('liquidity_needs', '')).strip()
    monthly = data.get('monthly_contribution', 0)

    try:
        capital = float(capital)
    except (TypeError, ValueError):
        return jsonify({"status": "error", "message": "Capital must be a valid number", "code": "VALIDATION_ERROR"}), 400

    if capital <= 0:
        return jsonify({"status": "error", "message": "Capital must be greater than 0", "code": "VALIDATION_ERROR"}), 400

    if not goal:
        return jsonify({"status": "error", "message": "Investment goal is required", "code": "VALIDATION_ERROR"}), 400

    try:
        horizon = int(horizon)
    except (TypeError, ValueError):
        return jsonify({"status": "error", "message": "Horizon must be a valid integer", "code": "VALIDATION_ERROR"}), 400

    if not (1 <= horizon <= 30):
        return jsonify({"status": "error", "message": "Horizon must be between 1 and 30 years", "code": "VALIDATION_ERROR"}), 400

    if liquidity not in ("High", "Medium", "Low"):
        return jsonify({"status": "error", "message": "Liquidity needs must be High, Medium, or Low", "code": "VALIDATION_ERROR"}), 400

    try:
        monthly = float(monthly) if monthly else 0.0
    except (TypeError, ValueError):
        return jsonify({"status": "error", "message": "Monthly contribution must be a valid number", "code": "VALIDATION_ERROR"}), 400

    if monthly < 0:
        return jsonify({"status": "error", "message": "Monthly contribution cannot be negative", "code": "VALIDATION_ERROR"}), 400

    profile_changed = any([
        user.current_capital != capital,
        user.investment_goal != goal,
        user.investment_horizon != horizon,
        user.liquidity_needs != liquidity,
        (user.monthly_contribution or 0) != monthly,
    ])

    user.current_capital = capital
    user.investment_goal = goal
    user.investment_horizon = horizon
    user.liquidity_needs = liquidity
    user.monthly_contribution = monthly

    if profile_changed:
        old_portfolios = Portfolio.query.filter_by(user_id=user_id).all()
        for portfolio in old_portfolios:
            Simulation.query.filter_by(portfolio_id=portfolio.portfolio_id).delete()
            PortfolioAllocation.query.filter_by(portfolio_id=portfolio.portfolio_id).delete()
            db.session.delete(portfolio)

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Profile saved successfully",
        "data": {
            "current_capital": user.current_capital,
            "investment_goal": user.investment_goal,
            "investment_horizon": user.investment_horizon,
            "liquidity_needs": user.liquidity_needs,
            "monthly_contribution": user.monthly_contribution,
        }
    }), 200


@profile_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"status": "error", "message": "User not found", "code": "USER_NOT_FOUND"}), 404

    return jsonify({
        "status": "success",
        "data": {
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
            "current_capital": user.current_capital,
            "investment_goal": user.investment_goal,
            "investment_horizon": user.investment_horizon,
            "liquidity_needs": user.liquidity_needs,
            "monthly_contribution": user.monthly_contribution,
            "final_risk_category": user.final_risk_category,
        }
    }), 200


@profile_bp.route('/account', methods=['GET'])
@jwt_required()
def get_account():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"status": "error", "message": "User not found", "code": "USER_NOT_FOUND"}), 404

    return jsonify({
        "status": "success",
        "data": {
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
        }
    }), 200


@profile_bp.route('/account', methods=['POST'])
@jwt_required()
def update_account():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"status": "error", "message": "User not found", "code": "USER_NOT_FOUND"}), 404

    data = request.get_json(silent=True) or {}
    name = str(data.get('name', '')).strip()
    email = str(data.get('email', '')).strip().lower()
    current_password = str(data.get('current_password', ''))
    new_password = str(data.get('new_password', ''))

    if not name:
        return jsonify({"status": "error", "message": "Name is required", "code": "VALIDATION_ERROR"}), 400
    if not email or not _valid_email(email):
        return jsonify({"status": "error", "message": "Valid email is required", "code": "VALIDATION_ERROR"}), 400

    existing = User.query.filter(User.email == email, User.user_id != user_id).first()
    if existing:
        return jsonify({"status": "error", "message": "Email already registered", "code": "EMAIL_TAKEN"}), 409

    if new_password:
        if len(new_password) < 8:
            return jsonify({"status": "error", "message": "New password must be at least 8 characters", "code": "VALIDATION_ERROR"}), 400
        if not current_password or not bcrypt.checkpw(
            current_password.encode('utf-8'),
            user.password_hash.encode('utf-8')
        ):
            return jsonify({"status": "error", "message": "Current password is incorrect", "code": "INVALID_PASSWORD"}), 401
        user.password_hash = bcrypt.hashpw(
            new_password.encode('utf-8'),
            bcrypt.gensalt(rounds=12)
        ).decode('utf-8')

    user.name = name
    user.email = email
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Account updated successfully",
        "data": {
            "user": {"user_id": user.user_id, "name": user.name, "email": user.email}
        }
    }), 200
