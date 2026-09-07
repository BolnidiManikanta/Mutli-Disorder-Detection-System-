"""
Preprocessing Pipeline for NeuroScan AI ML Models.
Ensures identical feature transformations during training and real-time inference.
"""

import numpy as np

# Canonical feature names expected by the model (14 features: 10 questionnaire items + 4 demographics)
# Target-derived features (such as aq10_sum or result) are excluded to prevent target leakage.
AQ_FEATURES = [f"A{i}_Score" for i in range(1, 11)]

MODEL_FEATURE_NAMES = [
    'A1_Score', 'A2_Score', 'A3_Score', 'A4_Score', 'A5_Score',
    'A6_Score', 'A7_Score', 'A8_Score', 'A9_Score', 'A10_Score',
    'age', 'gender_num', 'jaundice_num', 'austim_num'
]

def parse_binary(val):
    """Safely converts various binary representations (yes/no, 1/0, True/False, 'm'/'f') into 0 or 1."""
    if val is None:
        return 0
    if isinstance(val, bool):
        return 1 if val else 0
    if isinstance(val, (int, float)):
        return 1 if val >= 1 else 0
    s = str(val).strip().lower()
    if s in ('1', 'true', 'yes', 'y', 'm', 'male', 'agree', 'definitely agree', 'slightly agree'):
        return 1
    return 0

def transform_sample(sample_dict):
    """
    Transforms a single input dictionary (from API request or dataset row)
    into a structured feature vector matching MODEL_FEATURE_NAMES.
    
    Accepts keys like:
      - A1..A10 or A1_Score..A10_Score
      - age
      - gender ('m'/'f' or 1/0)
      - jaundice ('yes'/'no' or True/False)
      - austim or family / family_history ('yes'/'no' or True/False)
    """
    features = {}

    # Extract AQ1..AQ10
    aq_scores = []
    for i in range(1, 11):
        key1 = f"A{i}"
        key2 = f"A{i}_Score"
        raw_val = sample_dict.get(key2, sample_dict.get(key1, 0))
        score = parse_binary(raw_val)
        features[f"A{i}_Score"] = score
        aq_scores.append(score)

    aq10_sum = sum(aq_scores)
    features['aq10_sum'] = aq10_sum

    # Age
    raw_age = sample_dict.get('age', 25)
    try:
        age_val = float(raw_age) if raw_age is not None else 25.0
    except (ValueError, TypeError):
        age_val = 25.0
    features['age'] = age_val
    features['age_young'] = 1 if age_val < 18 else 0

    # Gender (1 = male, 0 = female/other)
    raw_gender = sample_dict.get('gender', 'm')
    if str(raw_gender).strip().lower() in ('m', 'male', '1', 1):
        features['gender_num'] = 1
    else:
        features['gender_num'] = 0

    # Jaundice (1 = yes, 0 = no)
    features['jaundice_num'] = parse_binary(sample_dict.get('jaundice', 0))

    # Family history of ASD / austim (1 = yes, 0 = no)
    raw_family = sample_dict.get('austim', sample_dict.get('family', sample_dict.get('family_history', 0)))
    features['austim_num'] = parse_binary(raw_family)

    # Ordered feature vector
    vector = [features[col] for col in MODEL_FEATURE_NAMES]
    return np.array(vector, dtype=np.float32), features

def batch_transform(records_list):
    """Transforms a list of records into X (numpy array) and y (if targets present)."""
    X_list = []
    y_list = []
    for rec in records_list:
        vec, _ = transform_sample(rec)
        X_list.append(vec)
        # Check target
        if 'Class_ASD' in rec:
            y_list.append(int(rec['Class_ASD']))
        elif 'Class/ASD' in rec:
            y_list.append(1 if str(rec['Class/ASD']).strip().lower() in ('1', 'yes', 'true') else 0)
        elif 'target' in rec:
            y_list.append(int(rec['target']))

    X = np.array(X_list, dtype=np.float32)
    y = np.array(y_list, dtype=np.int32) if y_list else None
    return X, y, MODEL_FEATURE_NAMES
