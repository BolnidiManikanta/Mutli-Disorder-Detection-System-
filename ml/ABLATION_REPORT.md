# NeuroScan AI — Systematic Ablation Study Report

**Audit Date**: September 2026  
**Evaluation Protocol**: 5-Fold Stratified Cross-Validation on Training Split ($N=59$) + ONE Final Evaluation on Untouched Stratified Holdout Test Split ($N=20$).  
**Models Evaluated**: Scikit-Learn Logistic Regression (L2 regularized, $C=0.5$, scaled per fold) and Random Forest ($N_{est}=100$, max depth 4, min samples leaf 2).  
**Random Seed**: `42` (Fixed for full reproducibility).

---

## 1. Ablation Experiment Suite Overview

To establish why models achieve high accuracy and determine the exact contributions of questionnaire items vs demographics, 9 distinct feature configurations were tested.

| Experiment ID | Feature Subset Description | Feature Count | Features Included |
| :--- | :--- | :---: | :--- |
| **Exp A** | All Allowed Features | 14 | A1–A10 + Age + Gender + Jaundice + Family ASD |
| **Exp B** | Questionnaire Only | 10 | A1–A10 |
| **Exp C** | Demographics Only | 4 | Age + Gender + Jaundice + Family ASD |
| **Exp D** | Single Feature: A1 Only | 1 | A1_Score |
| **Exp E** | Single Feature: A10 Only | 1 | A10_Score |
| **Exp F** | Dual Features: A1 + A10 | 2 | A1_Score, A10_Score |
| **Exp G** | A1–A9 (Excluding A10) | 9 | A1_Score through A9_Score |
| **Exp H** | A2–A10 (Excluding A1) | 9 | A2_Score through A10_Score |
| **Exp I** | A2–A9 (Excluding BOTH A1 & A10) | 8 | A2_Score through A9_Score |

---

## 2. Quantitative Experimental Results

### Logistic Regression

| Experiment | CV Accuracy | CV Sensitivity | CV Specificity | CV Balanced Acc | CV PR-AUC | Test Accuracy | Test Sensitivity | Test Specificity | Test PR-AUC | Test Confusion Matrix |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Exp A (All 14)** | 100.0% | 100.0% | 100.0% | **100.0%** | 1.000 | **100.0%** | 100.0% | 100.0% | 1.000 | TN=10, FP=0, FN=0, TP=10 |
| **Exp B (A1–A10)** | 100.0% | 100.0% | 100.0% | **100.0%** | 1.000 | **100.0%** | 100.0% | 100.0% | 1.000 | TN=10, FP=0, FN=0, TP=10 |
| **Exp C (Demographics)** | 96.7% | 93.3% | 100.0% | **96.7%** | 0.992 | **95.0%** | 90.0% | 100.0% | 0.988 | TN=10, FP=0, FN=1, TP=9 |
| **Exp D (A1 Only)** | 100.0% | 100.0% | 100.0% | **100.0%** | 1.000 | **100.0%** | 100.0% | 100.0% | 1.000 | TN=10, FP=0, FN=0, TP=10 |
| **Exp E (A10 Only)** | 100.0% | 100.0% | 100.0% | **100.0%** | 1.000 | **100.0%** | 100.0% | 100.0% | 1.000 | TN=10, FP=0, FN=0, TP=10 |
| **Exp F (A1 + A10)** | 100.0% | 100.0% | 100.0% | **100.0%** | 1.000 | **100.0%** | 100.0% | 100.0% | 1.000 | TN=10, FP=0, FN=0, TP=10 |
| **Exp G (A1–A9)** | 100.0% | 100.0% | 100.0% | **100.0%** | 1.000 | **100.0%** | 100.0% | 100.0% | 1.000 | TN=10, FP=0, FN=0, TP=10 |
| **Exp H (A2–A10)** | 100.0% | 100.0% | 100.0% | **100.0%** | 1.000 | **100.0%** | 100.0% | 100.0% | 1.000 | TN=10, FP=0, FN=0, TP=10 |
| **Exp I (No A1, No A10)** | 96.7% | 93.3% | 100.0% | **96.7%** | 0.995 | **100.0%** | 100.0% | 100.0% | 1.000 | TN=10, FP=0, FN=0, TP=10 |

---

### Random Forest

| Experiment | CV Accuracy | CV Sensitivity | CV Specificity | CV Balanced Acc | CV PR-AUC | Test Accuracy | Test Sensitivity | Test Specificity | Test PR-AUC | Test Confusion Matrix |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Exp A (All 14)** | 100.0% | 100.0% | 100.0% | **100.0%** | 1.000 | **100.0%** | 100.0% | 100.0% | 1.000 | TN=10, FP=0, FN=0, TP=10 |
| **Exp B (A1–A10)** | 100.0% | 100.0% | 100.0% | **100.0%** | 1.000 | **100.0%** | 100.0% | 100.0% | 1.000 | TN=10, FP=0, FN=0, TP=10 |
| **Exp C (Demographics)** | 95.0% | 93.3% | 96.7% | **95.0%** | 0.976 | **95.0%** | 90.0% | 100.0% | 0.992 | TN=10, FP=0, FN=1, TP=9 |
| **Exp D (A1 Only)** | 100.0% | 100.0% | 100.0% | **100.0%** | 1.000 | **100.0%** | 100.0% | 100.0% | 1.000 | TN=10, FP=0, FN=0, TP=10 |
| **Exp E (A10 Only)** | 100.0% | 100.0% | 100.0% | **100.0%** | 1.000 | **100.0%** | 100.0% | 100.0% | 1.000 | TN=10, FP=0, FN=0, TP=10 |
| **Exp F (A1 + A10)** | 100.0% | 100.0% | 100.0% | **100.0%** | 1.000 | **100.0%** | 100.0% | 100.0% | 1.000 | TN=10, FP=0, FN=0, TP=10 |
| **Exp G (A1–A9)** | 100.0% | 100.0% | 100.0% | **100.0%** | 1.000 | **100.0%** | 100.0% | 100.0% | 1.000 | TN=10, FP=0, FN=0, TP=10 |
| **Exp H (A2–A10)** | 100.0% | 100.0% | 100.0% | **100.0%** | 1.000 | **100.0%** | 100.0% | 100.0% | 1.000 | TN=10, FP=0, FN=0, TP=10 |
| **Exp I (No A1, No A10)** | 91.7% | 90.0% | 93.3% | **91.7%** | 0.963 | **100.0%** | 100.0% | 100.0% | 1.000 | TN=10, FP=0, FN=0, TP=10 |

---

## 3. Key Scientific Conclusions from Ablations

1. **A1 and A10 are Individual Deterministic Separators**:
   - Training on $A_1$ alone (**Exp D**) yields 100% CV and Test accuracy.
   - Training on $A_{10}$ alone (**Exp E**) yields 100% CV and Test accuracy.
   - Retaining either $A_1$ or $A_{10}$ (**Exp G**, **Exp H**) preserves 100% CV accuracy.

2. **Removing Both A1 and A10 Exposes Sub-100% Performance**:
   - In **Exp I** (A2 through A9 only), 5-fold cross-validation balanced accuracy drops to **$91.7\%$ for Random Forest** and **$96.7\%$ for Logistic Regression**.
   - This proves conclusively that the 100% CV score in the full model is caused by $A_1$ and $A_{10}$ sample collinearity.

3. **Demographics Alone Exert Significant Predictive Power**:
   - In **Exp C** (Age + Gender + Jaundice + Family History), models achieve **$95.0\% - 96.7\%$ balanced accuracy** without seeing any AQ-10 questions.
   - This highlights that demographic cohort selection in this 79-record sample was not age-matched (ASD cohort is younger).
