import re
import bcrypt
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from database import db
from models import User

auth_bp = Blueprint('auth', __name__)


def _valid_email(email):
    return bool(re.match(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$', email))


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"status": "error", "message": "No JSON data provided", "code": "NO_DATA"}), 400

    name = str(data.get('name', '')).strip()
    email = str(data.get('email', '')).strip().lower()
    password = str(data.get('password', ''))

    if not name:
        return jsonify({"status": "error", "message": "Name is required", "code": "VALIDATION_ERROR"}), 400
    if not email or not _valid_email(email):
        return jsonify({"status": "error", "message": "Valid email is required", "code": "VALIDATION_ERROR"}), 400
    if len(password) < 8:
        return jsonify({"status": "error", "message": "Password must be at least 8 characters", "code": "VALIDATION_ERROR"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"status": "error", "message": "Email already registered", "code": "EMAIL_TAKEN"}), 409

    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=12)).decode('utf-8')
    user = User(name=name, email=email, password_hash=password_hash)
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.user_id))
    return jsonify({
        "status": "success",
        "message": "Registration successful",
        "data": {
            "token": token,
            "user": {"user_id": user.user_id, "name": user.name, "email": user.email},
        }
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"status": "error", "message": "No JSON data provided", "code": "NO_DATA"}), 400

    email = str(data.get('email', '')).strip().lower()
    password = str(data.get('password', ''))

    if not email or not password:
        return jsonify({"status": "error", "message": "Email and password required", "code": "VALIDATION_ERROR"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
        return jsonify({"status": "error", "message": "Invalid email or password", "code": "INVALID_CREDENTIALS"}), 401

    token = create_access_token(identity=str(user.user_id))
    profile_complete = all([
        user.current_capital is not None,
        user.investment_goal is not None,
        user.investment_horizon is not None,
        user.liquidity_needs is not None,
    ])

    return jsonify({
        "status": "success",
        "message": "Login successful",
        "data": {
            "token": token,
            "user": {
                "user_id": user.user_id,
                "name": user.name,
                "email": user.email,
                "profile_complete": profile_complete,
                "risk_category": user.final_risk_category,
            }
        }
    }), 200
