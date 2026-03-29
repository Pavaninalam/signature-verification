"""
users/training.py
Training simulation — no TensorFlow/Keras required.
Generates realistic metrics and graphs using matplotlib + sklearn only.
"""
import os
import random
import time

import matplotlib
matplotlib.use('Agg')  # non-interactive backend — must be set before pyplot import
import matplotlib.pyplot as plt
import numpy as np
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay

from django.conf import settings


def simulate_training():
    """
    Simulate model training and return metrics + save graph images.
    Uses absolute paths so it works regardless of working directory.
    """
    static_dir = settings.BASE_DIR / 'static'
    static_dir.mkdir(exist_ok=True)

    dataset_paths = {
        'genuine_path': 'media/signatures/full_org',
        'forged_path':  'media/signatures/full_forg',
    }

    # Simulate loading + training time
    time.sleep(3)
    time.sleep(5)

    # Realistic simulated metrics
    accuracy  = round(random.uniform(0.85, 0.96), 4)
    precision = round(random.uniform(0.82, 0.95), 4)
    recall    = round(random.uniform(0.80, 0.94), 4)
    auc       = round(random.uniform(0.86, 0.98), 4)

    # --- Confusion matrix ---
    y_true = [1, 0, 1, 0, 1, 1, 0, 1, 0, 1]
    y_pred = [1, 0, 1, 0, 0, 1, 0, 1, 1, 0]
    cm = confusion_matrix(y_true, y_pred)

    disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=['Forged', 'Genuine'])
    disp.plot(cmap='Blues')
    plt.savefig(str(static_dir / 'confusion_matrix.png'))
    plt.close()

    # --- Training graph ---
    epochs            = np.arange(1, 21)
    training_loss     = np.random.uniform(0.1, 0.5, 20)
    training_accuracy = np.random.uniform(0.6, 0.95, 20)

    plt.figure(figsize=(10, 6))
    plt.plot(epochs, training_loss,     label='Loss',     color='red')
    plt.plot(epochs, training_accuracy, label='Accuracy', color='blue')
    plt.title('Training Loss and Accuracy')
    plt.xlabel('Epochs')
    plt.ylabel('Value')
    plt.legend()
    plt.grid(True)
    plt.savefig(str(static_dir / 'training_graph.png'))
    plt.close()

    return {
        'trained':       True,
        'dataset_paths': dataset_paths,
        'accuracy':      accuracy,
        'precision':     precision,
        'recall':        recall,
        'auc':           auc,
    }
