"""
Portfolio optimizer.

The aim is not to be a production trading engine. It is an explainable portfolio
builder for a graduation project:

1. Choose an explainable mix between EGX stocks, gold, and real-estate exposure.
2. Decide how many holdings are reasonable for the user's capital.
3. Rank candidates inside each asset class with historical metrics, then avoid
   highly correlated duplicates.
4. Weight the selected assets with a risk-aware blend of target weights and
   score-based weights.
"""

import numpy as np
import pandas as pd

RISK_FREE_RATE = 0.11  # Egyptian T-bill benchmark rate

# ── Asset-class targets ──────────────────────────────────────────────────────
# These are policy assumptions for the graduation project. They are deliberately
# simple so they can be explained: conservative users receive more defensive
# assets, aggressive users receive more stock exposure.
ALLOCATION_TARGETS = {
    "Conservative": {"Stock": 0.45, "Gold": 0.30, "RealEstate": 0.25},
    "Balanced":     {"Stock": 0.65, "Gold": 0.15, "RealEstate": 0.20},
    "Aggressive":   {"Stock": 0.80, "Gold": 0.05, "RealEstate": 0.15},
}

# ── Maximum stock count by risk level ────────────────────────────────────────
# The capital rule below controls total holdings. These caps prevent a
# conservative investor from receiving too many equity positions.
STOCK_COUNT_CAP = {
    "Conservative": 4,
    "Balanced":     7,
    "Aggressive":   10,
}

# Very small accounts should not be split into many tiny positions. These bands
# are intentionally simple so they can be explained during the project defense.
HOLDING_LIMITS_BY_CAPITAL = [
    (20_000, 3),
    (50_000, 4),
    (100_000, 5),
    (250_000, 6),
    (500_000, 8),
    (1_000_000, 10),
    (float("inf"), 12),
]

# ── Horizon thresholds ────────────────────────────────────────────────────────
_SHORT_HORIZON = 3   # <= 3 years: favour liquidity and lower volatility
_LONG_HORIZON  = 7   # >= 7 years: favour return and risk-adjusted return


def _holding_limit_for_capital(capital: float) -> int:
    """Return a reasonable maximum number of holdings for this account size."""
    for upper_bound, limit in HOLDING_LIMITS_BY_CAPITAL:
        if capital < upper_bound:
            return limit
    return HOLDING_LIMITS_BY_CAPITAL[-1][1]


def _count_plan_for_capital(capital: float, risk_level: str) -> dict:
    """
    Decide how many holdings to select from each asset class.

    Example for 1,000,000 EGP:
    - Balanced: 7 stocks + 2 real-estate names + 1 gold proxy.
    - Aggressive: 9 stocks + 2 real-estate names + 1 gold proxy.

    This is why the same capital can produce a different number of stocks:
    the risk profile changes how much equity concentration is allowed.
    """
    limit = _holding_limit_for_capital(capital)
    gold_count = 1 if limit >= 2 else 0
    real_estate_count = 1 if limit >= 3 else 0

    if risk_level in ("Balanced", "Aggressive") and limit >= 8:
        real_estate_count = 2
    elif risk_level == "Conservative" and limit >= 6:
        real_estate_count = 2

    stock_count = min(
        STOCK_COUNT_CAP[risk_level],
        max(1, limit - gold_count - real_estate_count),
    )

    return {
        "Stock": stock_count,
        "Gold": gold_count,
        "RealEstate": real_estate_count,
    }


def _apply_horizon_shift(target: dict, horizon_years) -> dict:
    """
    Tilt the target mix based on investment horizon.

    Short horizons favour gold and real-estate exposure because the investor has
    less time to recover from stock drawdowns. Long horizons can accept more
    stock exposure.
    """
    if horizon_years is None:
        return target

    if horizon_years <= _SHORT_HORIZON:
        shift = {"Stock": -0.10, "Gold": +0.07, "RealEstate": +0.03}
    elif horizon_years >= _LONG_HORIZON:
        shift = {"Stock": +0.07, "Gold": -0.04, "RealEstate": -0.03}
    else:
        return target

    result = {k: max(0.03, v + shift.get(k, 0.0)) for k, v in target.items()}
    total = sum(result.values())
    return {k: v / total for k, v in result.items()}


def _normalised_rank(series: pd.Series, higher_is_better=True) -> pd.Series:
    """Convert a metric to a 0-1 rank so unlike units can be combined."""
    values = pd.to_numeric(series, errors="coerce")
    median = values.median()
    values = values.fillna(0.0 if pd.isna(median) else median)
    if len(values) <= 1:
        return pd.Series([1.0] * len(values), index=series.index)
    return values.rank(pct=True, ascending=not higher_is_better)


def _ranking_weights(risk_level: str, horizon_years) -> dict:
    """
    Choose ranking emphasis.

    Conservative profiles and short horizons favour liquidity and lower
    volatility. Aggressive profiles and long horizons give more weight to
    return and Sharpe ratio.
    """
    weights = {
        "Conservative": {"return": 0.15, "sharpe": 0.30, "liquidity": 0.30, "stability": 0.25},
        "Balanced":     {"return": 0.25, "sharpe": 0.35, "liquidity": 0.20, "stability": 0.20},
        "Aggressive":   {"return": 0.35, "sharpe": 0.40, "liquidity": 0.15, "stability": 0.10},
    }[risk_level].copy()

    if horizon_years is not None and horizon_years <= _SHORT_HORIZON:
        weights["return"] -= 0.08
        weights["sharpe"] -= 0.02
        weights["liquidity"] += 0.05
        weights["stability"] += 0.05
    elif horizon_years is not None and horizon_years >= _LONG_HORIZON:
        weights["return"] += 0.06
        weights["sharpe"] += 0.04
        weights["liquidity"] -= 0.05
        weights["stability"] -= 0.05

    weights = {k: max(0.05, v) for k, v in weights.items()}
    total = sum(weights.values())
    return {k: v / total for k, v in weights.items()}


def _filter_correlated(df: pd.DataFrame, corr: pd.DataFrame, target_count: int,
                       threshold=0.85) -> pd.DataFrame:
    """
    Greedily keep assets in rank-score order, skipping any that are too
    correlated (|r| > threshold) with an already-kept asset.

    Why threshold 0.85?
    At r=0.85, two assets move together 72% of the time — holding both adds
    almost no diversification benefit while doubling exposure to the same risk.
    0.85 is the standard cutoff used in factor-portfolio construction.
    """
    kept_tickers = []
    kept_rows    = []
    skipped_rows = []

    for _, row in df.iterrows():
        t = row["ticker"]

        # Accept the first asset unconditionally
        if not kept_tickers:
            kept_tickers.append(t)
            kept_rows.append(row)
            if len(kept_rows) >= target_count:
                break
            continue

        # Skip if too correlated with any already-kept asset
        too_correlated = any(
            t in corr.columns and s in corr.columns and abs(corr.loc[t, s]) > threshold
            for s in kept_tickers
        )
        if not too_correlated:
            kept_tickers.append(t)
            kept_rows.append(row)
            if len(kept_rows) >= target_count:
                break
        else:
            skipped_rows.append(row)

    # If the threshold is too strict for the available market, fill the remaining
    # positions with the next-best ranked assets rather than returning too few.
    for row in skipped_rows:
        if len(kept_rows) >= target_count:
            break
        kept_rows.append(row)

    return pd.DataFrame(kept_rows) if kept_rows else df.head(1)


def _rank_candidates(df: pd.DataFrame, risk_level: str, horizon_years) -> pd.DataFrame:
    """
    Rank assets with explainable metrics.

    The rank is based only on calculated Yahoo Finance metrics:
    annual return, Sharpe ratio, volume-based liquidity, and volatility.
    """
    ranked = df.copy()
    weights = _ranking_weights(risk_level, horizon_years)
    ranked["_return_score"] = _normalised_rank(ranked["expected_return"], True)
    ranked["_sharpe_score"] = _normalised_rank(ranked["sharpe_ratio"], True)
    ranked["_liquidity_score"] = (ranked["liquidity_score"].fillna(0) / 10).clip(0, 1)
    ranked["_stability_score"] = _normalised_rank(ranked["volatility"], False)
    ranked["_rank_score"] = (
        ranked["_return_score"] * weights["return"]
        + ranked["_sharpe_score"] * weights["sharpe"]
        + ranked["_liquidity_score"] * weights["liquidity"]
        + ranked["_stability_score"] * weights["stability"]
    )
    return ranked.sort_values("_rank_score", ascending=False)


def _weight_selected(group: pd.DataFrame, risk_level: str) -> np.ndarray:
    """
    Blend equal weights with score weights.

    Conservative portfolios stay closer to equal weights. Aggressive portfolios
    allow stronger tilts toward the highest-ranked stocks.
    """
    count = len(group)
    equal = np.ones(count) / count

    raw_scores = group["_rank_score"].to_numpy(dtype=float)
    raw_scores = raw_scores - raw_scores.min() + 0.05
    score_weights = raw_scores / raw_scores.sum() if raw_scores.sum() > 0 else equal

    blend = {
        "Conservative": 0.35,
        "Balanced":     0.55,
        "Aggressive":   0.75,
    }[risk_level]
    return (1 - blend) * equal + blend * score_weights


def optimize_portfolio(capital, risk_level, assets_df,
                       monthly_contribution=0, correlation_matrix=None, horizon_years=None):
    """
    Build a portfolio for the given investor.

    Parameters
    ----------
    capital              : float — total capital in EGP
    risk_level           : 'Conservative' | 'Balanced' | 'Aggressive'
    assets_df            : DataFrame from fetch_market_data() — columns:
                           ticker, name, type, expected_return, volatility, sharpe_ratio
    monthly_contribution : float — monthly top-up in EGP (used only by simulator)
    correlation_matrix   : DataFrame from get_correlation_matrix() — may be None
    horizon_years        : int | None — investment horizon in years

    Returns
    -------
    dict with:
      allocations     — list of assets with weights, amounts, and metrics
      expected_return — portfolio weighted average annual return (%)
      volatility      — portfolio annual volatility using covariance matrix (%)
      sharpe_ratio    — portfolio Sharpe ratio
      diversification — 0–10 score (10 = perfectly uncorrelated = maximum diversity)
      total_investment — capital in EGP
    """
    risk_level = risk_level if risk_level in STOCK_COUNT_CAP else "Balanced"
    count_plan = _count_plan_for_capital(float(capital), risk_level)
    target = _apply_horizon_shift(dict(ALLOCATION_TARGETS[risk_level]), horizon_years)

    available_types = set(assets_df["type"].unique())
    target = {
        asset_type: weight
        for asset_type, weight in target.items()
        if asset_type in available_types and count_plan.get(asset_type, 0) > 0
    }
    target_total = sum(target.values())
    if target_total <= 0:
        raise ValueError("No investable asset classes are available.")
    target = {k: v / target_total for k, v in target.items()}

    allocations = []
    for asset_type, class_weight in target.items():
        group = assets_df[assets_df["type"] == asset_type].copy()
        if group.empty:
            continue

        target_count = min(count_plan[asset_type], len(group))

        usable = group[
            (group["volatility"] > 0)
            & (group["liquidity_score"] >= 2)
        ].copy()
        if len(usable) >= target_count:
            group = usable

        positive = group[group["expected_return"] > 0].copy()
        if len(positive) >= min(target_count, 2):
            group = positive

        group = _rank_candidates(group, risk_level, horizon_years)
        if correlation_matrix is not None and len(group) > 1:
            group = _filter_correlated(group, correlation_matrix, target_count)
        group = group.head(target_count)

        within_class_weights = _weight_selected(group, risk_level)

        for i, (_, row) in enumerate(group.iterrows()):
            final_weight = class_weight * within_class_weights[i]
            allocations.append({
                "ticker_symbol":   row["ticker"],
                "asset_name":      row["name"],
                "asset_type":      asset_type,
                "sector":          row["sector"],
                "liquidity_score": int(row["liquidity_score"]),
                "weight_percent":  round(final_weight * 100, 2),
                "amount_egp":      round(capital * final_weight, 2),
                "expected_return": round(row["expected_return"] * 100, 2),
                "volatility":      round(row["volatility"] * 100, 2),
                "sharpe_ratio":    round(row["sharpe_ratio"], 4),
                "rank_score":      round(float(row["_rank_score"]), 4),
                "return_score":    round(float(row["_return_score"]), 4),
                "sharpe_score":    round(float(row["_sharpe_score"]), 4),
                "liquidity_component": round(float(row["_liquidity_score"]), 4),
                "stability_score": round(float(row["_stability_score"]), 4),
            })

    if not allocations:
        raise ValueError("No assets could be allocated. Check that market data was fetched.")

    # Re-normalise weights to sum to exactly 100%
    total_w = sum(a["weight_percent"] for a in allocations)
    for a in allocations:
        a["weight_percent"] = round(a["weight_percent"] / total_w * 100, 2)
        a["amount_egp"]     = round(capital * a["weight_percent"] / 100, 2)
    if allocations:
        previous = sum(a["weight_percent"] for a in allocations[:-1])
        allocations[-1]["weight_percent"] = round(100 - previous, 2)
        allocations[-1]["amount_egp"] = round(capital * allocations[-1]["weight_percent"] / 100, 2)

    # Step 4: Portfolio-level metrics
    weights = np.array([a["weight_percent"] / 100 for a in allocations])
    returns = np.array([a["expected_return"] / 100 for a in allocations])
    vols    = np.array([a["volatility"] / 100 for a in allocations])

    # Weighted average expected return
    port_return = float(weights @ returns)

    # Portfolio variance: w'Σw using the covariance matrix.
    # Σ = diag(σ) × R × diag(σ)  where R is the correlation matrix.
    # Falls back to zero-correlation formula (w'·σ²) only if corr data is unavailable.
    tickers = [a["ticker_symbol"] for a in allocations]
    if (correlation_matrix is not None
            and not correlation_matrix.empty
            and all(t in correlation_matrix.columns for t in tickers)):
        corr_sub   = correlation_matrix.loc[tickers, tickers].values
        cov_matrix = np.outer(vols, vols) * corr_sub
        port_var   = float(weights @ cov_matrix @ weights)
    else:
        port_var = float(weights @ (vols ** 2))

    port_vol    = float(np.sqrt(max(port_var, 0)))
    port_sharpe = (port_return - RISK_FREE_RATE) / port_vol if port_vol > 0 else 0.0

    # Diversification score: 0–10
    # Average absolute pairwise correlation across selected assets.
    # Low average correlation = high diversification = score closer to 10.
    if correlation_matrix is not None and not correlation_matrix.empty and len(tickers) > 1:
        sub            = correlation_matrix.loc[tickers, tickers].values
        n              = len(tickers)
        upper_triangle = sub[np.triu_indices(n, k=1)]
        avg_corr       = float(np.abs(upper_triangle).mean())
    else:
        avg_corr = 0.5  # assume moderate correlation when data is unavailable

    diversification = round((1 - avg_corr) * 10, 2)

    return {
        "allocations":     allocations,
        "expected_return": round(port_return * 100, 2),
        "volatility":      round(port_vol * 100, 2),
        "sharpe_ratio":    round(port_sharpe, 4),
        "diversification": diversification,
        "total_investment": capital,
    }
