from datetime import date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import User, Portfolio, PortfolioAllocation, Simulation
from ml.data_fetcher import fetch_live_prices, fetch_market_data, get_correlation_matrix
from ml.portfolio_optimizer import optimize_portfolio
from ml.simulator import run_simulation

portfolio_bp = Blueprint('portfolio', __name__)


@portfolio_bp.route('/market_prices', methods=['GET'])
@jwt_required()
def market_prices():
    """Return latest available Yahoo Finance prices for selected EGX30 tickers."""
    raw_tickers = request.args.get('tickers', '')
    tickers = [t.strip().upper() for t in raw_tickers.split(',') if t.strip()]
    return jsonify({"status": "success", "data": fetch_live_prices(tickers or None)}), 200


def _apply_simulation_result(simulation, sim_result, years, monthly_contribution):
    """Persist a complete projection snapshot on a Simulation row."""
    assumptions = sim_result.get("assumptions", {})
    simulation.years = years
    simulation.monthly_contribution = monthly_contribution
    simulation.best_case = sim_result["best_case"]
    simulation.average_case = sim_result["average_case"]
    simulation.worst_case = sim_result["worst_case"]
    simulation.real_average_case = sim_result.get("real_average_case", [])
    simulation.initial_investment = sim_result.get("initial_investment")
    simulation.final_best = sim_result.get("final_best")
    simulation.final_average = sim_result.get("final_average")
    simulation.final_worst = sim_result.get("final_worst")
    simulation.final_average_real = sim_result.get("final_average_real")
    simulation.total_contributions = sim_result.get("total_contributions")
    simulation.average_rate_percent = assumptions.get("average_rate_percent")
    simulation.best_rate_percent = assumptions.get("best_rate_percent")
    simulation.worst_rate_percent = assumptions.get("worst_rate_percent")
    simulation.inflation_rate_percent = assumptions.get("inflation_rate_percent")
    simulation.volatility_percent = assumptions.get("volatility_percent")
    return simulation


def _serialize_portfolio(portfolio, simulation=None):
    """Convert a Portfolio DB object to a JSON-serialisable dict."""
    allocations = [
        {
            "ticker_symbol":   alloc.ticker_symbol,
            "asset_name":      alloc.asset_name,
            "asset_type":      alloc.asset_type,
            "sector":          alloc.sector,
            "liquidity_score": alloc.liquidity_score,
            "weight_percent":  alloc.weight_percent,
            "amount_egp":      alloc.amount_egp,
            "expected_return": alloc.expected_return,
            "volatility":      alloc.volatility,
            "sharpe_ratio":    alloc.sharpe_ratio,
            "rank_score":      alloc.rank_score,
            "return_score":    alloc.return_score,
            "sharpe_score":    alloc.sharpe_score,
            "liquidity_component": alloc.liquidity_component,
            "stability_score": alloc.stability_score,
        }
        for alloc in portfolio.allocations
    ]

    result = {
        "portfolio_id":         portfolio.portfolio_id,
        "risk_level":           portfolio.risk_level,
        "total_investment":     portfolio.total_investment,
        "expected_return":      portfolio.expected_return,
        "volatility":           portfolio.volatility,
        "sharpe_ratio":         portfolio.sharpe_ratio,
        "diversification_score": portfolio.diversification_score,
        "created_at":           portfolio.created_at.isoformat() if portfolio.created_at else None,
        "allocations":          allocations,
    }

    if simulation:
        yrs = simulation.years or 10
        average_case = simulation.average_case or []
        inflation_rate_percent = (
            simulation.inflation_rate_percent
            if simulation.inflation_rate_percent is not None
            else 5.0
        )
        inflation_rate = inflation_rate_percent / 100
        real_average_case = simulation.real_average_case or [
            round(value / ((1 + inflation_rate) ** year), 2)
            for year, value in enumerate(average_case, start=1)
        ]
        avg_return = (portfolio.expected_return or 0) / 100
        vol = (portfolio.volatility or 0) / 100
        scenario_gap = min(vol * 0.5, 0.15)
        result["simulation"] = {
            "years_list":          list(range(1, yrs + 1)),
            "best_case":           simulation.best_case or [],
            "average_case":        average_case,
            "worst_case":          simulation.worst_case or [],
            "real_average_case":   real_average_case,
            "initial_investment":  simulation.initial_investment or portfolio.total_investment,
            "final_best":         simulation.final_best if simulation.final_best is not None else (simulation.best_case  or [0])[-1],
            "final_average":      simulation.final_average if simulation.final_average is not None else (average_case or [0])[-1],
            "final_worst":        simulation.final_worst if simulation.final_worst is not None else (simulation.worst_case  or [0])[-1],
            "final_average_real": simulation.final_average_real if simulation.final_average_real is not None else (real_average_case or [0])[-1],
            "total_contributions": (
                simulation.total_contributions
                if simulation.total_contributions is not None
                else (simulation.monthly_contribution or 0) * 12 * yrs
            ),
            "assumptions": {
                "average_rate_percent": (
                    simulation.average_rate_percent
                    if simulation.average_rate_percent is not None
                    else round(avg_return * 100, 2)
                ),
                "best_rate_percent": (
                    simulation.best_rate_percent
                    if simulation.best_rate_percent is not None
                    else round((avg_return + scenario_gap) * 100, 2)
                ),
                "worst_rate_percent": (
                    simulation.worst_rate_percent
                    if simulation.worst_rate_percent is not None
                    else round(max(avg_return - scenario_gap, -0.25) * 100, 2)
                ),
                "inflation_rate_percent": inflation_rate_percent,
                "volatility_percent": (
                    simulation.volatility_percent
                    if simulation.volatility_percent is not None
                    else round(vol * 100, 2)
                ),
            },
        }

    return result


@portfolio_bp.route('/generate_portfolio', methods=['POST'])
@jwt_required()
def generate_portfolio():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"status": "error", "message": "User not found", "code": "USER_NOT_FOUND"}), 404

    if not all([user.current_capital, user.investment_goal,
                user.investment_horizon, user.liquidity_needs]):
        return jsonify({
            "status": "error",
            "message": "Please complete your investment profile first.",
            "code": "PROFILE_INCOMPLETE"
        }), 400

    if not user.final_risk_category:
        return jsonify({
            "status": "error",
            "message": "Please complete the risk assessment quiz first.",
            "code": "QUIZ_INCOMPLETE"
        }), 400

    if user.current_capital < 1000:
        return jsonify({
            "status": "error",
            "message": "Minimum capital is 1,000 EGP",
            "code": "CAPITAL_TOO_LOW"
        }), 400

    # Return today's cached portfolio unless ?force=true is passed
    force = request.args.get('force', 'false').lower() == 'true'
    if not force:
        existing = Portfolio.query.filter_by(user_id=user_id).order_by(
            Portfolio.created_at.desc()).first()
        if existing and existing.created_at.date() == date.today():
            sim = Simulation.query.filter_by(portfolio_id=existing.portfolio_id).order_by(
                Simulation.created_at.desc()).first()
            serialized = _serialize_portfolio(existing, sim)
            return jsonify({
                "status": "success",
                "message": "Portfolio loaded from today's cache.",
                "data": {
                    "portfolio":   serialized,
                    "simulation":  serialized.get("simulation"),
                    "user":        {"name": user.name, "risk_category": user.final_risk_category,
                                    "capital": user.current_capital, "horizon": user.investment_horizon},
                    "data_source": "cached",
                }
            }), 200

    # Fetch live market data from Yahoo Finance
    try:
        assets_df, price_history = fetch_market_data()
    except ValueError as exc:
        return jsonify({
            "status": "error",
            "message": str(exc),
            "code": "MARKET_DATA_UNAVAILABLE",
        }), 503

    corr_matrix = get_correlation_matrix(price_history)

    # Build the portfolio
    portfolio_result = optimize_portfolio(
        capital=user.current_capital,
        risk_level=user.final_risk_category,
        assets_df=assets_df,
        monthly_contribution=user.monthly_contribution or 0,
        correlation_matrix=corr_matrix,
        horizon_years=user.investment_horizon,
    )

    # Save portfolio to database
    portfolio = Portfolio(
        user_id=user_id,
        total_investment=user.current_capital,
        risk_level=user.final_risk_category,
        expected_return=portfolio_result["expected_return"],
        volatility=portfolio_result["volatility"],
        sharpe_ratio=portfolio_result["sharpe_ratio"],
        diversification_score=portfolio_result["diversification"],
    )
    db.session.add(portfolio)
    db.session.flush()

    for a in portfolio_result["allocations"]:
        db.session.add(PortfolioAllocation(
            portfolio_id=portfolio.portfolio_id,
            ticker_symbol=a["ticker_symbol"],
            asset_name=a["asset_name"],
            asset_type=a["asset_type"],
            sector=a.get("sector"),
            liquidity_score=a.get("liquidity_score"),
            weight_percent=a["weight_percent"],
            amount_egp=a["amount_egp"],
            expected_return=a["expected_return"],
            volatility=a["volatility"],
            sharpe_ratio=a.get("sharpe_ratio", 0),
            rank_score=a.get("rank_score"),
            return_score=a.get("return_score"),
            sharpe_score=a.get("sharpe_score"),
            liquidity_component=a.get("liquidity_component"),
            stability_score=a.get("stability_score"),
        ))

    # Run and save simulation
    horizon_years = user.investment_horizon or 10
    sim_result = run_simulation(
        portfolio_result=portfolio_result,
        years=horizon_years,
        monthly_contribution=user.monthly_contribution or 0,
    )

    simulation = _apply_simulation_result(
        Simulation(portfolio_id=portfolio.portfolio_id),
        sim_result,
        horizon_years,
        user.monthly_contribution or 0,
    )
    db.session.add(simulation)
    db.session.commit()
    serialized = _serialize_portfolio(portfolio, simulation)

    return jsonify({
        "status": "success",
        "message": "Portfolio generated successfully using live market data.",
        "data": {
            "portfolio":   serialized,
            "simulation":  serialized.get("simulation"),
            "user": {
                "name":          user.name,
                "risk_category": user.final_risk_category,
                "capital":       user.current_capital,
                "horizon":       horizon_years,
            },
            "data_source": "live",
        }
    }), 200


@portfolio_bp.route('/portfolio', methods=['GET'])
@jwt_required()
def get_portfolio():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"status": "error", "message": "User not found", "code": "USER_NOT_FOUND"}), 404

    portfolio = Portfolio.query.filter_by(user_id=user_id).order_by(
        Portfolio.created_at.desc()).first()
    if not portfolio:
        return jsonify({
            "status": "error",
            "message": "No portfolio found. Generate one first.",
            "code": "NO_PORTFOLIO"
        }), 404

    simulation = Simulation.query.filter_by(portfolio_id=portfolio.portfolio_id).order_by(
        Simulation.created_at.desc()).first()
    serialized = _serialize_portfolio(portfolio, simulation)

    return jsonify({
        "status": "success",
        "data": {
            "portfolio": serialized,
            "simulation": serialized.get("simulation"),
            "user": {"name": user.name, "risk_category": user.final_risk_category,
                     "capital": user.current_capital, "horizon": user.investment_horizon},
        }
    }), 200


@portfolio_bp.route('/simulation', methods=['POST'])
@jwt_required()
def recalculate_simulation():
    """Re-run the simulation with different years, contributions, or inflation."""
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"status": "error", "message": "User not found", "code": "USER_NOT_FOUND"}), 404

    portfolio = Portfolio.query.filter_by(user_id=user_id).order_by(
        Portfolio.created_at.desc()).first()
    if not portfolio:
        return jsonify({"status": "error", "message": "No portfolio found", "code": "NO_PORTFOLIO"}), 404

    data = request.get_json(silent=True) or {}
    try:
        years   = int(data.get('years', 10))
        monthly = float(data.get('monthly_contribution', 0))
        inflation = float(data.get('inflation_rate', 0.05))
    except (TypeError, ValueError):
        return jsonify({"status": "error", "message": "Invalid parameters", "code": "VALIDATION_ERROR"}), 400

    if not (1 <= years <= 30):
        return jsonify({"status": "error", "message": "Years must be 1–30", "code": "VALIDATION_ERROR"}), 400
    if monthly < 0:
        return jsonify({"status": "error", "message": "Monthly contribution cannot be negative", "code": "VALIDATION_ERROR"}), 400
    if not (0 <= inflation <= 0.5):
        return jsonify({"status": "error", "message": "Inflation rate must be between 0% and 50%", "code": "VALIDATION_ERROR"}), 400

    sim_result = run_simulation(
        portfolio_result={
            "total_investment": portfolio.total_investment,
            "expected_return":  portfolio.expected_return,
            "volatility":       portfolio.volatility,
        },
        years=years,
        monthly_contribution=monthly,
        inflation_rate=inflation,
    )

    simulation = Simulation.query.filter_by(portfolio_id=portfolio.portfolio_id).order_by(
        Simulation.created_at.desc()).first()
    if not simulation:
        simulation = Simulation(portfolio_id=portfolio.portfolio_id)
        db.session.add(simulation)

    _apply_simulation_result(simulation, sim_result, years, monthly)
    db.session.flush()
    Simulation.query.filter(
        Simulation.portfolio_id == portfolio.portfolio_id,
        Simulation.simulation_id != simulation.simulation_id,
    ).delete(synchronize_session=False)
    db.session.commit()

    return jsonify({"status": "success", "data": sim_result}), 200


@portfolio_bp.route('/dashboard_summary', methods=['GET'])
@jwt_required()
def dashboard_summary():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"status": "error", "message": "User not found", "code": "USER_NOT_FOUND"}), 404

    portfolio = Portfolio.query.filter_by(user_id=user_id).order_by(
        Portfolio.created_at.desc()).first()
    if not portfolio:
        return jsonify({"status": "error", "message": "No portfolio found", "code": "NO_PORTFOLIO"}), 404

    simulation = Simulation.query.filter_by(portfolio_id=portfolio.portfolio_id).order_by(
        Simulation.created_at.desc()).first()
    serialized = _serialize_portfolio(portfolio, simulation)

    return jsonify({
        "status": "success",
        "data": {
            "portfolio": serialized,
            "simulation": serialized.get("simulation"),
            "user": {
                "name":                user.name,
                "risk_category":       user.final_risk_category,
                "capital":             user.current_capital,
                "horizon":             user.investment_horizon,
                "goal":                user.investment_goal,
                "monthly_contribution": user.monthly_contribution,
            }
        }
    }), 200
