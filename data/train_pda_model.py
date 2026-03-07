"""
PDA Cox PH Model Training
==========================
Trains a Cox Proportional Hazards survival analysis model on the
synthetic provider directory degradation dataset.

Input:  data/pda_training_data.csv
Output: data/pda_model.pkl (trained CoxPHFitter)
        Prints model summary with β coefficients, hazard ratios, concordance index
"""

import pandas as pd
import pickle
import os
from lifelines import CoxPHFitter

def main():
    # ─── Load Training Data ───
    data_dir = os.path.dirname(__file__)
    df = pd.read_csv(os.path.join(data_dir, "pda_training_data.csv"))
    print(f"Loaded {len(df)} training records")
    print(f"Event rate: {df['event'].mean():.1%}\n")

    # ─── Features for Cox PH ───
    feature_cols = [
        "specialty_churn",
        "months_since_update",
        "state_mobility",
        "has_docs",
        "years_active",
    ]
    train_df = df[["duration", "event"] + feature_cols].copy()

    # ─── Fit Cox PH Model ───
    cph = CoxPHFitter(penalizer=0.1)  # L2 regularization for small dataset
    cph.fit(train_df, duration_col="duration", event_col="event")

    # ─── Model Summary ───
    print("=" * 70)
    print("COX PROPORTIONAL HAZARDS MODEL — SUMMARY")
    print("=" * 70)
    cph.print_summary()

    print("\n" + "=" * 70)
    print("KEY INSIGHTS")
    print("=" * 70)

    # Concordance Index
    ci = cph.concordance_index_
    print(f"\nConcordance Index: {ci:.3f}")
    print(f"  (1.0 = perfect prediction, 0.5 = random chance)")
    print(f"  {'Good model fit' if ci > 0.6 else 'Moderate fit — expected for small synthetic dataset'}")

    # Hazard Ratios
    print(f"\nHazard Ratios (exp(β)):")
    print("-" * 50)
    summary = cph.summary
    for feature in feature_cols:
        coef = summary.loc[feature, "coef"]
        hr = summary.loc[feature, "exp(coef)"]
        p_val = summary.loc[feature, "p"]
        sig = "***" if p_val < 0.001 else "**" if p_val < 0.01 else "*" if p_val < 0.05 else ""
        
        # Human-readable interpretation
        if hr > 1:
            pct = (hr - 1) * 100
            direction = f"+{pct:.0f}% faster decay"
        else:
            pct = (1 - hr) * 100
            direction = f"-{pct:.0f}% slower decay"
        
        print(f"  {feature:25s}  β={coef:+.3f}  HR={hr:.3f}  ({direction}) {sig}")

    print(f"\nSignificance: *** p<0.001, ** p<0.01, * p<0.05")

    # Feature Importance Ranking
    print(f"\nFeature Importance (by |β|):")
    print("-" * 50)
    importance = summary["coef"].abs().sort_values(ascending=False)
    for i, (feat, val) in enumerate(importance.items(), 1):
        print(f"  {i}. {feat:25s}  |β| = {val:.3f}")

    # ─── Example Predictions ───
    print(f"\n{'=' * 70}")
    print("EXAMPLE SURVIVAL PREDICTIONS")
    print("=" * 70)
    
    # Pick 3 example providers
    examples = df.head(5)[feature_cols]
    sf = cph.predict_survival_function(examples)
    
    print(f"\nP(data stale within 90 days) for first 5 providers:")
    for i in range(min(5, len(examples))):
        npi = df.iloc[i]["NPI"]
        # Find closest time point to 3 months (our time unit is months)
        t_target = 3.0  # 3 months ≈ 90 days
        closest_t = sf.index[sf.index.searchsorted(t_target)]
        survival_at_90 = sf.iloc[sf.index.searchsorted(t_target), i]
        decay_prob = 1 - survival_at_90
        spec_churn = examples.iloc[i]["specialty_churn"]
        months = examples.iloc[i]["months_since_update"]
        print(f"  NPI {npi}: decay_prob={decay_prob:.2f}  (specialty_churn={spec_churn}, months_old={months:.0f})")

    # ─── Median Survival Times ───
    print(f"\nMedian data half-life (months):")
    medians = cph.predict_median(df[feature_cols])
    print(f"  Network average: {medians.median():.1f} months")
    print(f"  Shortest: {medians.min():.1f} months")
    print(f"  Longest: {medians.max():.1f} months")

    # ─── Save Model ───
    model_path = os.path.join(data_dir, "pda_model.pkl")
    with open(model_path, "wb") as f:
        pickle.dump(cph, f)
    print(f"\nModel saved to: {model_path}")


if __name__ == "__main__":
    main()
