# NeuroScan AI — ML Scientific Integrity Audit & Validation Report

**Audit Completion Date**: September 2026  
**Audit Status**: **VERIFIED & LOCKED**  
**Governance Classification**: `RESEARCH_PROTOTYPE` (Experimental Screening Prototype)  
**Clinical Clearance**: **NOT APPROVED FOR CLINICAL USE** (Educational / Architectural Research Only)  
**Dataset SHA-256**: `33900055da1817b0932e0887e3f3c4fcbae5c7999a58a3ed24495de7465288a4`  

---

## 1. Executive Summary: Why the Models Achieved 100% Performance

When machine learning classifiers achieve 100% accuracy across multiple algorithms (Logistic Regression, Random Forest, Gradient Boosting, XGBoost), scientific rigor demands exhaustive skepticism. A formal investigation was executed to audit the 79-record ASD dataset and multi-disorder pipeline.

### Core Discoveries:
1. **The Target is a Questionnaire-Derived Construct**:
   - `Class_ASD` in this dataset represents screening score threshold concordance ($\sum A_i \ge 6$), not an independently gathered gold-standard clinical diagnosis.
   - The ML model operates as a **`Questionnaire-Score Replication and Explainability Tool`**, learning the screening logic and feature interactions.

2. **Deterministic Feature Separation in this 79-Record Subset**:
   - In this specific curated sample of 79 records (39 positive, 40 negative controls), two individual features exhibit 100% sensitivity and 100% specificity:
     - `A1_Score` (Noticing small sounds): Positive mean = $1.000$ (std 0.0), Control mean = $0.000$ (std 0.0), $r_{pb} = 1.000, p < 10^{-20}$.
     - `A10_Score` (Understanding social intentions): Positive mean = $1.000$ (std 0.0), Control mean = $0.000$ (std 0.0), $r_{pb} = 1.000, p < 10^{-20}$.
   - Secondary items also have high separation: `A7_Score` ($92.3\%$ vs $10.0\%$, adjusted OR = $84.59$) and `A8_Score` ($76.9\%$ vs $15.0\%$, adjusted OR = $17.04$).

3. **Ablation Proof**:
   - When both $A_1$ and $A_{10}$ are removed from the feature matrix (**Ablation Experiment I**), cross-validation balanced accuracy drops to **$91.7\%$ for Random Forest** and **$96.7\%$ for Logistic Regression**.
   - This empirically demonstrates that the 100% CV accuracy is driven by $A_1$ and $A_{10}$ collinearity in this sample.

4. **Demographic Confounding**:
   - Positive cases are significantly younger (mean $23.1 \pm 7.7$ years) than control cases (mean $49.0 \pm 11.1$ years).
   - Training on demographics alone (**Ablation Experiment C**) achieves $95.0\% - 96.7\%$ balanced accuracy.

5. **Multi-Disorder Synthetic Provenance**:
   - The 800-patient multi-disorder dataset is explicitly documented as a **synthetic heuristic developmental cohort** for architectural and user-interface demonstration, not a multi-center clinical study.
   - Severe class imbalance in Intellectual Disability ($N=7$ cases, $0.88\%$ prevalence) is prominently flagged with automated warning banners.

---

## 2. Leakage-Free Preprocessing & Evaluation Protocol

To ensure absolute methodological validity, the following architecture is enforced:

1. **Strict Feature Matrix Isolation**:
   - All target-derived sums (`aq10_sum`, `result`) and identifiers are **strictly purged** from `MODEL_FEATURE_NAMES`.
   - The model receives only the 14 allowed features: 10 individual AQ items and 4 demographic features (`age`, `gender_num`, `jaundice_num`, `austim_num`).
2. **Untouched Stratified Holdout Test Split**:
   - An exact $25\%$ stratified holdout split ($N=20$: 10 positive, 10 negative) is held out before any training or cross-validation.
   - It is evaluated exactly once after model fitting.
3. **Leakage-Free 5-Fold Stratified Cross-Validation**:
   - Within the training set ($N=59$), 5-fold cross-validation is performed.
   - All preprocessing transformers (e.g. `StandardScaler`) are encapsulated within `sklearn.pipeline.Pipeline` objects fitted strictly on the training partition of each fold.
4. **Discrimination vs Calibration Separation**:
   - Discrimination: Reported via ROC-AUC and Precision-Recall AUC (PR-AUC).
   - Calibration: Reported via Brier Score Loss and Expected Calibration Error (ECE).
5. **Authentic SHAP TreeExplainer**:
   - Real Shapley Additive Explanations computed via `shap.TreeExplainer` on the Random Forest ensemble, providing mathematically exact feature attributions.

---

## 3. Systematic Ablation Study Results

| Exp ID | Configuration | Features ($K$) | LR CV Bal Acc | RF CV Bal Acc | Test Acc | Test PR-AUC | Primary Takeaway |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Exp A** | All Features | 14 | 100.0% | 100.0% | 100.0% | 1.000 | Baseline full feature set. |
| **Exp B** | Questionnaire Only | 10 | 100.0% | 100.0% | 100.0% | 1.000 | A1..A10 alone preserve 100% separation. |
| **Exp C** | Demographics Only | 4 | 96.7% | 95.0% | 95.0% | 0.992 | Age & family history alone yield high separation. |
| **Exp D** | A1 Only | 1 | 100.0% | 100.0% | 100.0% | 1.000 | A1 alone perfectly separates positive from negative. |
| **Exp E** | A10 Only | 1 | 100.0% | 100.0% | 100.0% | 1.000 | A10 alone perfectly separates positive from negative. |
| **Exp F** | A1 + A10 | 2 | 100.0% | 100.0% | 100.0% | 1.000 | Combined dual perfect separators. |
| **Exp G** | A1–A9 (Excl A10) | 9 | 100.0% | 100.0% | 100.0% | 1.000 | A1 maintains 100% separation. |
| **Exp H** | A2–A10 (Excl A1) | 9 | 100.0% | 100.0% | 100.0% | 1.000 | A10 maintains 100% separation. |
| **Exp I** | A2–A9 (No A1, No A10)| 8 | 96.7% | 91.7% | 100.0% | 0.963 | **Performance drops to realistic 91.7% CV Bal Acc.** |

---

## 4. Multi-Disorder Architecture Performance (Synthetic Cohort N=800)

| Disorder | ICD Code | Positive Cases | Prevalence | CV Balanced Acc | Sensitivity | Specificity | PR-AUC | Scientific Integrity Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **ASD** | F84.0 | 156 | 19.5% | 92.1% | 93.0% | 91.3% | 0.936 | Experimental Research Prototype |
| **ADHD** | F90.9 | 215 | 26.9% | 95.5% | 96.3% | 94.7% | 0.971 | Experimental Research Prototype |
| **Dyslexia** | F81.0 | 74 | 9.2% | 96.8% | 98.7% | 94.9% | 0.885 | Experimental Research Prototype |
| **Social Anxiety** | F40.1 | 92 | 11.5% | 87.9% | 88.0% | 87.9% | 0.656 | Experimental Research Prototype |
| **Speech Delay** | F80.9 | 24 | 3.0% | 92.5% | 86.0% | 99.1% | 0.766 | Experimental Research Prototype |
| **Intellectual Disability**| F70-F79 | 7 | 0.88% | 79.3% | 60.0% | 98.6% | 0.733 | ⚠️ **Severe Imbalance Warning (N=7)** |
| **SPD** | R20.8 | 198 | 24.8% | 92.2% | 90.4% | 94.0% | 0.908 | Experimental Research Prototype |

---

## 5. Automated Quality Gate Verification Summary

An automated validation gate (`ml/evaluation/ml_quality_gate.py`) verifies:
- [x] Target column (`Class_ASD`) absent from feature matrix.
- [x] Derived sum variables (`result`, `aq10_sum`) purged from feature matrix.
- [x] Model governance status locked to `RESEARCH_PROTOTYPE` with `is_experimental: true`.
- [x] Synthetic multi-disorder cohort explicitly declared with imbalance warnings.
- [x] Physical dataset record count verified ($N=79$, SHA-256 verified).
- [x] All model artifacts (`.joblib`) load and execute inference.
- [x] SHAP TreeExplainer feature dimensions match model inputs (14 dimensions).
- [x] CV metrics, holdout test metrics, and calibration scores present.

**Quality Gate Result**: **100% PASSED (Exit Code: 0)**

---

## 6. Regulatory & Clinical Disclaimer

> **RESEARCH PROTOTYPE NOTICE**: NeuroScan AI is developed for academic, educational, and technical software prototyping. It is not an FDA-cleared, CE-marked, or clinically validated medical device. Outputs must not be used as a substitute for professional clinical judgment, psychiatric assessment, or standardized diagnostic instruments (e.g., ADOS-2, ADI-R, CARS).
