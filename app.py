import os
import sys

# Ensure the app's directory is the working directory so all relative paths resolve correctly
os.chdir(os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, render_template
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import Config
from database import db


def _sqlite_columns(conn, table_name):
    return {row[1] for row in conn.exec_driver_sql(f"PRAGMA table_info({table_name})")}


def _add_missing_sqlite_columns(conn, table_name, additions):
    existing = _sqlite_columns(conn, table_name)
    for column_name, ddl in additions.items():
        if column_name not in existing:
            conn.exec_driver_sql(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {ddl}")


def _rebuild_risk_quizzes_with_checks(conn):
    row = conn.exec_driver_sql(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='risk_quizzes'"
    ).fetchone()
    table_sql = row[0] if row else ""
    if "ck_risk_quizzes_q1_ans_range" in table_sql:
        return

    invalid_clause = " OR ".join(
        f"q{i}_ans NOT BETWEEN 0 AND 3" for i in range(1, 16)
    )
    invalid_count = conn.exec_driver_sql(
        f"SELECT COUNT(*) FROM risk_quizzes WHERE {invalid_clause}"
    ).scalar()
    if invalid_count:
        raise ValueError("Cannot add quiz answer constraints: invalid quiz answers exist.")

    answer_columns = ",\n                ".join(
        f"q{i}_ans INTEGER NOT NULL CONSTRAINT ck_risk_quizzes_q{i}_ans_range CHECK (q{i}_ans BETWEEN 0 AND 3)"
        for i in range(1, 16)
    )
    conn.exec_driver_sql(f"""
        CREATE TABLE risk_quizzes_new (
            quiz_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            {answer_columns},
            total_score INTEGER CONSTRAINT ck_risk_quizzes_total_score_range
                CHECK (total_score IS NULL OR total_score BETWEEN 0 AND 45),
            risk_category VARCHAR(20) CONSTRAINT ck_risk_quizzes_risk_category
                CHECK (risk_category IS NULL OR risk_category IN ('Conservative', 'Balanced', 'Aggressive')),
            score_breakdown JSON,
            submitted_at DATETIME,
            PRIMARY KEY (quiz_id),
            FOREIGN KEY(user_id) REFERENCES users (user_id)
        )
    """)
    columns = [
        "quiz_id", "user_id",
        *[f"q{i}_ans" for i in range(1, 16)],
        "total_score", "risk_category", "score_breakdown", "submitted_at",
    ]
    column_list = ", ".join(columns)
    conn.exec_driver_sql(
        f"INSERT INTO risk_quizzes_new ({column_list}) "
        f"SELECT {column_list} FROM risk_quizzes"
    )
    conn.exec_driver_sql("DROP TABLE risk_quizzes")
    conn.exec_driver_sql("ALTER TABLE risk_quizzes_new RENAME TO risk_quizzes")


def _run_sqlite_schema_updates(engine):
    if engine.url.get_backend_name() != "sqlite":
        return

    with engine.begin() as conn:
        tables = {
            row[0] for row in conn.exec_driver_sql(
                "SELECT name FROM sqlite_master WHERE type='table'"
            )
        }
        if "risk_quizzes" in tables:
            _add_missing_sqlite_columns(conn, "risk_quizzes", {
                "total_score": "INTEGER",
                "risk_category": "VARCHAR(20)",
                "score_breakdown": "JSON",
            })
            _rebuild_risk_quizzes_with_checks(conn)

        if "portfolio_allocations" in tables:
            _add_missing_sqlite_columns(conn, "portfolio_allocations", {
                "rank_score": "FLOAT",
                "return_score": "FLOAT",
                "sharpe_score": "FLOAT",
                "liquidity_component": "FLOAT",
                "stability_score": "FLOAT",
            })

        if "simulations" in tables:
            _add_missing_sqlite_columns(conn, "simulations", {
                "real_average_case": "JSON",
                "initial_investment": "FLOAT",
                "final_best": "FLOAT",
                "final_average": "FLOAT",
                "final_worst": "FLOAT",
                "final_average_real": "FLOAT",
                "total_contributions": "FLOAT",
                "average_rate_percent": "FLOAT",
                "best_rate_percent": "FLOAT",
                "worst_rate_percent": "FLOAT",
                "inflation_rate_percent": "FLOAT",
                "volatility_percent": "FLOAT",
            })
            conn.exec_driver_sql("""
                DELETE FROM simulations
                WHERE simulation_id NOT IN (
                    SELECT MAX(simulation_id)
                    FROM simulations
                    GROUP BY portfolio_id
                )
            """)


def _backfill_explainability_fields():
    from models import RiskQuiz, Simulation, Portfolio
    from ml.risk_classifier import predict_risk_category

    for quiz in RiskQuiz.query.filter(RiskQuiz.total_score.is_(None)).all():
        answers = [getattr(quiz, f"q{i}_ans") for i in range(1, 16)]
        prediction = predict_risk_category(answers)
        quiz.total_score = prediction["total_score"]
        quiz.risk_category = prediction["category"]
        quiz.score_breakdown = prediction.get("score_breakdown", {})

    latest_simulation_ids = [
        row[0] for row in db.session.query(db.func.max(Simulation.simulation_id))
        .group_by(Simulation.portfolio_id)
        .all()
    ]
    if latest_simulation_ids:
        Simulation.query.filter(~Simulation.simulation_id.in_(latest_simulation_ids)).delete(
            synchronize_session=False
        )

    simulations = Simulation.query.filter(
        Simulation.final_average.is_(None)
    ).all()
    for simulation in simulations:
        portfolio = db.session.get(Portfolio, simulation.portfolio_id)
        if not portfolio:
            continue
        years = simulation.years or 10
        average_case = simulation.average_case or []
        best_case = simulation.best_case or []
        worst_case = simulation.worst_case or []
        inflation_percent = (
            simulation.inflation_rate_percent
            if simulation.inflation_rate_percent is not None
            else 5.0
        )
        inflation_rate = inflation_percent / 100
        real_average = simulation.real_average_case or [
            round(value / ((1 + inflation_rate) ** year), 2)
            for year, value in enumerate(average_case, start=1)
        ]
        avg_return = (portfolio.expected_return or 0) / 100
        vol = (portfolio.volatility or 0) / 100
        scenario_gap = min(vol * 0.5, 0.15)

        simulation.real_average_case = real_average
        simulation.initial_investment = portfolio.total_investment
        simulation.final_best = best_case[-1] if best_case else portfolio.total_investment
        simulation.final_average = average_case[-1] if average_case else portfolio.total_investment
        simulation.final_worst = worst_case[-1] if worst_case else portfolio.total_investment
        simulation.final_average_real = real_average[-1] if real_average else portfolio.total_investment
        simulation.total_contributions = (simulation.monthly_contribution or 0) * 12 * years
        simulation.average_rate_percent = round(avg_return * 100, 2)
        simulation.best_rate_percent = round((avg_return + scenario_gap) * 100, 2)
        simulation.worst_rate_percent = round(max(avg_return - scenario_gap, -0.25) * 100, 2)
        simulation.inflation_rate_percent = inflation_percent
        simulation.volatility_percent = round(vol * 100, 2)

    db.session.commit()


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
    JWTManager(app)
    db.init_app(app)

    from routes.auth import auth_bp
    from routes.profile import profile_bp
    from routes.quiz import quiz_bp
    from routes.portfolio import portfolio_bp
    from routes.chat import chat_bp

    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(profile_bp, url_prefix='/api')
    app.register_blueprint(quiz_bp, url_prefix='/api')
    app.register_blueprint(portfolio_bp, url_prefix='/api')
    app.register_blueprint(chat_bp, url_prefix='/api')

    @app.route('/')
    def index():
        return render_template('index.html')

    @app.route('/register')
    def register():
        return render_template('register.html')

    @app.route('/login')
    def login():
        return render_template('login.html')

    @app.route('/profile')
    def profile():
        return render_template('profile.html')

    @app.route('/account')
    def account():
        return render_template('account.html')

    @app.route('/quiz')
    def quiz():
        return render_template('quiz.html')

    @app.route('/dashboard')
    def dashboard():
        return render_template('dashboard.html')

    with app.app_context():
        import models  # noqa: F401  — registers all models with SQLAlchemy
        db.create_all()
        _run_sqlite_schema_updates(db.engine)
        _backfill_explainability_fields()

        print(f"\n✅ SmartInvest running on http://localhost:5000")
        print(f"📊 Database: smartinvest.db")
        from ml.data_fetcher import ASSET_UNIVERSE
        print(f"🌐 Market data: Yahoo Finance ({len(ASSET_UNIVERSE)} assets: EGX30 + gold proxy)\n")

    return app


app = create_app()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
