# NeuroScan AI — Feature-Target Separation & Statistical Audit

**Audit Date**: September 2026  
**Cohort Size**: N = 79 (Positive ASD: 39, Negative Controls: 40)  
**Dataset SHA-256**: `33900055da1817b0932e0887e3f3c4fcbae5c7999a58a3ed24495de7465288a4`  

---

## 1. Executive Summary & Core Statistical Findings

This audit explains precisely **why** standard machine learning classifiers achieve 100% cross-validation and test accuracy on this 79-record curated dataset:

1. **Individual Perfect Separators ($A_1$ and $A_{10}$)**:
   - `A1_Score` (sensory sensitivity) is $1.0$ in 100% of positive cases ($39/39$) and $0.0$ in 100% of controls ($0/40$). Point-biserial correlation $r_{pb} = 1.000$, $\chi^2 = 75.05$ ($p < 10^{-17}$).
   - `A10_Score` (social intention decoding) is $1.0$ in 100% of positive cases ($39/39$) and $0.0$ in 100% of controls ($0/40$). Point-biserial correlation $r_{pb} = 1.000$, $\chi^2 = 75.05$ ($p < 10^{-17}$).
   - Either of these two features alone provides 100% linear separability.

2. **Strong Secondary Separators ($A_7$, $A_8$, $A_6$)**:
   - `A7_Score` (theory of mind): Present in $92.3\%$ of ASD cases vs $10.0\%$ of controls. Adjusted Odds Ratio = $84.59$, $r_{pb} = 0.8231$, $\chi^2 = 50.28$ ($p < 10^{-11}$).
   - `A8_Score` (catalog information): Present in $76.9\%$ of ASD cases vs $15.0\%$ of controls. Adjusted Odds Ratio = $17.04$, $r_{pb} = 0.6216$, $\chi^2 = 28.08$ ($p < 10^{-6}$).
   - `A6_Score` (listener boredom): Present in $10.3\%$ of ASD cases vs $60.0\%$ of controls ($r_{pb} = -0.5199$).

3. **Demographic Confounding in the Curated Sample**:
   - `age`: Positive cases are significantly younger (mean $23.08 \pm 7.65$ years) compared to negative controls (mean $49.03 \pm 11.10$ years) ($r_{pb} = -0.8087, p < 10^{-18}$).
   - `jaundice_num`: 12 out of 39 positive cases ($30.8\%$) report neonatal jaundice, compared to 0 out of 40 controls ($0.0\%$).
   - `austim_num`: 14 out of 39 positive cases ($35.9\%$) report family history of ASD, compared to 0 out of 40 controls ($0.0\%$).

---

## 2. Comprehensive Statistical Summary Table

| Feature Name | Mean (Pos) | Mean (Neg) | Std (Pos) | Std (Neg) | Median (Pos) | Median (Neg) | Point-Biserial $r$ | $p$-value | Mutual Info | Perfect Separator? |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`A1_Score`** | **1.0000** | **0.0000** | 0.0000 | 0.0000 | 1.0 | 0.0 | **+1.0000** | $< 10^{-20}$ | 0.6994 | **YES (100%)** |
| `A2_Score` | 0.5641 | 0.4500 | 0.5024 | 0.5038 | 1.0 | 0.0 | +0.1141 | 0.3167 | 0.0000 | NO |
| `A3_Score` | 0.6410 | 0.4250 | 0.4860 | 0.5006 | 1.0 | 0.0 | +0.2164 | 0.0554 | 0.0000 | NO |
| `A4_Score` | 0.4103 | 0.6000 | 0.4983 | 0.4961 | 0.0 | 1.0 | -0.1897 | 0.0940 | 0.0708 | NO |
| `A5_Score` | 0.7692 | 0.4000 | 0.4268 | 0.4961 | 1.0 | 0.0 | +0.3743 | 0.0007 | 0.0812 | NO |
| `A6_Score` | 0.1026 | 0.6000 | 0.3074 | 0.4961 | 0.0 | 1.0 | -0.5199 | $9.08 \times 10^{-7}$ | 0.1560 | NO |
| **`A7_Score`** | **0.9231** | **0.1000** | 0.2700 | 0.3038 | 1.0 | 0.0 | **+0.8231** | $1.32 \times 10^{-20}$ | 0.3884 | NO (91.1% sep) |
| **`A8_Score`** | **0.7692** | **0.1500** | 0.4268 | 0.3616 | 1.0 | 0.0 | **+0.6216** | $9.74 \times 10^{-10}$ | 0.2122 | NO |
| `A9_Score` | 0.4103 | 0.5000 | 0.4983 | 0.5064 | 0.0 | 0.5 | -0.0901 | 0.4298 | 0.0000 | NO |
| **`A10_Score`**| **1.0000** | **0.0000** | 0.0000 | 0.0000 | 1.0 | 0.0 | **+1.0000** | $< 10^{-20}$ | 0.6994 | **YES (100%)** |
| `age` | 23.0769 | 49.0250 | 7.6550 | 11.1044 | 24.0 | 48.5 | -0.8087 | $2.01 \times 10^{-19}$ | 0.5054 | NO |
| `gender_num` | 0.7436 | 0.4750 | 0.4424 | 0.5057 | 1.0 | 0.0 | +0.2750 | 0.0142 | 0.0000 | NO |
| `jaundice_num`| 0.3077 | 0.0000 | 0.4676 | 0.0000 | 0.0 | 0.0 | +0.4286 | $8.12 \times 10^{-5}$ | 0.0649 | NO |
| `austim_num` | 0.3590 | 0.0000 | 0.4860 | 0.0000 | 0.0 | 0.0 | +0.4700 | $1.24 \times 10^{-5}$ | 0.1462 | NO |

---

## 3. Contingency Analysis for AQ-10 Questionnaire Items

| Item | True Neg (0, 0) | False Pos (1, 0) | False Neg (0, 1) | True Pos (1, 1) | Adjusted Odds Ratio | $\chi^2$ Statistic | $p$-value |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **A1** | 40 | 0 | 0 | 39 | **6399.0** | 75.05 | $< 10^{-17}$ |
| A2 | 22 | 18 | 17 | 22 | 1.56 | 0.62 | 0.4300 |
| A3 | 23 | 17 | 14 | 25 | 2.36 | 2.88 | 0.0895 |
| A4 | 16 | 24 | 23 | 16 | 0.47 | 2.14 | 0.1439 |
| A5 | 24 | 16 | 9 | 30 | 4.77 | 9.60 | 0.0019 |
| A6 | 16 | 24 | 35 | 4 | 0.09 | 19.24 | $< 0.0001$ |
| **A7** | 36 | 4 | 3 | 36 | **84.59** | 50.28 | $< 10^{-11}$ |
| **A8** | 34 | 6 | 9 | 30 | **17.04** | 28.08 | $< 10^{-6}$ |
| A9 | 20 | 20 | 23 | 16 | 0.70 | 0.33 | 0.5654 |
| **A10** | 40 | 0 | 0 | 39 | **6399.0** | 75.05 | $< 10^{-17}$ |

---

## 4. Conclusion

The 100% classification metrics are an authentic mathematical reflection of this specific 79-record curated sample's feature distributions (specifically $A_1$ and $A_{10}$), not a sign of data tampering or evaluation leakage. However, because real-world clinical ASD presentations are heterogeneous and do not adhere to 100% separation on any single question, **this model must strictly be labelled and treated as an experimental research prototype.**
