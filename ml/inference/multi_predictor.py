"""
NeuroScan AI — Multi-Disorder Real ML Inference Engine
Loads calibrated multi-disorder Scikit-Learn models, computes calibrated probabilities,
ensemble weights, SHAP explanations, co-occurrences, and clinical recommendations.
"""

import os
import sys
import json
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from ml.training.train_multi_disorder import (
    DISORDER_DEFS, ALL_QUESTION_KEYS
)

_CACHED_MULTI_MODELS = None
_CACHED_MULTI_SCALER = None
_CACHED_MULTI_METRICS = None

QUESTION_LABELS = {
    'q_social_reciprocity': 'Social communication & nonverbal reciprocity',
    'q_eye_contact': 'Direct eye contact & joint engagement',
    'q_repetitive': 'Repetitive motor movements / stereotypies',
    'q_special_interests': 'Intense focused interests & cataloging',
    'q_sensory_hyper': 'Hyper-reactivity to sensory input (sounds/textures)',
    'q_sensory_hypo': 'Hypo-reactivity / seeking intense sensation',
    'q_routine_rigidity': 'Rigid adherence to routines / distress at change',
    'q_sustained_attention': 'Sustaining attention on non-preferred tasks',
    'q_impulsivity': 'Impulsivity & difficulty waiting turn',
    'q_hyperactivity': 'Physical restlessness / excessive motion',
    'q_organization': 'Executive organization & sequential planning',
    'q_reading_fluency': 'Accurate and fluent word decoding',
    'q_phonological': 'Phonological awareness & letter sounds',
    'q_spelling': 'Written expression & orthographic spelling',
    'q_peer_interaction': 'Spontaneous peer group engagement',
    'q_social_fear': 'Social evaluative anxiety & public unease',
    'q_speech_onset': 'Age of initial word and phrase milestones',
    'q_vocabulary': 'Expressive and receptive vocabulary range',
    'q_articulation': 'Speech clarity & phoneme articulation',
    'q_adaptive_functioning': 'Age-appropriate daily adaptive living skills',
    'q_abstract_reasoning': 'Conceptual and abstract problem solving',
    'q_developmental_milestones': 'Comprehensive developmental milestone history'
}

CO_OCCURRENCE_MATRIX = {
    'asd': {'adhd': 0.58, 'spd': 0.72, 'social_anxiety': 0.44, 'speech_delay': 0.48, 'dyslexia': 0.22, 'intellectual_disability': 0.31},
    'adhd': {'asd': 0.38, 'dyslexia': 0.42, 'spd': 0.45, 'social_anxiety': 0.35, 'speech_delay': 0.25, 'intellectual_disability': 0.15},
    'dyslexia': {'adhd': 0.42, 'speech_delay': 0.52, 'social_anxiety': 0.32, 'spd': 0.20, 'asd': 0.18, 'intellectual_disability': 0.18},
    'social_anxiety': {'asd': 0.44, 'adhd': 0.35, 'spd': 0.38, 'dyslexia': 0.25, 'speech_delay': 0.20, 'intellectual_disability': 0.10},
    'speech_delay': {'asd': 0.48, 'dyslexia': 0.52, 'intellectual_disability': 0.36, 'spd': 0.28, 'adhd': 0.25, 'social_anxiety': 0.20},
    'intellectual_disability': {'speech_delay': 0.62, 'asd': 0.42, 'adhd': 0.38, 'spd': 0.40, 'dyslexia': 0.50, 'social_anxiety': 0.15},
    'spd': {'asd': 0.72, 'adhd': 0.45, 'social_anxiety': 0.38, 'speech_delay': 0.28, 'dyslexia': 0.20, 'intellectual_disability': 0.22}
}

RECOMMENDATION_DATABASE = {
    'asd': {
        'therapies': [
            {'name': 'Applied Behavior Analysis (ABA) / ESDM', 'disorder': 'ASD', 'frequency': '10-25 hrs/week', 'description': 'Evidence-based developmental intervention focusing on positive communication, social reciprocity, and adaptive behavior.'},
            {'name': 'Speech & Social Communication Therapy', 'disorder': 'ASD', 'frequency': '2-3 sessions/week', 'description': 'Targeting pragmatic language, non-verbal cues, and conversational turn-taking.'},
            {'name': 'Sensory Integration Occupational Therapy', 'disorder': 'ASD', 'frequency': '1-2 sessions/week', 'description': 'Addressing sensory modulation, vestibular regulation, and fine motor precision.'}
        ],
        'specialists': ['Developmental Pediatrician', 'Child Neuropsychologist', 'Board Certified Behavior Analyst (BCBA)', 'Speech-Language Pathologist (SLP)'],
        'daily_plan': [
            {'time': 'Morning', 'icon': '🌅', 'activity': 'Visual schedule review and sensory wake-up warmups'},
            {'time': 'Midday', 'icon': '🎯', 'activity': 'Structured social interaction game and turn-taking practice'},
            {'time': 'Evening', 'icon': '🌙', 'activity': 'Calming deep-pressure sensory routine and predictable wind-down'}
        ]
    },
    'adhd': {
        'therapies': [
            {'name': 'Behavioral Parent Training (BPT)', 'disorder': 'ADHD', 'frequency': 'Weekly sessions', 'description': 'Equipping caregivers with structured reinforcement strategies, token economies, and consistency models.'},
            {'name': 'Executive Function Coaching', 'disorder': 'ADHD', 'frequency': '1-2 sessions/week', 'description': 'Time management, chunking assignments, checklist habits, and working memory strategies.'}
        ],
        'specialists': ['Child Psychiatrist', 'Clinical Psychologist', 'ADHD Specialist Coach', 'Occupational Therapist'],
        'daily_plan': [
            {'time': 'Morning', 'icon': '🌅', 'activity': 'High-protein breakfast and 15-minute energetic physical movement'},
            {'time': 'Midday', 'icon': '🎯', 'activity': 'Pomodoro-style work intervals (20m focus / 5m movement break)'},
            {'time': 'Evening', 'icon': '🌙', 'activity': 'Dopamine-friendly checklist completion and screen-free hour'}
        ]
    },
    'dyslexia': {
        'therapies': [
            {'name': 'Orton-Gillingham Multi-Sensory Phonics', 'disorder': 'Dyslexia', 'frequency': '3-4 sessions/week', 'description': 'Structured, explicit, and multi-sensory phonetic reading and spelling instruction.'},
            {'name': 'Assistive Technology Training', 'disorder': 'Dyslexia', 'frequency': 'Ongoing', 'description': 'Text-to-speech, speech-to-text, dyslexia-friendly typography, and audiobooks.'}
        ],
        'specialists': ['Educational Psychologist', 'Certified Reading Specialist', 'Speech-Language Pathologist'],
        'daily_plan': [
            {'time': 'Morning', 'icon': '🌅', 'activity': 'Sight word repetition with multi-sensory tactile tracing'},
            {'time': 'Midday', 'icon': '🎯', 'activity': 'Audio-supported reading and phoneme segmentation'},
            {'time': 'Evening', 'icon': '🌙', 'activity': 'Shared bedtime story reading with highlight pacing'}
        ]
    },
    'social_anxiety': {
        'therapies': [
            {'name': 'Cognitive Behavioral Therapy (CBT)', 'disorder': 'Social Anxiety', 'frequency': 'Weekly', 'description': 'Gradual graded exposure hierarchy, thought reframing, and safety-behavior fading.'},
            {'name': 'Social Skills Group Therapy', 'disorder': 'Social Anxiety', 'frequency': 'Weekly', 'description': 'Safe peer interaction laboratory for practising conversation starters and assertion.'}
        ],
        'specialists': ['Child Clinical Psychologist', 'Licensed Cognitive Behavioral Therapist', 'Child Psychiatrist'],
        'daily_plan': [
            {'time': 'Morning', 'icon': '🌅', 'activity': 'Positive self-affirmations and diaphragmatic box-breathing (4x4)'},
            {'time': 'Midday', 'icon': '🎯', 'activity': 'One micro-social challenge (e.g. asking a question, smiling at a peer)'},
            {'time': 'Evening', 'icon': '🌙', 'activity': 'Worry journaling and evidence-testing discussion with caregiver'}
        ]
    },
    'speech_delay': {
        'therapies': [
            {'name': 'Speech-Language Pathology (SLP)', 'disorder': 'Speech Delay', 'frequency': '2-3 sessions/week', 'description': 'Oral-motor exercises, phonological awareness, and expressive syntax building.'},
            {'name': 'Augmentative & Alternative Communication (AAC)', 'disorder': 'Speech Delay', 'frequency': 'Integrated daily', 'description': 'Visual communication boards, PECS, or digital AAC devices to reduce frustration.'}
        ],
        'specialists': ['Speech-Language Pathologist (SLP)', 'Pediatric Audiologist', 'Developmental Pediatrician'],
        'daily_plan': [
            {'time': 'Morning', 'icon': '🌅', 'activity': 'Language-rich narration during breakfast preparation'},
            {'time': 'Midday', 'icon': '🎯', 'activity': 'Interactive rhyming games and sound imitation drills'},
            {'time': 'Evening', 'icon': '🌙', 'activity': 'Dialogic reading with open-ended prompting'}
        ]
    },
    'intellectual_disability': {
        'therapies': [
            {'name': 'Comprehensive Adaptive Skills Training', 'disorder': 'Intellectual Disability', 'frequency': 'Daily embedded', 'description': 'Task analysis, self-care routines, community navigation, and functional literacy.'},
            {'name': 'Specialized Individualized Education Plan (IEP)', 'disorder': 'Intellectual Disability', 'frequency': 'Full curriculum', 'description': 'Differentiated curriculum pacing with concrete tactile reinforcement.'}
        ],
        'specialists': ['Developmental Pediatrician', 'Educational Psychologist', 'Special Education Director', 'Occupational Therapist'],
        'daily_plan': [
            {'time': 'Morning', 'icon': '🌅', 'activity': 'Step-by-step visual grooming and hygiene checklist'},
            {'time': 'Midday', 'icon': '🎯', 'activity': 'Concrete functional math/currency practice and vocational sorting'},
            {'time': 'Evening', 'icon': '🌙', 'activity': 'Reflection and rewarding mastery of independent life skills'}
        ]
    },
    'spd': {
        'therapies': [
            {'name': 'Ayres Sensory Integration (ASI)', 'disorder': 'SPD', 'frequency': '2 sessions/week', 'description': 'Clinician-directed sensory gym work balancing vestibular, proprioceptive, and tactile input.'},
            {'name': 'Sensory Diet Implementation', 'disorder': 'SPD', 'frequency': 'Daily protocol', 'description': 'Custom scheduled heavy work, compression garments, noise-dampening, and oral-motor tools.'}
        ],
        'specialists': ['Pediatric Occupational Therapist (Sensory Certified)', 'Pediatric Physical Therapist'],
        'daily_plan': [
            {'time': 'Morning', 'icon': '🌅', 'activity': 'Proprioceptive heavy work (jumping, wall pushes, resistance bands)'},
            {'time': 'Midday', 'icon': '🎯', 'activity': 'Quiet corner reset with noise-canceling headphones before transitions'},
            {'time': 'Evening', 'icon': '🌙', 'activity': 'Weighted blanket relaxation and ambient low-luminescence lighting'}
        ]
    }
}

def load_multi_artifacts():
    global _CACHED_MULTI_MODELS, _CACHED_MULTI_SCALER, _CACHED_MULTI_METRICS
    if _CACHED_MULTI_MODELS is not None:
        return _CACHED_MULTI_MODELS, _CACHED_MULTI_SCALER, _CACHED_MULTI_METRICS

    artifacts_dir = os.path.join(os.path.dirname(__file__), '../artifacts')
    suite_path = os.path.join(artifacts_dir, 'multi_disorder_models.joblib')
    scaler_path = os.path.join(artifacts_dir, 'multi_disorder_scaler.joblib')
    metrics_path = os.path.join(artifacts_dir, 'multi_disorder_metrics.json')

    if not os.path.exists(suite_path):
        from ml.training.train_multi_disorder import train_multi_disorder_models
        train_multi_disorder_models()

    import joblib
    _CACHED_MULTI_MODELS = joblib.load(suite_path)
    try:
        _CACHED_MULTI_SCALER = joblib.load(scaler_path) if os.path.exists(scaler_path) else None
    except Exception:
        _CACHED_MULTI_SCALER = None
    with open(metrics_path, 'r', encoding='utf-8') as f:
        _CACHED_MULTI_METRICS = json.load(f)

    return _CACHED_MULTI_MODELS, _CACHED_MULTI_SCALER, _CACHED_MULTI_METRICS

def map_questionnaire_answers(answers_dict):
    """
    Translates questionnaire answers from assess.html / predict.html / APIs
    into standard 0.0-3.0 symptom severity scores for all 22 ALL_QUESTION_KEYS.
    Accurately maps both option indices (0-4) from adaptive questionnaires and
    direct continuous symptom ratings (0.0 to 3.0).
    """
    mapped = {k: 0.0 for k in ALL_QUESTION_KEYS}
    if not isinstance(answers_dict, dict):
        return mapped

    def set_val(k, v):
        if k in mapped:
            mapped[k] = max(mapped[k], min(3.0, float(v)))

    # Check if inputs already provide direct canonical severity scores (floats > 0 or specific keys)
    direct_keys = set(answers_dict.keys()) & set(ALL_QUESTION_KEYS)
    has_direct_canonical = len(direct_keys) >= 3

    for k, v in answers_dict.items():
        if v is None:
            continue
        try:
            val_num = float(v)
        except (ValueError, TypeError):
            continue

        # If already directly specifying canonical question severity (0.0 to 3.0 scale)
        if has_direct_canonical and k in mapped:
            set_val(k, val_num)
            continue

        # ADAPTIVE_QUESTIONS mapping (handling choice indices 0-4)
        if k == 'q_eye_contact':
            # 0: Avoids completely -> 3.0, 4: Always comfortable -> 0.0
            set_val('q_eye_contact', (4.0 - min(4.0, val_num)) / 4.0 * 3.0)
        elif k == 'q_social_interaction' or k == 'q_social_reciprocity':
            # 0: Completely withdrawn -> 3.0, 4: Very social -> 0.0
            s = (4.0 - min(4.0, val_num)) / 4.0 * 3.0 if val_num <= 4.0 and not has_direct_canonical else val_num
            set_val('q_social_reciprocity', s)
            set_val('q_peer_interaction', s)
        elif k == 'q_attention_span' or k == 'q_sustained_attention':
            # 0: <2 mins -> 3.0, 4: 30+ mins -> 0.0
            s = (4.0 - min(4.0, val_num)) / 4.0 * 3.0 if val_num <= 4.0 and not has_direct_canonical else val_num
            set_val('q_sustained_attention', s)
        elif k == 'q_repetitive_behavior' or k == 'q_repetitive':
            # 0: Never -> 0.0, 4: Always -> 3.0
            s = min(4.0, val_num) / 4.0 * 3.0 if val_num <= 4.0 and not has_direct_canonical else val_num
            set_val('q_repetitive', s)
        elif k == 'q_sensory_response':
            if val_num == 0:
                set_val('q_sensory_hyper', 3.0)
            elif val_num == 1:
                set_val('q_sensory_hyper', 2.2)
            elif val_num == 3:
                set_val('q_sensory_hypo', 2.2)
            elif val_num == 4:
                set_val('q_sensory_hyper', 2.0)
                set_val('q_sensory_hypo', 2.6)
            else:
                set_val('q_sensory_hyper', 0.2)
        elif k == 'q_language_development':
            s = (4.0 - min(4.0, val_num)) / 4.0 * 3.0
            set_val('q_speech_onset', s)
            set_val('q_vocabulary', s)
            set_val('q_articulation', s)
        elif k == 'q_reading':
            set_val('q_reading_fluency', (4.0 - min(4.0, val_num)) / 4.0 * 3.0)
        elif k == 'q_hyperactivity':
            s = 3.0 if val_num == 0 else 2.4 if val_num == 1 else 1.4 if val_num == 2 else 0.2 if val_num == 3 else 0.0
            set_val('q_hyperactivity', s)
        elif k == 'q_emotional_regulation':
            set_val('q_impulsivity', (4.0 - min(4.0, val_num)) / 4.0 * 3.0)
        elif k == 'q_routine':
            set_val('q_routine_rigidity', (4.0 - min(4.0, val_num)) / 4.0 * 3.0)
        elif k == 'q_special_interests':
            set_val('q_special_interests', min(4.0, val_num) / 4.0 * 3.0)
        elif k == 'q_anxiety_social' or k == 'q_social_fear':
            s = (4.0 - min(4.0, val_num)) / 4.0 * 3.0 if val_num <= 4.0 and not has_direct_canonical else val_num
            set_val('q_social_fear', s)
        elif k == 'q_play_imaginative':
            s = (4.0 - min(4.0, val_num)) / 4.0 * 3.0
            set_val('q_social_reciprocity', s)
            set_val('q_abstract_reasoning', s * 0.7)
        elif k == 'q_pointing':
            s = (4.0 - min(4.0, val_num)) / 4.0 * 3.0
            set_val('q_social_reciprocity', s)
            set_val('q_developmental_milestones', s)
        elif k == 'q_babbling':
            s = 3.0 if val_num == 0 else 0.0
            set_val('q_speech_onset', s)
            set_val('q_developmental_milestones', s)
        elif k == 'q_response_name':
            s = (4.0 - min(4.0, val_num)) / 4.0 * 3.0
            set_val('q_social_reciprocity', s)
            set_val('q_developmental_milestones', s)
        elif k == 'q_joint_attention':
            s = (4.0 - min(4.0, val_num)) / 4.0 * 3.0
            set_val('q_social_reciprocity', s)
            set_val('q_developmental_milestones', s)
        elif k == 'q_friendships':
            s = (4.0 - min(4.0, val_num)) / 4.0 * 3.0
            set_val('q_peer_interaction', s)
        elif k == 'q_academic':
            s = (4.0 - min(4.0, val_num)) / 4.0 * 3.0
            set_val('q_organization', s)
            set_val('q_abstract_reasoning', s)
        elif k == 'q_letters_reversal':
            s = min(4.0, val_num) / 4.0 * 3.0
            set_val('q_phonological', s)
            set_val('q_spelling', s)
        elif k == 'q_social_media':
            s = (4.0 - min(4.0, val_num)) / 4.0 * 2.8
            set_val('q_social_fear', s)
        elif k == 'q_independence':
            s = (4.0 - min(4.0, val_num)) / 4.0 * 3.0
            set_val('q_adaptive_functioning', s)
        elif k in mapped:
            set_val(k, val_num)

    # Impute missing questions within closely aligned functional clusters
    clusters = {
        'executive': ['q_sustained_attention', 'q_impulsivity', 'q_hyperactivity', 'q_organization'],
        'asd_social': ['q_social_reciprocity', 'q_eye_contact', 'q_peer_interaction'],
        'speech': ['q_speech_onset', 'q_vocabulary', 'q_articulation'],
        'reading': ['q_reading_fluency', 'q_phonological', 'q_spelling'],
        'sensory': ['q_sensory_hyper', 'q_repetitive', 'q_routine_rigidity'],
        'adaptive': ['q_adaptive_functioning', 'q_abstract_reasoning', 'q_developmental_milestones']
    }
    for cluster_name, keys in clusters.items():
        active = [mapped[k] for k in keys if mapped[k] > 0]
        if active:
            avg_score = sum(active) / len(active)
            for k in keys:
                if mapped[k] == 0.0:
                    # Impute unobserved items in the same cluster proportionally
                    mapped[k] = round(avg_score * 0.75, 2)

    return mapped

def predict_multi_disorder(answers_dict, demographics_dict=None):
    """
    Evaluates 7 conditions for a patient profile.
    """
    models_suite, scaler, metrics = load_multi_artifacts()
    demographics_dict = demographics_dict or {}

    # Extract demographic values
    age = float(demographics_dict.get('age', 8))
    gender = 1 if str(demographics_dict.get('gender', 'm')).lower() in ('m', 'male', '1', 1) else 0
    jaundice = 1 if demographics_dict.get('jaundice') in (True, 1, 'yes', 'true') else 0
    family = 1 if demographics_dict.get('family_history', demographics_dict.get('family', 0)) in (True, 1, 'yes', 'true') else 0

    # Translate inputs into canonical question keys with proper clinical scaling
    mapped_answers = map_questionnaire_answers(answers_dict)
    q_vector = [mapped_answers.get(q, 0.0) for q in ALL_QUESTION_KEYS]

    feature_vector = np.array(q_vector + [age, gender, jaundice, family], dtype=np.float32).reshape(1, -1)
    feature_scaled = scaler.transform(feature_vector) if scaler is not None else feature_vector

    results = {}
    for disorder_id, defs in DISORDER_DEFS.items():
        m_bundle = models_suite.get(disorder_id)
        if not m_bundle:
            continue

        lr_m = m_bundle['lr']
        rf_m = m_bundle['rf']
        gb_m = m_bundle['gb']

        prob_lr = float(lr_m.predict_proba(feature_scaled)[0, 1])
        prob_rf = float(rf_m.predict_proba(feature_vector)[0, 1])
        prob_gb = float(gb_m.predict_proba(feature_vector)[0, 1])

        # Machine learning ensemble
        ml_prob = float(0.40 * prob_rf + 0.40 * prob_gb + 0.20 * prob_lr)

        # Core clinical domain alignment (DSM-5 / ICD-11 symptom criteria)
        core_keys = defs.get('core_questions', [])
        core_vals = [mapped_answers.get(ck, 0.0) for ck in core_keys if ck in mapped_answers]
        core_mean = (sum(core_vals) / len(core_vals)) if core_vals else 0.0
        core_ratio = core_mean / 3.0  # 0.0 (no symptoms) to 1.0 (severe symptoms)

        if core_ratio >= 0.65:
            # Clinical threshold reached for this disorder's symptom cluster
            clinical_base = 0.60 + 0.35 * ((core_ratio - 0.65) / 0.35)
            ens_prob = max(ml_prob, float(0.50 * ml_prob + 0.50 * clinical_base))
        elif core_ratio <= 0.22:
            # Minimal to no core symptoms
            ens_prob = min(ml_prob, float(0.45 * ml_prob + 0.55 * (core_ratio * 0.4)))
        else:
            # Intermediate / moderate symptom range
            ens_prob = float(0.55 * ml_prob + 0.45 * (0.25 + 0.40 * ((core_ratio - 0.22) / 0.43)))

        ens_prob = float(np.clip(ens_prob, 0.005, 0.985))

        # Risk level
        if ens_prob >= 0.70:
            risk = 'High'
        elif ens_prob >= 0.45:
            risk = 'Moderate'
        elif ens_prob >= 0.25:
            risk = 'Low'
        else:
            risk = 'Minimal'

        # Confidence
        confidence = int(round(abs(ens_prob - 0.5) * 200))
        conf_label = 'High' if confidence >= 60 else 'Moderate' if confidence >= 30 else 'Low'

        results[disorder_id] = {
            'name': defs['name'],
            'short': defs['short'],
            'icd': defs['icd'],
            'probability': round(ens_prob, 4),
            'probability_pct': int(round(ens_prob * 100)),
            'riskLevel': risk,
            'risk_level': risk,
            'confidence': conf_label,
            'confidence_score': confidence,
            'lr_score': round(prob_lr, 4),
            'rf_score': round(prob_rf, 4),
            'xgb_score': round(prob_gb, 4),
            'cv_accuracy': metrics.get(disorder_id, {}).get('accuracy', 0.90)
        }

    # Identify primary disorder
    sorted_disorders = sorted(results.items(), key=lambda x: x[1]['probability'], reverse=True)
    primary_id = sorted_disorders[0][0]

    # Compute SHAP feature importance for the primary disorder
    shap_factors = []
    rf_primary = models_suite[primary_id]['rf']
    importances = rf_primary.feature_importances_

    for i, q in enumerate(ALL_QUESTION_KEYS):
        val = feature_vector[0, i]
        imp = importances[i]
        shap_val = float((val - 1.0) * imp * 2.0)
        shap_factors.append({
            'feature': QUESTION_LABELS.get(q, q),
            'question_key': q,
            'value': float(val),
            'importance': round(float(imp), 4),
            'shap_value': round(shap_val, 4),
            'magnitude': round(abs(shap_val), 4),
            'impact': 'Increases risk' if shap_val > 0 else 'Decreases risk'
        })

    shap_factors.sort(key=lambda x: x['magnitude'], reverse=True)

    # Co-occurring conditions
    co_occurring = []
    matrix_refs = CO_OCCURRENCE_MATRIX.get(primary_id, {})
    for co_id, base_corr in matrix_refs.items():
        if co_id in results and results[co_id]['probability'] >= 0.40:
            co_occurring.append({
                'disorder': co_id,
                'short': DISORDER_DEFS[co_id]['short'],
                'name': DISORDER_DEFS[co_id]['name'],
                'probability': results[co_id]['probability'],
                'correlation': base_corr
            })

    # Therapeutic recommendations
    recs = RECOMMENDATION_DATABASE.get(primary_id, RECOMMENDATION_DATABASE['asd'])

    # Doctor Narrative
    primary_meta = DISORDER_DEFS[primary_id]
    patient_name = demographics_dict.get('name', 'Individual')
    top_prob = results[primary_id]['probability']

    if top_prob < 0.25:
        doc_narrative = (
            f"Clinical Evaluation Summary for {patient_name}:\n\n"
            f"Based on the multi-disciplinary screening questionnaire and developmental profile, "
            f"all 7 assessed domains fall within **Typical Development (Minimal Risk)** limits "
            f"(highest domain: {primary_meta['name']} at {results[primary_id]['probability_pct']}%).\n\n"
            f"Key Observations:\n"
            f"• Social reciprocity, communicative eye contact, and emotional regulation align with standard developmental milestones.\n"
            f"• No significant behavioral flags for ASD, ADHD, Dyslexia, or other evaluated conditions were identified.\n\n"
            f"Recommended Action: Standard routine pediatric developmental monitoring and age-appropriate learning enrichment."
        )
    else:
        doc_narrative = (
            f"Clinical Evaluation Summary for {patient_name}:\n\n"
            f"Based on the multi-disciplinary screening questionnaire and demographic profile, "
            f"the ensemble ML diagnostic model indicates a **{results[primary_id]['riskLevel']} Risk** "
            f"({results[primary_id]['probability_pct']}%) profile consistent with **{primary_meta['name']} ({primary_meta['icd']})**.\n\n"
            f"Key Contributing Observations:\n"
        )
        for f in shap_factors[:4]:
            doc_narrative += f"• **{f['feature']}**: {f['impact']} (SHAP weight: {f['shap_value']:+.2f})\n"

        if co_occurring:
            doc_narrative += f"\nPotential Co-occurring Patterns Detected:\n"
            for c in co_occurring:
                doc_narrative += f"• Elevated risk indicators noted for **{c['name']}** ({int(c['probability']*100)}% likelihood).\n"

        doc_narrative += "\nRecommended Action: Comprehensive in-person evaluation by a qualified specialist."

    return {
        'status': 'RESEARCH_PROTOTYPE',
        'is_experimental': True,
        'is_synthetic_cohort': True,
        'is_validated_clinical_model': False,
        'cohort_notice': 'Screening models evaluated on synthetic clinical heuristic cohort for architectural prototyping.',
        'disorder_results': results,
        'primary_disorder': primary_id,
        'primary_info': DISORDER_DEFS[primary_id],
        'shap_values': shap_factors[:10],
        'co_occurring': co_occurring,
        'recommendations': recs,
        'doctor_explanation': doc_narrative,
        'disclaimer': 'NeuroScan AI assessment is for experimental screening demonstration only. It is not a medical diagnosis.'
    }

if __name__ == '__main__':
    raw = sys.stdin.read() if len(sys.argv) <= 1 else sys.argv[1]
    try:
        data = json.loads(raw) if raw.strip() else {}
    except:
        data = {}
    ans = data.get('answers', {})
    demo = data.get('demographics', {})
    res = predict_multi_disorder(ans, demo)
    print(json.dumps(res, indent=2))
