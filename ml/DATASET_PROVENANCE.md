# NeuroScan AI — Dataset Provenance & Cohort Documentation

**Document Version**: 2.1.0-research  
**Last Updated**: September 2026  
**Primary Dataset**: `ml/data/asd_kaggle_data.json` / `ml/data/asd_kaggle_data.csv`  
**Dataset SHA-256 Hash**: `33900055da1817b0932e0887e3f3c4fcbae5c7999a58a3ed24495de7465288a4`  

---

## 1. Dataset Provenance & Overview

| Metadata Field | Value / Details |
| :--- | :--- |
| **Dataset Title** | Kaggle ML Olympiad - Autism Prediction (Curated Benchmark Subset) |
| **Source Repository** | Derived from public Kaggle Autism Screening Competition / UCI Machine Learning Repository (Autism Screening Data for Adults & Children by Dr. Fadi Fayez Thabtah). |
| **Local File Paths** | `ml/data/asd_kaggle_data.json`, `ml/data/asd_kaggle_data.csv` |
| **Observed Total Records ($N$)** | **79 records** (39 positive ASD screening cases, 40 negative control cases). |
| **Target Variable** | `Class_ASD` (Binary: 1 = positive screening, 0 = negative screening). |
| **Extraction Process** | Extracted via `ml/data/extract_dataset.py` from verified ground-truth clinical screening records. |
| **Missing Values** | 0 missing values across all 79 records. |
| **Duplicate Rows (Full)** | 0 exact duplicate rows across all 20 columns. |
| **Duplicate Profiles (AQ-10)**| 18 duplicate questionnaire response patterns across different demographic profiles. |

---

## 2. Target Derivation & Scored Construct

- The AQ-10 is a standardized 10-item clinical screening questionnaire for autism spectrum conditions.
- In the original screening protocol, each item is scored 0 or 1 based on autistic trait concordance.
- In this curated 79-record subset:
  - All 39 positive screening records have $A_1 = 1$ and $A_{10} = 1$.
  - All 40 negative control records have $A_1 = 0$ and $A_{10} = 0$.
  - The variable `result` (the raw AQ-10 score) was originally computed as the sum of positive responses.
- **Leakage Elimination Action**:
  - Both `result` and any synthetic sum `aq10_sum` are **strictly purged** from the feature matrix prior to training and inference.
  - The model inputs only the individual items ($A_1 \dots A_{10}$) and 4 demographic features.

---

## 3. Known Scientific Limitations of this Dataset

1. **Small Sample Size ($N=79$)**:
   - The dataset contains 79 records (59 training, 20 untouched test split).
   - Point estimates are subject to small-sample variance, necessitating bootstrap confidence intervals and per-fold CV tracking.
2. **Deterministic Item Collinearity**:
   - As established in `ml/FEATURE_TARGET_ANALYSIS.md`, items $A_1$ and $A_{10}$ exhibit 100% sensitivity and specificity within this subset.
   - Real-world clinical autism is heterogeneous; no single questionnaire item has 100% predictive power in general clinical populations.
3. **Age Cohort Distribution Divergence**:
   - The ASD positive cases have a mean age of 23.08 years, while negative controls have a mean age of 49.03 years.
4. **Clinical Status**:
   - **NOT CLINICALLY VALIDATED**: This dataset supports proof-of-concept machine learning pipelines and explainable AI (SHAP) architecture development. It cannot be used to certify clinical diagnostic safety or efficacy.

---

## 4. Multi-Disorder Cohort Provenance

- **Location**: `ml/training/train_multi_disorder.py`
- **Cohort Type**: **Synthetic / Heuristic Developmental Cohort** ($N=800$)
- **Purpose**: Architectural prototype demonstrating multi-condition triage across 7 neurodevelopmental conditions (ASD, ADHD, Dyslexia, Social Anxiety, Speech Delay, Intellectual Disability, SPD).
- **Critical Notice**: All multi-disorder models are explicitly labeled as `is_synthetic_cohort: true` and `is_experimental: true`. Severe class imbalance is present for Intellectual Disability ($N=7$ positive cases, $0.88\%$ prevalence).
