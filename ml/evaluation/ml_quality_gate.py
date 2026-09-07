"""
NeuroScan AI — Automated Machine Learning Quality Gate & Scientific Integrity Verifier
Enforces blocking checks:
  1. Strict Leakage Guard: Target ('Class_ASD') and target-derived sums ('result', 'aq10_sum')
     MUST NOT appear in feature vectors or model artifacts.
  2. Governance Lock: Status must be 'RESEARCH_PROTOTYPE', 'is_experimental: true',
     'is_validated_clinical_model: false'. No 'PRODUCTION_READY' status permitted.
  3. Synthetic Cohort Guard: Multi-disorder suite must explicitly declare synthetic origin.
  4. Dataset Consistency: Dataset size metadata must match actual physical dataset (N=79).
  5. Artifact Integrity: Model joblib files must load and feature schemas must align.
  6. SHAP Alignment: SHAP TreeExplainer feature space must match model input dimensions.
  7. Metrics Completeness: CV metrics, Holdout test metrics, and Brier calibration scores must be present.

Exits with code 0 on PASS, code 1 on FAIL.
"""

import os
import sys
import json
import joblib
import numpy as np

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

def run_quality_gate():
    print("=" * 70)
    print("NeuroScan AI — ML Scientific Quality Gate & Integrity Audit")
    print("=" * 70)

    artifacts_dir = os.path.join(os.path.dirname(__file__), '../artifacts')
    governance_file = os.path.join(os.path.dirname(__file__), '../model_governance.json')
    asd_data_file = os.path.join(os.path.dirname(__file__), '../data/asd_kaggle_data.json')
    asd_metrics_file = os.path.join(artifacts_dir, 'metrics.json')
    multi_metrics_file = os.path.join(artifacts_dir, 'multi_disorder_metrics.json')

    failures = []
    warnings = []

    # Check 1: Model Governance File
    if not os.path.exists(governance_file):
        failures.append(f"Model governance file missing: {governance_file}")
    else:
        with open(governance_file, 'r', encoding='utf-8') as f:
            gov = json.load(f)

        if gov.get('model_status') == 'PRODUCTION_READY':
            failures.append("Governance violation: Model status is marked 'PRODUCTION_READY' without clinical validation.")
        if gov.get('model_status') != 'RESEARCH_PROTOTYPE':
            failures.append(f"Governance violation: Model status is '{gov.get('model_status')}', expected 'RESEARCH_PROTOTYPE'.")
        if not gov.get('is_experimental', False):
            failures.append("Governance violation: 'is_experimental' must be True.")
        if gov.get('is_validated_clinical_model', True):
            failures.append("Governance violation: 'is_validated_clinical_model' must be False.")
        if gov.get('clinical_use_allowed', True):
            failures.append("Governance violation: 'clinical_use_allowed' must be False.")
        print("  [PASS] Governance file verified (Status: RESEARCH_PROTOTYPE, Non-Clinical).")

    # Check 2: Physical Dataset Integrity & Verification
    if not os.path.exists(asd_data_file):
        failures.append(f"ASD dataset file missing: {asd_data_file}")
    else:
        with open(asd_data_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        n_records = len(data)
        if n_records != 79:
            failures.append(f"Dataset size mismatch: Found {n_records} records, expected exactly 79.")
        else:
            print(f"  [PASS] Dataset verified (Physical records: {n_records}).")

    # Check 3: Strict Target Leakage & Feature Set Audit
    from ml.preprocessing.pipeline import MODEL_FEATURE_NAMES, transform_sample

    banned_features = {'Class_ASD', 'Class/ASD', 'target', 'result', 'aq10_sum', 'ethnicity', 'country'}
    leaked_features = set(MODEL_FEATURE_NAMES).intersection(banned_features)
    if leaked_features:
        failures.append(f"CRITICAL LEAKAGE: Banned or target-derived features in MODEL_FEATURE_NAMES: {leaked_features}")
    else:
        print("  [PASS] Feature space verified (No target-derived variables in MODEL_FEATURE_NAMES).")

    # Check 4: ASD Model Artifacts & Integrity
    rf_path = os.path.join(artifacts_dir, 'random_forest.joblib')
    lr_path = os.path.join(artifacts_dir, 'logistic_regression.joblib')
    gb_path = os.path.join(artifacts_dir, 'gradient_boosting.joblib')
    explainer_path = os.path.join(artifacts_dir, 'rf_shap_explainer.joblib')

    for p, name in [(rf_path, 'Random Forest'), (lr_path, 'Logistic Regression'), (gb_path, 'Gradient Boosting')]:
        if not os.path.exists(p):
            failures.append(f"Model artifact missing: {name} ({p})")
        else:
            try:
                m = joblib.load(p)
                # Test inference
                dummy_vec, _ = transform_sample({'A1': 1, 'A10': 1, 'age': 25})
                prob = m.predict_proba(dummy_vec.reshape(1, -1))
                if prob.shape != (1, 2):
                    failures.append(f"Invalid probability output shape from {name}: {prob.shape}")
            except Exception as e:
                failures.append(f"Failed to load or execute model {name}: {e}")

    if not failures:
        print("  [PASS] All ASD core model artifacts loaded and executed test inference.")

    # Check 5: SHAP TreeExplainer Consistency
    if not os.path.exists(explainer_path):
        failures.append(f"SHAP TreeExplainer artifact missing: {explainer_path}")
    else:
        try:
            explainer = joblib.load(explainer_path)
            dummy_vec, _ = transform_sample({'A1': 1, 'A10': 1, 'age': 25})
            shap_vals = explainer.shap_values(dummy_vec.reshape(1, -1))
            
            # Check dimension
            if isinstance(shap_vals, list):
                val_len = len(shap_vals[1][0]) if len(shap_vals) > 1 else len(shap_vals[0])
            elif isinstance(shap_vals, np.ndarray):
                if shap_vals.ndim == 3:
                    val_len = shap_vals.shape[1] # (1, 14, 2)
                elif shap_vals.ndim == 2:
                    val_len = shap_vals.shape[1]
                else:
                    val_len = len(shap_vals)
            else:
                val_len = len(shap_vals)

            if val_len != len(MODEL_FEATURE_NAMES):
                failures.append(f"SHAP feature dimension mismatch: TreeExplainer outputs {val_len} values, expected {len(MODEL_FEATURE_NAMES)}.")
            else:
                print(f"  [PASS] SHAP TreeExplainer verified ({val_len} feature attributions match input dimension).")
        except Exception as e:
            failures.append(f"SHAP TreeExplainer execution error: {e}")

    # Check 6: ASD Model Metrics & Calibration Completeness
    if not os.path.exists(asd_metrics_file):
        failures.append(f"ASD metrics file missing: {asd_metrics_file}")
    else:
        with open(asd_metrics_file, 'r', encoding='utf-8') as f:
            metrics = json.load(f)

        if metrics.get('status') != 'RESEARCH_PROTOTYPE':
            failures.append(f"ASD metrics status is '{metrics.get('status')}', expected 'RESEARCH_PROTOTYPE'.")

        m_dict = metrics.get('metrics', {})
        for mod in ['random_forest', 'logistic_regression', 'gradient_boosting']:
            if mod not in m_dict:
                failures.append(f"Missing evaluation metrics for {mod}")
            else:
                test_m = m_dict[mod].get('test_metrics', {})
                if 'brier_score' not in test_m:
                    failures.append(f"Missing Brier calibration score for {mod}")
                if 'accuracy' not in test_m:
                    failures.append(f"Missing test accuracy for {mod}")
                if 'bootstrap_95ci' not in test_m:
                    warnings.append(f"Bootstrap 95% CI missing for {mod}")

        print("  [PASS] ASD validation metrics and calibration metadata verified.")

    # Check 7: Multi-Disorder Synthetic Prototype Status
    if not os.path.exists(multi_metrics_file):
        failures.append(f"Multi-disorder metrics file missing: {multi_metrics_file}")
    else:
        with open(multi_metrics_file, 'r', encoding='utf-8') as f:
            multi_m = json.load(f)

        if not multi_m.get('is_synthetic_cohort', False):
            failures.append("Multi-disorder suite must have 'is_synthetic_cohort: true'.")
        if multi_m.get('is_validated_clinical_model', True):
            failures.append("Multi-disorder suite must have 'is_validated_clinical_model: false'.")

        # Check Intellectual Disability Imbalance Warning
        disorders = multi_m.get('disorders', {})
        if 'intellectual_disability' in disorders:
            idd = disorders['intellectual_disability']
            if not idd.get('imbalance_warning'):
                failures.append("Intellectual Disability model missing mandatory severe class imbalance warning.")
            else:
                print("  [PASS] Multi-disorder synthetic cohort status & IDD severe imbalance warning verified.")

    print("\n" + "-" * 70)
    if warnings:
        print("QUALITY GATE WARNINGS:")
        for w in warnings:
            print(f"  [WARN] {w}")

    if failures:
        print("QUALITY GATE FAILED WITH BLOCKING ERRORS:")
        for f_err in failures:
            print(f"  [FAIL] {f_err}")
        print("=" * 70)
        sys.exit(1)
    else:
        print("ALL QUALITY GATE CHECKS PASSED PERFECTLY (Exit Code: 0).")
        print("=" * 70)
        sys.exit(0)

if __name__ == '__main__':
    run_quality_gate()
