import os
import pandas as pd

from signal_generator import generate_signals
from signal_processing import extract_features


FAULTS = [
    "normal",
    "imbalance",
    "misalignment",
    "loose_mounting"
]

FS = 2000


def create_dataset(samples_per_fault=250):

    rows = []

    for fault in FAULTS:

        for _ in range(samples_per_fault):

            rpm = 1400 + (
                __import__("numpy").random.randint(
                    -100,
                    101
                )
            )

            t, acoustic, sensors = generate_signals(
                fault=fault,
                rpm=rpm,
                fs=FS
            )

            row = {}

            acoustic_features = extract_features(
                acoustic,
                FS
            )

            row["acoustic_rms"] = acoustic_features["rms"]
            row["acoustic_peak"] = acoustic_features["peak"]
            row["acoustic_frequency"] = acoustic_features[
                "dominant_frequency"
            ]

            for i in range(4):

                features = extract_features(
                    sensors[i],
                    FS
                )

                row[f"s{i+1}_rms"] = features["rms"]
                row[f"s{i+1}_peak"] = features["peak"]
                row[f"s{i+1}_frequency"] = features[
                    "dominant_frequency"
                ]

            row["fault"] = fault

            rows.append(row)

    df = pd.DataFrame(rows)

    os.makedirs("../data", exist_ok=True)

    df.to_csv(
        "../data/machine_data.csv",
        index=False
    )

    print("Dataset created successfully.")
    print("Rows:", len(df))
    print("Saved to: ../data/machine_data.csv")


if __name__ == "__main__":
    create_dataset()