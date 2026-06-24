# SmartInvest

SmartInvest is a web app that helps an Egyptian investor turn
a simple financial profile into an explainable investment portfolio.

The project focuses on clarity:

1. The user enters capital, investment goal, horizon, and liquidity needs.
2. A 15-question scorecard classifies the user as Conservative, Balanced, or
   Aggressive.
3. The app downloads recent market data for EGX30 stocks, gold, and
   real-estate exposure.
4. The portfolio builder selects a reasonable number of holdings based on the
   user's capital and risk profile.
5. The dashboard explains allocation, historical return, volatility, Sharpe
   ratio, diversification, and simple scenario projections.

This is an educational decision-support tool, not licensed financial advice.

## Features

- Account registration and JWT login
- Financial profile form
- Explainable 15-question risk scorecard
- Capital-aware portfolio allocation
- Yahoo Finance price-history integration for EGX30 stocks, gold, and
  real-estate exposure
- Auto-updating dashboard prices using periodic Yahoo Finance polling
- Dashboard with allocation charts, risk metrics, and hover explanations
- Simple scenario projection with monthly contributions and inflation
- Header settings menu for profile changes, quiz retake, and logout
- Optional AI chat assistant when an API key is configured
- Arabic / English interface

## Stack

| Layer        | Technology                                    |
| ------------ | --------------------------------------------- |
| Backend      | Flask, Flask-JWT-Extended, Flask-SQLAlchemy   |
| Database     | SQLite                                        |
| Data         | Yahoo Finance via `yfinance`                  |
| Calculations | pandas, NumPy                                 |
| Frontend     | Jinja templates, vanilla JavaScript, Chart.js |
| AI Chat      | OpenAI-compatible API client                  |

## Quick Start

```bash
pip install -r requirements.txt
python app.py
```

Open: http://localhost:5000

Optional chatbot environment variables:

```bash
GROQ_API_KEY=your_groq_key_here
AI_BASE_URL=https://api.groq.com/openai/v1
AI_MODEL=llama-3.3-70b-versatile
```

Use a key that matches the provider in `AI_BASE_URL`. The app also accepts
`AI_API_KEY`, `DEEPSEEK_API_KEY`, or `OPENAI_API_KEY`. Do not commit real API
keys. Use a local `.env` file only.

## Main User Flow

```text
Register -> Complete Profile -> Take Risk Quiz -> Generate Portfolio -> View Dashboard
```

## How The Risk Score Works

Each quiz answer is scored from 0 to 3:

- `0`: more risk-averse
- `3`: more risk-tolerant

The scorecard is weighted so that behavioral risk tolerance drives the result:

- Risk-tolerance behavior questions: `70%`
- Financial capacity questions such as time horizon/emergency savings: `20%`
- Goal, knowledge, and experience questions: `10%`

The weighted score is converted back to a 0-45 scale:

| Score | Category     |
| ----- | ------------ |
| 0-14  | Conservative |
| 15-29 | Balanced     |
| 30-45 | Aggressive   |

This is intentionally simple. It is easy to explain and audit, and it avoids
pretending that the project has a trained financial ML model. The result card
shows behavioral risk-tolerance answers as the key factors, not capacity answers
such as time horizon or emergency savings.

## Market Data

The app uses 30 EGX30 companies plus a Yahoo Finance gold proxy. Real-estate
exposure is represented by EGX30 real-estate-sector companies such as TMGH,
EMFD, PHDC, MASR, and ORHD. In code, the list lives in `ml/data_fetcher.py`.

The app uses Yahoo Finance symbols with the `.CA` suffix, for example:

```text
COMI.CA, TMGH.CA, EAST.CA, ETEL.CA, FWRY.CA
```

The dashboard polls `/api/market_prices` every 60 seconds for the assets shown
in the user's portfolio. This is not a paid exchange data stream. Free Yahoo
Finance data may be delayed or unavailable for some symbols.

## How The Portfolio Builder Works

The portfolio logic is in `ml/portfolio_optimizer.py`.

It follows this order:

1. Choose target weights between EGX stocks, gold, and real-estate exposure
   from the user's risk category.
2. Adjust the mix slightly for short or long investment horizons.
3. Limit the number of holdings based on capital size and risk category.
4. Rank candidates inside each class using historical return, volatility,
   Sharpe ratio, and liquidity.
5. Avoid highly correlated duplicate assets.
6. Allocate money across the selected assets using a risk-aware blend of target
   weights and score-based weights.

Why can one asset take 14% while another takes 6%?

The app does not use pure equal weighting. Inside each asset class, it blends:

- Equal weight: keeps the portfolio diversified.
- Score weight: gives more weight to assets with stronger historical return,
  Sharpe ratio, liquidity, and lower volatility.

Aggressive portfolios use a stronger score tilt than balanced or conservative
portfolios, so high-ranked assets can receive visibly larger weights.

Example holding limits:

| Capital             | Maximum holdings |
| ------------------- | ---------------- |
| < 20,000 EGP        | 3                |
| 20,000-49,999 EGP   | 4                |
| 50,000-99,999 EGP   | 5                |
| 100,000-249,999 EGP | 6                |
| 250,000-499,999 EGP | 8                |
| 500,000-999,999 EGP | 10               |
| 1,000,000+ EGP      | 12               |

## What The Metrics Mean

- Live price: latest available Yahoo Finance price, refreshed automatically.
- Today's change: latest price compared with the previous close.
- Historical annual return: annualized return from recent downloaded prices.
- Volatility: annualized historical price movement.
- Sharpe ratio: return compared with risk; higher is usually better.
- Liquidity score: 1-10 rank based on average trading volume inside the project
  universe.
- Diversification score: 0-10 score based on historical correlation between the
  selected assets.

These values are estimates from recent historical data. They are not guaranteed
future returns.

## Current Limitations

- The project uses EGX30 plus a gold proxy, not every listed company in the
  Egyptian Exchange.
- The gold price is a Yahoo Finance global gold proxy, not a local Egyptian
  physical-gold quote.
- Yahoo Finance coverage for EGX symbols can be incomplete or delayed.
- The app does not perform company fundamental analysis.
- The scenario projection is a planning tool, not an accurate market forecast.
  Inflation affects the "average after inflation" result, not the nominal
  best/average/worst portfolio values.
- A real production product would need licensed market data, stronger security,
  proper migrations, audit logs, tests, and compliance/legal review.

## Project Structure

```text
SmartInvest/
├── app.py
├── config.py
├── database.py
├── models.py
├── ml/
│   ├── data_fetcher.py
│   ├── portfolio_optimizer.py
│   ├── risk_classifier.py
│   └── simulator.py
├── routes/
│   ├── auth.py
│   ├── chat.py
│   ├── portfolio.py
│   ├── profile.py
│   └── quiz.py
├── static/
│   ├── css/style.css
│   └── js/
└── templates/
```
