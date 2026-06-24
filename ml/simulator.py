def run_simulation(portfolio_result, years=10, monthly_contribution=0, inflation_rate=0.05):
    """
    Project portfolio value year-by-year using simple monthly compounding.

    This is scenario analysis, not a promise. The "average" scenario uses the
    portfolio's historical annualised return. The best/worst cases move half a
    volatility point above/below that rate so the range is visible without
    producing absurd numbers for volatile assets.
    """
    initial      = float(portfolio_result.get("total_investment", 0))
    avg_return   = float(portfolio_result.get("expected_return", 15)) / 100.0
    vol          = float(portfolio_result.get("volatility", 20)) / 100.0
    monthly_contribution = float(monthly_contribution)
    inflation_rate = max(0.0, float(inflation_rate))

    scenario_gap = min(vol * 0.5, 0.15)
    best_rate  = avg_return + scenario_gap
    worst_rate = max(avg_return - scenario_gap, -0.25)

    def project(annual_rate):
        values = []
        value = initial
        monthly_rate = (1 + annual_rate) ** (1 / 12) - 1 if annual_rate > -1 else -0.99

        for month in range(1, years * 12 + 1):
            value = value * (1 + monthly_rate) + monthly_contribution
            if month % 12 == 0:
                values.append(round(max(value, 0), 2))
        return values

    def inflation_adjust(values):
        return [
            round(value / ((1 + inflation_rate) ** year), 2)
            for year, value in enumerate(values, start=1)
        ]

    best_case    = project(best_rate)
    average_case = project(avg_return)
    worst_case   = project(worst_rate)
    real_average = inflation_adjust(average_case)

    return {
        "years_list":         list(range(1, years + 1)),
        "best_case":          best_case,
        "average_case":       average_case,
        "worst_case":         worst_case,
        "real_average_case":   real_average,
        "initial_investment": initial,
        "final_best":         best_case[-1] if best_case else initial,
        "final_average":      average_case[-1] if average_case else initial,
        "final_worst":        worst_case[-1] if worst_case else initial,
        "final_average_real":  real_average[-1] if real_average else initial,
        "total_contributions": round(monthly_contribution * 12 * years, 2),
        "assumptions": {
            "average_rate_percent": round(avg_return * 100, 2),
            "best_rate_percent": round(best_rate * 100, 2),
            "worst_rate_percent": round(worst_rate * 100, 2),
            "inflation_rate_percent": round(inflation_rate * 100, 2),
            "volatility_percent": round(vol * 100, 2),
            "scenario_gap_percent": round(scenario_gap * 100, 2),
        },
    }
