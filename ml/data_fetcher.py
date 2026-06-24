"""
Market data module.

The investable universe is the EGX30 constituent list used by this project.
Yahoo Finance is a free data source, so coverage can be delayed or incomplete.
The code therefore skips individual failed symbols and continues as long as
enough assets are available to build a portfolio.
"""

import numpy as np
import pandas as pd
import warnings
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone

warnings.filterwarnings('ignore')

RISK_FREE_RATE = 0.11   # Egyptian T-bill benchmark rate (approximate annual rate)
_FETCH_YEARS   = 2      # years of historical daily prices to download per asset
_POOL_WORKERS  = 10     # max parallel Yahoo Finance requests

# ── EGX30 universe + alternatives ────────────────────────────────────────────
# EGX30 is the Egyptian Exchange's top-liquidity/top-activity index. Symbols use
# Yahoo Finance's Cairo suffix: <EGX ticker>.CA.
#
# Real-estate exposure is represented by EGX30 real-estate-sector companies.
# Gold exposure uses a free Yahoo Finance gold futures proxy because local
# Egyptian physical-gold spot data is not freely available from Yahoo.
EGX30_COMPANIES = [
    {"ticker": "COMI", "yahoo": "COMI.CA", "name": "Commercial International Bank", "type": "Stock", "sector": "Banking"},
    {"ticker": "TMGH", "yahoo": "TMGH.CA", "name": "Talaat Moustafa Group", "type": "RealEstate", "sector": "Real Estate"},
    {"ticker": "EAST", "yahoo": "EAST.CA", "name": "Eastern Company", "type": "Stock", "sector": "Consumer Staples"},
    {"ticker": "MFPC", "yahoo": "MFPC.CA", "name": "Misr Fertilizers Production", "type": "Stock", "sector": "Fertilizers"},
    {"ticker": "ALCN", "yahoo": "ALCN.CA", "name": "Alexandria Containers & Cargo Handling", "type": "Stock", "sector": "Transportation"},
    {"ticker": "ETEL", "yahoo": "ETEL.CA", "name": "Telecom Egypt", "type": "Stock", "sector": "Telecom"},
    {"ticker": "ABUK", "yahoo": "ABUK.CA", "name": "Abu Qir Fertilizers", "type": "Stock", "sector": "Fertilizers"},
    {"ticker": "EGAL", "yahoo": "EGAL.CA", "name": "Egypt Aluminium", "type": "Stock", "sector": "Materials"},
    {"ticker": "ORAS", "yahoo": "ORAS.CA", "name": "Orascom Construction", "type": "Stock", "sector": "Construction"},
    {"ticker": "EMFD", "yahoo": "EMFD.CA", "name": "Emaar Misr for Development", "type": "RealEstate", "sector": "Real Estate"},
    {"ticker": "HRHO", "yahoo": "HRHO.CA", "name": "EFG Holding", "type": "Stock", "sector": "Financial Services"},
    {"ticker": "EFIH", "yahoo": "EFIH.CA", "name": "eFinance for Digital and Financial Investments", "type": "Stock", "sector": "Financial Technology"},
    {"ticker": "FWRY", "yahoo": "FWRY.CA", "name": "Fawry for Banking Technology", "type": "Stock", "sector": "Financial Technology"},
    {"ticker": "BTFH", "yahoo": "BTFH.CA", "name": "Beltone Holding", "type": "Stock", "sector": "Financial Services"},
    {"ticker": "EKHO", "yahoo": "EKHO.CA", "name": "Egyptian Kuwaiti Holding", "type": "Stock", "sector": "Holding & Investment"},
    {"ticker": "ORHD", "yahoo": "ORHD.CA", "name": "Orascom Development Egypt", "type": "RealEstate", "sector": "Real Estate"},
    {"ticker": "JUFO", "yahoo": "JUFO.CA", "name": "Juhayna Food Industries", "type": "Stock", "sector": "Food & Beverages"},
    {"ticker": "ADIB", "yahoo": "ADIB.CA", "name": "Abu Dhabi Islamic Bank Egypt", "type": "Stock", "sector": "Banking"},
    {"ticker": "GBCO", "yahoo": "GBCO.CA", "name": "GB Corp", "type": "Stock", "sector": "Automotive"},
    {"ticker": "CIEB", "yahoo": "CIEB.CA", "name": "Credit Agricole Egypt", "type": "Stock", "sector": "Banking"},
    {"ticker": "PHDC", "yahoo": "PHDC.CA", "name": "Palm Hills Developments", "type": "RealEstate", "sector": "Real Estate"},
    {"ticker": "SKPC", "yahoo": "SKPC.CA", "name": "Sidi Kerir Petrochemicals", "type": "Stock", "sector": "Petrochemicals"},
    {"ticker": "EFID", "yahoo": "EFID.CA", "name": "Edita Food Industries", "type": "Stock", "sector": "Food & Beverages"},
    {"ticker": "ORWE", "yahoo": "ORWE.CA", "name": "Oriental Weavers", "type": "Stock", "sector": "Textiles"},
    {"ticker": "ISPH", "yahoo": "ISPH.CA", "name": "Ibnsina Pharma", "type": "Stock", "sector": "Healthcare"},
    {"ticker": "MASR", "yahoo": "MASR.CA", "name": "Madinet Masr", "type": "RealEstate", "sector": "Real Estate"},
    {"ticker": "AMOC", "yahoo": "AMOC.CA", "name": "Alexandria Mineral Oils Company", "type": "Stock", "sector": "Oil & Gas"},
    {"ticker": "PHAR", "yahoo": "PHAR.CA", "name": "Egyptian International Pharmaceutical Industries", "type": "Stock", "sector": "Healthcare"},
    {"ticker": "RMDA", "yahoo": "RMDA.CA", "name": "Tenth of Ramadan Pharmaceutical Industries", "type": "Stock", "sector": "Healthcare"},
    {"ticker": "CCAP", "yahoo": "CCAP.CA", "name": "Qalaa Holdings", "type": "Stock", "sector": "Financial Services"},
]

ALTERNATIVE_ASSETS = [
    {"ticker": "GOLD", "yahoo": "GC=F", "name": "Gold Futures Proxy", "type": "Gold", "sector": "Gold", "currency": "USD"},
]

ASSET_UNIVERSE = EGX30_COMPANIES + ALTERNATIVE_ASSETS
ASSET_BY_TICKER = {asset["ticker"]: asset for asset in ASSET_UNIVERSE}


def _fetch_one(ticker, yahoo_ticker, start_str, end_str):
    """
    Fetch 2 years of daily closing prices and volume for one ticker from Yahoo Finance.
    Returns (ticker, closes_series, avg_daily_volume).
    """
    import yfinance as yf

    hist = yf.Ticker(yahoo_ticker).history(
        start=start_str, end=end_str,
        auto_adjust=True,
        timeout=25,
    )

    if hist is None or hist.empty or 'Close' not in hist.columns:
        raise ValueError(f"No price data returned for '{yahoo_ticker}'.")

    closes = hist['Close'].dropna()
    if len(closes) < 30:
        raise ValueError(
            f"Insufficient history for '{yahoo_ticker}': "
            f"only {len(closes)} trading days found (need ≥ 30)."
        )

    # Average daily trading volume — the real basis for liquidity
    avg_volume = float(hist['Volume'].dropna().mean()) if 'Volume' in hist.columns else 0.0

    return ticker, closes, avg_volume


def fetch_market_data():
    """
    Fetch 2 years of daily closing prices + volume from Yahoo Finance for every
    asset in ASSET_UNIVERSE, then compute annualised return, volatility, Sharpe
    ratio, and a volume-based liquidity score.

    Returns
    -------
    assets_df     : pd.DataFrame with columns:
                    ticker, name, type, sector, expected_return, volatility,
                    sharpe_ratio, liquidity_score
    price_history : dict — ticker → pd.Series of daily Close prices
                    (passed to get_correlation_matrix)

    Raises
    ------
    ValueError if too few assets can be fetched to build a useful portfolio.
    """
    end   = datetime.now()
    start = end - timedelta(days=_FETCH_YEARS * 365)

    futures = {}
    with ThreadPoolExecutor(max_workers=_POOL_WORKERS) as pool:
        for asset in ASSET_UNIVERSE:
            fut = pool.submit(
                _fetch_one, asset["ticker"], asset["yahoo"],
                start.strftime('%Y-%m-%d'), end.strftime('%Y-%m-%d'),
            )
            futures[fut] = asset

        closes_map  = {}
        volume_map  = {}   # ticker → average daily volume
        errors = []
        for fut in as_completed(futures):
            asset = futures[fut]
            try:
                ticker, closes, avg_volume = fut.result()
                closes_map[ticker] = closes
                volume_map[ticker] = avg_volume
            except Exception as exc:
                errors.append(f"{asset['ticker']} ({asset['yahoo']}): {exc}")

    min_assets = 10
    if len(closes_map) < min_assets:
        raise ValueError(
            f"Only {len(closes_map)} EGX30 assets were available from Yahoo Finance "
            f"(need at least {min_assets}). Failed symbols:\n"
            + "\n".join(f"  • {e}" for e in errors)
            + "\n\nCheck your internet connection or try again later."
        )

    # ── Compute liquidity_score from real average daily volume ────────────────
    # Rank every asset by its mean daily traded volume, then map to 1–10.
    # Formula: score = round(percentile_rank × 9) + 1  →  always 1–10.
    # Example: the highest-volume asset gets score 10, the lowest gets 1.
    # This is fully computed from Yahoo Finance Volume data — no invented numbers.
    available_assets = [a for a in ASSET_UNIVERSE if a["ticker"] in closes_map]
    all_tickers = [a["ticker"] for a in available_assets]
    volumes     = np.array([volume_map.get(t, 0.0) for t in all_tickers], dtype=float)
    n = len(volumes)
    if n > 1:
        # argsort twice gives rank (0-based), divide by (n-1) → 0.0–1.0 percentile
        ranks = np.argsort(np.argsort(volumes)).astype(float) / (n - 1)
    else:
        ranks = np.array([0.5])
    liquidity_scores = {t: max(1, min(10, round(r * 9) + 1))
                        for t, r in zip(all_tickers, ranks)}

    rows = []
    for asset in available_assets:
        ticker = asset["ticker"]
        closes = closes_map[ticker]
        daily_returns = closes.pct_change().dropna()

        # Annualise: 252 trading days per year is the universal standard
        expected_return = float(daily_returns.mean() * 252)
        volatility      = float(daily_returns.std() * np.sqrt(252))

        if volatility <= 0 or np.isnan(expected_return) or np.isnan(volatility):
            raise ValueError(
                f"Cannot compute valid metrics for '{ticker}': "
                f"return={expected_return:.4f}, vol={volatility:.4f}"
            )

        # Sharpe ratio: excess return above risk-free rate, per unit of volatility
        sharpe = (expected_return - RISK_FREE_RATE) / volatility

        rows.append({
            "ticker":          ticker,
            "name":            asset["name"],
            "type":            asset["type"],
            "sector":          asset["sector"],
            "liquidity_score": liquidity_scores[ticker],
            "expected_return": expected_return,
            "volatility":      volatility,
            "sharpe_ratio":    sharpe,
        })

    return pd.DataFrame(rows), closes_map


def _fetch_live_one(asset):
    """Fetch the latest available Yahoo price for one EGX ticker."""
    import yfinance as yf

    ticker = asset["ticker"]
    yahoo_ticker = asset["yahoo"]
    y_ticker = yf.Ticker(yahoo_ticker)

    intraday = y_ticker.history(period="2d", interval="1m", auto_adjust=True, timeout=12)
    daily = y_ticker.history(period="7d", interval="1d", auto_adjust=True, timeout=12)

    price = None
    market_time = None
    previous_close = None

    if intraday is not None and not intraday.empty and "Close" in intraday.columns:
        intraday_closes = intraday["Close"].dropna()
        if not intraday_closes.empty:
            price = float(intraday_closes.iloc[-1])
            market_time = intraday_closes.index[-1].isoformat()

    if daily is not None and not daily.empty and "Close" in daily.columns:
        daily_closes = daily["Close"].dropna()
        if price is None and not daily_closes.empty:
            price = float(daily_closes.iloc[-1])
            market_time = daily_closes.index[-1].isoformat()
        if len(daily_closes) >= 2:
            previous_close = float(daily_closes.iloc[-2])
        elif len(daily_closes) == 1:
            previous_close = float(daily_closes.iloc[0])

    if price is None:
        raise ValueError(f"No live price returned for {yahoo_ticker}")

    change = None
    change_pct = None
    if previous_close and previous_close > 0:
        change = price - previous_close
        change_pct = change / previous_close * 100

    return {
        "ticker": ticker,
        "yahoo": yahoo_ticker,
        "name": asset["name"],
        "price": round(price, 4),
        "previous_close": round(previous_close, 4) if previous_close is not None else None,
        "change": round(change, 4) if change is not None else None,
        "change_percent": round(change_pct, 2) if change_pct is not None else None,
        "market_time": market_time,
        "currency": asset.get("currency", "EGP"),
        "source": "Yahoo Finance",
    }


def fetch_live_prices(tickers=None):
    """
    Fetch latest available prices for selected EGX30 tickers.

    This is polling, not a paid exchange data stream. Yahoo data may be delayed.
    """
    if tickers:
        requested = {str(t).upper().strip() for t in tickers if str(t).strip()}
        assets = [a for a in ASSET_UNIVERSE if a["ticker"] in requested]
    else:
        assets = ASSET_UNIVERSE

    prices = []
    errors = []
    with ThreadPoolExecutor(max_workers=_POOL_WORKERS) as pool:
        futures = {pool.submit(_fetch_live_one, asset): asset for asset in assets}
        for fut in as_completed(futures):
            asset = futures[fut]
            try:
                prices.append(fut.result())
            except Exception as exc:
                errors.append({"ticker": asset["ticker"], "message": str(exc)})

    prices.sort(key=lambda item: item["ticker"])
    return {
        "prices": prices,
        "errors": errors,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "source": "Yahoo Finance",
        "note": "Free Yahoo Finance data can be delayed or unavailable for some EGX symbols.",
    }


def get_correlation_matrix(price_history: dict) -> pd.DataFrame:
    """
    Build a Pearson correlation matrix of daily returns across all tickers.
    Used by the portfolio optimizer to avoid selecting highly correlated assets.
    """
    if not price_history or len(price_history) < 2:
        return pd.DataFrame()

    daily_returns = pd.DataFrame({
        ticker: closes.pct_change().dropna()
        for ticker, closes in price_history.items()
    }).dropna()

    if len(daily_returns) < 5:
        return pd.DataFrame()

    return daily_returns.corr()
