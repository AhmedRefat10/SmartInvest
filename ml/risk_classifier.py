"""
Risk profile classifier.

This module intentionally uses a simple, explainable weighted scorecard instead
of a black-box ML model. The investor answers 15 questions on the same scale:

  0 = most risk-averse answer
  3 = most risk-tolerant answer

The final score is converted back to a 0-45 scale:

  0-14  -> Conservative
  15-29 -> Balanced
  30-45 -> Aggressive

That makes the result easy to defend in a presentation: the final category is
not magic, it is a transparent weighted score. Behavioral risk tolerance has the
largest weight, while financial capacity questions such as time horizon and
emergency savings only adjust the result.
"""

# What each question measures (scale: 0 = risk-averse, 3 = risk-tolerant).
QUESTIONS = {
    "Q1":  "Investment goal",
    "Q2":  "Reaction to a market loss",
    "Q3":  "Investment time horizon",
    "Q4":  "Maximum acceptable short-term loss",
    "Q5":  "Investment knowledge",
    "Q6":  "Previous investing experience",
    "Q7":  "Ability to stay invested during a downturn",
    "Q8":  "Emergency savings buffer",
    "Q9":  "Share of savings invested",
    "Q10": "Financial dependents",
    "Q11": "Income stability",
    "Q12": "Personal comfort with risk",
    "Q13": "Comfort with uncertain outcomes",
    "Q14": "Reaction after strong gains",
    "Q15": "Long-term wealth goal",
}

# Score thresholds — dividing the 0–45 range into three equal zones
_THRESHOLDS = {
    "Conservative": (0,  14),   # 0% – 31% of max
    "Balanced":     (15, 29),   # 33% – 64% of max
    "Aggressive":   (30, 45),   # 67% – 100% of max
}

_GROUPS = {
    "risk_tolerance": {
        "weight": 0.70,
        "questions": [1, 3, 6, 11, 12, 13, 14],  # Q2, Q4, Q7, Q12, Q13, Q14, Q15
    },
    "risk_capacity": {
        "weight": 0.20,
        "questions": [2, 7, 8, 9, 10],  # Q3, Q8, Q9, Q10, Q11
    },
    "knowledge_goal": {
        "weight": 0.10,
        "questions": [0, 4, 5],  # Q1, Q5, Q6
    },
}

_DISPLAY_FACTOR_INDEXES = _GROUPS["risk_tolerance"]["questions"]


def _group_average(answers, indexes):
    return sum(answers[i] for i in indexes) / len(indexes)


def predict_risk_category(answers: list) -> dict:
    """
    Classify an investor's risk profile from their 15 quiz answers.

    Parameters
    ----------
    answers : list of exactly 15 integers, each 0–3

    Returns
    -------
    dict with:
      category       : 'Conservative' | 'Balanced' | 'Aggressive'
      total_score    : int  — weighted score converted to 0–45
      score_percent  : int  — total_score as a percentage of 45
      thresholds     : dict — the exact cutoff ranges used (for display to user)
      top_factors    : list — up to 3 question IDs that best support the final
                       category. These are selected only from behavioral
                       risk-tolerance questions, not capacity questions such as
                       time horizon or emergency savings.
      category_reason: str — plain-language explanation for the result
    """
    if len(answers) != 15:
        raise ValueError(f"Expected 15 answers, got {len(answers)}")
    if not all(isinstance(a, int) and 0 <= a <= 3 for a in answers):
        raise ValueError("All answers must be integers between 0 and 3.")

    weighted_average = sum(
        _group_average(answers, group["questions"]) * group["weight"]
        for group in _GROUPS.values()
    )
    total = round(weighted_average / 3 * 45)

    if total <= 14:
        category = "Conservative"
    elif total <= 29:
        category = "Balanced"
    else:
        category = "Aggressive"

    if category == "Conservative":
        ranked = sorted(_DISPLAY_FACTOR_INDEXES, key=lambda i: (answers[i], i))
        reason = (
            "Your total score is in the conservative range. The answers that "
            "most support this are the ones where you preferred stability and "
            "lower downside risk."
        )
    elif category == "Aggressive":
        ranked = sorted(_DISPLAY_FACTOR_INDEXES, key=lambda i: (-answers[i], i))
        reason = (
            "Your total score is in the aggressive range. The answers that "
            "most support this are the ones where you accepted higher short-term "
            "risk for higher long-term growth."
        )
    else:
        ranked = sorted(_DISPLAY_FACTOR_INDEXES, key=lambda i: (abs(answers[i] - 1.5), i))
        reason = (
            "Your total score is in the balanced range. This usually means your "
            "answers were mixed or moderate, not strongly conservative or "
            "strongly aggressive."
        )

    top_factors = [f"Q{i + 1}" for i in ranked[:3]]

    return {
        "category":      category,
        "total_score":   total,
        "score_percent": round(total / 45 * 100),
        "max_score":     45,
        "thresholds":    {k: f"{v[0]}–{v[1]}" for k, v in _THRESHOLDS.items()},
        "top_factors":   top_factors,
        "score_breakdown": {
            name: round(_group_average(answers, group["questions"]) / 3 * 100)
            for name, group in _GROUPS.items()
        },
        "category_reason": reason,
    }
