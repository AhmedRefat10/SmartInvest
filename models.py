from datetime import datetime
from database import db


def _answer_range_constraint(column_name):
    return db.CheckConstraint(
        f"{column_name} BETWEEN 0 AND 3",
        name=f"ck_risk_quizzes_{column_name}_range",
    )


class User(db.Model):
    __tablename__ = 'users'

    user_id              = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name                 = db.Column(db.String(100), nullable=False)
    email                = db.Column(db.String(150), unique=True, nullable=False, index=True)
    password_hash        = db.Column(db.String(255), nullable=False)
    created_at           = db.Column(db.DateTime, default=datetime.utcnow)
    current_capital      = db.Column(db.Float, nullable=True)
    investment_goal      = db.Column(db.String(100), nullable=True)
    investment_horizon   = db.Column(db.Integer, nullable=True)
    liquidity_needs      = db.Column(db.String(20), nullable=True)
    monthly_contribution = db.Column(db.Float, nullable=True, default=0)
    final_risk_category  = db.Column(db.String(20), nullable=True)

    quizzes    = db.relationship('RiskQuiz',  backref='user', lazy=True)
    portfolios = db.relationship('Portfolio', backref='user', lazy=True)


class RiskQuiz(db.Model):
    __tablename__ = 'risk_quizzes'
    __table_args__ = tuple(
        _answer_range_constraint(f"q{i}_ans") for i in range(1, 16)
    ) + (
        db.CheckConstraint(
            "total_score IS NULL OR total_score BETWEEN 0 AND 45",
            name="ck_risk_quizzes_total_score_range",
        ),
        db.CheckConstraint(
            "risk_category IS NULL OR risk_category IN ('Conservative', 'Balanced', 'Aggressive')",
            name="ck_risk_quizzes_risk_category",
        ),
    )

    quiz_id      = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id      = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    q1_ans  = db.Column(db.Integer, nullable=False)
    q2_ans  = db.Column(db.Integer, nullable=False)
    q3_ans  = db.Column(db.Integer, nullable=False)
    q4_ans  = db.Column(db.Integer, nullable=False)
    q5_ans  = db.Column(db.Integer, nullable=False)
    q6_ans  = db.Column(db.Integer, nullable=False)
    q7_ans  = db.Column(db.Integer, nullable=False)
    q8_ans  = db.Column(db.Integer, nullable=False)
    q9_ans  = db.Column(db.Integer, nullable=False)
    q10_ans = db.Column(db.Integer, nullable=False)
    q11_ans = db.Column(db.Integer, nullable=False)
    q12_ans = db.Column(db.Integer, nullable=False)
    q13_ans = db.Column(db.Integer, nullable=False)
    q14_ans = db.Column(db.Integer, nullable=False)
    q15_ans = db.Column(db.Integer, nullable=False)
    total_score = db.Column(db.Integer, nullable=True)
    risk_category = db.Column(db.String(20), nullable=True)
    score_breakdown = db.Column(db.JSON, nullable=True)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)


class Portfolio(db.Model):
    __tablename__ = 'portfolios'

    portfolio_id          = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id               = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    created_at            = db.Column(db.DateTime, default=datetime.utcnow)
    total_investment      = db.Column(db.Float)
    risk_level            = db.Column(db.String(20))
    expected_return       = db.Column(db.Float)
    volatility            = db.Column(db.Float)
    sharpe_ratio          = db.Column(db.Float)
    diversification_score = db.Column(db.Float)

    allocations = db.relationship('PortfolioAllocation', backref='portfolio', lazy=True)
    simulations = db.relationship('Simulation',          backref='portfolio', lazy=True)


class PortfolioAllocation(db.Model):
    """
    One row per asset in a saved portfolio.
    All asset details are stored here directly — there is no separate Asset table.
    The asset universe is defined in ml/data_fetcher.py (ASSET_UNIVERSE).
    """
    __tablename__ = 'portfolio_allocations'

    allocation_id   = db.Column(db.Integer, primary_key=True, autoincrement=True)
    portfolio_id    = db.Column(db.Integer, db.ForeignKey('portfolios.portfolio_id'), nullable=False)
    ticker_symbol   = db.Column(db.String(20),  nullable=False)
    asset_name      = db.Column(db.String(200), nullable=False)
    asset_type      = db.Column(db.String(20),  nullable=False)  # Stock | Gold | RealEstate
    sector          = db.Column(db.String(50),  nullable=True)
    liquidity_score = db.Column(db.Integer,     nullable=True)   # 1–10
    weight_percent  = db.Column(db.Float)
    amount_egp      = db.Column(db.Float)
    expected_return = db.Column(db.Float)
    volatility      = db.Column(db.Float)
    sharpe_ratio    = db.Column(db.Float)
    rank_score      = db.Column(db.Float)
    return_score    = db.Column(db.Float)
    sharpe_score    = db.Column(db.Float)
    liquidity_component = db.Column(db.Float)
    stability_score = db.Column(db.Float)


class Simulation(db.Model):
    __tablename__ = 'simulations'

    simulation_id        = db.Column(db.Integer, primary_key=True, autoincrement=True)
    portfolio_id         = db.Column(db.Integer, db.ForeignKey('portfolios.portfolio_id'), nullable=False)
    years                = db.Column(db.Integer)
    monthly_contribution = db.Column(db.Float)
    best_case            = db.Column(db.JSON)
    average_case         = db.Column(db.JSON)
    worst_case           = db.Column(db.JSON)
    real_average_case    = db.Column(db.JSON)
    initial_investment   = db.Column(db.Float)
    final_best           = db.Column(db.Float)
    final_average        = db.Column(db.Float)
    final_worst          = db.Column(db.Float)
    final_average_real   = db.Column(db.Float)
    total_contributions  = db.Column(db.Float)
    average_rate_percent = db.Column(db.Float)
    best_rate_percent    = db.Column(db.Float)
    worst_rate_percent   = db.Column(db.Float)
    inflation_rate_percent = db.Column(db.Float)
    volatility_percent   = db.Column(db.Float)
    created_at           = db.Column(db.DateTime, default=datetime.utcnow)
