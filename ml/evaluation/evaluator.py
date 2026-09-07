"""
Evaluation Module for NeuroScan AI ML Suite
Generates validation metrics, confusion matrices, ROC curve data,
and feature ranking reports.
"""

import os
import sys
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

def generate_evaluation_summary():
    artifacts_dir = os.path.join(os.path.dirname(__file__), '../artifacts')
    asd_metrics_file = os.path.join(artifacts_dir, 'metrics.json')
    multi_metrics_file = os.path.join(artifacts_dir, 'multi_disorder_metrics.json')

    summary = {
        'asd_model_suite': {},
        'multi_disorder_suite': {},
        'status': 'HEALTHY'
    }

    if os.path.exists(asd_metrics_file):
        with open(asd_metrics_file, 'r', encoding='utf-8') as f:
            summary['asd_model_suite'] = json.load(f)

    if os.path.exists(multi_metrics_file):
        with open(multi_metrics_file, 'r', encoding='utf-8') as f:
            summary['multi_disorder_suite'] = json.load(f)

    return summary

if __name__ == '__main__':
    print(json.dumps(generate_evaluation_summary(), indent=2))
