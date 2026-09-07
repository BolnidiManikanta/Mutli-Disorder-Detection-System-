# NeuroScan AI — Formal Feature Classification & Provenance Audit

**Audit Date**: September 2026  
**Dataset**: Kaggle ML Olympiad - Autism Prediction (Curated Sample, N=79)  
**Dataset SHA-256**: `33900055da1817b0932e0887e3f3c4fcbae5c7999a58a3ed24495de7465288a4`  
**Model Governance Status**: `RESEARCH_PROTOTYPE` (Experimental)

---

## 1. Feature Classification Matrix

Every attribute in the raw dataset has been formally audited and categorized according to strict machine learning and clinical evaluation standards.

| Variable Name | Raw Type | Encoded Type | Formal Classification | Description & Rationale | Included in Model? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `A1_Score` | Binary (0/1) | Float (0.0/1.0) | **Allowed Predictor (Screening Item)** | AQ-10 Question 1 (Sensory sensitivity). Exhibits 100% sample separation in this curated subset. | **YES** |
| `A2_Score` | Binary (0/1) | Float (0.0/1.0) | **Allowed Predictor (Screening Item)** | AQ-10 Question 2 (Detail focus vs whole picture). | **YES** |
| `A3_Score` | Binary (0/1) | Float (0.0/1.0) | **Allowed Predictor (Screening Item)** | AQ-10 Question 3 (Attention switching & multitasking). | **YES** |
| `A4_Score` | Binary (0/1) | Float (0.0/1.0) | **Allowed Predictor (Screening Item)** | AQ-10 Question 4 (Task interruption recovery). | **YES** |
| `A5_Score` | Binary (0/1) | Float (0.0/1.0) | **Allowed Predictor (Screening Item)** | AQ-10 Question 5 (Social subtleties / reading between lines). | **YES** |
| `A6_Score` | Binary (0/1) | Float (0.0/1.0) | **Allowed Predictor (Screening Item)** | AQ-10 Question 6 (Listener boredom detection). | **YES** |
| `A7_Score` | Binary (0/1) | Float (0.0/1.0) | **Allowed Predictor (Screening Item)** | AQ-10 Question 7 (Theory of mind / intention attribution). Strong separation. | **YES** |
| `A8_Score` | Binary (0/1) | Float (0.0/1.0) | **Allowed Predictor (Screening Item)** | AQ-10 Question 8 (Categorization & catalog information interest). | **YES** |
| `A9_Score` | Binary (0/1) | Float (0.0/1.0) | **Allowed Predictor (Screening Item)** | AQ-10 Question 9 (Facial expression & emotion recognition). | **YES** |
| `A10_Score` | Binary (0/1) | Float (0.0/1.0) | **Allowed Predictor (Screening Item)** | AQ-10 Question 10 (Social intention decoding). Exhibits 100% sample separation in this curated subset. | **YES** |
| `age` | Numeric | Float (years) | **Demographic / Confounder** | Chronological age. Positive cases are significantly younger (mean 23.1) than negative controls (mean 49.0). | **YES** |
| `gender` | Categorical (`m`/`f`) | Binary `gender_num` (1/0) | **Demographic / Confounder** | Biological sex indicator (Male=1, Female=0). | **YES** |
| `jaundice` | Categorical (`yes`/`no`) | Binary `jaundice_num` (1/0) | **Demographic / Medical History** | Neonatal jaundice history. In this subset, present in 30.8% of ASD cases, 0% of controls. | **YES** |
| `austim` | Categorical (`yes`/`no`) | Binary `austim_num` (1/0) | **Demographic / Family History** | Family history of ASD. In this subset, present in 35.9% of ASD cases, 0% of controls. | **YES** |
| `ethnicity` | Categorical | N/A | **Demographic / Potential Bias** | Ethnic background. Excluded to avoid demographic bias and sparse categorical instability. | **NO (Excluded)** |
| `country` | Categorical | N/A | **Administrative Metadata / Confounder** | Country of test administration. Excluded to avoid geographical overfitting. | **NO (Excluded)** |
| `used_app_before`| Categorical (`yes`/`no`) | N/A | **Administrative Metadata** | Previous screening software usage. Excluded. | **NO (Excluded)** |
| `relation` | Categorical | N/A | **Administrative Metadata** | Relationship of test-filler (Self, Parent, etc.). Excluded. | **NO (Excluded)** |
| `result` | Integer (0-10) | N/A | **TARGET_DERIVED (STRICT LEAKAGE)** | Sum of positive AQ-10 items. Directly determines Class_ASD. **PURGED from all model inputs.** | **STRICTLY PURGED** |
| `aq10_sum` | Integer (0-10) | N/A | **TARGET_DERIVED (STRICT LEAKAGE)** | Engineered cumulative sum of A1..A10. **PURGED from all model inputs.** | **STRICTLY PURGED** |
| `Class_ASD` | Binary (0/1) | Integer (0/1) | **TARGET VARIABLE** | Ground-truth screening outcome (1=ASD Screening Positive, 0=Negative). | **TARGET ONLY** |

---

## 2. Target Derivation & Independence Finding

1. **Target Derivation Mechanism**:
   - `Class_ASD` is derived deterministically from the AQ-10 screening threshold rule ($\sum A_i \ge \text{threshold}$).
   - In this 79-record curated cohort, $A_1 = 1$ and $A_{10} = 1$ in 100% of positive records ($39/39$) and $0\%$ of negative records ($0/40$).
2. **Scientific Classification**:
   - The model is formally classified as **`QUESTIONNAIRE-SCORE REPLICATION / SCREENING SCORE PREDICTION`**.
   - It is **NOT** an independently validated clinical diagnostic tool.
   - It functions as an automated screening score replication and explainability engine for educational and research exploration.

---

## 3. Data Flow & Leakage-Free Preprocessing

```
[Raw Patient Input]
        │
        ▼
[Strict Preprocessing Pipeline] ──► Extracts strictly the 14 allowed features
        │                          (A1..A10, age, gender_num, jaundice_num, austim_num)
        │                          Purges: aq10_sum, result, Class_ASD, metadata
        ▼
[StandardScaler in Pipeline]  ──► Fit exclusively within training folds (no data snooping)
        │
        ▼
[Calibrated Ensemble Models]  ──► Random Forest, Gradient Boosting, Logistic Regression
        │
        ▼
[Authentic SHAP TreeExplainer] ──► Exact additive tree attributions for Random Forest
```
