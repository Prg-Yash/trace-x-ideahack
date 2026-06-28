# TRACE-X Master ML Evaluation Report
> Generated on: 2026-06-29 02:42:29

This report evaluates all live inference models deployed in TRACE-X against the synthetic ground truth.
Due to severe class imbalance, **AUC-PR (Average Precision Lift)** is the primary metric of operational success.

| Model | Precision | Recall | AUC-PR | ROC-AUC | FPR | Positives / Total |
|---|---|---|---|---|---|---|
| **Dormancy Hybrid (ISO->XGBoost)** | 1.0000 | 1.0000 | **1.0000** | 1.0000 | 0.0000 | 395 / 20000 |

| **XGBoost (Profile Mismatch)** | 0.0545 | 0.6129 | **0.2096** | 0.7435 | 0.3403 | 124 / 4000 |

| **XGBoost (Smurfing Calibrated)** | 0.9000 | 0.9863 | **0.9275** | 0.9991 | 0.0020 | 73 / 4000 |

| **XGBoost (Layering)** | 1.0000 | 1.0000 | **1.0000** | 1.0000 | 0.0000 | 26 / 351 |

| **XGBoost (Round-Trip)** | 0.3333 | 1.0000 | **0.3462** | 0.9076 | 0.1957 | 9 / 101 |

