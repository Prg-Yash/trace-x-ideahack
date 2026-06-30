# TRACE-X Master ML Evaluation Report
> Generated on: 2026-06-30 21:54:13

This report evaluates all live inference models deployed in TRACE-X against the synthetic ground truth.
Due to severe class imbalance, **AUC-PR (Average Precision Lift)** is the primary metric of operational success.

| Model | Precision | Recall | AUC-PR | ROC-AUC | FPR | Positives / Total |
|---|---|---|---|---|---|---|
| **Dormancy Hybrid (ISO->XGBoost)** | 1.0000 | 1.0000 | **1.0000** | 1.0000 | 0.0000 | 396 / 20000 |

| **XGBoost (Profile Mismatch)** | 0.0576 | 0.5968 | **0.1951** | 0.7445 | 0.3122 | 124 / 4000 |

| **XGBoost (Smurfing Calibrated)** | 0.0000 | 0.0000 | **0.0190** | 0.5409 | 0.0000 | 69 / 4000 |

| **XGBoost (Layering)** | 1.0000 | 0.9231 | **1.0000** | 1.0000 | 0.0000 | 26 / 351 |

| **XGBoost (Round-Trip)** | 0.3333 | 1.0000 | **0.3611** | 0.9112 | 0.1957 | 9 / 101 |

