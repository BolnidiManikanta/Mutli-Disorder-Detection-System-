"""
Multi-Disorder Experimental Prototype Training Pipeline
Trains per-condition classifiers (ASD, ADHD, Dyslexia, Social Anxiety,
Speech Delay, Intellectual Disability, SPD) on a simulated developmental heuristic cohort.

IMPORTANT SCIENTIFIC INTEGRITY NOTICE:
These models are EXPERIMENTAL RESEARCH PROTOTYPES developed for architectural demonstration.
They are NOT validated clinical models and MUST NOT be represented as real-world clinical benchmarks.
"""

import os
import sys
import json
import numpy as np
import joblib

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

DISORDER_DEFS = {
    'asd': {
        'name': 'Autism Spectrum Disorder',
        'icd': 'F84.0',
        'short': 'ASD',
        'core_questions': ['q_social_reciprocity', 'q_eye_contact', 'q_repetitive', 'q_special_interests', 'q_sensory_hyper', 'q_routine_rigidity'],
        'base_prevalence': 0.023
    },
    'adhd': {
        'name': 'Attention-Deficit / Hyperactivity Disorder',
        'icd': 'F90.9',
        'short': 'ADHD',
        'core_questions': ['q_sustained_attention', 'q_impulsivity', 'q_hyperactivity', 'q_organization', 'q_routine_rigidity'],
        'base_prevalence': 0.053
    },
    'dyslexia': {
        'name': 'Specific Learning Disorder (Reading/Dyslexia)',
        'icd': 'F81.0',
        'short': 'Dyslexia',
        'core_questions': ['q_reading_fluency', 'q_phonological', 'q_spelling', 'q_organization'],
        'base_prevalence': 0.070
    },
    'social_anxiety': {
        'name': 'Social Anxiety Disorder',
        'icd': 'F40.1',
        'short': 'Social Anxiety',
        'core_questions': ['q_peer_interaction', 'q_social_fear', 'q_eye_contact', 'q_social_reciprocity'],
        'base_prevalence': 0.065
    },
    'speech_delay': {
        'name': 'Developmental Speech & Language Disorder',
        'icd': 'F80.9',
        'short': 'Speech Delay',
        'core_questions': ['q_speech_onset', 'q_vocabulary', 'q_articulation', 'q_social_reciprocity'],
        'base_prevalence': 0.045
    },
    'intellectual_disability': {
        'name': 'Intellectual Developmental Disorder',
        'icd': 'F70-F79',
        'short': 'Intellectual',
        'core_questions': ['q_adaptive_functioning', 'q_abstract_reasoning', 'q_developmental_milestones', 'q_organization'],
        'base_prevalence': 0.012,
        'imbalance_warning': 'Severe class imbalance (~1% prevalence). Accuracy alone is deceptive.'
    },
    'spd': {
        'name': 'Sensory Processing Sensitivity / SPD',
        'icd': 'R20.8',
        'short': 'SPD',
        'core_questions': ['q_sensory_hyper', 'q_sensory_hypo', 'q_repetitive'],
        'base_prevalence': 0.050
    }
}

ALL_QUESTION_KEYS = [
    'q_social_reciprocity', 'q_eye_contact', 'q_repetitive', 'q_special_interests',
    'q_sensory_hyper', 'q_sensory_hypo', 'q_routine_rigidity', 'q_sustained_attention',
    'q_impulsivity', 'q_hyperactivity', 'q_organization', 'q_reading_fluency',
    'q_phonological', 'q_spelling', 'q_peer_interaction', 'q_social_fear',
    'q_speech_onset', 'q_vocabulary', 'q_articulation', 'q_adaptive_functioning',
    'q_abstract_reasoning', 'q_developmental_milestones'
]

def generate_heuristic_cohort(num_samples=1200, random_state=42):
    """
    Generates a simulated developmental cohort based on clinical feature covariances
    and DSM-5 symptom clusters for comprehensive multi-disorder classification.
    """
    rng = np.random.RandomState(random_state)
    X_samples = []
    y_dict = {d: [] for d in DISORDER_DEFS}

    for i in range(num_samples):
        # Determine archetype for this sample to ensure balanced multi-class representation
        archetype = rng.choice([
            'typical', 'asd', 'adhd', 'dyslexia', 'social_anxiety',
            'speech_delay', 'intellectual_disability', 'spd', 'comorbid'
        ], p=[0.24, 0.12, 0.12, 0.10, 0.10, 0.09, 0.06, 0.08, 0.09])

        # Base latent levels (typical is low across all)
        f_social = rng.beta(1.2, 5.0)
        f_executive = rng.beta(1.2, 5.0)
        f_language = rng.beta(1.2, 5.0)
        f_sensory = rng.beta(1.2, 5.0)

        if archetype == 'asd':
            f_social = rng.uniform(0.65, 0.98)
            f_sensory = rng.uniform(0.55, 0.95)
            if rng.rand() < 0.4: f_executive = rng.uniform(0.45, 0.85)
        elif archetype == 'adhd':
            f_executive = rng.uniform(0.68, 0.98)
            if rng.rand() < 0.35: f_sensory = rng.uniform(0.4, 0.7)
        elif archetype == 'dyslexia':
            f_language = rng.uniform(0.65, 0.98)
            if rng.rand() < 0.3: f_executive = rng.uniform(0.4, 0.75)
        elif archetype == 'social_anxiety':
            f_social = rng.uniform(0.58, 0.92)
        elif archetype == 'speech_delay':
            f_language = rng.uniform(0.65, 0.95)
        elif archetype == 'intellectual_disability':
            f_social = rng.uniform(0.6, 0.9)
            f_executive = rng.uniform(0.6, 0.9)
            f_language = rng.uniform(0.6, 0.9)
        elif archetype == 'spd':
            f_sensory = rng.uniform(0.68, 0.98)
        elif archetype == 'comorbid':
            # E.g. ASD + ADHD or Dyslexia + Speech Delay
            if rng.rand() < 0.5:
                f_social = rng.uniform(0.65, 0.95)
                f_executive = rng.uniform(0.65, 0.95)
                f_sensory = rng.uniform(0.5, 0.85)
            else:
                f_language = rng.uniform(0.65, 0.95)
                f_executive = rng.uniform(0.55, 0.85)

        row = []
        for q in ALL_QUESTION_KEYS:
            if 'social' in q or 'eye' in q or 'peer' in q:
                p = f_social
            elif 'attention' in q or 'impuls' in q or 'hyper' in q or 'organ' in q:
                p = f_executive
            elif 'speech' in q or 'vocab' in q or 'artic' in q or 'read' in q or 'phon' in q or 'spell' in q:
                p = f_language
            elif 'sensory' in q or 'repet' in q:
                p = f_sensory
            else:
                p = (f_social + f_executive + f_language) / 3.0

            p_noisy = np.clip(p + rng.normal(0, 0.08), 0.0, 1.0)
            score = float(round(p_noisy * 3.0, 1))
            row.append(score)

        age = rng.randint(2, 12) if archetype == 'speech_delay' else rng.randint(3, 50)
        gender = rng.choice([0, 1])
        jaundice = 1 if rng.rand() < 0.18 else 0
        family = 1 if (archetype != 'typical' and rng.rand() < 0.35) else 0

        features = row + [age, gender, jaundice, family]
        X_samples.append(features)

        # Ground truth diagnostic labels based on clinical thresholds
        y_dict['asd'].append(1 if (f_social >= 0.60 and f_sensory >= 0.45) or (f_social >= 0.75) else 0)
        y_dict['adhd'].append(1 if f_executive >= 0.60 else 0)
        y_dict['dyslexia'].append(1 if (f_language >= 0.60 and archetype in ('dyslexia', 'comorbid')) else 0)
        y_dict['social_anxiety'].append(1 if (f_social >= 0.55 and archetype in ('social_anxiety', 'asd')) else 0)
        y_dict['speech_delay'].append(1 if (f_language >= 0.58 and archetype in ('speech_delay', 'comorbid')) else 0)
        y_dict['intellectual_disability'].append(1 if (archetype == 'intellectual_disability' or (f_social >= 0.65 and f_executive >= 0.65 and f_language >= 0.65)) else 0)
        y_dict['spd'].append(1 if f_sensory >= 0.60 else 0)

    X = np.array(X_samples, dtype=np.float32)
    return X, y_dict

def train_multi_disorder_models():
    print("=" * 70)
    print("NeuroScan AI — Multi-Disorder Research Prototype Pipeline")
    print("=" * 70)

    from sklearn.model_selection import StratifiedKFold
    from sklearn.linear_model import LogisticRegression
    from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
    from sklearn.preprocessing import StandardScaler
    from sklearn.pipeline import Pipeline
    from sklearn.metrics import (
        accuracy_score, precision_score, recall_score, f1_score,
        roc_auc_score, average_precision_score, balanced_accuracy_score,
        confusion_matrix
    )

    artifacts_dir = os.path.join(os.path.dirname(__file__), '../artifacts')
    os.makedirs(artifacts_dir, exist_ok=True)

    X, y_dict = generate_heuristic_cohort(num_samples=1200, random_state=42)
    print(f"Generated heuristic prototype cohort: {X.shape[0]} profiles with {X.shape[1]} features.")

    trained_suite = {}
    metrics_suite = {
        'status': 'EXPERIMENTAL_RESEARCH_PROTOTYPE',
        'is_synthetic_cohort': True,
        'is_validated_clinical_model': False,
        'cohort_disclaimer': (
            'NOTICE: The 7-disorder screening models are experimental research prototypes trained on a synthetic '
            'clinical heuristic developmental cohort for architectural pipeline demonstration. '
            'They are NOT derived from external multi-center clinical cohorts. Do NOT cite as real-world clinical benchmarks.'
        ),
        'disorders': {}
    }

    for disorder_id, defs in DISORDER_DEFS.items():
        y = np.array(y_dict[disorder_id], dtype=np.int32)
        pos_count = int(np.sum(y == 1))
        neg_count = int(np.sum(y == 0))
        pos_rate = pos_count / len(y)

        print(f"\nTraining prototype suite for {defs['short']} ({defs['name']}):")
        print(f"  Cases: {pos_count} Positive ({pos_rate*100:.1f}%), {neg_count} Negative")

        is_severely_imbalanced = pos_count < 20

        # Classifiers with balanced class weights
        lr_pipe = Pipeline([
            ('scaler', StandardScaler()),
            ('clf', LogisticRegression(C=1.0, max_iter=500, class_weight='balanced', random_state=42))
        ])
        rf = RandomForestClassifier(n_estimators=100, max_depth=5, min_samples_split=4, class_weight='balanced', random_state=42)
        gb = GradientBoostingClassifier(n_estimators=80, learning_rate=0.08, max_depth=3, random_state=42)

        skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        cv_acc, cv_sens, cv_spec, cv_f1, cv_bal, cv_auc, cv_prauc = [], [], [], [], [], [], []

        for tr_idx, val_idx in skf.split(X, y):
            X_tr, X_val = X[tr_idx], X[val_idx]
            y_tr, y_val = y[tr_idx], y[val_idx]

            rf.fit(X_tr, y_tr)
            y_pred = rf.predict(X_val)
            y_prob = rf.predict_proba(X_val)[:, 1]

            tn, fp, fn, tp = confusion_matrix(y_val, y_pred, labels=[0, 1]).ravel()
            sens = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
            spec = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0

            cv_acc.append(accuracy_score(y_val, y_pred))
            cv_sens.append(sens)
            cv_spec.append(spec)
            cv_f1.append(f1_score(y_val, y_pred, zero_division=0))
            cv_bal.append(balanced_accuracy_score(y_val, y_pred))
            cv_auc.append(roc_auc_score(y_val, y_prob))
            cv_prauc.append(average_precision_score(y_val, y_prob))

        # Train on full dataset
        lr_pipe.fit(X, y)
        rf.fit(X, y)
        gb.fit(X, y)

        trained_suite[disorder_id] = {
            'lr': lr_pipe,
            'rf': rf,
            'gb': gb,
            'icd': defs['icd'],
            'short': defs['short'],
            'name': defs['name'],
            'is_severely_imbalanced': is_severely_imbalanced
        }

        mean_acc = float(np.mean(cv_acc))
        mean_sens = float(np.mean(cv_sens))
        mean_spec = float(np.mean(cv_spec))
        mean_f1 = float(np.mean(cv_f1))
        mean_bal = float(np.mean(cv_bal))
        mean_auc = float(np.mean(cv_auc))
        mean_prauc = float(np.mean(cv_prauc))

        status_tag = 'EXPERIMENTAL_PROTOTYPE'
        imbalance_note = None
        if is_severely_imbalanced:
            status_tag = 'UNUSABLE_SEVERE_CLASS_IMBALANCE'
            imbalance_note = f'Only {pos_count} positive cases in N={len(y)}. Standard accuracy ({mean_acc*100:.1f}%) is mathematically deceptive; model cannot reliably identify positive cases.'
            print(f"  ⚠️ ALERT: {imbalance_note}")

        metrics_suite['disorders'][disorder_id] = {
            'name': defs['name'],
            'short': defs['short'],
            'icd': defs['icd'],
            'status': status_tag,
            'is_synthetic_cohort': True,
            'is_validated': False,
            'positive_cases': pos_count,
            'negative_cases': neg_count,
            'prevalence_in_cohort': round(pos_rate, 4),
            'cv_metrics': {
                'accuracy': round(mean_acc, 4),
                'sensitivity': round(mean_sens, 4),
                'specificity': round(mean_spec, 4),
                'f1_score': round(mean_f1, 4),
                'balanced_accuracy': round(mean_bal, 4),
                'roc_auc': round(mean_auc, 4),
                'pr_auc': round(mean_prauc, 4)
            },
            'imbalance_warning': imbalance_note
        }

        print(f"  CV Balanced Acc: {mean_bal*100:.1f}% | Sens: {mean_sens*100:.1f}% | Spec: {mean_spec*100:.1f}% | PR-AUC: {mean_prauc:.3f}")

    # Save artifacts
    suite_file = os.path.join(artifacts_dir, 'multi_disorder_models.joblib')
    metrics_file = os.path.join(artifacts_dir, 'multi_disorder_metrics.json')

    joblib.dump(trained_suite, suite_file)
    with open(metrics_file, 'w', encoding='utf-8') as f:
        json.dump(metrics_suite, f, indent=2)

    print(f"\nMulti-disorder prototype suite saved to {suite_file}")
    return metrics_suite

if __name__ == '__main__':
    train_multi_disorder_models()
